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

The project targets shared TypeScript gameplay/UI for browser, Windows Electron and Chromium/Firefox sidebars. The classic/modern engine, controller, browser ports and Canvas UI with next/hold/ghost are implemented; later capability paths in layout remain planned. Node 24 with pinned dependencies supports validated `npm run check`, `npm run build` and the bounded browser probe. Use `npm run test:unit` for domain/controller checks and `npm run test:e2e` for the actual browser game. Preserve platform separation and the central browser/Windows policies above.

[TASKS](docs/dev/TASKS.md) is the sole implementation task owner; its adjacent review report assesses derivation. The current autodoc stopping boundary and any later grants remain in DOCS_PREPARATION/HANDOFF. Phase 4 is activated; recover the current task from TASKS/Git and HANDOFF.

The managed Linux test host requires `TETRIS_FIREFOX_SANDBOX_WORKAROUND=1` for trusted local Firefox checks after a diagnosed content-process namespace failure. It is opt-in and must not be applied to arbitrary pages. Use the absolute project-owned browser root established by Playwright configuration.

`npm run test:unit` covers public domain and application behavior. Domain consumers import `src/domain/index.ts`; private shape data stays within the domain owner.

`npm run package` and `npm run verify:package` build/check the browser candidate with Python 3.11+. `TETRIS_PACKAGED_TEST=1 npm run test:e2e` serves the extracted candidate and tests the actual runtime; source-module input consumers and authored-state public-component fixtures are excluded there; ordinary packaged-entry acceptance still runs. Release packaging requires a clean exact release source and the same checks before upload.

Build-selected delivered features are owned by `src/capabilities.ts`; user settings do not control capability activation.

Pure typed settings/defaults are owned by `src/rules/settings.ts`; session-only edits never invoke persistence. Selected settings and active PiecePolicy are separate. C4 `panels.ts` owns the six controls and pending-policy hint.

The shared C4 entry is `mount(root, controller, mode)` from `src/ui/index.ts`; browser composition uses wide mode, and private board/preview modules own readonly rendering.
