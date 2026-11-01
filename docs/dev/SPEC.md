# System specification

## Scope and ownership

The system satisfies [PROJECT](PROJECT.md) through the structure in [ARCHITECTURE](ARCHITECTURE.md) and [DECOMPOSITION](DECOMPOSITION.md). [MODELS](MODELS.md) owns canonical data types; [API-DESIGN](API-DESIGN.md) owns interface signatures. The following focused contracts own behavioral detail:

- [Gameplay](spec/gameplay.md): R1–R4, including engine semantics and lifecycle timing.
- [Persistence and files](spec/persistence.md): R5–R8 and their adapter/codec semantics.
- [UI, platforms and releases](spec/platforms.md): R9–R12 and their presentation/delivery semantics.

These artifacts collectively describe the complete intended application. PLAN assigns delivery increments; a phase is assessed only against its included contracts and preserved prior behavior.

## Required capabilities and acceptance

| Requirement | Required outcome / objective acceptance | Responsible components |
| --- | --- | --- |
| R1 Classic game | A new game supports the 10×20 board, seven pieces, keyboard movement/rotation/drop, gravity, line clears, score/level, pause/restart and game over. A scripted full game demonstrates coherent spawn → movement → lock → clear/top-out transitions. | C1–C4 |
| R2 Modern rules | Hold is limited per piece; preview does not consume the queue; seven-bag sequences contain all seven kinds; wall kicks are ordered and bounded; hard drop reaches the normal landing. Disabled/unavailable actions are harmless. | C1–C4 |
| R3 Lock timing | Grounding gets a full current gravity interval, independently of gravity phase. Grounded actions do not reset it; lifting off does. Pause/resume preserves exact remaining time. Immediate hard-drop selection takes precedence; otherwise general policy applies. Boundary checks exercise just-before, exactly-at and just-after expiry. | C1–C3 |
| R4 Ghost and penetrator | Dynamic midline boundaries, lowest valid penetrator landing, pass-through without destruction, white pieces, bonus cap/spend/award and hold prohibition behave together. Ghost and hard drop agree for the same board/pose. | C1–C4 |
| R5 Session settings | All six settings have the specified defaults, controls and effects. The session-only increment writes no persistence and reload restores defaults. Action/visibility toggles are immediate; selected lock policies apply at the next piece. | C3–C5/C7 |
| R6 Persistent settings | Per-key URL → cookie → default resolution, valid explicit default persistence, omission retention, invalid-value fallback and user-change synchronization pass real-origin checks. Extension-local adaptation satisfies the same logical setting contract. | C3/C5/C7 |
| R7 Leaderboard | Completed games enter exactly once; unfinished restarts do not. Ranking, tie handling, truncation, stable IDs and UTC completion times survive manual file round trips while the live history remains session-only. | C3/C5/C7 |
| R8 Manual files | JSON and SQLite save one complete file; both restore formats validate completely before effects. Round-trip equivalent snapshots preserve fields. Malformed, unsupported, duplicate, oversized and semantic-invalid files leave live state and persistence unchanged. | C3/C5–C7 |
| R9 Layout and input | Required wide panel order, board centering across all eight auxiliary visibility combinations, persistent board/info access, two gameplay buttons, keyboard-only other actions and compact responsive behavior pass layout/input checks. Save/Restore hide with settings. | C3/C4 |
| R10 Windows | An unsigned portable x64 package includes Electron and all runtime assets. Archive/executable metadata and shared runtime smoke pass without a separate Node installation/server; native Windows execution is recorded separately when unavailable. | C7/C8 |
| R11 Sidebars | Chromium and Firefox packages contain sidebar pages and local assets, preserve the paused browser-window session across reopen, store only settings persistently, adapt Save/Restore and require no backend. Narrow/resizable layout retains all capabilities. | C3/C4/C7/C8 |
| R12 Releases | Every integrated completed phase has a version/tag/release, notes, installation instructions and verified applicable platform assets with stable names, checksums and honest evidence limits. No artifact is called verified from packaging success alone. | C8 |

## Cross-component guarantees

Engine operations do not mutate input state, read a host clock, write storage or draw. Application commands are serialized. A GameView is immutable and cannot grant the UI write access to the engine. Non-running gameplay actions are no-ops. Invalid nonzero-uint32 seeds, or negative/non-finite elapsed values, throw RangeError before changing state; zero elapsed is a no-op. `createGame` produces an empty idle state or starts a fresh running game according to its explicit initialStatus. `setPaused` changes only running↔paused states, preserving timers and game data; idle/gameover calls do nothing.

Errors from file, persistence or checkpoint operations carry AppError codes and a clear user message. Cancelled pickers do nothing. State subscriptions are notified after coherent changes; a failed operation may update the visible error message without changing results/settings/game data. Disposing a controller clears listeners, timers, pending owned resources and prevents further writes. In-flight asynchronous completions check controller/session generation before committing.

All score arithmetic stays within non-negative safe integers; additions saturate at `Number.MAX_SAFE_INTEGER`. Run IDs distinguish completed games from repeats of an event. A restored result ID is not rewritten. Current gameplay is not replaced by a leaderboard/settings file restore; only the requested data changes, subject to selected-policy activation rules.

## Verification scope

Use contract-level deterministic scenarios and integrated application checks through declared project commands. Browser support is desktop Chromium and Firefox using the repository's isolated-browser policy. Supported runtime APIs include WebAssembly, crypto-generated IDs/seeds, Canvas, Blob downloads, file input and history/cookies or their platform adapters. Exact tested versions/modes are reported per delivery; document preparation does not establish runtime support evidence.

Unavailable native Windows or full-browser sidebar facilities are excluded from execution scope under repository policy and remain explicitly unverified. Build integrity, package contents, shared application behavior and other feasible required checks still apply. No unavailable-native-only task may block the rest of an authorized range by default. A failed feasible required check remains a blocker. Whole-document package QC is separate from these per-document contracts.
