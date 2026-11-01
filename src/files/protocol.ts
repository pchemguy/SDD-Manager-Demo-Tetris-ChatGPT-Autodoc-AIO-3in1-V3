/** Private one-operation worker messages; request identities reject stale responses. */
import type {SQLiteRuntimeInfo} from './sqlite';
import type {FileFormat,Outcome,PortableSnapshot} from '../models';
export type CodecRequest={id:number;operation:'encode';snapshot:PortableSnapshot;format:FileFormat}|{id:number;operation:'decode';bytes:Uint8Array}|{id:number;operation:'runtime'};
export type CodecResponse={id:number;outcome:Outcome<Uint8Array|PortableSnapshot|SQLiteRuntimeInfo>};
