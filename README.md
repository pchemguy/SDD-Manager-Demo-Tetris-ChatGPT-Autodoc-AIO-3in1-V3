# Tetris: browser, Windows desktop and browser sidebars

A Tetris development project targeting a static browser application, a Windows Electron application and desktop Chromium/Firefox sidebar extensions. Delivery begins with a playable classic browser baseline and adds the requested capabilities through bounded increments.

Implementation is underway. The current task establishes the toolchain and an empty browser composition shell; playable gameplay and verified release packages are not available yet.

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

Use Node 24 and the pinned local dependencies:

```text
npm ci
npm run check
npm run build
npm run dev
```

Browser acceptance uses the project-local `.cache/ms-playwright` binary root. Provision the pinned managed Chromium headless shell and Firefox with the local Playwright CLI. Follow the repository browser policy for download/runtime recovery; never reuse a personal browser profile. `npm run probe:browsers` checks two isolated input/Canvas/font/screenshot/teardown cycles per browser, not game acceptance. Unit and application tests are added with their owning tasks.

On this managed Linux host, Firefox content processes hit a diagnosed `/proc/self/uid_map: EPERM`. The process-local `TETRIS_FIREFOX_SANDBOX_WORKAROUND=1` flag enables the documented content-sandbox override only for trusted local probes/tests. Leave it unset on environments that do not require it. No host security setting is changed.
