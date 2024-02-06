"use strict";
var _LitNodeClientNodeJs_isSuccessNodePromises;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LitNodeClientNodeJs = void 0;
const tslib_1 = require("tslib");
const access_control_conditions_1 = require("@lit-protocol/access-control-conditions");
const bls_sdk_1 = require("@lit-protocol/bls-sdk");
const constants_1 = require("@lit-protocol/constants");
const crypto_1 = require("@lit-protocol/crypto");
const encryption_1 = require("@lit-protocol/encryption");
const misc_1 = require("@lit-protocol/misc");
const uint8arrays_1 = require("@lit-protocol/uint8arrays");
const transactions_1 = require("@ethersproject/transactions");
const lit_siwe_1 = require("lit-siwe");
const utils_1 = require("ethers/lib/utils");
const lit_third_party_libs_1 = require("@lit-protocol/lit-third-party-libs");
const nacl_1 = require("@lit-protocol/nacl");
const misc_browser_1 = require("@lit-protocol/misc-browser");
const ethers_1 = require("ethers");
// import { checkAndSignAuthMessage } from '@lit-protocol/auth-browser';
/** ---------- Main Export Class ---------- */
class LitNodeClientNodeJs {
    // ========== Constructor ==========
    constructor(args) {
        // ========== Scoped Class Helpers ==========
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
         * Get either auth sig or session auth sig
         *
         */
        this.getAuthSigOrSessionAuthSig = ({ authSig, sessionSigs, url, }) => {
            // -- if there's session
            let sigToPassToNode = authSig;
            if (sessionSigs) {
                sigToPassToNode = sessionSigs[url];
                if (!sigToPassToNode) {
                    (0, misc_1.throwError)({
                        message: `You passed sessionSigs but we could not find session sig for node ${url}`,
                        errorKind: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.kind,
                        errorCode: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.name,
                    });
                }
            }
            return sigToPassToNode;
        };
        /**
         *
         * Get the request body of the lit action
         *
         * @param { ExecuteJsProps } params
         *
         * @returns { JsonExecutionRequest }
         *
         */
        this.getLitActionRequestBody = (params) => {
            const reqBody = {
                authSig: params.authSig,
                jsParams: (0, misc_1.convertLitActionsParams)(params.jsParams),
                // singleNode: params.singleNode ?? false,
                targetNodeRange: params.targetNodeRange ?? 0,
            };
            if (params.code) {
                const _uint8Array = (0, uint8arrays_1.uint8arrayFromString)(params.code, 'utf8');
                const encodedJs = (0, uint8arrays_1.uint8arrayToString)(_uint8Array, 'base64');
                reqBody.code = encodedJs;
            }
            if (params.ipfsId) {
                reqBody.ipfsId = params.ipfsId;
            }
            if (params.authMethods && params.authMethods.length > 0) {
                reqBody.authMethods = params.authMethods;
            }
            return reqBody;
        };
        /**
         *
         * we need to send jwt params iat (issued at) and exp (expiration) because the nodes may have different wall clock times, the nodes will verify that these params are withing a grace period
         *
         */
        this.getJWTParams = () => {
            const now = Date.now();
            const iat = Math.floor(now / 1000);
            const exp = iat + 12 * 60 * 60; // 12 hours in seconds
            return { iat, exp };
        };
        /**
         *
         * Parse the response string to JSON
         *
         * @param { string } responseString
         *
         * @returns { any } JSON object
         *
         */
        this.parseResponses = (responseString) => {
            let response;
            try {
                response = JSON.parse(responseString);
            }
            catch (e) {
                (0, misc_1.log)('Error parsing response as json.  Swallowing and returning as string.', responseString);
            }
            return response;
        };
        // ==================== SESSIONS ====================
        /**
         * Try to get the session key in the local storage,
         * if not, generates one.
         *
         * @param {string} [serializedSessionKeyPair] - Serialized session key pair
         * @return {SessionKeyPair} - Session key pair
         */
        this.getSessionKey = (serializedSessionKeyPair) => {
            // If a session key pair is provided, parse it and return it
            if (serializedSessionKeyPair) {
                try {
                    const keyPair = JSON.parse(serializedSessionKeyPair);
                    if (this.isSessionKeyPair(keyPair)) {
                        return keyPair;
                    }
                    else {
                        return (0, misc_1.throwError)({
                            message: 'Invalid session key pair provided',
                            error: constants_1.LIT_ERROR.PARAMS_MISSING_ERROR,
                        });
                    }
                }
                catch (err) {
                    (0, misc_1.log)(`Error when parsing provided session keypair ${serializedSessionKeyPair}: ${err}`);
                    throw err;
                }
            }
            // If no session key pair is provided, try to get it from the local storage
            const storageKey = constants_1.LOCAL_STORAGE_KEYS.SESSION_KEY;
            const storedSessionKeyOrError = (0, misc_browser_1.getStorageItem)(storageKey);
            // Check for errors
            if (storedSessionKeyOrError.type === 'ERROR') {
                console.warn(`Storage key "${storageKey}" is missing. Not a problem. Continue...`);
            }
            else {
                // If no errors, get the stored session key
                const storedSessionKey = storedSessionKeyOrError.result;
                if (storedSessionKey) {
                    try {
                        const keyPair = JSON.parse(storedSessionKey);
                        if (this.isSessionKeyPair(keyPair)) {
                            return keyPair;
                        }
                        else {
                            throw new Error('Invalid session key pair stored');
                        }
                    }
                    catch (err) {
                        (0, misc_1.log)(`Error when parsing stored session keypair ${storedSessionKey}. Continuing to generate a new one...`);
                    }
                }
            }
            // If no session key is stored, generate one
            let sessionKey;
            try {
                sessionKey = (0, crypto_1.generateSessionKeyPair)();
            }
            catch (err) {
                (0, misc_1.log)(`Error when generating session keypair: ${err}`);
                throw err;
            }
            // Store session key in local storage
            try {
                localStorage.setItem(storageKey, JSON.stringify(sessionKey));
            }
            catch (e) {
                console.warn(`Local storage not available. Not a problem. Continue...`);
            }
            return sessionKey;
        };
        /**
         *
         * Get session capabilities from user, it not, generates one
         * @param { Array<any> } capabilities
         * @param { Array<any> } resources
         * @return { Array<any> }
         */
        this.getSessionCapabilities = (capabilities, resources) => {
            if (!capabilities || capabilities.length == 0) {
                capabilities = resources.map((resource) => {
                    const { protocol, resourceId } = this.parseResource({ resource });
                    return `${protocol}Capability://*`;
                });
            }
            return capabilities;
        };
        /**
         *
         * Get expiration for session
         *
         */
        this.getExpiration = () => {
            return new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();
        };
        /**
         *
         * Get the signature from local storage, if not, generates one
         *
         */
        this.getWalletSig = async ({ authNeededCallback, chain, capabilities, switchChain, expiration, sessionKeyUri, }) => {
            let walletSig;
            const storageKey = constants_1.LOCAL_STORAGE_KEYS.WALLET_SIGNATURE;
            const storedWalletSigOrError = (0, misc_browser_1.getStorageItem)(storageKey);
            // -- (TRY) to get it in the local storage
            if (storedWalletSigOrError.type === 'ERROR') {
                console.warn(`Storage key "${storageKey}" is missing. Not a problem. Contiune...`);
            }
            else {
                walletSig = storedWalletSigOrError.result;
            }
            // -- IF NOT: Generates one
            if (!storedWalletSigOrError.result || storedWalletSigOrError.result == '') {
                if (authNeededCallback) {
                    walletSig = await authNeededCallback({
                        chain,
                        resources: capabilities,
                        switchChain,
                        expiration,
                        uri: sessionKeyUri,
                    });
                }
                else {
                    if (!this.defaultAuthCallback) {
                        return (0, misc_1.throwError)({
                            message: 'No default auth callback provided',
                            errorKind: constants_1.LIT_ERROR.PARAMS_MISSING_ERROR.kind,
                            errorCode: constants_1.LIT_ERROR.PARAMS_MISSING_ERROR.name,
                        });
                    }
                    walletSig = await this.defaultAuthCallback({
                        chain,
                        resources: capabilities,
                        switchChain,
                        expiration,
                        uri: sessionKeyUri,
                    });
                }
            }
            else {
                try {
                    walletSig = JSON.parse(storedWalletSigOrError.result);
                }
                catch (e) {
                    console.warn('Error parsing walletSig', e);
                }
            }
            return walletSig;
        };
        /**
         *
         * Check if a session key needs to be resigned
         *
         */
        this.checkNeedToResignSessionKey = async ({ siweMessage, walletSignature, sessionKeyUri, resources, sessionCapabilities, }) => {
            let needToResign = false;
            try {
                // @ts-ignore
                await siweMessage.verify({ signature: walletSignature });
            }
            catch (e) {
                needToResign = true;
            }
            // make sure the sig is for the correct session key
            if (siweMessage.uri !== sessionKeyUri) {
                needToResign = true;
            }
            // make sure the sig has the session capabilities required to fulfill the resources requested
            for (let i = 0; i < resources.length; i++) {
                const resource = resources[i];
                const { protocol, resourceId } = this.parseResource({ resource });
                // check if we have blanket permissions or if we authed the specific resource for the protocol
                const permissionsFound = sessionCapabilities.some((capability) => {
                    const capabilityParts = this.parseResource({ resource: capability });
                    return (capabilityParts.protocol === protocol &&
                        (capabilityParts.resourceId === '*' ||
                            capabilityParts.resourceId === resourceId));
                });
                if (!permissionsFound) {
                    needToResign = true;
                }
            }
            return needToResign;
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
            (0, misc_1.log)(`sendCommandToNode with url ${url} and data`, data);
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
                return Promise.reject(error);
            });
        };
        // ==================== API Calls to Nodes ====================
        /**
         *
         * Get JS Execution Shares from Nodes
         *
         * @param { JsonExecutionRequest } params
         *
         * @returns { Promise<any> }
         */
        this.getJsExecutionShares = async (url, params, requestId) => {
            const { code, ipfsId, authSig, jsParams, sessionSigs } = params;
            (0, misc_1.log)('getJsExecutionShares');
            // -- execute
            const urlWithPath = `${url}/web/execute`;
            const data = {
                code,
                ipfsId,
                authSig,
                jsParams,
            };
            return await this.sendCommandToNode({ url: urlWithPath, data, requestId });
        };
        /**
         *
         * Get Chain Data Signing Shares
         *
         * @param { string } url
         * @param { JsonSignChainDataRequest } params
         *
         * @returns { Promise<any> }
         *
         */
        this.getChainDataSigningShare = async (url, params, requestId) => {
            const { callRequests, chain, iat, exp } = params;
            (0, misc_1.log)('getChainDataSigningShare');
            const urlWithPath = `${url}/web/signing/sign_chain_data`;
            const data = {
                callRequests,
                chain,
                iat,
                exp,
            };
            return await this.sendCommandToNode({ url: urlWithPath, data, requestId });
        };
        /**
         *
         * Get Signing Shares from Nodes
         *
         * @param { string } url
         * @param { JsonSigningRetrieveRequest } params
         *
         * @returns { Promise<any>}
         *
         */
        this.getSigningShare = async (url, params, requestId) => {
            (0, misc_1.log)('getSigningShare');
            const urlWithPath = `${url}/web/signing/retrieve`;
            return await this.sendCommandToNode({
                url: urlWithPath,
                data: params,
                requestId,
            });
        };
        /**
         *
         * Ger Decryption Shares from Nodes
         *
         * @param { string } url
         * @param { JsonEncryptionRetrieveRequest } params
         *
         * @returns { Promise<any> }
         *
         */
        this.getDecryptionShare = async (url, params, requestId) => {
            (0, misc_1.log)('getDecryptionShare');
            const urlWithPath = `${url}/web/encryption/retrieve`;
            return await this.sendCommandToNode({
                url: urlWithPath,
                data: params,
                requestId,
            });
        };
        /**
         *
         * Store signing conditions to nodes
         *
         * @param { string } url
         * @param { JsonSigningStoreRequest } params
         *
         * @returns { Promise<NodeCommandResponse> }
         *
         */
        this.storeSigningConditionWithNode = async (url, params, requestId) => {
            (0, misc_1.log)('storeSigningConditionWithNode');
            const urlWithPath = `${url}/web/signing/store`;
            return await this.sendCommandToNode({
                url: urlWithPath,
                data: {
                    key: params.key,
                    val: params.val,
                    authSig: params.authSig,
                    chain: params.chain,
                    permanant: params.permanent,
                },
                requestId,
            });
        };
        /**
         *
         * Store encryption conditions to nodes
         *
         * @param { string } urk
         * @param { JsonEncryptionStoreRequest } params
         *
         * @returns { Promise<NodeCommandResponse> }
         *
         */
        this.storeEncryptionConditionWithNode = async (url, params, requestId) => {
            (0, misc_1.log)('storeEncryptionConditionWithNode');
            const urlWithPath = `${url}/web/encryption/store`;
            const data = {
                key: params.key,
                val: params.val,
                authSig: params.authSig,
                chain: params.chain,
                permanant: params.permanent,
            };
            return await this.sendCommandToNode({ url: urlWithPath, data, requestId });
        };
        /**
         *
         * Sign Condition ECDSA
         *
         * @param { string } url
         * @param { SignConditionECDSA } params
         *
         * @returns { Promise<NodeCommandResponse> }
         *
         */
        this.signConditionEcdsa = async (url, params, requestId) => {
            (0, misc_1.log)('signConditionEcdsa');
            const urlWithPath = `${url}/web/signing/signConditionEcdsa`;
            const data = {
                access_control_conditions: params.accessControlConditions,
                evmContractConditions: params.evmContractConditions,
                solRpcConditions: params.solRpcConditions,
                auth_sig: params.auth_sig,
                chain: params.chain,
                iat: params.iat,
                exp: params.exp,
            };
            return await this.sendCommandToNode({
                url: urlWithPath,
                data,
                requestId,
            });
        };
        /**
         *
         * Handshake with SGX
         *
         * @param { HandshakeWithSgx } params
         *
         * @returns { Promise<NodeCommandServerKeysResponse> }
         *
         */
        this.handshakeWithSgx = async (params, requestId) => {
            // -- get properties from params
            const { url } = params;
            // -- create url with path
            const urlWithPath = `${url}/web/handshake`;
            (0, misc_1.log)(`handshakeWithSgx ${urlWithPath}`);
            const data = {
                clientPublicKey: 'test',
            };
            return this.sendCommandToNode({
                url: urlWithPath,
                data,
                requestId,
            });
        };
        /**
         *
         * Combine Shares from network public key set and signature shares
         *
         * @param { string } networkPubKeySet
         * @param { any } signatureShares
         *
         * @returns { string } final JWT (convert the sig to base64 and append to the jwt)
         *
         */
        this.combineSharesAndGetJWT = (networkPubKeySet, signatureShares) => {
            // ========== Shares Validations ==========
            // -- sanity check
            if (!signatureShares.every((val, i, arr) => val.unsignedJwt === arr[0].unsignedJwt)) {
                const msg = 'Unsigned JWT is not the same from all the nodes.  This means the combined signature will be bad because the nodes signed the wrong things';
                (0, misc_1.log)(msg);
            }
            // ========== Sorting ==========
            // -- sort the sig shares by share index.  this is important when combining the shares.
            signatureShares.sort((a, b) => a.shareIndex - b.shareIndex);
            // ========== Combine Shares ==========
            const pkSetAsBytes = (0, uint8arrays_1.uint8arrayFromString)(networkPubKeySet, 'base16');
            (0, misc_1.log)('pkSetAsBytes', pkSetAsBytes);
            const sigShares = signatureShares.map((s) => ({
                shareHex: s.signatureShare,
                shareIndex: s.shareIndex,
            }));
            const signature = bls_sdk_1.wasmBlsSdkHelpers.combine_signatures(pkSetAsBytes, sigShares);
            (0, misc_1.log)('raw sig', signature);
            (0, misc_1.log)('signature is ', (0, uint8arrays_1.uint8arrayToString)(signature, 'base16'));
            const unsignedJwt = (0, misc_1.mostCommonString)(signatureShares.map((s) => s.unsignedJwt));
            // ========== Result ==========
            // convert the sig to base64 and append to the jwt
            const finalJwt = `${unsignedJwt}.${(0, uint8arrays_1.uint8arrayToString)(signature, 'base64url')}`;
            return finalJwt;
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
         *
         * Get hash of access control conditions
         *
         * @param { JsonStoreSigningRequest } params
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
        // ========== Promise Handlers ==========
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
         * Handle node promises
         *
         * @param { Array<Promise<any>> } nodePromises
         *
         * @returns { Promise<SuccessNodePromises | RejectedNodePromises> }
         *
         */
        this.handleNodePromises = async (nodePromises, minNodeCount) => {
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
            (0, misc_1.log)(`most common error: ${JSON.stringify(mostCommonError)}`);
            const rejectedPromises = {
                success: false,
                error: mostCommonError,
            };
            return rejectedPromises;
        };
        /**
         * Run lit action on a single deterministicly selected node. It's important that the nodes use the same deterministic selection algorithm.
         *
         * @param { ExecuteJsProps } params
         *
         * @returns { Promise<SuccessNodePromises | RejectedNodePromises> }
         *
         */
        this.runOnTargetedNodes = async (params) => {
            const { code, authSig, jsParams, debug, sessionSigs, targetNodeRange } = params;
            (0, misc_1.log)('running runOnTargetedNodes:', targetNodeRange);
            if (!targetNodeRange) {
                return (0, misc_1.throwError)({
                    message: 'targetNodeRange is required',
                    errorKind: constants_1.LIT_ERROR.INVALID_PARAM_TYPE.kind,
                    errorCode: constants_1.LIT_ERROR.INVALID_PARAM_TYPE.name,
                });
            }
            // determine which node to run on
            let ipfsId;
            if (params.code) {
                // hash the code to get IPFS id
                const blockstore = new lit_third_party_libs_1.IPFSBundledSDK.MemoryBlockstore();
                let content = params.code;
                if (typeof content === 'string') {
                    content = new TextEncoder().encode(content);
                }
                else {
                    (0, misc_1.throwError)({
                        message: 'Invalid code content type for single node execution.  Your code param must be a string',
                        errorKind: constants_1.LIT_ERROR.INVALID_PARAM_TYPE.kind,
                        errorCode: constants_1.LIT_ERROR.INVALID_PARAM_TYPE.name,
                    });
                }
                let lastCid;
                for await (const { cid } of lit_third_party_libs_1.IPFSBundledSDK.importer([{ content }], blockstore, {
                    onlyHash: true,
                })) {
                    lastCid = cid;
                }
                ipfsId = lastCid;
            }
            else {
                ipfsId = params.ipfsId;
            }
            if (!ipfsId) {
                return (0, misc_1.throwError)({
                    message: 'ipfsId is required',
                    error: constants_1.LIT_ERROR.INVALID_PARAM_TYPE,
                });
            }
            // select targetNodeRange number of random index of the bootstrapUrls.length
            const randomSelectedNodeIndexes = [];
            let nodeCounter = 0;
            while (randomSelectedNodeIndexes.length < targetNodeRange) {
                const str = `${nodeCounter}:${ipfsId.toString()}`;
                const cidBuffer = Buffer.from(str);
                const hash = (0, utils_1.sha256)(cidBuffer);
                const hashAsNumber = ethers_1.BigNumber.from(hash);
                const nodeIndex = hashAsNumber
                    .mod(this.config.bootstrapUrls.length)
                    .toNumber();
                (0, misc_1.log)('nodeIndex:', nodeIndex);
                // must be unique & less than bootstrapUrls.length
                if (!randomSelectedNodeIndexes.includes(nodeIndex) &&
                    nodeIndex < this.config.bootstrapUrls.length) {
                    randomSelectedNodeIndexes.push(nodeIndex);
                }
                nodeCounter++;
            }
            (0, misc_1.log)('Final Selected Indexes:', randomSelectedNodeIndexes);
            const requestId = this.getRequestId();
            const nodePromises = [];
            for (let i = 0; i < randomSelectedNodeIndexes.length; i++) {
                // should we mix in the jsParams?  to do this, we need a canonical way to serialize the jsParams object that will be identical in rust.
                // const jsParams = params.jsParams || {};
                // const jsParamsString = JSON.stringify(jsParams);
                const nodeIndex = randomSelectedNodeIndexes[i];
                // FIXME: we are using this.config.bootstrapUrls to pick the selected node, but we
                // should be using something like the list of nodes from the staking contract
                // because the staking nodes can change, and the rust code will use the same list
                const url = this.config.bootstrapUrls[nodeIndex];
                (0, misc_1.log)(`running on node ${nodeIndex} at ${url}`);
                const reqBody = this.getLitActionRequestBody(params);
                // -- choose the right signature
                let sigToPassToNode = this.getAuthSigOrSessionAuthSig({
                    authSig,
                    sessionSigs,
                    url,
                });
                reqBody.authSig = sigToPassToNode;
                // this return { url: string, data: JsonRequest }
                let singleNodePromise = this.getJsExecutionShares(url, reqBody, requestId);
                nodePromises.push(singleNodePromise);
            }
            const handledPromise = await this.handleNodePromises(nodePromises, targetNodeRange);
            // -- handle response
            return handledPromise;
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
        // ========== Shares Resolvers ==========
        /**
         *
         * Get signatures from signed data
         *
         * @param { Array<any> } signedData
         *
         * @returns { any }
         *
         */
        this.getSessionSignatures = (signedData) => {
            // -- prepare
            let signatures = {};
            // TOOD: get keys of signedData
            const keys = Object.keys(signedData[0]);
            // -- execute
            keys.forEach((key) => {
                const shares = signedData.map((r) => r[key]);
                shares.sort((a, b) => a.shareIndex - b.shareIndex);
                const sigShares = shares.map((s) => ({
                    sigType: s.sigType,
                    shareHex: s.signatureShare,
                    shareIndex: s.shareIndex,
                    localX: s.localX,
                    localY: s.localY,
                    publicKey: s.publicKey,
                    dataSigned: s.dataSigned,
                    siweMessage: s.siweMessage,
                }));
                (0, misc_1.log)('sigShares', sigShares);
                const sigType = (0, misc_1.mostCommonString)(sigShares.map((s) => s.sigType));
                // -- validate if this.networkPubKeySet is null
                if (this.networkPubKeySet === null) {
                    (0, misc_1.throwError)({
                        message: 'networkPubKeySet cannot be null',
                        errorKind: constants_1.LIT_ERROR.PARAM_NULL_ERROR.kind,
                        errorCode: constants_1.LIT_ERROR.PARAM_NULL_ERROR.name,
                    });
                    return;
                }
                // -- validate if signature type is BLS or ECDSA
                if (sigType !== 'BLS' && sigType !== 'ECDSA') {
                    (0, misc_1.throwError)({
                        message: 'signature type is not BLS or ECDSA',
                        errorKind: constants_1.LIT_ERROR.UNKNOWN_SIGNATURE_TYPE.kind,
                        errorCode: constants_1.LIT_ERROR.UNKNOWN_SIGNATURE_TYPE.name,
                    });
                    return;
                }
                let signature;
                if (sigType === constants_1.SIGTYPE.BLS) {
                    signature = (0, crypto_1.combineBlsShares)(sigShares, this.networkPubKeySet);
                }
                else if (sigType === constants_1.SIGTYPE.ECDSA) {
                    signature = (0, crypto_1.combineEcdsaShares)(sigShares);
                }
                const encodedSig = (0, utils_1.joinSignature)({
                    r: '0x' + signature.r,
                    s: '0x' + signature.s,
                    v: signature.recid,
                });
                signatures[key] = {
                    ...signature,
                    signature: encodedSig,
                    publicKey: (0, misc_1.mostCommonString)(sigShares.map((s) => s.publicKey)),
                    dataSigned: (0, misc_1.mostCommonString)(sigShares.map((s) => s.dataSigned)),
                    siweMessage: (0, misc_1.mostCommonString)(sigShares.map((s) => s.siweMessage)),
                };
            });
            return signatures;
        };
        /**
         *
         * Get signatures from signed data
         *
         * @param { Array<any> } signedData
         *
         * @returns { any }
         *
         */
        this.getSignatures = (signedData) => {
            // -- prepare
            let signatures = {};
            // TOOD: get keys of signedData
            const keys = Object.keys(signedData[0]);
            // -- execute
            keys.forEach((key) => {
                const shares = signedData.map((r) => r[key]);
                shares.sort((a, b) => a.shareIndex - b.shareIndex);
                const sigShares = shares.map((s) => ({
                    sigType: s.sigType,
                    shareHex: s.signatureShare,
                    shareIndex: s.shareIndex,
                    localX: s.localX,
                    localY: s.localY,
                    publicKey: s.publicKey,
                    dataSigned: s.dataSigned,
                }));
                (0, misc_1.log)('sigShares', sigShares);
                const sigType = (0, misc_1.mostCommonString)(sigShares.map((s) => s.sigType));
                // -- validate if this.networkPubKeySet is null
                if (this.networkPubKeySet === null) {
                    (0, misc_1.throwError)({
                        message: 'networkPubKeySet cannot be null',
                        errorKind: constants_1.LIT_ERROR.PARAM_NULL_ERROR.kind,
                        errorCode: constants_1.LIT_ERROR.PARAM_NULL_ERROR.name,
                    });
                    return;
                }
                // -- validate if signature type is BLS or ECDSA
                if (sigType !== 'BLS' && sigType !== 'ECDSA') {
                    (0, misc_1.throwError)({
                        message: 'signature type is not BLS or ECDSA',
                        errorKind: constants_1.LIT_ERROR.UNKNOWN_SIGNATURE_TYPE.kind,
                        errorCode: constants_1.LIT_ERROR.UNKNOWN_SIGNATURE_TYPE.name,
                    });
                    return;
                }
                let signature;
                if (sigType === constants_1.SIGTYPE.BLS) {
                    signature = (0, crypto_1.combineBlsShares)(sigShares, this.networkPubKeySet);
                }
                else if (sigType === constants_1.SIGTYPE.ECDSA) {
                    signature = (0, crypto_1.combineEcdsaShares)(sigShares);
                }
                const encodedSig = (0, utils_1.joinSignature)({
                    r: '0x' + signature.r,
                    s: '0x' + signature.s,
                    v: signature.recid,
                });
                signatures[key] = {
                    ...signature,
                    signature: encodedSig,
                    publicKey: (0, misc_1.mostCommonString)(sigShares.map((s) => s.publicKey)),
                    dataSigned: (0, misc_1.mostCommonString)(sigShares.map((s) => s.dataSigned)),
                };
            });
            return signatures;
        };
        /**
         *
         * Get the decryptions from the decrypted data list
         *
         * @param { Array<any> } decryptedData
         *
         * @returns { Promise<Array<any>> }
         *
         */
        this.getDecryptions = async (decryptedData) => {
            // -- prepare params
            let decryptions;
            Object.keys(decryptedData[0]).forEach(async (key) => {
                // -- prepare
                const shares = decryptedData.map((r) => r[key]);
                const decShares = shares.map((s) => ({
                    algorithmType: s.algorithmType,
                    decryptionShare: s.decryptionShare,
                    shareIndex: s.shareIndex,
                    publicKey: s.publicKey,
                    ciphertext: s.ciphertext,
                }));
                const algorithmType = (0, misc_1.mostCommonString)(decShares.map((s) => s.algorithmType));
                const ciphertext = (0, misc_1.mostCommonString)(decShares.map((s) => s.ciphertext));
                // -- validate if this.networkPubKeySet is null
                if (this.networkPubKeySet === null) {
                    (0, misc_1.throwError)({
                        message: 'networkPubKeySet cannot be null',
                        errorKind: constants_1.LIT_ERROR.PARAM_NULL_ERROR.kind,
                        errorCode: constants_1.LIT_ERROR.PARAM_NULL_ERROR.name,
                    });
                    return;
                }
                let decrypted;
                if (algorithmType === 'BLS') {
                    decrypted = await (0, crypto_1.combineBlsDecryptionShares)(decShares, this.networkPubKeySet, ciphertext);
                }
                else {
                    (0, misc_1.throwError)({
                        message: 'Unknown decryption algorithm type',
                        errorKind: constants_1.LIT_ERROR.UNKNOWN_DECRYPTION_ALGORITHM_TYPE_ERROR.kind,
                        errorCode: constants_1.LIT_ERROR.UNKNOWN_DECRYPTION_ALGORITHM_TYPE_ERROR.name,
                    });
                }
                decryptions[key] = {
                    decrypted: (0, uint8arrays_1.uint8arrayToString)(decrypted, 'base16'),
                    publicKey: (0, misc_1.mostCommonString)(decShares.map((s) => s.publicKey)),
                    ciphertext: (0, misc_1.mostCommonString)(decShares.map((s) => s.ciphertext)),
                };
            });
            return decryptions;
        };
        /**
         *
         * Get a single signature
         *
         * @param { Array<any> } shareData from all node promises
         *
         * @returns { string } signature
         *
         */
        this.getSignature = async (shareData) => {
            // R_x & R_y values can come from any node (they will be different per node), and will generate a valid signature
            const R_x = shareData[0].local_x;
            const R_y = shareData[0].local_y;
            // the public key can come from any node - it obviously will be identical from each node
            const public_key = shareData[0].public_key;
            const valid_shares = shareData.map((s) => s.signature_share);
            const shares = JSON.stringify(valid_shares);
            await wasmECDSA.initWasmEcdsaSdk(); // init WASM
            const signature = wasmECDSA.combine_signature(R_x, R_y, shares);
            (0, misc_1.log)('raw ecdsa sig', signature);
            return signature;
        };
        // ========== Scoped Business Logics ==========
        /**
         *
         * Execute JS on the nodes and combine and return any resulting signatures
         *
         * @param { ExecuteJsRequest } params
         *
         * @returns { ExecuteJsResponse }
         *
         */
        this.executeJs = async (params) => {
            // ========== Prepare Params ==========
            const { code, ipfsId, authSig, jsParams, debug, sessionSigs, targetNodeRange, } = params;
            // ========== Validate Params ==========
            // -- validate: If it's NOT ready
            if (!this.ready) {
                const message = '1 LitNodeClient is not ready.  Please call await litNodeClient.connect() first.';
                (0, misc_1.throwError)({
                    message,
                    errorKind: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.name,
                });
            }
            const paramsIsSafe = (0, encryption_1.safeParams)({
                functionName: 'executeJs',
                params: params,
            });
            if (!paramsIsSafe) {
                return (0, misc_1.throwError)({
                    message: 'executeJs params are not valid',
                    errorKind: constants_1.LIT_ERROR.INVALID_PARAM_TYPE.kind,
                    errorCode: constants_1.LIT_ERROR.INVALID_PARAM_TYPE.name,
                });
            }
            let res;
            // -- only run on a single node
            if (targetNodeRange) {
                res = await this.runOnTargetedNodes(params);
            }
            else {
                // ========== Prepare Variables ==========
                // -- prepare request body
                const reqBody = this.getLitActionRequestBody(params);
                // ========== Get Node Promises ==========
                // -- fetch shares from nodes
                const requestId = this.getRequestId();
                const nodePromises = this.getNodePromises((url) => {
                    // -- choose the right signature
                    let sigToPassToNode = this.getAuthSigOrSessionAuthSig({
                        authSig,
                        sessionSigs,
                        url,
                    });
                    reqBody.authSig = sigToPassToNode;
                    return this.getJsExecutionShares(url, reqBody, requestId);
                });
                // -- resolve promises
                res = await this.handleNodePromises(nodePromises);
            }
            // -- case: promises rejected
            if (res.success === false) {
                this._throwNodeError(res);
            }
            // -- case: promises success (TODO: check the keys of "values")
            const responseData = res.values;
            (0, misc_1.log)('responseData', JSON.stringify(responseData, null, 2));
            // ========== Extract shares from response data ==========
            // -- 1. combine signed data as a list, and get the signatures from it
            const signedDataList = responseData.map((r) => r.signedData);
            const signatures = this.getSignatures(signedDataList);
            // -- 2. combine decrypted data a list, and get the decryptions from it
            const decryptedDataList = responseData.map((r) => r.decryptedData);
            const decryptions = await this.getDecryptions(decryptedDataList);
            // -- 3. combine responses as a string, and get parse it as JSON
            let response = (0, misc_1.mostCommonString)(responseData.map((r) => r.response));
            response = this.parseResponses(response);
            // -- 4. combine logs
            const mostCommonLogs = (0, misc_1.mostCommonString)(responseData.map((r) => r.logs));
            // ========== Result ==========
            let returnVal = {
                signatures,
                decryptions,
                response,
                logs: mostCommonLogs,
            };
            // -- case: debug mode
            if (debug) {
                const allNodeResponses = responseData.map((r) => r.response);
                const allNodeLogs = responseData.map((r) => r.logs);
                returnVal.debug = {
                    allNodeResponses,
                    allNodeLogs,
                    rawNodeHTTPResponses: responseData,
                };
            }
            return returnVal;
        };
        /**
         *
         * Request a signed JWT of any solidity function call from the LIT network.  There are no prerequisites for this function.  You should use this function if you need to transmit information across chains, or from a blockchain to a centralized DB or server.  The signature of the returned JWT verifies that the response is genuine.
         *
         * @param { SignedChainDataToken } params
         *
         * @returns { Promise<string>}
         */
        this.getSignedChainDataToken = async (params) => {
            // ========== Prepare Params ==========
            const { callRequests, chain } = params;
            // ========== Pre-Validations ==========
            // -- validate if it's ready
            if (!this.ready) {
                const message = '2 LitNodeClient is not ready.  Please call await litNodeClient.connect() first.';
                return (0, misc_1.throwError)({
                    message,
                    errorKind: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.name,
                });
            }
            // -- validate if this.networkPubKeySet is null
            if (this.networkPubKeySet === null) {
                return (0, misc_1.throwError)({
                    message: 'networkPubKeySet cannot be null',
                    errorKind: constants_1.LIT_ERROR.PARAM_NULL_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.PARAM_NULL_ERROR.name,
                });
            }
            // ========== Prepare ==========
            // we need to send jwt params iat (issued at) and exp (expiration)
            // because the nodes may have different wall clock times
            // the nodes will verify that these params are withing a grace period
            const { iat, exp } = this.getJWTParams();
            // ========== Get Node Promises ==========
            // -- fetch shares from nodes
            const requestId = this.getRequestId();
            const nodePromises = this.getNodePromises((url) => {
                return this.getChainDataSigningShare(url, {
                    callRequests,
                    chain,
                    iat,
                    exp,
                }, requestId);
            });
            // -- resolve promises
            const signatureShares = await Promise.all(nodePromises);
            (0, misc_1.log)('signatureShares', signatureShares);
            // -- total of good shares
            const goodShares = signatureShares.filter((d) => d.signatureShare !== '');
            // ========== Shares Validations ==========
            // -- validate if we have enough good shares
            if (goodShares.length < this.config.minNodeCount) {
                (0, misc_1.log)(`majority of shares are bad. goodShares is ${JSON.stringify(goodShares)}`);
                if (this.config.alertWhenUnauthorized) {
                    alert('You are not authorized to receive a signature to grant access to this content');
                }
                (0, misc_1.throwError)({
                    message: `You are not authorized to recieve a signature on this item`,
                    errorKind: constants_1.LIT_ERROR.UNAUTHROZIED_EXCEPTION.kind,
                    errorCode: constants_1.LIT_ERROR.UNAUTHROZIED_EXCEPTION.name,
                });
            }
            // ========== Result ==========
            const finalJwt = this.combineSharesAndGetJWT(this.networkPubKeySet, signatureShares);
            return finalJwt;
        };
        /**
         *
         * Request a signed JWT from the LIT network. Before calling this function, you must either create or know of a resource id and access control conditions for the item you wish to gain authorization for. You can create an access control condition using the saveSigningCondition function.
         *
         * @param { JsonSigningRetrieveRequest } params
         *
         * @returns { Promise<string> } final JWT
         *
         */
        this.getSignedToken = async (params) => {
            // ========== Prepare Params ==========
            const { 
            // accessControlConditions,
            // evmContractConditions,
            // solRpcConditions,
            // unifiedAccessControlConditions,
            chain, authSig, resourceId, sessionSigs, } = params;
            // ========== Pre-Validations ==========
            // -- validate if it's ready
            if (!this.ready) {
                const message = '3 LitNodeClient is not ready.  Please call await litNodeClient.connect() first.';
                (0, misc_1.throwError)({
                    message,
                    errorKind: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.name,
                });
            }
            // -- validate if this.networkPubKeySet is null
            if (this.networkPubKeySet === null) {
                return (0, misc_1.throwError)({
                    message: 'networkPubKeySet cannot be null',
                    errorKind: constants_1.LIT_ERROR.PARAM_NULL_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.PARAM_NULL_ERROR.name,
                });
            }
            // ========== Prepare ==========
            // we need to send jwt params iat (issued at) and exp (expiration)
            // because the nodes may have different wall clock times
            // the nodes will verify that these params are withing a grace period
            const { iat, exp } = this.getJWTParams();
            // ========== Formatting Access Control Conditions =========
            const { error, formattedAccessControlConditions, formattedEVMContractConditions, formattedSolRpcConditions, formattedUnifiedAccessControlConditions, } = this.getFormattedAccessControlConditions(params);
            if (error) {
                return (0, misc_1.throwError)({
                    message: `You must provide either accessControlConditions or evmContractConditions or solRpcConditions or unifiedAccessControlConditions`,
                    errorKind: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.kind,
                    errorCode: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.name,
                });
            }
            if (!resourceId) {
                return (0, misc_1.throwError)({
                    message: `You must provide a resourceId`,
                    errorKind: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.kind,
                    errorCode: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.name,
                });
            }
            const formattedResourceId = (0, access_control_conditions_1.canonicalResourceIdFormatter)(resourceId);
            // ========== Get Node Promises ==========
            const requestId = this.getRequestId();
            const nodePromises = this.getNodePromises((url) => {
                // -- if session key is available, use it
                let authSigToSend = sessionSigs ? sessionSigs[url] : authSig;
                return this.getSigningShare(url, {
                    accessControlConditions: formattedAccessControlConditions,
                    evmContractConditions: formattedEVMContractConditions,
                    solRpcConditions: formattedSolRpcConditions,
                    unifiedAccessControlConditions: formattedUnifiedAccessControlConditions,
                    chain,
                    authSig: authSigToSend,
                    resourceId: formattedResourceId,
                    iat,
                    exp,
                }, requestId);
            });
            // -- resolve promises
            const res = await this.handleNodePromises(nodePromises);
            // -- case: promises rejected
            if (res.success === false) {
                this._throwNodeError(res);
            }
            const signatureShares = res
                .values;
            (0, misc_1.log)('signatureShares', signatureShares);
            // ========== Result ==========
            const finalJwt = this.combineSharesAndGetJWT(this.networkPubKeySet, signatureShares);
            return finalJwt;
        };
        /**
         *
         * Associated access control conditions with a resource on the web.  After calling this function, users may use the getSignedToken function to request a signed JWT from the LIT network.  This JWT proves that the user meets the access control conditions, and is authorized to access the resource you specified in the resourceId parameter of the saveSigningCondition function.
         *
         * @param { JsonStoreSigningRequest } params
         *
         * @returns { Promise<boolean> }
         *
         */
        this.saveSigningCondition = async (params) => {
            // -- validate if it's ready
            if (!this.ready) {
                const message = '4 LitNodeClient is not ready.  Please call await litNodeClient.connect() first.';
                (0, misc_1.throwError)({
                    message,
                    errorKind: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.name,
                });
            }
            // this is to fix my spelling mistake that we must now maintain forever lol
            if (typeof params.permanant !== 'undefined') {
                params.permanent = params.permanant;
            }
            // ========== Prepare Params ==========
            const { 
            // accessControlConditions,
            // evmContractConditions,
            // solRpcConditions,
            // unifiedAccessControlConditions,
            chain, authSig, resourceId, 
            // permanant,
            permanent, sessionSigs, } = params;
            // ----- validate params -----
            // validate if resourceId is null
            if (!resourceId) {
                return (0, misc_1.throwError)({
                    message: 'resourceId cannot be null',
                    errorKind: constants_1.LIT_ERROR.PARAM_NULL_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.PARAM_NULL_ERROR.name,
                });
            }
            // ========== Hashing Resource ID & Conditions ==========
            // hash the resource id
            const hashOfResourceId = await (0, access_control_conditions_1.hashResourceId)(resourceId);
            const hashOfResourceIdStr = (0, uint8arrays_1.uint8arrayToString)(new Uint8Array(hashOfResourceId), 'base16');
            let hashOfConditions = await this.getHashedAccessControlConditions(params);
            if (!hashOfConditions) {
                return (0, misc_1.throwError)({
                    message: `You must provide either accessControlConditions or evmContractConditions or solRpcConditions or unifiedAccessControlConditions`,
                    errorKind: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.kind,
                    errorCode: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.name,
                });
            }
            const hashOfConditionsStr = (0, uint8arrays_1.uint8arrayToString)(new Uint8Array(hashOfConditions), 'base16');
            // ========== Get Node Promises ==========
            const requestId = this.getRequestId();
            const nodePromises = this.getNodePromises((url) => {
                // -- if session key is available, use it
                let authSigToSend = sessionSigs ? sessionSigs[url] : authSig;
                return this.storeSigningConditionWithNode(url, {
                    key: hashOfResourceIdStr,
                    val: hashOfConditionsStr,
                    authSig: authSigToSend,
                    chain,
                    permanent: permanent ? 1 : 0,
                }, requestId);
            });
            // -- resolve promises
            const res = await this.handleNodePromises(nodePromises);
            // -- case: promises rejected
            if (res.success === false) {
                this._throwNodeError(res);
            }
            return true;
        };
        /**
         *
         * Retrieve the symmetric encryption key from the LIT nodes.  Note that this will only work if the current user meets the access control conditions specified when the data was encrypted.  That access control condition is typically that the user is a holder of the NFT that corresponds to this encrypted data.  This NFT token address and ID was specified when this LIT was created.
         *
         */
        this.getEncryptionKey = async (params) => {
            // -- validate if it's ready
            if (!this.ready) {
                const message = '5 LitNodeClient is not ready.  Please call await litNodeClient.connect() first.';
                (0, misc_1.throwError)({
                    message,
                    errorKind: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.name,
                });
            }
            // -- validate if this.networkPubKeySet is null
            if (!this.networkPubKeySet) {
                const message = 'networkPubKeySet cannot be null';
                (0, misc_1.throwError)({
                    message,
                    errorKind: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.name,
                });
            }
            // ========== Prepare Params ==========
            const { chain, authSig, resourceId, toDecrypt } = params;
            // ========== Validate Params ==========
            const paramsIsSafe = (0, encryption_1.safeParams)({
                functionName: 'getEncryptionKey',
                params: params,
            });
            if (!paramsIsSafe) {
                (0, misc_1.throwError)({
                    message: `You must provide either accessControlConditions or evmContractConditions or solRpcConditions or unifiedAccessControlConditions`,
                    errorKind: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.kind,
                    errorCode: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.name,
                });
            }
            // ========== Formatting Access Control Conditions =========
            const { error, formattedAccessControlConditions, formattedEVMContractConditions, formattedSolRpcConditions, formattedUnifiedAccessControlConditions, } = this.getFormattedAccessControlConditions(params);
            if (error) {
                (0, misc_1.throwError)({
                    message: `You must provide either accessControlConditions or evmContractConditions or solRpcConditions or unifiedAccessControlConditions`,
                    errorKind: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.kind,
                    errorCode: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.name,
                });
            }
            // ========== Node Promises ==========
            const requestId = this.getRequestId();
            const nodePromises = this.getNodePromises((url) => {
                // -- choose the right signature
                let sigToPassToNode = this.getAuthSigOrSessionAuthSig({
                    authSig: params.authSig,
                    sessionSigs: params.sessionSigs,
                    url,
                });
                return this.getDecryptionShare(url, {
                    accessControlConditions: formattedAccessControlConditions,
                    evmContractConditions: formattedEVMContractConditions,
                    solRpcConditions: formattedSolRpcConditions,
                    unifiedAccessControlConditions: formattedUnifiedAccessControlConditions,
                    toDecrypt,
                    authSig: sigToPassToNode,
                    chain,
                }, requestId);
            });
            // -- resolve promises
            const res = await this.handleNodePromises(nodePromises);
            // -- case: promises rejected
            if (res.success === false) {
                this._throwNodeError(res);
            }
            const decryptionShares = res
                .values;
            (0, misc_1.log)('decryptionShares', decryptionShares);
            if (!this.networkPubKeySet) {
                return (0, misc_1.throwError)({
                    message: 'networkPubKeySet cannot be null',
                    errorKind: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.name,
                });
            }
            // ========== Combine Shares ==========
            const decrypted = (0, crypto_1.combineBlsDecryptionShares)(decryptionShares, this.networkPubKeySet, toDecrypt);
            return decrypted;
        };
        /**
         *
         * Securely save the association between access control conditions and something that you wish to decrypt
         *
         * @param { JsonSaveEncryptionKeyRequest } params
         *
         * @returns { Promise<Uint8Array> }
         *
         */
        this.saveEncryptionKey = async (params) => {
            // ========= Prepare Params ==========
            const { encryptedSymmetricKey, symmetricKey, authSig, chain, permanent } = params;
            // ========== Validate Params ==========
            // -- validate if it's ready
            if (!this.ready) {
                const message = '6 LitNodeClient is not ready.  Please call await litNodeClient.connect() first.';
                (0, misc_1.throwError)({
                    message,
                    errorKind: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.name,
                });
            }
            // -- validate if this.subnetPubKey is null
            if (!this.subnetPubKey) {
                const message = 'subnetPubKey cannot be null';
                return (0, misc_1.throwError)({
                    message,
                    errorKind: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.name,
                });
            }
            const paramsIsSafe = (0, encryption_1.safeParams)({
                functionName: 'saveEncryptionKey',
                params,
            });
            if (!paramsIsSafe) {
                return (0, misc_1.throwError)({
                    message: `You must provide either accessControlConditions or evmContractConditions or solRpcConditions or unifiedAccessControlConditions`,
                    errorKind: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.kind,
                    errorCode: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.name,
                });
            }
            // ========== Encryption ==========
            // -- encrypt with network pubkey
            let encryptedKey;
            if (encryptedSymmetricKey) {
                encryptedKey = encryptedSymmetricKey;
            }
            else {
                encryptedKey = bls_sdk_1.wasmBlsSdkHelpers.encrypt((0, uint8arrays_1.uint8arrayFromString)(this.subnetPubKey, 'base16'), symmetricKey);
                (0, misc_1.log)('symmetric key encrypted with LIT network key: ', (0, uint8arrays_1.uint8arrayToString)(encryptedKey, 'base16'));
            }
            // ========== Hashing ==========
            // -- hash the encrypted pubkey
            const hashOfKey = await crypto.subtle.digest('SHA-256', encryptedKey);
            const hashOfKeyStr = (0, uint8arrays_1.uint8arrayToString)(new Uint8Array(hashOfKey), 'base16');
            // hash the access control conditions
            let hashOfConditions = await this.getHashedAccessControlConditions(params);
            if (!hashOfConditions) {
                return (0, misc_1.throwError)({
                    message: `You must provide either accessControlConditions or evmContractConditions or solRpcConditions or unifiedAccessControlConditions`,
                    errorKind: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.kind,
                    errorCode: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.name,
                });
            }
            const hashOfConditionsStr = (0, uint8arrays_1.uint8arrayToString)(new Uint8Array(hashOfConditions), 'base16');
            // ========== Node Promises ==========
            const requestId = this.getRequestId();
            const nodePromises = this.getNodePromises((url) => {
                // -- choose the right signature
                let sigToPassToNode = this.getAuthSigOrSessionAuthSig({
                    authSig: params.authSig,
                    sessionSigs: params.sessionSigs,
                    url,
                });
                return this.storeEncryptionConditionWithNode(url, {
                    key: hashOfKeyStr,
                    val: hashOfConditionsStr,
                    authSig: sigToPassToNode,
                    chain,
                    permanent: permanent ? 1 : 0,
                }, requestId);
            });
            // -- resolve promises
            const res = await this.handleNodePromises(nodePromises);
            // -- case: promises rejected
            if (res.success === false) {
                this._throwNodeError(res);
            }
            return encryptedKey;
        };
        /**
         *
         * Validates a condition, and then signs the condition if the validation returns true.
         * Before calling this function, you must know the on chain conditions that you wish to validate.
         *
         * @param { ValidateAndSignECDSA } params
         *
         * @returns { Promise<string> }
         */
        this.validateAndSignEcdsa = async (params) => {
            // ========== Validate Params ==========
            // -- validate if it's ready
            if (!this.ready) {
                const message = '7 LitNodeClient is not ready.  Please call await litNodeClient.connect() first.';
                (0, misc_1.throwError)({
                    message,
                    errorKind: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.name,
                });
            }
            // ========== Prepare Params ==========
            const { accessControlConditions, chain, auth_sig } = params;
            // ========== Prepare JWT Params ==========
            // we need to send jwt params iat (issued at) and exp (expiration)
            // because the nodes may have different wall clock times
            // the nodes will verify that these params are withing a grace period
            const { iat, exp } = this.getJWTParams();
            // -- validate
            if (!accessControlConditions) {
                return (0, misc_1.throwError)({
                    message: `You must provide either accessControlConditions or evmContractConditions or solRpcConditions`,
                    errorKind: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.kind,
                    errorCode: constants_1.LIT_ERROR.INVALID_ARGUMENT_EXCEPTION.name,
                });
            }
            // -- formatted access control conditions
            let formattedAccessControlConditions;
            formattedAccessControlConditions = accessControlConditions.map((c) => (0, access_control_conditions_1.canonicalAccessControlConditionFormatter)(c));
            (0, misc_1.log)('formattedAccessControlConditions', JSON.stringify(formattedAccessControlConditions));
            // ========== Node Promises ==========
            const requestId = this.getRequestId();
            const nodePromises = this.getNodePromises((url) => {
                return this.signConditionEcdsa(url, {
                    accessControlConditions: formattedAccessControlConditions,
                    evmContractConditions: undefined,
                    solRpcConditions: undefined,
                    auth_sig,
                    chain,
                    iat,
                    exp,
                }, requestId);
            });
            // ----- Resolve Promises -----
            try {
                const shareData = await Promise.all(nodePromises);
                if (shareData[0].result == 'failure')
                    return 'Condition Failed';
                const signature = this.getSignature(shareData);
                return signature;
            }
            catch (e) {
                (0, misc_1.log)('Error - signed_ecdsa_messages - ', e);
                const signed_ecdsa_message = nodePromises[0];
                return signed_ecdsa_message;
            }
        };
        /**
         *
         * Connect to the LIT nodes
         *
         * @returns { Promise } A promise that resolves when the nodes are connected.
         *
         */
        this.connect = () => {
            // -- handshake with each node
            const requestId = this.getRequestId();
            for (const url of this.config.bootstrapUrls) {
                this.handshakeWithSgx({ url }, requestId)
                    .then((resp) => {
                    this.connectedNodes.add(url);
                    let keys = {
                        serverPubKey: resp.serverPublicKey,
                        subnetPubKey: resp.subnetPublicKey,
                        networkPubKey: resp.networkPublicKey,
                        networkPubKeySet: resp.networkPublicKeySet,
                    };
                    this.serverKeys[url] = keys;
                })
                    .catch((e) => {
                    (0, misc_1.log)('Error connecting to node ', url, e);
                });
            }
            // -- get promise
            const promise = new Promise((resolve, reject) => {
                const startTime = Date.now();
                const interval = setInterval(() => {
                    if (Object.keys(this.serverKeys).length >= this.config.minNodeCount) {
                        clearInterval(interval);
                        // pick the most common public keys for the subnet and network from the bunch, in case some evil node returned a bad key
                        this.subnetPubKey = (0, misc_1.mostCommonString)(Object.values(this.serverKeys).map((keysFromSingleNode) => keysFromSingleNode.subnetPubKey));
                        this.networkPubKey = (0, misc_1.mostCommonString)(Object.values(this.serverKeys).map((keysFromSingleNode) => keysFromSingleNode.networkPubKey));
                        this.networkPubKeySet = (0, misc_1.mostCommonString)(Object.values(this.serverKeys).map((keysFromSingleNode) => keysFromSingleNode.networkPubKeySet));
                        this.ready = true;
                        (0, misc_1.log)(`🔥 lit is ready. "litNodeClient" variable is ready to use globally.`);
                        // @ts-ignore
                        globalThis.litNodeClient = this;
                        // browser only
                        if ((0, misc_1.isBrowser)()) {
                            console.log(new Event('lit-ready'));
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
                            (0, misc_1.log)(msg);
                            reject(msg);
                        }
                    }
                }, 500);
            });
            return promise;
        };
        /** ============================== SESSION ============================== */
        /**
         * Sign a session public key using a PKP, which generates an authSig.
         * @returns {Object} An object containing the resulting signature.
         */
        this.signSessionKey = async (params) => {
            // ========== Validate Params ==========
            // -- validate: If it's NOT ready
            if (!this.ready) {
                const message = '8 LitNodeClient is not ready.  Please call await litNodeClient.connect() first.';
                (0, misc_1.throwError)({
                    message,
                    errorKind: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.LIT_NODE_CLIENT_NOT_READY_ERROR.name,
                });
            }
            // -- construct SIWE message that will be signed by node to generate an authSig.
            const _expiration = params.expiration ||
                new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
            // Try to get it from local storage, if not generates one~
            let sessionKey = this.getSessionKey(params.sessionKey);
            let sessionKeyUri = constants_1.LIT_SESSION_KEY_URI + sessionKey.publicKey;
            // Compute the address from the public key if it's provided. Otherwise, the node will compute it.
            const pkpEthAddress = (function () {
                if (params.pkpPublicKey)
                    return (0, transactions_1.computeAddress)(params.pkpPublicKey);
                // This will be populated by the node, using dummy value for now.
                return '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
            })();
            let siweMessage = new lit_siwe_1.SiweMessage({
                domain: params?.domain || globalThis.location?.host || 'litprotocol.com',
                address: pkpEthAddress,
                statement: 'Lit Protocol PKP session signature',
                uri: sessionKeyUri,
                version: '1',
                chainId: params.chainId ?? 1,
                expirationTime: _expiration,
                resources: params.resources,
            });
            let siweMessageStr = siweMessage.prepareMessage();
            // ========== Get Node Promises ==========
            // -- fetch shares from nodes
            const requestId = this.getRequestId();
            const nodePromises = this.getNodePromises((url) => {
                return this.getSignSessionKeyShares(url, {
                    body: {
                        sessionKey: sessionKeyUri,
                        authMethods: params.authMethods,
                        pkpPublicKey: params.pkpPublicKey,
                        authSig: params.authSig,
                        siweMessage: siweMessageStr,
                    },
                }, requestId);
            });
            // -- resolve promises
            const res = await this.handleNodePromises(nodePromises);
            // -- case: promises rejected
            if (!tslib_1.__classPrivateFieldGet(this, _LitNodeClientNodeJs_isSuccessNodePromises, "f").call(this, res)) {
                this._throwNodeError(res);
                return {};
            }
            const responseData = res.values;
            (0, misc_1.log)('responseData', JSON.stringify(responseData, null, 2));
            // ========== Extract shares from response data ==========
            // -- 1. combine signed data as a list, and get the signatures from it
            const signedDataList = responseData.map((r) => r.signedData);
            const signatures = this.getSessionSignatures(signedDataList);
            const { sessionSig } = signatures;
            return {
                authSig: {
                    sig: sessionSig.signature,
                    derivedVia: 'web3.eth.personal.sign via Lit PKP',
                    signedMessage: sessionSig.siweMessage,
                    address: (0, transactions_1.computeAddress)('0x' + sessionSig.publicKey),
                },
                pkpPublicKey: sessionSig.publicKey,
            };
        };
        _LitNodeClientNodeJs_isSuccessNodePromises.set(this, (res) => {
            return res.success === true;
        });
        this.getSignSessionKeyShares = async (url, params, requestId) => {
            (0, misc_1.log)('getSignSessionKeyShares');
            const urlWithPath = `${url}/web/sign_session_key`;
            return await this.sendCommandToNode({
                url: urlWithPath,
                data: params.body,
                requestId,
            });
        };
        this.generateAuthMethodForWebAuthn = (params) => ({
            authMethodType: constants_1.AUTH_METHOD_TYPE_IDS.WEBAUTHN,
            accessToken: JSON.stringify(params),
        });
        this.generateAuthMethodForDiscord = (access_token) => ({
            authMethodType: constants_1.AUTH_METHOD_TYPE_IDS.DISCORD,
            accessToken: access_token,
        });
        this.generateAuthMethodForGoogle = (access_token) => ({
            authMethodType: constants_1.AUTH_METHOD_TYPE_IDS.GOOGLE,
            accessToken: access_token,
        });
        this.generateAuthMethodForGoogleJWT = (access_token) => ({
            authMethodType: constants_1.AUTH_METHOD_TYPE_IDS.GOOGLE_JWT,
            accessToken: access_token,
        });
        this.parseResource = ({ resource, }) => {
            const [protocol, resourceId] = resource.split('://');
            return { protocol, resourceId };
        };
        /**
         * Get session signatures for a set of resources
         *
         * High level, how this works:
         * 1. Generate or retrieve session key
         * 2. Generate or retrieve the wallet signature of the session key
         * 3. Sign the specific resources with the session key
         *
         * @param { GetSessionSigsProps } params
         */
        this.getSessionSigs = async (params) => {
            // -- prepare
            // Try to get it from local storage, if not generates one~
            let sessionKey = this.getSessionKey(params.sessionKey);
            let sessionKeyUri = constants_1.LIT_SESSION_KEY_URI + sessionKey.publicKey;
            let capabilities = this.getSessionCapabilities(params.sessionCapabilities, params.resources);
            let expiration = params.expiration || this.getExpiration();
            // -- (TRY) to get the wallet signature
            let walletSig = await this.getWalletSig({
                authNeededCallback: params.authNeededCallback,
                chain: params.chain,
                capabilities: capabilities,
                switchChain: params.switchChain,
                expiration: expiration,
                sessionKeyUri: sessionKeyUri,
            });
            let siweMessage = new lit_siwe_1.SiweMessage(walletSig?.signedMessage);
            let needToResignSessionKey = await this.checkNeedToResignSessionKey({
                siweMessage,
                walletSignature: walletSig?.sig,
                sessionKeyUri,
                resources: params.resources,
                sessionCapabilities: capabilities,
            });
            // -- (CHECK) if we need to resign the session key
            if (needToResignSessionKey) {
                (0, misc_1.log)('need to re-sign session key.  Signing...');
                if (params.authNeededCallback) {
                    walletSig = await params.authNeededCallback({
                        chain: params.chain,
                        resources: capabilities,
                        expiration,
                        uri: sessionKeyUri,
                    });
                }
                else {
                    if (!this.defaultAuthCallback) {
                        return (0, misc_1.throwError)({
                            message: 'No default auth callback provided',
                            errorKind: constants_1.LIT_ERROR.PARAMS_MISSING_ERROR.kind,
                            errorCode: constants_1.LIT_ERROR.PARAMS_MISSING_ERROR.name,
                        });
                    }
                    walletSig = await this.defaultAuthCallback({
                        chain: params.chain,
                        resources: capabilities,
                        switchChain: params.switchChain,
                        expiration,
                        uri: sessionKeyUri,
                    });
                }
            }
            if (walletSig.address === '' ||
                walletSig.derivedVia === '' ||
                walletSig.sig === '' ||
                walletSig.signedMessage === '') {
                (0, misc_1.throwError)({
                    message: 'No wallet signature found',
                    errorKind: constants_1.LIT_ERROR.WALLET_SIGNATURE_NOT_FOUND_ERROR.kind,
                    errorCode: constants_1.LIT_ERROR.WALLET_SIGNATURE_NOT_FOUND_ERROR.name,
                });
                return;
            }
            // ===== AFTER we have Valid Signed Session Key =====
            // - Let's sign the resources with the session key
            // - 5 minutes is the default expiration for a session signature
            // - Because we can generate a new session sig every time the user wants to access a resource without prompting them to sign with their wallet
            let sessionExpiration = new Date(Date.now() + 1000 * 60 * 5);
            const signingTemplate = {
                sessionKey: sessionKey.publicKey,
                resources: params.resources,
                capabilities: [walletSig],
                issuedAt: new Date().toISOString(),
                expiration: sessionExpiration.toISOString(),
            };
            const signatures = {};
            this.connectedNodes.forEach((nodeAddress) => {
                const toSign = {
                    ...signingTemplate,
                    nodeAddress,
                };
                let signedMessage = JSON.stringify(toSign);
                const uint8arrayKey = (0, uint8arrays_1.uint8arrayFromString)(sessionKey.secretKey, 'base16');
                const uint8arrayMessage = (0, uint8arrays_1.uint8arrayFromString)(signedMessage, 'utf8');
                let signature = nacl_1.nacl.sign.detached(uint8arrayMessage, uint8arrayKey);
                // log("signature", signature);
                signatures[nodeAddress] = {
                    sig: (0, uint8arrays_1.uint8arrayToString)(signature, 'base16'),
                    derivedVia: 'litSessionSignViaNacl',
                    signedMessage,
                    address: sessionKey.publicKey,
                    algo: 'ed25519',
                };
            });
            (0, misc_1.log)('signatures:', signatures);
            return signatures;
        };
        let customConfig = args;
        // -- initialize default config
        this.config = constants_1.defaultLitnodeClientConfig;
        // -- initialize default auth callback
        this.defaultAuthCallback = args?.defaultAuthCallback;
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
        // -- set bootstrapUrls to match the network litNetwork unless it's set to custom
        this.setCustomBootstrapUrls();
        // -- set global variables
        globalThis.litConfig = this.config;
    }
    /**
     * Check if a given object is of type SessionKeyPair.
     *
     * @param obj - The object to check.
     * @returns True if the object is of type SessionKeyPair.
     */
    isSessionKeyPair(obj) {
        return (typeof obj === 'object' &&
            'publicKey' in obj &&
            'secretKey' in obj &&
            typeof obj.publicKey === 'string' &&
            typeof obj.secretKey === 'string');
    }
    /**
     *
     * Get a random request ID
     *   *
     * @returns { string }
     *
     */
    getRequestId() {
        return Math.random().toString(16).slice(2);
    }
}
exports.LitNodeClientNodeJs = LitNodeClientNodeJs;
_LitNodeClientNodeJs_isSuccessNodePromises = new WeakMap();
//# sourceMappingURL=lit-node-client-nodejs.js.map