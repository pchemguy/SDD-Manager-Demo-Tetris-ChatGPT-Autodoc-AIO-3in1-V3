# Repository layout

## Scope and ownership

This is the intended physical allocation of the components in [DECOMPOSITION](DECOMPOSITION.md) and delivery routes in [PLAN](PLAN.md). Product source/test paths below are planned; their listing is not a claim that implementation exists. Existing root guidance, bundled skills/plugin, license and provenance scaffolding are preserved. No extra packages/workspaces or linked source directories are needed for this small application.

## Source and public boundaries

| Owner | Canonical physical location | Surface and restrictions |
| --- | --- | --- |
| Shared models | `src/models.ts` | Type/value declarations implementing MODELS; no platform dependencies |
| C1 geometry/landing | `src/domain/geometry.ts`, `src/domain/landing.ts`, `src/domain/shapes.ts` | Used internally by the domain; imported through domain's declared public entry by external consumers |
| C2 engine/sequence/scoring | `src/domain/engine.ts`, `sequence.ts`, `scoring.ts`, public `src/domain/index.ts` | Implements API-DESIGN game operations and projections; exports models/types as needed; no DOM/Node/extension imports |
| C3 controller | `src/application/controller.ts`, public `src/application/index.ts` | Queue, subscriptions, exact-once completion, settings/file commit and checkpoint coordination |
| C4 UI/input/rendering | `src/ui/panels.ts`, `input.ts`, `board.ts`, `styles.css`, public `src/ui/index.ts` | DOM/Canvas resources and shared mount/dispose; receives Controller, never mutates engine internals |
| C5 settings/ranking | `src/rules/settings.ts`, `src/rules/results.ts`, public `src/rules/index.ts` | Pure parsers, validation and ranking; authoritative value domains align with schema |
| C6 snapshot codecs | `src/files/json.ts`, `sqlite.ts`, `validation.ts`, `codec.worker.ts`, public `src/files/index.ts` | Worker protocol/client and both byte formats; database/runtime handles private |
| C7 port contracts | `src/platform/ports.ts` | PlatformPorts and checkpoint message types reference canonical models; no concrete host imports |
| Browser adapter | `src/platform/browser/index.ts`, `settings.ts`, `files.ts`, `lifecycle.ts` | Cookies/history, DOM downloads/input and clock/ID ports; common renderer behavior reusable by Electron |
| Electron shell/adapter | `src/platform/electron/main.ts`, `origin.ts`, private `shell.ts`, renderer `index.ts`; `platforms/electron/runtime.json` | Main-process Electron imports isolated from renderer bundles; local asset/session setup, no game loop or broad preload bridge |
| Shared extension adapter | `src/platform/extension/index.ts`, `session.ts`, `background.ts` | Settings-local/session-checkpoint adapter and generation/revision broker; no gameplay transitions in background |
| Platform entries | `src/entry/browser.ts`, `desktop.ts`, `sidebar.ts` | Compose shared app/controller/UI and the selected adapter/capabilities |
| Capability/version metadata | `src/capabilities.ts`, root `package.json` | Build-selected features and package version; not user configuration or an external plugin registry |

Only component public entries and `src/models.ts`/`src/platform/ports.ts` cross component boundaries. Relative private imports remain inside an owner. Shared UI/application/domain must build without importing Electron main modules or extension globals; adapters provide those facilities. Platform-specific TypeScript configurations distinguish DOM/worker and Node/Electron ambient types. `tsconfig.electron.json` checks only the Node shell without DOM globals; the existing shared/test configuration retains its browser/test owners.

## Formats, assets and assembly

| Owner | Location | Allocation |
| --- | --- | --- |
| Portable format | `schemas/snapshot.schema.json` | Tracked JSON Schema implementing SPEC's version-1 format; consumer/runtime validator has one source |
| Validator generation | `scripts/build-schemas.mjs`, generated `generated/` | Build-time standalone validator; generated output is ignored and rebuilt before dependent checks/bundles |
| Runtime assets | `public/` and build-copied `vendor/` | Project-owned icons; matching pinned SQLite JS/WASM copied from installed dependency by build; no personal/system asset discovery |
| HTML roots | root `index.html`, `platforms/sidebar.html` | Shared entry loading; platform assembly chooses correct bundled entry with relative asset paths |
| Extension manifests | `platforms/chromium/manifest.json`, `platforms/firefox/manifest.json` | Distinct side_panel/sidebar_action and service-worker/background-script declarations; stable version and permission/CSP checks |
| Build configuration | `vite.config.ts`, `tsconfig*.json`, root `package.json`/lockfile | Explicit browser/desktop/sidebar/worker targets; no source symlink/junction requirement |
| C8 packaging/checks | `scripts/build.mjs`, `package.mjs`, `verify-packages.mjs` | Build and stable-name/archive/version/asset checks; direct and CI callers share the same verifier |
| CI | `.github/workflows/verify.yml` | Pinned setup, isolated browsers, checks/build/package verification; no release publication bypassing phase/integration gates |
| Generated products | `dist/browser/`, `dist/desktop/`, `dist/chromium/`, `dist/firefox/`, `artifacts/` | Ignored build roots; release artifacts have the exact stable names in SPEC |

SQLite worker and .wasm resolution use normal copied/package assets under the same platform origin. Follow the repository Vite worker diagnostic policy if served paths fail. Schema, licenses and required runtime assets must be included in the relevant built/package roots; development node_modules, tokens, test fixtures and provenance logs must not be bundled.

## Tests and fixtures

| Test concern | Location and public consumer |
| --- | --- |
| Geometry/game transitions and timers | `tests/unit/domain/` calls public domain API with controlled state/seed/time |
| Settings, ranking and controller effects | `tests/unit/rules/`, `tests/unit/application/` use public entries and typed adapter doubles |
| File format/schema/worker behavior | `tests/unit/files/`, `tests/integration/files/`, `tests/fixtures/` cover complete equivalent and rejected snapshots, timeouts and resource cleanup |
| Browser gameplay/Canvas/settings/layout | `tests/e2e/` and `playwright.config.ts`; actual built/server application, isolated managed browsers |
| Adapter/session/shell contracts | `tests/integration/platform/` covers cookie/history, extension broker generations/session and Electron origin/asset checks |
| Packaged distributions | `tests/packages/` and shared `scripts/verify-packages.mjs`; extracted artifacts and known entry/runtime identities |
| Captured evidence | ignored `test-results/`, `playwright-report/`, and per-task records/reports | Screenshots/logs support actual acceptance; generated images alone are not task completion |

Fixtures containing malformed JSON/SQLite are data, never instructions. Generate larger/corrupt databases reproducibly in tests rather than tracking unnecessary binaries. Browser binary/profile/download roots are dedicated, absolute and ignored or job-external under the central policy. Test helpers may create controlled states through public contracts; they must not bind tests to private UI pixels when a public transition assertion is sufficient. Rendering acceptance still requires visual evidence.

## Documentation and evidence

Development owners remain in `docs/dev/`: PROJECT, ARCHITECTURE, DECOMPOSITION, MODELS, API-DESIGN, SPEC and `spec/`, PLAN, layout, TASKS and adjacent review reports. DOCS_TASKS contains preparation checkoffs only; DOCS_PREPARATION and HANDOFF retain workflow control/continuity.

README owns current user/setup navigation; root `INSTALL.md` owns platform install instructions; root `RELEASE-NOTES.md` owns the finalized release message. `docs/user/` may hold detailed controls/settings/file-format guidance when needed. Actual module/API documentation lives with implementation modules and links to canonical design/contracts rather than copying a second contract.

Milestone reports belong at `docs/dev/reports/phases/<phase>/<milestone>.md`, phase reports at the same prefix's `PHASE-REPORT.md`, and the final implementation report at `docs/dev/reports/IMPLEMENTATION-REPORT.md`. These are produced by assigned boundary tasks, not extra report-only delivery milestones. Retained manual provenance is confined to `docs/ai-logs/`; bundled `.agents/` sources are not application build inputs.

## Tooling targets and refinement

Implementation establishes root-local npm scripts for check/type checking, unit tests, browser acceptance, builds, platform packaging and package verification. Proposed names are `check`, `test:unit`, `test:e2e`, `build`, `package:browser`, `package:windows`, `package:extensions` and `verify:packages`; they are not executable or validated at this preparation checkpoint. The first applicable implementation task pins exact dependencies and records actual validated commands in README/AGENTS.

Vite/TypeScript and a TypeScript-capable unit runner plus Playwright are local development dependencies; no global installation is required. Schema/SQLite/Electron/extension-validation tools are added only when their owning capability is implemented. Scripts remain portable to Linux and Windows CMD; Windows-only instructions continue to be governed by the existing policy. Ignore installed dependencies, generated code/assets, products, browser state, reports and token files.

Private helper filenames may be refined under these owners during implementation. New public surfaces, cross-component ownership or contractual behavior require an owning design/specification amendment and affected review before consumers change. No unresolved physical allocation blocks TASKS.
