/** Browser clock, identity, memory-session and lifecycle ports; persistence is capability-scoped. */
import type { AppError, AppState, Checkpoint, Outcome } from '../../models';
import type { PlatformPorts } from '../ports';
import {readRawSettings} from './settings';

/** Create fresh host adapters; settings are read only when requested by a delivered capability. */
export function createBrowserPorts(host: Window = window): PlatformPorts {
  let checkpoint: Checkpoint | null = null;
  let revision = 0;
  const unavailable = (): Outcome<void> => ({ ok: false, error: { code: 'runtime-unavailable', message: 'File operations are not available in this build.' } });
  return {
    now: () => host.performance.now(), utcNow: () => new Date().toISOString(),
    newId: () => {
      const bytes = host.crypto.getRandomValues(new Uint8Array(16));
      bytes[6] = (bytes[6]! & 15) | 64; bytes[8] = (bytes[8]! & 63) | 128;
      const h = [...bytes].map(n => n.toString(16).padStart(2, '0')).join('');
      return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
    },
    newSeed: () => {
      const words = new Uint32Array(1);
      do { host.crypto.getRandomValues(words); } while (words[0] === 0);
      return words[0]!;
    },
    readSettings: async () => {try{return {ok:true,value:readRawSettings(host)};}catch{return {ok:false,error:{code:'persistence-failed',message:'Browser settings could not be read.'}};}},
    commitSettings: async () => ({ ok: true, value: undefined }),
    download: async () => unavailable(),
    loadCheckpoint: async () => ({ ok: true, value: structuredClone(checkpoint) }),
    writeCheckpoint: async (state: AppState) => {
      checkpoint = { checkpointVersion: 1, windowId: 0, generation: 1, revision: ++revision, state: structuredClone(state) };
      return { ok: true, value: undefined };
    },
    bindLifecycle: onSuspend => {
      const visibility = () => { if (host.document.hidden) onSuspend(); };
      host.addEventListener('blur', onSuspend);
      host.document.addEventListener('visibilitychange', visibility);
      return () => { host.removeEventListener('blur', onSuspend); host.document.removeEventListener('visibilitychange', visibility); };
    }
  };
}
