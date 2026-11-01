# Canonical models

## Ownership and use

This artifact is the canonical structural owner for types shared by the components in [DECOMPOSITION](DECOMPOSITION.md). Names below designate TypeScript declarations to implement; they are design declarations, not existing executable code. Behavioral meaning and validation failures belong to SPEC. API-DESIGN references these types without redefining them.

## Values and configuration

```typescript
type PieceKind = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';
type Rotation = 0 | 1 | 2 | 3;
type Cell = PieceKind | 'penetrator' | null;
type Board = ReadonlyArray<ReadonlyArray<Cell>>;
type Vec = Readonly<{ x: number; y: number }>;
type Piece = Readonly<{ kind: PieceKind; rotation: Rotation;
  origin: Vec; penetrator: boolean }>;
type LockPolicy = 'failed' | 'interval';
type HardDropLock = 'general' | 'immediate';
type GhostMode = 'hide' | 'dynamic' | 'show';
type Settings = Readonly<{ ghost: GhostMode; hardDrop: boolean;
  nextPreview: boolean; hardDropLock: HardDropLock;
  lockPolicy: LockPolicy; hold: boolean }>;
type SettingKey = keyof Settings;
type SettingPatch = Partial<Settings>;
type PiecePolicy = Readonly<{ lockPolicy: LockPolicy;
  hardDropLock: HardDropLock }>;
type Status = 'idle' | 'running' | 'paused' | 'gameover';
```

Board is exactly 20 rows of 10 cells. Piece origins and transformed coordinates are integers; an active spawning piece may have cells above row zero, but locked cells cannot. Piece colors are renderer mappings from Cell values, not arbitrary per-cell RGB data.

Settings always contain exactly the six keys above. Selected settings and active PiecePolicy are distinct. Feature availability is a build/application capability, not a seventh user setting. `Capabilities` is a readonly set of `modern`, `penetrator`, `settings`, `persistentSettings`, `leaderboard`, `files` and `panelLayout`; platform identity is a separate adapter property.

## Game and application state

```typescript
type SequenceState = Readonly<{ rng: number; mode: 'uniform' | 'bag7';
  pending: ReadonlyArray<PieceKind> }>;
type Timers = Readonly<{ gravityRemainingMs: number;
  lockRemainingMs: number | null; grounded: boolean }>;
type GameState = Readonly<{ runId: string; status: Status; board: Board;
  active: Piece | null; held: PieceKind | null; holdUsed: boolean;
  sequence: SequenceState; score: number; lines: number; level: number;
  bonuses: number; timers: Timers; piecePolicy: PiecePolicy }>;
type ScoreResult = Readonly<{ id: string; score: number; timestamp: string }>;
type PortableSnapshot = Readonly<{ formatVersion: 1;
  results: ReadonlyArray<ScoreResult>; settings: Settings }>;
type AppState = Readonly<{ game: GameState; settings: Settings;
  results: ReadonlyArray<ScoreResult>; completedRunId: string | null }>;
```

SequenceState contains all pending next pieces and generator state; seeded xorshift32 uses a nonzero unsigned 32-bit state. Sequence operations own random-number consumption. Next preview reads pending state without consuming it. A held piece records kind only: origin, rotation and penetrator activation belong to the falling instance. Score/line values are non-negative safe integers; level starts at 1. Bonuses are integers 0–3. Timers store remaining active-time durations, never absolute wall-clock dates.

A ScoreResult ID is 1–128 ASCII letters, digits, `_` or `-`; newly generated IDs use UUID spelling. Existing IDs and timestamp strings are preserved on file round trips. UTC timestamps use a real Gregorian date, four-digit year 0001–9999, seconds and optional one-to-three fractional digits, ending in `Z`. Newly completed games generate millisecond UTC strings. Results are at most ten unique IDs, ordered by score descending, timestamp instant ascending, then ID code-unit ascending.

## Commands, events and views

```typescript
type GameAction = 'left' | 'right' | 'rotateCW' | 'rotateCCW' |
  'softDrop' | 'hardDrop' | 'hold' | 'penetrator';
type GameEvent = Readonly<{ type: 'locked' | 'linesCleared' |
  'bonusChanged' | 'gameOver'; lines?: number; runId: string }>;
type Transition = Readonly<{ state: GameState;
  events: ReadonlyArray<GameEvent> }>;
type GameView = Readonly<{ state: AppState; ghost: Piece | null;
  next: PieceKind | null; held: PieceKind | null;
  capabilities: Capabilities; error: AppError | null }>;
type AppError = Readonly<{ code: 'invalid-data' | 'unsupported-format' |
  'persistence-failed' | 'file-failed' | 'checkpoint-failed' |
  'stale-session' | 'runtime-unavailable'; message: string }>;
type Outcome<T> = Readonly<{ ok: true; value: T }> |
  Readonly<{ ok: false; error: AppError }>;
type FileFormat = 'json' | 'sqlite';
```

Ignored or unavailable gameplay actions are no-op transitions, not fatal errors. Platform/file failures use Outcome and a user-readable message. The view is an immutable projection; its state objects must not be exposed as mutable engine internals. Only game-over events cause completed-score insertion.

## Settings and effect models

```typescript
type RawSettings = Readonly<Partial<Record<SettingKey, string>>>;
type Resolution = Readonly<{ settings: Settings;
  explicit: ReadonlyArray<SettingKey>; warnings: ReadonlyArray<string> }>;
type SettingsTransaction = Readonly<{ previous: Settings; next: Settings;
  writeKeys: ReadonlyArray<SettingKey>; reason: 'startup' | 'edit' | 'restore' }>;
type InputFile = Readonly<{ name: string; bytes: Uint8Array }>;
type Checkpoint = Readonly<{ checkpointVersion: 1; windowId: number;
  generation: number; revision: number; state: AppState }>;
```

PortableSnapshot deliberately excludes the active game, timers, random sequence, UI toggles and window/session metadata. Checkpoint is internal session data, never a Save file; it contains the larger state needed for paused sidebar recovery. Its model is versioned independently of the portable file format.
