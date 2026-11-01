/** Host effects supplied to the application; shared code imports no concrete host API. */
import type { AppState, Checkpoint, InputFile, Outcome, RawSettings, SettingsTransaction } from '../models';
export interface PlatformPorts {
  now(): number;
  utcNow(): string;
  newId(): string;
  newSeed(): number;
  readSettings(): Promise<Outcome<Readonly<{ query: RawSettings; saved: RawSettings }>>>;
  commitSettings(tx: SettingsTransaction): Promise<Outcome<void>>;
  download(file: InputFile): Promise<Outcome<void>>;
  loadCheckpoint(): Promise<Outcome<Checkpoint | null>>;
  writeCheckpoint(state: AppState): Promise<Outcome<void>>;
  bindLifecycle(onSuspend: () => void): () => void;
}
