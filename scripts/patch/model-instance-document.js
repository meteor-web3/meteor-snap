var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ModelInstanceDocument_1;
import jsonpatch from 'fast-json-patch';
import * as dagCbor from '@ipld/dag-cbor';
import { randomBytes } from '@stablelib/random';
import sizeof from 'object-sizeof';
import { Stream, StreamStatic, SyncOptions, StreamUtils } from '@ceramicnetwork/common';
import { StreamRef, StreamID } from '@ceramicnetwork/streamid';

function typeStreamID(streamId) {
    return typeof streamId === 'string' ? StreamID.fromString(streamId) : streamId;
}

const DEFAULT_CREATE_OPTS = {
    anchor: true,
    publish: true,
    sync: SyncOptions.NEVER_SYNC,
    syncTimeoutSeconds: 0,
};
const DEFAULT_DETERMINISTIC_OPTS = {
    anchor: false,
    publish: false,
    sync: SyncOptions.PREFER_CACHE,
};
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE };
const DEFAULT_UPDATE_OPTS = { anchor: true, publish: true };
async function _ensureAuthenticated(signer) {
    if (signer.did == null) {
        throw new Error('No DID provided');
    }
    if (!signer.did.authenticated) {
        await signer.did.authenticate();
        if (signer.loggerProvider) {
            signer.loggerProvider.getDiagnosticsLogger().imp(`Now authenticated as DID ${signer.did.id}`);
        }
    }
}
async function throwReadOnlyError() {
    throw new Error('Historical stream commits cannot be modified. Load the stream without specifying a commit to make updates.');
}
let ModelInstanceDocument = ModelInstanceDocument_1 = class ModelInstanceDocument extends Stream {
    constructor() {
        super(...arguments);
        this._isReadOnly = false;
    }
    get content() {
        return super.content;
    }
    get metadata() {
        const metadata = this.state$.value.metadata;
        return { controller: metadata.controllers[0], model: metadata.model };
    }
    static async create(ceramic, content, metadata, opts = {}, custom = {}) {
        opts = { ...DEFAULT_CREATE_OPTS, ...opts };
        const signer = opts.asDID ? { did: opts.asDID } : ceramic;
        const commit = await ModelInstanceDocument_1._makeGenesis(signer, content, metadata);
        if(custom?.onlyPayload) {
            return {
                type: ModelInstanceDocument_1.STREAM_TYPE_ID,
                genesis: StreamUtils.serializeCommit(commit),
                opts
            }
        }
        return ceramic.createStreamFromGenesis(ModelInstanceDocument_1.STREAM_TYPE_ID, commit, opts);
    }
    static async single(ceramic, metadata, opts = {}, custom = {}) {
        opts = { ...DEFAULT_DETERMINISTIC_OPTS, ...opts };
        const signer = opts.asDID ? { did: opts.asDID } : ceramic;
        metadata = { ...metadata, deterministic: true };
        const commit = await ModelInstanceDocument_1._makeGenesis(signer, null, metadata);
        if(custom?.onlyPayload) {
            return {
                type: ModelInstanceDocument_1.STREAM_TYPE_ID,
                genesis: StreamUtils.serializeCommit(commit),
                opts
            }
        }
        return ceramic.createStreamFromGenesis(ModelInstanceDocument_1.STREAM_TYPE_ID, commit, opts);
    }
    static async load(ceramic, streamId, opts = {}, custom = {}) {
        opts = { ...DEFAULT_LOAD_OPTS, ...opts };
        const streamRef = StreamRef.from(streamId);
        if (streamRef.type != ModelInstanceDocument_1.STREAM_TYPE_ID) {
            throw new Error(`StreamID ${streamRef.toString()} does not refer to a '${ModelInstanceDocument_1.STREAM_TYPE_NAME}' stream, but to a ${streamRef.typeName}`);
        }
        const res =  await ceramic.loadStream(streamRef, opts, custom);
        return res;
    }
    async replace(content, opts = {}, custom = {}) {
        opts = { ...DEFAULT_UPDATE_OPTS, ...opts };
        validateContentLength(content);
        const signer = opts.asDID ? { did: opts.asDID } : (custom.ceramic ? custom.ceramic: this.api);
        const updateCommit = await this._makeCommit(signer, content);
        if(custom.onlyPayload) {
            return {
                streamId: custom.streamId,
                commit: StreamUtils.serializeCommit(updateCommit),
                opts,
            }
        }
        const updated = await (custom.ceramic ? custom.ceramic: this.api).applyCommit(this.id, updateCommit, opts);
        this.state$.next(updated.state);
    }
    async patch(jsonPatch, opts = {}, custom = {}) {
        opts = { ...DEFAULT_UPDATE_OPTS, ...opts };
        jsonPatch.forEach((patch) => {
            switch (patch.op) {
                case 'add': {
                    validateContentLength(patch.value);
                    break;
                }
                case 'replace': {
                    validateContentLength(patch.value);
                    break;
                }
                default: {
                    break;
                }
            }
        });
        const rawCommit = {
            data: jsonPatch,
            prev: this.tip,
            id: this.id.cid,
        };
        const commit = await ModelInstanceDocument_1._signDagJWS((custom.ceramic ? custom.ceramic: this.api), rawCommit);
        if(custom?.onlyPayload) {
            return {
                streamId: custom.streamId,
                commit: StreamUtils.serializeCommit(commit),
                opts,
            }
        }
        const updated = await (custom.ceramic ? custom.ceramic: this.api).applyCommit(this.id, commit, opts);
        this.state$.next(updated.state);
    }
    makeReadOnly() {
        this.replace = throwReadOnlyError;
        this.patch = throwReadOnlyError;
        this.sync = throwReadOnlyError;
        this._isReadOnly = true;
    }
    get isReadOnly() {
        return this._isReadOnly;
    }
    _makeCommit(signer, newContent) {
        const commit = this._makeRawCommit(newContent);
        return ModelInstanceDocument_1._signDagJWS(signer, commit);
    }
    _makeRawCommit(newContent) {
        const patch = jsonpatch.compare(this.content, newContent || {});
        return {
            data: patch,
            prev: this.tip,
            id: this.state.log[0].cid,
        };
    }
    static async _makeGenesis(signer, content, metadata) {
        const commit = await this._makeRawGenesis(signer, content, metadata);
        if (metadata.deterministic) {
            dagCbor.encode(commit);
            return commit;
        }
        else {
            return ModelInstanceDocument_1._signDagJWS(signer, commit);
        }
    }
    static async _makeRawGenesis(signer, content, metadata) {
        if (!metadata.model) {
            throw new Error(`Must specify a 'model' when creating a ModelInstanceDocument`);
        }
        validateContentLength(content);
        let controller = metadata.controller;
        if (!controller) {
            if (signer.did) {
                await _ensureAuthenticated(signer);
                controller = signer.did.hasParent ? signer.did.parent : signer.did.id;
            }
            else {
                throw new Error('No controller specified');
            }
        }
        const header = {
            controllers: [controller],
            model: metadata.model.bytes,
            sep: 'model',
        };
        if (!metadata.deterministic) {
            header.unique = randomBytes(12);
        }
        return { data: content, header };
    }
    static async _signDagJWS(signer, commit) {
        await _ensureAuthenticated(signer);
        return signer.did.createDagJWS(commit);
    }
};
ModelInstanceDocument.STREAM_TYPE_NAME = 'MID';
ModelInstanceDocument.STREAM_TYPE_ID = 3;
ModelInstanceDocument.MAX_DOCUMENT_SIZE = 16000000;
ModelInstanceDocument = ModelInstanceDocument_1 = __decorate([
    StreamStatic()
], ModelInstanceDocument);
export { ModelInstanceDocument };
export function validateContentLength(content) {
    if (content) {
        const contentLength = sizeof(content);
        if (contentLength > ModelInstanceDocument.MAX_DOCUMENT_SIZE) {
            throw new Error(`Content has length of ${contentLength}B which exceeds maximum size of ${ModelInstanceDocument.MAX_DOCUMENT_SIZE}B`);
        }
    }
}
//# sourceMappingURL=model-instance-document.js.map