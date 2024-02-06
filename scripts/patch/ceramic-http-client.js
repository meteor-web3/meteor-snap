import { typeStreamID } from './utils.js';
import { Document } from './document.js';
import { fetchJson, StreamUtils, SyncOptions, } from '@ceramicnetwork/common';
import { TileDocument } from '@ceramicnetwork/stream-tile';
import { Caip10Link } from '@ceramicnetwork/stream-caip10-link';
import { Model } from '@ceramicnetwork/stream-model';
import { ModelInstanceDocument } from '@ceramicnetwork/stream-model-instance';
import { StreamRef } from '@ceramicnetwork/streamid';
import { RemoteIndexApi } from './remote-index-api.js';
import { RemoteAdminApi } from './remote-admin-api.js';
import { DummyPinApi } from './dummy-pin-api.js';
const API_PATH = '/api/v0/';
const CERAMIC_HOST = 'http://localhost:7007';
export const DEFAULT_CLIENT_CONFIG = {
    syncInterval: 5000,
};
const DEFAULT_APPLY_COMMIT_OPTS = { anchor: true, publish: true, sync: SyncOptions.PREFER_CACHE };
const DEFAULT_CREATE_FROM_GENESIS_OPTS = {
    anchor: true,
    publish: true,
    sync: SyncOptions.PREFER_CACHE,
};
const DEFAULT_LOAD_OPTS = { sync: SyncOptions.PREFER_CACHE };
export class CeramicClient {
    constructor(apiHost = CERAMIC_HOST, config = {}) {
        this._config = { ...DEFAULT_CLIENT_CONFIG, ...config };
        this._apiUrl = new URL(API_PATH, apiHost);
        this.context = { api: this };
        this.pin = new DummyPinApi();
        this.index = new RemoteIndexApi(this._apiUrl);
        const getDidFn = (() => {
            return this.did;
        }).bind(this);
        this.admin = new RemoteAdminApi(this._apiUrl, getDidFn);
        this._streamConstructors = {
            [Caip10Link.STREAM_TYPE_ID]: Caip10Link,
            [Model.STREAM_TYPE_ID]: Model,
            [ModelInstanceDocument.STREAM_TYPE_ID]: ModelInstanceDocument,
            [TileDocument.STREAM_TYPE_ID]: TileDocument,
        };
    }
    get did() {
        return this.context.did;
    }
    set did(did) {
        this.context.did = did;
    }
    async createStreamFromGenesis(type, genesis, opts = {}) {
        opts = { ...DEFAULT_CREATE_FROM_GENESIS_OPTS, ...opts };
        const stream = await Document.createFromGenesis(this._apiUrl, type, genesis, opts, this._config.syncInterval);
        return this.buildStreamFromDocument(stream);
    }
    async loadStream(streamId, opts = {}, custom = {}) {
        opts = { ...DEFAULT_LOAD_OPTS, ...opts };
        const streamRef = StreamRef.from(streamId);
        const stream = await Document.load(streamRef, this._apiUrl, this._config.syncInterval, opts, custom);
        return this.buildStreamFromDocument(stream);
    }
    async multiQuery(queries, timeout) {
        const queriesJSON = queries.map((q) => {
            return {
                ...q,
                streamId: typeof q.streamId === 'string' ? q.streamId : q.streamId.toString(),
            };
        });
        const url = new URL('./multiqueries', this._apiUrl);
        const results = await fetchJson(url, {
            method: 'POST',
            body: {
                queries: queriesJSON,
                ...{ timeout },
            },
        });
        return Object.entries(results).reduce((acc, e) => {
            const [k, v] = e;
            const state = StreamUtils.deserializeState(v);
            const stream = new Document(state, this._apiUrl, this._config.syncInterval);
            acc[k] = this.buildStreamFromDocument(stream);
            return acc;
        }, {});
    }
    loadStreamCommits(streamId) {
        const effectiveStreamId = typeStreamID(streamId);
        return Document.loadStreamCommits(effectiveStreamId, this._apiUrl);
    }
    async applyCommit(streamId, commit, opts = {}) {
        opts = { ...DEFAULT_APPLY_COMMIT_OPTS, ...opts };
        const effectiveStreamId = typeStreamID(streamId);
        const document = await Document.applyCommit(this._apiUrl, effectiveStreamId, commit, opts, this._config.syncInterval);
        return this.buildStreamFromDocument(document);
    }
    async requestAnchor(streamId, opts = {}) {
        opts = { ...DEFAULT_LOAD_OPTS, ...opts };
        const { anchorStatus } = await fetchJson(`${this._apiUrl}/streams/${streamId.toString()}/anchor`, {
            method: 'POST',
            body: {
                opts,
            },
        });
        return anchorStatus;
    }
    addStreamHandler(streamHandler) {
        this._streamConstructors[streamHandler.name] = streamHandler.stream_constructor;
    }
    a(){

    }
    buildStreamFromState(state) {
        const stream$ = new Document(state, this._apiUrl, this._config.syncInterval);
        return this.buildStreamFromDocument(stream$);
    }
    buildStreamFromDocument(stream) {
        const type = stream.state.type;
        const streamConstructor = this._streamConstructors[type];
        if (!streamConstructor)
            throw new Error(`Failed to find constructor for stream ${type}`);
        return new streamConstructor(stream, this.context);
    }
    async setDID(did) {
        this.context.did = did;
    }
    async getSupportedChains() {
        if (this._supportedChains) {
            return this._supportedChains;
        }
        const { supportedChains } = await fetchJson(this._apiUrl + '/node/chains');
        this._supportedChains = supportedChains;
        return supportedChains;
    }
    async close() { }
}
//# sourceMappingURL=ceramic-http-client.js.map