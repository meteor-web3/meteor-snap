"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LitCore = void 0;
const crypto_1 = require("@lit-protocol/crypto");
const access_control_conditions_1 = require("@lit-protocol/access-control-conditions");
const constants_1 = require("@lit-protocol/constants");
const misc_1 = require("@lit-protocol/misc");
const ethers_1 = require("ethers");
const contracts_sdk_1 = require("@lit-protocol/contracts-sdk");
class LitCore {
    // ========== Constructor ==========
    constructor(args) {
        // ========== Logger utilities ==========
        this.getLogsForRequestId = (id) => {
            return globalThis.logManager.getLogsForId(id);
        };
        // ========== Scoped Class Helpers ==========
        /**
         * Asynchronously updates the configuration settings for the LitNodeClient.
         * This function fetches the minimum node count and bootstrap URLs for the
         * specified Lit network. It validates these values and updates the client's
         * configuration accordingly. If the network is set to 'InternalDev', it
         * dynamically updates the bootstrap URLs in the configuration.
         *
         * @throws Will throw an error if the minimum node count is invalid or if
         *         the bootstrap URLs array is empty.
         * @returns {Promise<void>} A promise that resolves when the configuration is updated.
         */
        this.setNewConfig = async () => {
            if (this.config.litNetwork !== constants_1.LitNetwork.Cayenne &&
                this.config.litNetwork !== constants_1.LitNetwork.Custom) {
                const minNodeCount = await contracts_sdk_1.LitContracts.getMinNodeCount(this.config.litNetwork);
                const bootstrapUrls = await contracts_sdk_1.LitContracts.getValidators(this.config.litNetwork);
                (0, misc_1.log)('Bootstrap urls: ', bootstrapUrls);
                if (minNodeCount <= 0) {
                    (0, misc_1.throwError)({
                        message: `minNodeCount is ${minNodeCount}, which is invalid. Please check your network connection and try again.`,
                        errorKind: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.kind,
                        errorCode: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.name,
                    });
                }
                if (bootstrapUrls.length <= 0) {
                    (0, misc_1.throwError)({
                        message: `bootstrapUrls is empty, which is invalid. Please check your network connection and try again.`,
                        errorKind: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.kind,
                        errorCode: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.name,
                    });
                }
                this.config.minNodeCount = parseInt(minNodeCount, 10);
            }
            else if (this.config.litNetwork === constants_1.LitNetwork.Cayenne) {
                // If the network is cayenne it is a centralized testnet so we use a static config
                // This is due to staking contracts holding local ip / port contexts which are innacurate to the ip / port exposed to the world
                this.config.bootstrapUrls = constants_1.LIT_NETWORKS.cayenne;
                this.config.minNodeCount =
                    constants_1.LIT_NETWORKS.cayenne.length == 2
                        ? 2
                        : (constants_1.LIT_NETWORKS.cayenne.length * 2) / 3;
            }
        };
        /**
         * Sets up a listener to detect state changes (new epochs) in the staking contract.
         * When a new epoch is detected, it triggers the `setNewConfig` function to update
         * the client's configuration based on the new state of the network. This ensures
         * that the client's configuration is always in sync with the current state of the
         * staking contract.
         *
         * @returns {Promise<void>} A promise that resolves when the listener is successfully set up.
         */
        this.listenForNewEpoch = async () => {
            if (this.config.litNetwork !== constants_1.LitNetwork.Cayenne &&
                this.config.litNetwork !== constants_1.LitNetwork.Custom) {
                const stakingContract = await contracts_sdk_1.LitContracts.getStakingContract(this.config.litNetwork);
                (0, misc_1.log)('listening for state change on staking contract: ', stakingContract.address);
                stakingContract.on('StateChanged', async (state) => {
                    (0, misc_1.log)(`New state detected: "${state}"`);
                    if (state === constants_1.StakingStates.NextValidatorSetLocked) {
                        await this.setNewConfig();
                    }
                });
            }
        };
        /**
         *
         * Set bootstrapUrls to match the network litNetwork unless it's set to custom
         *
         * @returns { void }
         *
         */
        this.setCustomBootstrapUrls = () => {
            // -- validate
            if (this.config.litNetwork === 'custom')
                return;
            // -- execute
            const hasNetwork = this.config.litNetwork in constants_1.LIT_NETWORKS;
            if (!hasNetwork) {
                // network not found, report error
                (0, misc_1.throwError)({
                    message: 'the litNetwork specified in the LitNodeClient config not found in LIT_NETWORKS',
                    errorKind: constants_1.LIT_ERROR.LIT_NODE_CLIENT_BAD_CONFIG_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.LIT_NODE_CLIENT_BAD_CONFIG_ERROR.name,
                });
                return;
            }
            this.config.bootstrapUrls = constants_1.LIT_NETWORKS[this.config.litNetwork];
        };
        /**
         *
         * Connect to the LIT nodes
         *
         * @returns { Promise } A promise that resolves when the nodes are connected.
         *
         */
        this.connect = async () => {
            // -- handshake with each node
            await this.setNewConfig();
            await this.listenForNewEpoch();
            // -- handshake with each node
            const requestId = this.getRequestId();
            for (const url of this.config.bootstrapUrls) {
                const challenge = this.getRandomHexString(64);
                this.handshakeWithNode({ url, challenge }, requestId)
                    .then((resp) => {
                    this.connectedNodes.add(url);
                    let keys = {
                        serverPubKey: resp.serverPublicKey,
                        subnetPubKey: resp.subnetPublicKey,
                        networkPubKey: resp.networkPublicKey,
                        networkPubKeySet: resp.networkPublicKeySet,
                        hdRootPubkeys: resp.hdRootPubkeys,
                        latestBlockhash: resp.latestBlockhash,
                    };
                    // -- validate returned keys
                    if (keys.serverPubKey === 'ERR' ||
                        keys.subnetPubKey === 'ERR' ||
                        keys.networkPubKey === 'ERR' ||
                        keys.networkPubKeySet === 'ERR') {
                        (0, misc_1.logErrorWithRequestId)(requestId, 'Error connecting to node. Detected "ERR" in keys', url, keys);
                    }
                    if (!keys.latestBlockhash) {
                        (0, misc_1.logErrorWithRequestId)(requestId, 'Error getting latest blockhash from the node.');
                    }
                    if (this.config.checkNodeAttestation) {
                        // check attestation
                        if (!resp.attestation) {
                            (0, misc_1.logErrorWithRequestId)(requestId, `Missing attestation in handshake response from ${url}`);
                            (0, misc_1.throwError)({
                                message: `Missing attestation in handshake response from ${url}`,
                                errorKind: constants_1.LIT_ERROR.INVALID_NODE_ATTESTATION.kind,
                                errorCode: constants_1.LIT_ERROR.INVALID_NODE_ATTESTATION.name,
                            });
                        }
                        else {
                            // actually verify the attestation by checking the signature against AMD certs
                            (0, misc_1.log)('Checking attestation against amd certs...');
                            const attestation = resp.attestation;
                            try {
                                (0, crypto_1.checkSevSnpAttestation)(attestation, challenge, url).then(() => {
                                    (0, misc_1.log)(`Lit Node Attestation verified for ${url}`);
                                    // only set server keys if attestation is valid
                                    // so that we don't use this node if it's not valid
                                    this.serverKeys[url] = keys;
                                });
                            }
                            catch (e) {
                                (0, misc_1.logErrorWithRequestId)(requestId, `Lit Node Attestation failed verification for ${url}`);
                                (0, misc_1.throwError)({
                                    message: `Lit Node Attestation failed verification for ${url}`,
                                    errorKind: constants_1.LIT_ERROR.INVALID_NODE_ATTESTATION.kind,
                                    errorCode: constants_1.LIT_ERROR.INVALID_NODE_ATTESTATION.name,
                                });
                            }
                        }
                    }
                    else {
                        // don't check attestation, just set server keys
                        this.serverKeys[url] = keys;
                    }
                })
                    .catch((e) => {
                    (0, misc_1.log)('Error connecting to node ', url, e);
                });
            }
            // -- get promise
            const promise = new Promise((resolve, reject) => {
                const startTime = Date.now();
                const interval = setInterval(() => {
                    if (Object.keys(this.serverKeys).length == this.config.bootstrapUrls.length) {
                        clearInterval(interval);
                        // pick the most common public keys for the subnet and network from the bunch, in case some evil node returned a bad key
                        this.subnetPubKey = (0, misc_1.mostCommonString)(Object.values(this.serverKeys).map((keysFromSingleNode) => keysFromSingleNode.subnetPubKey));
                        this.networkPubKey = (0, misc_1.mostCommonString)(Object.values(this.serverKeys).map((keysFromSingleNode) => keysFromSingleNode.networkPubKey));
                        this.networkPubKeySet = (0, misc_1.mostCommonString)(Object.values(this.serverKeys).map((keysFromSingleNode) => keysFromSingleNode.networkPubKeySet));
                        this.hdRootPubkeys = (0, misc_1.mostCommonString)(Object.values(this.serverKeys).map((keysFromSingleNode) => keysFromSingleNode.hdRootPubkeys));
                        this.latestBlockhash = (0, misc_1.mostCommonString)(Object.values(this.serverKeys).map((keysFromSingleNode) => keysFromSingleNode.latestBlockhash));
                        this.ready = true;
                        (0, misc_1.log)(`🔥 lit is ready. "litNodeClient" variable is ready to use globally.`);
                        (0, misc_1.log)('current network config', {
                            networkPubkey: this.networkPubKey,
                            networkPubKeySet: this.networkPubKeySet,
                            hdRootPubkeys: this.hdRootPubkeys,
                            subnetPubkey: this.subnetPubKey,
                            latesBlockhash: this.latestBlockhash,
                        });
                        // @ts-ignore
                        globalThis.litNodeClient = this;
                        // browser only
                        if ((0, misc_1.isBrowser)()) {
                            // document.dispatchEvent(new Event('lit-ready'));
                        }
                        // @ts-ignore: Expected 1 arguments, but got 0. Did you forget to include 'void' in your type argument to 'Promise'?ts(2794)
                        resolve();
                    }
                    else {
                        const now = Date.now();
                        if (now - startTime > this.config.connectTimeout) {
                            clearInterval(interval);
                            const msg = `Error: Could not connect to enough nodes after timeout of ${this.config.connectTimeout}ms.  Could only connect to ${Object.keys(this.serverKeys).length} of ${this.config.minNodeCount} required nodes.  Please check your network connection and try again.  Note that you can control this timeout with the connectTimeout config option which takes milliseconds.`;
                            (0, misc_1.logErrorWithRequestId)(requestId, msg);
                            reject(msg);
                        }
                    }
                }, 500);
            });
            return promise;
        };
        /**
         *
         * Handshake with Node
         *
         * @param { HandshakeWithNode } params
         *
         * @returns { Promise<NodeCommandServerKeysResponse> }
         *
         */
        this.handshakeWithNode = async (params, requestId) => {
            // -- get properties from params
            const { url } = params;
            // -- create url with path
            const urlWithPath = `${url}/web/handshake`;
            (0, misc_1.log)(`handshakeWithNode ${urlWithPath}`);
            const data = {
                clientPublicKey: 'test',
                challenge: params.challenge,
            };
            return this.sendCommandToNode({
                url: urlWithPath,
                data,
                requestId,
            });
        };
        // ==================== SENDING COMMAND ====================
        /**
         *
         * Send a command to nodes
         *
         * @param { SendNodeCommand }
         *
         * @returns { Promise<any> }
         *
         */
        this.sendCommandToNode = async ({ url, data, requestId, }) => {
            (0, misc_1.logWithRequestId)(requestId, `sendCommandToNode with url ${url} and data`, data);
            const req = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Lit-SDK-Version': constants_1.version,
                    'X-Lit-SDK-Type': 'Typescript',
                    'X-Request-Id': 'lit_' + requestId,
                },
                body: JSON.stringify(data),
            };
            return fetch(url, req)
                .then(async (response) => {
                const isJson = response.headers
                    .get('content-type')
                    ?.includes('application/json');
                const data = isJson ? await response.json() : null;
                if (!response.ok) {
                    // get error message from body or default to response status
                    const error = data || response.status;
                    return Promise.reject(error);
                }
                return data;
            })
                .catch((error) => {
                (0, misc_1.logErrorWithRequestId)(requestId, `Something went wrong, internal id for request: lit_${requestId}. Please provide this identifier with any support requests. ${error?.message || error?.details
                    ? `Error is ${error.message} - ${error.details}`
                    : ''}`);
                return Promise.reject(error);
            });
        };
        /**
         *
         * Get and gather node promises
         *
         * @param { any } callback
         *
         * @returns { Array<Promise<any>> }
         *
         */
        this.getNodePromises = (callback) => {
            const nodePromises = [];
            for (const url of this.connectedNodes) {
                nodePromises.push(callback(url));
            }
            return nodePromises;
        };
        /**
         *
         * Get either auth sig or session auth sig
         *
         */
        this.getSessionOrAuthSig = ({ authSig, sessionSigs, url, mustHave = true, }) => {
            if (!authSig && !sessionSigs) {
                if (mustHave) {
                    (0, misc_1.throwError)({
                        message: `You must pass either authSig, or sessionSigs`,
                        errorKind: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.kind,
                        errorCode: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.name,
                    });
                }
                else {
                    (0, misc_1.log)(`authSig or sessionSigs not found. This may be using authMethod`);
                }
            }
            if (sessionSigs) {
                const sigToPassToNode = sessionSigs[url];
                if (!sigToPassToNode) {
                    (0, misc_1.throwError)({
                        message: `You passed sessionSigs but we could not find session sig for node ${url}`,
                        errorKind: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.kind,
                        errorCode: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.name,
                    });
                }
                return sigToPassToNode;
            }
            return authSig;
        };
        /**
         *
         * Get hash of access control conditions
         *
         * @param { MultipleAccessControlConditions } params
         *
         * @returns { Promise<ArrayBuffer | undefined> }
         *
         */
        this.getHashedAccessControlConditions = async (params) => {
            let hashOfConditions;
            // ========== Prepare Params ==========
            const { accessControlConditions, evmContractConditions, solRpcConditions, unifiedAccessControlConditions, } = params;
            // ========== Hash ==========
            if (accessControlConditions) {
                hashOfConditions = await (0, access_control_conditions_1.hashAccessControlConditions)(accessControlConditions);
            }
            else if (evmContractConditions) {
                hashOfConditions = await (0, access_control_conditions_1.hashEVMContractConditions)(evmContractConditions);
            }
            else if (solRpcConditions) {
                hashOfConditions = await (0, access_control_conditions_1.hashSolRpcConditions)(solRpcConditions);
            }
            else if (unifiedAccessControlConditions) {
                hashOfConditions = await (0, access_control_conditions_1.hashUnifiedAccessControlConditions)(unifiedAccessControlConditions);
            }
            else {
                return;
            }
            // ========== Result ==========
            return hashOfConditions;
        };
        /**
         * Handle node promises
         *
         * @param { Array<Promise<any>> } nodePromises
         *
         * @returns { Promise<SuccessNodePromises<T> | RejectedNodePromises> }
         *
         */
        this.handleNodePromises = async (nodePromises, requestId, minNodeCount) => {
            // -- prepare
            const responses = await Promise.allSettled(nodePromises);
            const minNodes = minNodeCount ?? this.config.minNodeCount;
            // -- get fulfilled responses
            const successes = responses.filter((r) => r.status === 'fulfilled');
            // -- case: success (when success responses are more than minNodeCount)
            if (successes.length >= minNodes) {
                const successPromises = {
                    success: true,
                    values: successes.map((r) => r.value),
                };
                return successPromises;
            }
            // -- case: if we're here, then we did not succeed.  time to handle and report errors.
            // -- get "rejected" responses
            const rejected = responses.filter((r) => r.status === 'rejected');
            const mostCommonError = JSON.parse((0, misc_1.mostCommonString)(rejected.map((r) => JSON.stringify(r.reason))));
            (0, misc_1.logErrorWithRequestId)(requestId || '', `most common error: ${JSON.stringify(mostCommonError)}`);
            const rejectedPromises = {
                success: false,
                error: mostCommonError,
            };
            return rejectedPromises;
        };
        /**
         *
         * Throw node error
         *
         * @param { RejectedNodePromises } res
         *
         * @returns { void }
         *
         */
        this._throwNodeError = (res) => {
            if (res.error && res.error.errorCode) {
                if ((res.error.errorCode === constants_1.LIT_ERROR_CODE.NODE_NOT_AUTHORIZED ||
                    res.error.errorCode === 'not_authorized') &&
                    this.config.alertWhenUnauthorized) {
                    (0, misc_1.log)('[Alert originally] You are not authorized to access to this content');
                }
                (0, misc_1.throwError)({
                    ...res.error,
                    message: res.error.message ||
                        'You are not authorized to access to this content',
                    errorCode: res.error.errorCode,
                });
            }
            else {
                (0, misc_1.throwError)({
                    message: `There was an error getting the signing shares from the nodes`,
                    error: constants_1.LIT_ERROR.UNKNOWN_ERROR,
                });
            }
        };
        /**
         *
         * Get different formats of access control conditions, eg. evm, sol, unified etc.
         *
         * @param { SupportedJsonRequests } params
         *
         * @returns { FormattedMultipleAccs }
         *
         */
        this.getFormattedAccessControlConditions = (params) => {
            // -- prepare params
            const { accessControlConditions, evmContractConditions, solRpcConditions, unifiedAccessControlConditions, } = params;
            // -- execute
            let formattedAccessControlConditions;
            let formattedEVMContractConditions;
            let formattedSolRpcConditions;
            let formattedUnifiedAccessControlConditions;
            let error = false;
            if (accessControlConditions) {
                formattedAccessControlConditions = accessControlConditions.map((c) => (0, access_control_conditions_1.canonicalAccessControlConditionFormatter)(c));
                (0, misc_1.log)('formattedAccessControlConditions', JSON.stringify(formattedAccessControlConditions));
            }
            else if (evmContractConditions) {
                formattedEVMContractConditions = evmContractConditions.map((c) => (0, access_control_conditions_1.canonicalEVMContractConditionFormatter)(c));
                (0, misc_1.log)('formattedEVMContractConditions', JSON.stringify(formattedEVMContractConditions));
            }
            else if (solRpcConditions) {
                formattedSolRpcConditions = solRpcConditions.map((c) => (0, access_control_conditions_1.canonicalSolRpcConditionFormatter)(c));
                (0, misc_1.log)('formattedSolRpcConditions', JSON.stringify(formattedSolRpcConditions));
            }
            else if (unifiedAccessControlConditions) {
                formattedUnifiedAccessControlConditions =
                    unifiedAccessControlConditions.map((c) => (0, access_control_conditions_1.canonicalUnifiedAccessControlConditionFormatter)(c));
                (0, misc_1.log)('formattedUnifiedAccessControlConditions', JSON.stringify(formattedUnifiedAccessControlConditions));
            }
            else {
                error = true;
            }
            return {
                error,
                formattedAccessControlConditions,
                formattedEVMContractConditions,
                formattedSolRpcConditions,
                formattedUnifiedAccessControlConditions,
            };
        };
        /**
         * Calculates an HD public key from a given {@link keyId} the curve type or signature type will assumed to be k256 unless given
         * @param keyId
         * @param sigType
         * @returns {string} public key
         */
        this.computeHDPubKey = (keyId, sigType = constants_1.SIGTYPE.EcdsaCaitSith) => {
            if (!this.hdRootPubkeys) {
                (0, misc_1.logError)('root public keys not found, have you connected to the nodes?');
                (0, misc_1.throwError)({
                    message: `root public keys not found, have you connected to the nodes?`,
                    errorKind: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.code,
                });
            }
            return (0, crypto_1.computeHDPubKey)(this.hdRootPubkeys, keyId, sigType);
        };
        const customConfig = args;
        let _defaultConfig = {
            alertWhenUnauthorized: false,
            debug: true,
            connectTimeout: 20000,
            litNetwork: 'cayenne',
            minNodeCount: 2,
            bootstrapUrls: [], // Default value, should be replaced
        };
        // Initialize default config based on litNetwork
        if (args && 'litNetwork' in args) {
            switch (args.litNetwork) {
                case constants_1.LitNetwork.Cayenne:
                    this.config = {
                        ..._defaultConfig,
                        litNetwork: constants_1.LitNetwork.Cayenne,
                    };
                    break;
                default:
                    this.config = {
                        ..._defaultConfig,
                        ...customConfig,
                    };
            }
        }
        else {
            this.config = { ..._defaultConfig, ...customConfig };
        }
        // -- initialize default auth callback
        // this.defaultAuthCallback = args?.defaultAuthCallback;
        // -- if config params are specified, replace it
        if (customConfig) {
            this.config = { ...this.config, ...customConfig };
            // this.config = override(this.config, customConfig);
        }
        // -- init default properties
        this.connectedNodes = new Set();
        this.serverKeys = {};
        this.ready = false;
        this.subnetPubKey = null;
        this.networkPubKey = null;
        this.networkPubKeySet = null;
        this.hdRootPubkeys = null;
        this.latestBlockhash = null;
        // -- set bootstrapUrls to match the network litNetwork unless it's set to custom
        this.setCustomBootstrapUrls();
        // -- set global variables
        globalThis.litConfig = this.config;
        (0, misc_1.bootstrapLogManager)('core');
    }
    /**
     *
     * Get a random request ID
     *
     * @returns { string }
     *
     */
    getRequestId() {
        return Math.random().toString(16).slice(2);
    }
    /**
     *
     * Get a random hex string for use as an attestation challenge
     *
     * @returns { string }
     */
    getRandomHexString(size) {
        return [...Array(size)]
            .map(() => Math.floor(Math.random() * 16).toString(16))
            .join('');
    }
    /**
     * Calculates a Key Id for claiming a pkp based on a user identifier and an app identifier.
     * The key Identifier is an Auth Method Id which scopes the key uniquely to a specific application context.
     * These identifiers are specific to each auth method and will derive the public key protion of a pkp which will be persited
     * when a key is claimed.
     * | Auth Method | User ID | App ID |
     * |:------------|:--------|:-------|
     * | Google OAuth | token `sub` | token `aud` |
     * | Discord OAuth | user id | client app identifier |
     * | Stytch OTP |token `sub` | token `aud`|
     * | Lit Actions | user defined | ipfs cid |
     * *Note* Lit Action claiming uses a different schema than oter auth methods
     * isForActionContext should be set for true if using claiming through actions
     * @param userId {string} user identifier for the Key Identifier
     * @param appId {string} app identifier for the Key Identifier
     * @returns {String} public key of pkp when claimed
     */
    computeHDKeyId(userId, appId, isForActionContext = false) {
        if (!isForActionContext) {
            return ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes(`${userId}:${appId}`));
        }
        else {
            return ethers_1.ethers.utils.keccak256(ethers_1.ethers.utils.toUtf8Bytes(`${appId}:${userId}`));
        }
    }
}
exports.LitCore = LitCore;
//# sourceMappingURL=lit-core.js.map