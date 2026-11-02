# API surface design

## Scope and canonical types

This document owns structural operations/messages for [DECOMPOSITION](DECOMPOSITION.md). All named types are owned by [MODELS](MODELS.md); concrete behavioral preconditions, errors and effects belong to SPEC. Public means a supported in-process consumer boundary, not a network endpoint.

## C1 and C2 domain library

```typescript
cells(piece: Piece): ReadonlyArray<Vec>;
canPlace(board: Board, piece: Piece, allowAboveTop: boolean): boolean;
landing(board: Board, piece: Piece): Piece | null;
canTraverse(board: Board, piece: Piece): boolean;
createGame(seed: number, runId: string, settings: Settings,
  capabilities: Capabilities, initialStatus: 'idle' | 'running'): GameState;
setPaused(state: GameState, paused: boolean): GameState;
dispatchGame(state: GameState, action: GameAction, settings: Settings,
  capabilities: Capabilities): Transition;
advanceGame(state: GameState, elapsedMs: number, settings: Settings,
  capabilities: Capabilities): Transition;
projectGame(state: GameState, settings: Settings,
  capabilities: Capabilities): Readonly<{ ghost: Piece | null;
    next: PieceKind | null; held: PieceKind | null }>;
```

C1 exports only geometry/landing operations to C2. C2 exports game creation, action/time transitions and projection to C3 and tests. Seed creation, IDs and wall time remain with C7. All operations return new values or readonly projections and have no external side effects. A failed landing search returns null rather than a partly valid pose. Sequence generation and scoring helpers are internal C2 collaborators, not additional public services.

## C3 application service and C4 presentation

```typescript
interface Controller {
  view(): GameView;
  start(): void;
  pause(): void;
  resume(): void;
  action(action: GameAction): void;
  tick(): void;
  setSettings(patch: SettingPatch): Promise<Outcome<void>>;
  save(format: FileFormat): Promise<Outcome<void>>;
  restore(file: InputFile): Promise<Outcome<void>>;
  subscribe(listener: (view: GameView) => void): () => void;
  suspend(): Promise<Outcome<void>>;
  dispose(): void;
}
createController(initial: AppState, ports: PlatformPorts,
  capabilities: Capabilities): Controller;
mount(root: HTMLElement, controller: Controller,
  mode: 'wide' | 'sidebar'): () => void;
```

Controller owns serialization and notifies subscribers only after a coherent transition. `tick()` polls PlatformPorts.now; the controller accounts each monotonic interval once and synchronizes that clock before every semantic input. The UI must not supply a second frame-delta clock. C2 advanceGame remains the explicit-elapsed pure boundary. C4 owns DOM event listeners and input-repeat scheduling, invokes the controller and disposes listeners/resources through its returned function. UI code cannot call C1/C2 to mutate gameplay. Subscribe returns an idempotent unsubscribe; dispose is idempotent and rejects further effectful operations with a typed failure rather than leaking resources.

## C5 pure rules and C6 codecs

```typescript
resolveSettings(query: RawSettings, saved: RawSettings): Resolution;
validateSettings(input: unknown): Outcome<Settings>;
rankResults(results: ReadonlyArray<ScoreResult>): ReadonlyArray<ScoreResult>;
validateSnapshot(input: unknown): Outcome<PortableSnapshot>;
encodeSnapshot(snapshot: PortableSnapshot,
  format: FileFormat, signal?: AbortSignal): Promise<Outcome<Uint8Array>>;
decodeSnapshot(bytes: Uint8Array, signal?: AbortSignal): Promise<Outcome<PortableSnapshot>>;
```

`validateSnapshot` applies the generated canonical draft-2020-12 schema and complete ID/calendar/settings semantics, rejects import lists above ten, and returns owned ranked values. C6 performs a lexical duplicate-property check before JSON.parse so decoded-name duplicates cannot disappear before validation. Unsupported numeric versions have an unsupported-format outcome; malformed data has invalid-data.

Decode identifies format from bytes, not the supplied filename. JSON and SQLite conversion feed the same complete semantic validator. Encoding validates its input too. C6 owns a terminable codec worker and disposal of its database/statement handles; optional AbortSignal is a backward-compatible implementation refinement of required session-disposal cancellation. Abort, initialization/message failure, timeout and success all release that operation's worker, handlers, deadline and abort listener. The controller owns its signal and checks session generation before effects; callers receive owned byte arrays or immutable validated candidates. SQLite import additionally establishes a verified 64 MiB SQLite heap ceiling, read-only connection operations and untrusted-schema restrictions before integrity/data checks; this bounds constraint/integrity allocations alongside the input/deadline limits. Every prepared statement and database is released on all paths. The decoder exposes no SQL execution API to the controller or UI. C5 sorting is deterministic and non-mutating. `rankResults` validates every supplied record and unique identity before ranking/truncating to ten, returns owned record copies and throws TypeError for invalid preconditions; file validation converts rejected input into its typed Outcome. Calendar checks reject impossible dates and timestamp comparison uses the represented UTC instant without rewriting strings.

## C7 required platform ports

```typescript
interface PlatformPorts {
  now(): number;                    // monotonic milliseconds
  utcNow(): string;                 // UTC result timestamp
  newId(): string;
  newSeed(): number;
  readSettings(): Promise<Outcome<Readonly<{
    query: RawSettings; saved: RawSettings }>>>;
  commitSettings(tx: SettingsTransaction): Promise<Outcome<void>>;
  download(file: InputFile): Promise<Outcome<void>>;
  loadCheckpoint(): Promise<Outcome<Checkpoint | null>>;
  writeCheckpoint(state: AppState): Promise<Outcome<void>>;
  bindLifecycle(onSuspend: () => void): () => void;
}
```

The browser adapter has an in-memory checkpoint implementation; only extension panels need reopening recovery. Its settings transaction owns cookies plus URL changes. Electron provides the same origin behavior through a local secure scheme and persistent session. Sidebar query input is empty; commitSettings writes extension-local settings only, without changing the containing browser tab.

Downloads and input-file acquisition remain host/DOM details. The UI file input supplies InputFile to restore; a cancelled picker issues no restore. A file-format selector requests JSON or SQLite but does not change the portable content. No generic filesystem access or arbitrary main-process IPC is exposed.

## Extension background messages

| Request | Success response | Provider and consumers |
| --- | --- | --- |
| `{type:'acquire', windowId}` | `{generation, revision, checkpoint: Checkpoint \| null, warning?: AppError}` | Background coordinator → panel adapter |
| `{type:'checkpoint', windowId, generation, revision, state}` | `{revision}` | Panel adapter → background coordinator → storage.session |
| `{type:'release', windowId, generation}` | `{released:true}` | Panel lifecycle → coordinator; best-effort only |

Every failure returns `{error: AppError}`. Runtime message sender identity, window identity, supported version, generation and revision are checked before a write. Generation is assigned by the coordinator, never trusted from an acquiring caller. Acquire invalidates a prior writer; checkpoint revisions must increase by one from the acquired revision. A corrupt stored checkpoint yields a fresh null checkpoint with an optional warning, preserving R11 error feedback. The session generation counter survives coordinator restarts and window cleanup within the browser session; it never reuses a removed window's lease. Reacquired checkpoints use the new generation and revision zero. The same message envelope is implemented by Chromium's background service worker and Firefox's background script. The coordinator acknowledges only completed session writes and performs no gameplay transitions.

## C8 package boundary

Build assembly consumes shared entry modules plus one platform adapter and an explicit capability set. Its outputs are a static browser directory, Electron application directory and two extension roots. Packaging adds only declared runtimes/assets/manifests/licenses and installation instructions. Each platform has a distinct executable entry but consumes the same domain/application/UI source. Consumer-build checks prevent platform imports from leaking into the shared browser entry.
