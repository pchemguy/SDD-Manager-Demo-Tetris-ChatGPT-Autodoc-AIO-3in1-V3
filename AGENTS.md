# Agent instructions

## Specification-driven development

This project uses the SDD Manager plugin for specification-driven development. If not already in the context, load `PLUGIN.md` from installed location or from `.agents/plugins/sdd-manager/PLUGIN.md` and the coordinator skill entry it references. If neither source is available, report the missing plugin before dependent workflow work.

**Follow the applicable SDD Manager workflows, including human checkpoints, Git publication and integration, and the tracking policy below.**

## Initialization

Execute the [skill and plugin discovery protocol](SKILL_DISCOVERY_PROTOCOL.md).

## Windows shell

On **Windows execution hosts only**, follow [WINDOWS_SHELL_POLICY.md](.agents/plugins/sdd-manager/assets/WINDOWS_SHELL_POLICY.md): CMD syntax, unavailable PowerShell/pwsh, temporary files for script text and shell operations, and the documented tool probe/recovery. This repository policy is independent of the plugin.

## Browser development

When developing or testing browser-based applications or browser extensions, follow [BROWSER_DEV_POLICY.md](.agents/plugins/sdd-manager/assets/BROWSER_DEV_POLICY.md). Prioritize Chromium and include Firefox by default; project documents may specify other choices. Use dedicated, isolated environments.

## Environment diagnostics

When Playwright is selected, follow [Playwright environment guidance](.agents/plugins/sdd-manager/assets/playwright.md) before dependent setup and execution, and when provisioning or browser runtime blocks required checks.

When a Vite-served module worker fails to start, especially from a linked Windows checkout or with an HTML entry response, follow [Vite worker-loading diagnostics](.agents/plugins/sdd-manager/assets/vite-worker-loading.md). Diagnose the loading stage before applying a workaround; this guidance does not apply to every SQLite or worker failure.

## Workflow continuity

For continuation, read `docs/dev/HANDOFF.md` and use `sdd-manage`'s continuity subworkflow to reconstruct later work from current development records and Git. The handoff describes a checkpoint, not necessarily the branch tip. At startup, inspect unfinished workflow branches against their recorded parents and request the continuation branch unless already selected. Preserve the recovered scope, approvals and stopping boundary.

## Human checkpoints

Present each necessary development-document proposal and its selected artifacts with concise substantive analysis and pause for acceptance before dependent work. Model/API-design artifacts share the decomposition checkpoint; contract artifacts share specification, without additional documentation tasks or approval rounds. Honor the user's requested implementation range and stop when it is complete.

The user may explicitly preapprove future checkpoints at any time. Retain the scope and conditions of that decision, including after interruption; do not repeat a covered approval request. Preapproval does not waive QC, resolve blockers or expand the authorized implementation range.

## Commits and publication

Keep each task's verified result, required evidence and completion checkbox in the same commit. Push every owned commit and verify remote containment before further work or another commit, unless the user explicitly directs local-only or deferred publication.

Use SDD Manager's integration procedure at the authorized complete boundary.

## GitHub tracking

Enable and maintain GitHub tracking for documentation preparation and implementation **by default**. The user may disable tracking, select local-only work or choose another supported backend. Preserve an established choice through interruptions and access failures; copying this template does not reset it.

Follow `sdd-manage`'s preparation and phase-activation workflows for required tracking readiness and lifecycle updates. Reconcile uncertain effects before retrying and report unmet prerequisites before dependent work.

## Project guidance

Maintain project-specific navigation and validated setup/check commands here as they become established. Do not invent commands, paths, requirements or completion claims.

## Tetris project navigation

Read [PROJECT](docs/dev/PROJECT.md), [ARCHITECTURE](docs/dev/ARCHITECTURE.md), [DECOMPOSITION](docs/dev/DECOMPOSITION.md), [MODELS](docs/dev/MODELS.md), [API-DESIGN](docs/dev/API-DESIGN.md), [SPEC](docs/dev/SPEC.md), [PLAN](docs/dev/PLAN.md) and [layout](docs/dev/layout.md) as their current owners. Focused behavioral contracts are linked from SPEC. [DOCS_PREPARATION](docs/dev/DOCS_PREPARATION.md) owns preparation decisions/evidence; DOCS_TASKS owns preparation checkoffs. HANDOFF remains the recovery entry.

The project targets shared TypeScript gameplay/UI for browser, Windows Electron and Chromium/Firefox sidebars. The modern engine, controller, browser settings, session ranking, manual JSON/SQLite snapshots and centered responsive Canvas UI are implemented; desktop candidate assembly/verification is implemented; release and sidebar delivery remain in their owning tasks. Node 24 with pinned dependencies supports validated `npm run check`, `npm run build` and the bounded browser probe. Use `npm run test:unit` for domain/controller checks and `npm run test:e2e` for the actual browser game. Preserve platform separation and the central browser/Windows policies above.

[TASKS](docs/dev/TASKS.md) is the sole implementation task owner; its adjacent review report assesses derivation. Current authorization and stopping boundaries remain in DOCS_PREPARATION/HANDOFF. Phases 1–7 are verified, integrated and released. Phase 8 implementation/review is complete; recover its integration/release effects before Phase 9 activation. Recover the current task from TASKS/Git and HANDOFF.

The managed Linux test host requires `TETRIS_FIREFOX_SANDBOX_WORKAROUND=1` for trusted local Firefox checks after a diagnosed content-process namespace failure. It is opt-in and must not be applied to arbitrary pages. Use the absolute project-owned browser root established by Playwright configuration.

`npm run test:unit` covers public domain/rules/application behavior and deterministic composed adapter integration under `tests/integration/`; CI uses the same command. Domain consumers import `src/domain/index.ts`; private shape data stays within the domain owner.

`npm run package` and `npm run verify:package` build/check the browser candidate with Python 3.11+. `TETRIS_PACKAGED_TEST=1 npm run test:e2e` serves the extracted candidate and tests the actual runtime; source-module input/adapter consumers and authored-state/session-only public-component fixtures are excluded there; ordinary packaged-entry acceptance still runs. The ZIP includes the exact source project LICENSE and third-party notices; the verifier requires and byte-checks them. Release packaging requires a clean exact release source and the same checks before upload.

Build-selected delivered features are owned by `src/capabilities.ts`; user settings do not control capability activation.

Pure typed settings/defaults are consumed through public `src/rules/index.ts`; implementation remains in `settings.ts`; session-only composition never invokes persistence. Capability-scoped C3 startup queues commands until per-key resolution and explicit-URL cookie synchronization finish. The browser adapter compensates handled startup cookie failures and reports unavailable/failed rollback; the browser adapter supports compensated edit/Restore cookie+history transactions. C3 serializes async edits, changes selected values only after acknowledgement, retains typed failure feedback across Restart and settles active/queued edit promises on disposal. Session-only compositions retain their zero-effect path. Selected settings and active PiecePolicy are separate. C4 `panels.ts` owns the six controls and pending-policy hint.

The shared C4 entry is `mount(root, controller, mode)` from `src/ui/index.ts`; browser composition uses wide mode, and private board/preview modules own readonly rendering.


Electron 45.2.1 is pinned. Main/origin/shell under `src/platform/electron/` are Node-only and must never enter a renderer bundle; `tsconfig.electron.json` checks them without DOM ambient types. They register `app://tetris/` on `persist:tetris`, require verified local `ASSETS.json` entries and retain sandbox/isolation with no preload bridge. CI skips npm's unrelated host-binary download via `ELECTRON_SKIP_BINARY_DOWNLOAD=1`; the reviewed Windows runtime identity is in `platforms/electron/runtime.json`. Host-recorder/protocol checks are distinct from actual native launch. `build:desktop`, `package:windows` and `verify:windows` assemble/check the shared renderer and pristine pinned runtime. `fetch:electron`, `package:all` and `verify:all` are the cumulative browser/Windows path used directly and by CI; strict inventories and clean-source release checks are mandatory. The extracted Windows renderer uses the production-origin handler over labeled test-only HTTP transport with TETRIS_DESKTOP_TEST=1, TETRIS_PACKAGED_TEST=1 and an absolute TETRIS_DESKTOP_ROOT. Native Electron/Windows execution is not claimed; consult TASKS/HANDOFF for publication and remaining sidebar scope.
