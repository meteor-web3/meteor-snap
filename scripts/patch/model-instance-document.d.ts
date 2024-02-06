import type { Operation } from 'fast-json-patch';
import { CreateOpts, LoadOpts, UpdateOpts, Stream, CeramicApi } from '@ceramicnetwork/common';
import { CommitID, StreamID } from '@ceramicnetwork/streamid';
export interface ModelInstanceDocumentMetadataArgs {
    controller?: string;
    model: StreamID;
    deterministic?: boolean;
}
export interface ModelInstanceDocumentMetadata {
    controller: string;
    model: StreamID;
}
export interface Custom {
    onlyPayload?: boolean;
    streamId?: string;
    ceramic?: CeramicApi;
    state?: any;
}
export declare class ModelInstanceDocument<T = Record<string, any>> extends Stream {
    static STREAM_TYPE_NAME: string;
    static STREAM_TYPE_ID: number;
    static MAX_DOCUMENT_SIZE: number;
    private _isReadOnly;
    get content(): T;
    get metadata(): ModelInstanceDocumentMetadata;
    static create<T>(ceramic: CeramicApi, content: T | null, metadata: ModelInstanceDocumentMetadataArgs, opts?: CreateOpts, custom?: Custom): Promise<ModelInstanceDocument<T>>;
    static single<T>(ceramic: CeramicApi, metadata: ModelInstanceDocumentMetadataArgs, opts?: CreateOpts, custom?: Custom): Promise<ModelInstanceDocument<T>>;
    static load<T>(ceramic: CeramicApi, streamId: StreamID | CommitID | string, opts?: LoadOpts, custom?: Custom): Promise<ModelInstanceDocument<T>>;
    replace(content: T | null, opts?: UpdateOpts, custom?: Custom): Promise<void>;
    patch(jsonPatch: Operation[], opts?: UpdateOpts, custom?: Custom): Promise<void>;
    makeReadOnly(): void;
    get isReadOnly(): boolean;
    private _makeCommit;
    private _makeRawCommit;
    private static _makeGenesis;
    private static _makeRawGenesis;
    private static _signDagJWS;
}
export declare function validateContentLength<T>(content: T | null): void;
//# sourceMappingURL=model-instance-document.d.ts.map