# Tetris: browser, Windows desktop and browser sidebars

A Tetris development project targeting a static browser application, a Windows Electron application and desktop Chromium/Firefox sidebar extensions. Delivery begins with a playable classic browser baseline and adds the requested capabilities through bounded increments.

Implementation is underway. The classic/modern engine, scoring, controller and playable Canvas UI with next/hold/ghost previews, penetrator bonuses and URL/cookie-backed configurable settings are present. Phases 1–7 are verified and integrated. Browser release downloads and installation instructions are available from the [latest release](https://github.com/pchemguy/SDD-Manager-Demo-Tetris-ChatGPT-Autodoc-AIO-3in1-V3/releases/latest). Later phases remain in progress.

## Project documents

- [Project brief](docs/dev/PROJECT.md)
- [Documentation preparation tasks](docs/dev/DOCS_TASKS.md)
- [Preparation decisions and evidence](docs/dev/DOCS_PREPARATION.md)
- [Architecture](docs/dev/ARCHITECTURE.md), [components](docs/dev/DECOMPOSITION.md), [models](docs/dev/MODELS.md) and [APIs](docs/dev/API-DESIGN.md)
- [Specification](docs/dev/SPEC.md), [delivery plan](docs/dev/PLAN.md), [layout](docs/dev/layout.md) and [implementation tasks](docs/dev/TASKS.md)
- [Workflow handoff](docs/dev/HANDOFF.md)

## Development context

This repository uses [SDD Manager](SDD-MANAGER.md) for specification-driven development. Read the [AI-assisted development disclosure](AI_DISCLOSURE.md). The preparation environment also exposes other skills/plugins and prior Tetris-related context; this is not an isolated evaluation of SDD Manager alone. Current project requirements and explicitly accepted decisions govern the implementation.

Selected conversations may be recorded manually under `docs/ai-logs/`. Scaffolding is present, but no conversation record has been created automatically.

## Development setup

Use Node 24 and the pinned local dependencies. Check, unit tests, development server and build regenerate the standalone draft-2020-12 validator from `schemas/snapshot.schema.json` using pinned Ajv8.20.0; runtime validation uses generated ESM without a schema compiler/eval. Generated files are reproducible and ignored. The public JSON codec runs parsing in a local module worker, bounds input at4MiB and execution at10 seconds, and accepts an optional AbortSignal that terminates owned work; The app offers manual JSON and SQLite Save/Restore. The canonical schema is also included byte-for-byte in the browser package:


```text
npm ci
npm run check
npm run build
npm run dev
```

Browser acceptance uses the project-local `.cache/ms-playwright` binary root. Provision the pinned managed Chromium headless shell and Firefox with the local Playwright CLI. Follow the repository browser policy for download/runtime recovery; never reuse a personal browser profile. `npm run probe:browsers` checks two isolated input/Canvas/font/screenshot/teardown cycles per browser, not game acceptance. Run `npm run test:unit` for deterministic domain/rules/controller checks and composed adapter and real-WASM snapshot integration and `npm run test:e2e` for actual browser gameplay. The baseline supports arrow movement, Up/X and Z rotation, Down soft drop, Space hard drop, C hold, P penetrator activation when a bonus is available, Escape pause/resume, and the two session buttons. Left/right repeat after 150 ms and then every 50 ms; soft drop repeats every 40 ms. Pause and focus loss release held keys. Form/editable focus retains normal keys. The six session settings support hide/show/dynamic ghost, hard-drop/hold/next enablement and next-piece lock policies. The delivered app restores each key from URL, cookie or default, synchronizes only valid explicit URL choices, and acknowledges compensated cookie/history edits before changing live selections. Restart retains selections and reload resolves them again. The session-only capability composition retains zero-write/reload-default regressions. Configuration persistence does not save a score or active game. The current Phase6 increment also shows a session top ten: completed games enter once, sorted by score then UTC time and stable ID; Restart retains the list and reload clears it. Manual JSON/SQLite Save/Restore preserves result identity and selected settings, pauses play and validates before acknowledged cookie/URL persistence and live replacement.

On this managed Linux host, Firefox content processes hit a diagnosed `/proc/self/uid_map: EPERM`. The process-local `TETRIS_FIREFOX_SANDBOX_WORKAROUND=1` flag enables the documented content-sandbox override only for trusted local probes/tests. Leave it unset on environments that do not require it. No host security setting is changed.

The SQLite asset gate is available as `npm run probe:sqlite`: it rebuilds/extracts the real ZIP and probes its production worker in both browsers. sql.js 1.15.2 and its matching browser WASM are copied/fingerprinted by `build:assets`; no CDN or host SQLite is used. JSON does not fetch that binary. The native Save format choice and automatic Restore detection use the same complete snapshot validator. Both formats are processed locally in owned workers with no server or host SQLite. See the [asset gate evidence](docs/dev/reports/phases/6/SQLITE-ASSET-GATE.md).

## Layout and controls

The shared UI centers the board independently of leaderboard/settings/help visibility. Three Hide/Show controls sit above the two gameplay buttons; hiding settings also hides manual file controls. Canvas backing follows device pixels. See the [UI guide](docs/UI-GUIDE.md) for keyboard, focus, settings and manual snapshots. Wide order is verified from 1280px; compact information/board/auxiliary sections fit 320px and shared sidebar mode remains compact. Hidden controls leave keyboard/accessibility navigation, resize retains game/settings/results/focus, and file feedback stays accessible outside a hidden settings panel.

## Browser packaging

`npm run package` builds `dist/release/tetris-browser.zip`, `INSTALL.md` and `SHA256SUMS.txt`. `npm run verify:package` checks the stable inventory, SHA-256 bytes, safe ZIP members, local assets, source/version, project/third-party license bytes and credential exclusions, then extracts to `dist/package-smoke`. Use `TETRIS_PACKAGED_TEST=1 npm run test:e2e` to test that extracted distribution. On the diagnosed Linux host, also set the Firefox workaround described above. Python 3.11+ is required for packaging/static smoke serving. See [installation instructions](INSTALL.md).

The verification workflow runs the same checks on push/PR. Local success does not claim that GitHub Actions has run successfully.

### Desktop application assembly

`npm run build:desktop` produces `dist/desktop/` with a bundled Electron main process and the shared renderer. `ASSETS.json` fingerprints every renderer resource before the secure local-origin handler loads it. The renderer uses the existing browser cookie/query and manual file adapters on `app://tetris/`; there is no Node or preload bridge. This directory is a build input, not the Windows portable distribution. Windows runtime assembly and artifact verification follow in the desktop delivery tasks.

`npm run package:windows` assembles the Windows portable candidate after `build:desktop`. The producer requires the exact official Electron ZIP described by `platforms/electron/runtime.json` at `.cache/electron-runtime/electron-v45.2.1-win32-x64.zip`; it checks size, SHA-256, ZIP integrity and runtime version before use. The candidate is `dist/windows-candidate/tetris-windows-x64.zip`, with `Tetris.exe` and `resources/app/`. Packaging does not sign the application or establish native Windows execution. Complete independent package verification and release instructions are separate delivery gates.

`npm run verify:windows` independently checks the candidate against the pristine pinned runtime and the generated app, parses the executable's AMD64 PE32+ identity, checks archive paths/duplicates, version/source and renderer manifest, and extracts to `dist/windows-smoke/`. `TETRIS_DESKTOP_TEST=1 TETRIS_PACKAGED_TEST=1 TETRIS_DESKTOP_ROOT=<absolute extracted resources/app/renderer path> npm run test:e2e` exercises those extracted renderer bytes through the production handler over a test-only HTTP transport. This is shared-renderer evidence, not native Windows installation or launch evidence.
