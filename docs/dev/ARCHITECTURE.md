# Architecture

## System context

The application implements the scope in [PROJECT](PROJECT.md) as a local, single-player game. A shared TypeScript application runs in a static browser page, a Windows Electron renderer and two extension sidebar pages. No application backend participates in gameplay, settings, score ranking or file conversion.

## Blocks and dependency direction

| Block | Responsibility | Dependencies and consumers |
| --- | --- | --- |
| Domain | Board geometry, piece sequences, movement, landing, locking, line clears and scoring | Pure TypeScript; consumed by the application controller and domain tests |
| Application | Own the active game, settings effects, leaderboard and command ordering; coordinate restore transactions and lifecycle | Domain and typed platform ports; consumed by the UI and lifecycle bridges |
| Presentation | DOM panels, keyboard routing, Canvas drawing and narrow-sidebar layout | Read-only application views and command dispatch; no direct domain-state mutation |
| File codecs | Translate JSON and SQLite bytes to/from a validated portable snapshot | Canonical snapshot models and validators; consumed by application save/restore |
| Platform adapters | Clock, random seed, IDs, settings persistence, URL handling, downloads/uploads and ephemeral checkpoints | Browser, Electron or WebExtension APIs; implement application ports |
| Delivery shells | Load the shared bundle and supply adapters, assets and platform lifecycle | Shared application entry; Electron main process or extension background code has no game loop |

Dependencies point toward canonical types and the domain. Neither domain nor shared presentation imports Electron or extension APIs. Codecs do not access live results, cookies, URLs or platform storage. The controller is the sole writer of live application state.

## Runtime ownership

The domain accepts explicit elapsed time and a serializable random-generator state. Rendering uses requestAnimationFrame, while the controller advances the simulation using elapsed active time. The clock never advances a paused game. Grounding and locking are separate from ordinary gravity ticks, which prevents an early lock when a piece lands immediately before a global tick.

The controller queues user commands, time advances, configuration changes and file operations. It emits immutable views and events after a completed transition. Keyboard auto-repeat, frame scheduling and platform events enter through this queue. The renderer never infers authoritative landing or lock deadlines from pixels.

The same landing service supplies normal/penetrator hard drop and ghost projection. It owns collision semantics rather than maintaining two competing implementations. Penetrator traversal permits intermediate overlap, while placement validation and the reachable-landing invariant protect the final locked board.

Settings contain both the selected configuration and the lock policy captured for the active piece. Visibility/action toggles affect the current view or next action immediately; selected locking policies become active at the next piece spawn. Hold keeps its slot when disabled. Restart resets game-specific state while retaining configuration and session leaderboard.

## Persistence and file boundaries

Browser settings are resolved per key from query parameters, cookies and defaults. Browser session scores and gameplay remain in memory. Electron serves bundled assets through a standard, secure local `app://tetris/` origin registered on a persistent Electron session, retaining cookie/query behavior without a listening server. Its app process owns lifecycle and local asset resolution; Node integration is disabled in the renderer.

Sidebar adapters replace query/cookie persistence with extension `storage.local` for settings. Their ephemeral game and leaderboard checkpoint uses `storage.session`, keyed by browser-window identity. Separate windows have separate games and score sessions, with common persisted settings read on opening. No host page is read or modified. A background script/worker may allocate session keys and remove closed-window state; it never advances gameplay.

Sidebar checkpoints serialize remaining timers, piece sequence/RNG, current/held pieces, board, score, bonuses, effective policies and results after committed state changes, plus coalesced timer snapshots while running. A reopened panel restores a paused game from the latest acknowledged checkpoint. Pending input transitions are not presented as durable until the storage queue acknowledges them. Closing a panel discards unacknowledged work; no elapsed closed time is applied. This makes the recovery boundary explicit instead of relying only on unload events.

Manual save/restore uses one portable snapshot model covering results and the six selected settings. JSON and SQLite share semantic validation, including actual calendar timestamps, uniqueness and numeric limits. SQL execution is confined to an isolated in-memory imported database. The browser-compatible SQLite runtime and its WebAssembly asset are bundled on every platform that includes file persistence; no CDN is needed at runtime.

Restore decodes and validates into an isolated candidate first. The controller then asks the adapter to commit settings persistence/URL effects with saved old values and compensating rollback on reported failure. Only a successful adapter result swaps live results and settings. Validation failure has no persistence side effects. This is an application transaction for handled errors, not a guarantee of an atomic transaction across browser crashes or externally blocked rollback.

## Presentation and lifecycle

The browser/desktop layout anchors the board independently of auxiliary-panel visibility. Fixed-width panel slots on each side reserve enough room around its center; hidden panels do not re-center the surrounding group. Smaller viewports use a compact board/info region with auxiliary sections below, keeping the board horizontally centered and essential information accessible. Wide layout preserves the requested left-to-right order; sidebar mode uses a board/info header and collapsible auxiliary sections.

Only the two specified gameplay buttons dispatch start/restart or pause/resume. Other gameplay commands originate from keyboard routing. Focused form controls retain normal text/select interaction and do not also move the game. Settings, file actions and panel toggles remain normal accessible DOM controls.

Page visibility/focus loss and Electron blur pause the controller and clear held input. Reopening/focus gain never resumes automatically. Sidebar restoration is paused. The controller preserves remaining lock/gravity durations rather than converting a long inactive wall-clock interval into catch-up play.

## Delivery and verification seams

Use a framework-free DOM/Canvas interface and Vite for static bundling. Unit checks use deterministic domain/application inputs; browser acceptance uses pinned Playwright-managed Chromium headless shell and Firefox under the repository browser policy. Full-browser extension integration and native Windows execution are recorded separately when unavailable, without replacing feasible package, contract or shared-runtime checks.

Windows distribution is an unsigned portable x64 ZIP containing Electron and the application runtime. Chromium distribution is a ZIP for unpacked installation. Firefox distribution is an unsigned development ZIP for temporary installation. Signing/store publication is outside scope. Release assets use stable version-free filenames; versions live in tags, manifests and release notes. Exact dependency versions are selected and locked during the first applicable implementation task, before dependent consumers or packaging.

The system requires no abstract platform registry, dependency-injection framework, backend database or worker-hosted game engine. Small typed ports cover the actual platform differences. Detailed components and canonical type ownership are defined in DECOMPOSITION.

## Platform references

- [Electron protocol API](https://www.electronjs.org/docs/latest/api/protocol): standard secure local schemes and session-specific handlers.
- [Chromium sidePanel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel).
- [Firefox sidebar_action](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/sidebar_action) and [session storage](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/storage/session).
- [sql.js](https://github.com/sql-js/sql.js): browser SQLite import/export and bundled WebAssembly runtime.

These are design inputs; executable integration evidence is required during implementation.
