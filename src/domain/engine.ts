/** Pure classic game transitions; gravity and grounded locking have separate clocks. */
import type { Capabilities, Cell, GameAction, GameEvent, GameState, Piece, PieceKind, Settings, Transition } from '../models';
import { canPlace, cells } from './geometry';
import { takeNext } from './sequence';
import { addPoints, clearAndScore } from './scoring';

type Mutable<T> = T extends ReadonlyArray<infer U> ? Mutable<U>[] : T extends object ? { -readonly [K in keyof T]: Mutable<T[K]> } : T;
type Draft = Mutable<GameState>;
const copy = (state: GameState): Draft => structuredClone(state) as Draft;
const interval = (level: number) => Math.max(100, Math.floor(1000 * 0.85 ** (level - 1)));
const below = (piece: Piece): Piece => ({ ...piece, origin: { ...piece.origin, y: piece.origin.y + 1 } });

/** Reconcile ground contact without restarting an existing grounded deadline. */
function ground(g: Draft): void {
  if (!g.active) return;
  const grounded = !canPlace(g.board, below(g.active), true);
  if (!grounded) g.timers.lockRemainingMs = null;
  else if (!g.timers.grounded || g.timers.lockRemainingMs === null) {
    g.timers.lockRemainingMs = g.piecePolicy.lockPolicy === 'interval' ? interval(g.level) : null;
  }
  g.timers.grounded = grounded;
}

function spawn(g: Draft, settings: Settings, events: GameEvent[]): void {
  const [kind, sequence] = takeNext(g.sequence);
  g.sequence = copySequence(sequence);
  g.active = { kind, rotation: 0, origin: { x: kind === 'O' ? 4 : 3, y: -2 }, penetrator: false };
  g.holdUsed = false;
  g.piecePolicy = { lockPolicy: settings.lockPolicy, hardDropLock: settings.hardDropLock };
  g.timers = { gravityRemainingMs: interval(g.level), lockRemainingMs: null, grounded: false };
  if (!canPlace(g.board, g.active, true)) end(g, events);
  else ground(g);
}
const copySequence = (s: GameState['sequence']) => ({ ...s, pending: [...s.pending] });

function end(g: Draft, events: GameEvent[]): void {
  g.status = 'gameover';
  events.push({ type: 'gameOver', runId: g.runId });
}

/** Atomically place only a fully in-board legal pose, then start a fresh piece. */
function lock(g: Draft, settings: Settings, events: GameEvent[]): void {
  if (!g.active || !canPlace(g.board, g.active, false)) { end(g, events); return; }
  for (const { x, y } of cells(g.active)) g.board[y]![x] = g.active.kind;
  events.push({ type: 'locked', runId: g.runId });
  const result = clearAndScore(g.board, g.score, g.lines, g.level);
  g.board = result.board; g.score = result.score; g.lines = result.lines; g.level = result.level;
  if (result.cleared) events.push({ type: 'linesCleared', lines: result.cleared, runId: g.runId });
  spawn(g, settings, events);
}

function down(g: Draft, settings: Settings, events: GameEvent[], soft = false): void {
  if (!g.active) return;
  const candidate = below(g.active);
  if (canPlace(g.board, candidate, true)) {
    g.active = copyPiece(candidate);
    if (soft) g.score = addPoints(g.score, 1);
    ground(g);
  }
  else if (g.piecePolicy.lockPolicy === 'failed') lock(g, settings, events);
  else ground(g);
}
const copyPiece = (p: Piece) => ({ ...p, origin: { ...p.origin } });

/** Create an empty idle state or a seeded running game; seeds are nonzero uint32. */
export function createGame(seed: number, runId: string, settings: Settings, capabilities: Capabilities, initialStatus: 'idle' | 'running'): GameState {
  if (!Number.isInteger(seed) || seed < 1 || seed > 4294967295) throw new RangeError('Seed must be a nonzero uint32');
  const g: Draft = {
    runId, status: initialStatus, board: Array.from({ length: 20 }, () => Array<Cell>(10).fill(null)),
    active: null, held: null, holdUsed: false, sequence: { rng: seed, mode: capabilities.has('modern')?'bag7':'uniform', pending: [] },
    score: 0, lines: 0, level: 1, bonuses: 0,
    timers: { gravityRemainingMs: 1000, lockRemainingMs: null, grounded: false },
    piecePolicy: { lockPolicy: settings.lockPolicy, hardDropLock: settings.hardDropLock }
  };
  if (initialStatus === 'running') spawn(g, settings, []);
  return g;
}

/** Pause/resume only active sessions; remaining durations are unchanged. */
export function setPaused(state: GameState, paused: boolean): GameState {
  if (paused && state.status === 'running') return { ...state, status: 'paused' };
  if (!paused && state.status === 'paused') return { ...state, status: 'running' };
  return state;
}

/** Apply one baseline action without host effects or mutating the caller's state. */
export function dispatchGame(state: GameState, action: GameAction, settings: Settings, _capabilities: Capabilities): Transition {
  if (state.status !== 'running' || !state.active || ['hold','hardDrop','penetrator'].includes(action)) return { state, events: [] };
  const g = copy(state), events: GameEvent[] = [];
  if (action === 'softDrop') down(g, settings, events, true);
  else {
    const p = g.active!;
    let candidate: Piece = p;
    if (action === 'left' || action === 'right') candidate = { ...p, origin: { ...p.origin, x: p.origin.x + (action === 'left' ? -1 : 1) } };
    else if (p.kind !== 'O') candidate = { ...p, rotation: ((p.rotation + (action === 'rotateCW' ? 1 : 3)) % 4) as Piece['rotation'] };
    if (canPlace(g.board, candidate, true)) { g.active = copyPiece(candidate); ground(g); }
  }
  return { state: g, events };
}

/** Process explicit active time in event order, with lock expiry before equal-time gravity. */
export function advanceGame(state: GameState, elapsedMs: number, settings: Settings, _capabilities: Capabilities): Transition {
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw new RangeError('Elapsed time must be finite and non-negative');
  if (state.status !== 'running' || elapsedMs === 0) return { state, events: [] };
  const g = copy(state), events: GameEvent[] = [];
  ground(g);
  let remaining = elapsedMs;
  while (g.status === 'running' && remaining > 0) {
    const step = Math.min(remaining, g.timers.gravityRemainingMs, g.timers.lockRemainingMs ?? Infinity);
    g.timers.gravityRemainingMs -= step;
    if (g.timers.lockRemainingMs !== null) g.timers.lockRemainingMs -= step;
    remaining -= step;
    if (g.timers.lockRemainingMs !== null && g.timers.lockRemainingMs <= 0) { lock(g, settings, events); continue; }
    if (g.timers.gravityRemainingMs <= 0) { g.timers.gravityRemainingMs = interval(g.level); down(g, settings, events); }
  }
  return { state: g, events };
}

/** Baseline projections expose no undelivered modern controls. */
export function projectGame(state: GameState, settings: Settings, capabilities: Capabilities): Readonly<{ ghost: Piece | null; next: PieceKind | null; held: PieceKind | null }> {
  return { ghost: null, next: capabilities.has('modern')&&settings.nextPreview ? state.sequence.pending[0]??null : null, held: null };
}
