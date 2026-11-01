# Component decomposition

## Canonical design owners

[ARCHITECTURE](ARCHITECTURE.md) owns system structure. [MODELS](MODELS.md) owns shared entities and state representations. [API-DESIGN](API-DESIGN.md) owns the provided/required signatures and message surfaces below. Behavioral contracts are assigned to SPEC and its focused contracts; neither API design nor model design supplies a second behavioral specification.

## Components and collaboration

| ID / component | Responsibility and owned state | Provided surface / consumers | Required collaborators and exclusions |
| --- | --- | --- | --- |
| C1 Geometry and landing | Piece cell transforms, normal placement and penetrator reachability; immutable shape data | Geometry operations to C2 and view projection | Models only; no timers, score or rendering |
| C2 Game engine | Board, active/held piece, generator, score/level, bonus inventory and simulation timers | Pure create/dispatch/advance/project operations to C3 | C1 and deterministic sequence functions; no DOM, clock, persistence or file access |
| C3 Application controller | Single live AppState, command queue, completion de-duplication, effectful restore boundary and checkpoint queue | Controller API to C4 and platform lifecycle | C2, C5, C6 and C7 ports; owns all live mutations |
| C4 Presentation and input | DOM nodes, selected open panels, pressed-key repeat state and Canvas drawing resources | Mount/dispose and view consumption to shell | C3 public controller; no cookie/SQL access or direct engine-state writes |
| C5 Settings and ranking | Pure per-key resolution/normalization; validation, sorting, truncation and ID uniqueness | Pure settings/ranking functions to C3/C6 | Models; no I/O and no active gameplay ownership |
| C6 Snapshot codecs | Portable JSON/SQLite representation, isolated parsing and complete candidate validation | Encode/decode to C3; schema asset to validators and consumers | Models, C5 and bundled schema/SQLite runtime; never commits live state |
| C7 Platform adapters | Clock, seed, ID/time source, settings/URL transaction, file picker/download, session checkpoint and lifecycle bindings | PlatformPorts to C3; shell setup to platform entry | Actual host APIs; no gameplay or ranking logic |
| C8 Delivery assembly | Build inputs, platform manifests, packaged assets, stable output names and release checks | Browser, Windows and two extension packages to users | Shared app and shell entries; no domain rules |

The application controller sequences engine actions, derives views, updates results exactly once at game over, then notifies presentation and queues acknowledged session checkpoints. C4 sends semantic commands, never raw DOM events, into that boundary. C2 computes ghost/hard-drop poses using the same C1 landing operation. C6 returns an isolated validated snapshot to C3; C3 and C7 coordinate effects before the live state swap.

## External and internal surfaces

“External” means outside the selected component. C2 is an in-process library with C3 and tests as consumers; C3 is an application service with C4 and lifecycle adapters as consumers. Their interfaces are public within the codebase, while geometric helpers and codec parser internals remain internal to their components. Only the declared entry surfaces are imported by consumers.

| Boundary | Design owner | Contract owner | Verification seam |
| --- | --- | --- | --- |
| C1 → C2 placement/projection | API-DESIGN geometry operations | SPEC gameplay contracts | Enumerated boards and poses; both drop and ghost use the result |
| C2 → C3 transitions/events | API-DESIGN engine operations; MODELS state | SPEC gameplay/lifecycle contracts | Seeded public engine calls with explicit time advances |
| C3 → C4 commands/views | API-DESIGN controller and UI | SPEC UI and settings contracts | Consumer commands, immutable views and actual keyboard/browser integration |
| C3 ↔ C7 effects | API-DESIGN platform ports | SPEC persistence/lifecycle contracts | Adapter contract fixtures plus real origin/storage checks |
| C3 ↔ C6 bytes/candidate | API-DESIGN codec; MODELS portable snapshot | SPEC file contracts | Equivalent JSON/SQLite fixtures; malformed-file and no-mutation checks |
| C7 ↔ extension background | API-DESIGN checkpoint envelopes | SPEC sidebar-session contract | Session identity, revisions, stale-writer rejection and reopen checks |
| C8 → packaged runtime | Architecture delivery shell | SPEC platform/release contracts | Archive inspection, offline asset resolution and supported runtime smoke |

## Extension state ownership

Each browser window has one sidebar session key and a monotonically increasing writer generation. The background coordinator grants the current panel writer a generation and serializes checkpoint messages into storage.session. Older generations cannot overwrite a reopened panel's state. A checkpoint acknowledgement returns its revision. The coordinator transports and validates snapshots without running engine transitions. It clears a closed window's session key and loses all session state on browser restart.

This coordinator is needed for actual sidebar destruction/reopening and concurrent stale messages; it is not a general service layer. Persistent settings are separate from session snapshots. Panel-local presentation toggles do not enter portable save files or global persisted game configuration.

## Refinement and implementation boundaries

The models and API surfaces are settled design inputs. Implementation may refine private helpers, filenames beneath layout-owned directories and exact dependency versions without changing these consumer guarantees. Package versions must be pinned before their consumers compile; SQLite initialization and Electron/extension protocol support must be exercised before dependent packaging. Material model/surface changes return to their design owner and trigger affected SPEC/PLAN/TASKS reassessment.

No class hierarchy or service container is required. Small exported functions and one controller object make ownership and deterministic testing sufficient for this project.
