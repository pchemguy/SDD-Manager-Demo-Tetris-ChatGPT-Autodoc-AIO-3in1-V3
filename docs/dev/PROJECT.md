# Tetris across browser, Windows desktop and browser sidebars

## Purpose and users

Develop a keyboard-controlled Tetris game for desktop players, delivered first as a browser application, then as a self-contained Windows Electron application, and finally as desktop Chromium and Firefox sidebar extensions. The repository demonstrates specification-driven development through playable, verified increments. Demonstration intent does not establish production maturity or official Tetris affiliation.

## Outcomes and delivery constraints

The first delivery is the simplest sensible playable classic browser game. Subsequent bounded increments add the complete capabilities below. Session-only configuration must be delivered before persistent configuration. The browser UI layout must be implemented and verified before Windows delivery; both sidebar extensions follow Windows delivery as one platform increment.

Share the game logic and UI across platforms, with platform-specific lifecycle, settings and file behavior kept separate. Installed desktop and extension packages must bundle required runtime assets and need no separate Node.js installation, development server or backend. The browser distribution is a deployable static build.

Choose an initial project version and increase it for delivered changes. Each completed, verified and integrated implementation phase produces a GitHub release and corresponding tag. Releases include verified artifacts for every platform delivered to date, with installation instructions and an explicit distinction between development packages and signed/store distribution. A platform is delivered only after its packaged artifact passes the applicable verification; report unavailable native execution separately from checks actually performed.

## Complete gameplay scope

Provide a classic board, seven tetrominoes, movement, rotation, soft drop, gravity, line clearing, scoring, levels, pause, restart and game over. Modern extensions include hold, next-piece preview, ghost, seven-bag randomization, wall kicks and hard drop. Default locking waits one full gravity interval after grounding; hard drop uses the same policy unless immediate hard-drop locking is selected.

Offer ghost modes to always hide, always show, or hide dynamically when the projected landing lies above the board midline. Ghost calculations must follow the current piece's normal or penetrator landing rules.

A four-line clear awards one penetrator bonus, with at most three available. A hotkey spends one bonus to activate the current piece until lock. A penetrator passes through occupied cells without destroying them, but its final pose is wholly inside the board and does not overlap occupied cells. Its hard drop and visible ghost target the same lowest valid landing. Penetrator pieces are entirely white; regular pieces never use white. The game information panel shows one bonus symbol per available activation.

## Configuration, leaderboard and files

Expose six settings: ghost visibility, hard-drop enablement, next-preview enablement, immediate versus general hard-drop locking, general failed-downward versus full-interval locking, and hold enablement. Use sensible defaults. First deliver these settings only for the current page session, without reload persistence.

Then add browser cookie and URL query configuration. Resolve every setting independently: valid explicit URL value, saved cookie, then default. Explicit valid URL values are saved to cookies even when equal to defaults; omitted parameters preserve saved cookies. User setting changes update the corresponding cookie and URL parameter.

Keep a session leaderboard of the ten best completed-game results, ranked by score. Each result has a stable ID, non-negative integer score and UTC completion timestamp.

At the bottom of settings, provide Save and Restore controls that hide with the panel. Save offers one JSON or SQLite file containing the top ten results and all six settings. Restore accepts either format, replaces session results, applies settings and updates cookies/URL parameters or their platform adaptations.

JSON has a format version, results array and settings object, with a supplied JSON Schema and complete validation including timestamps and settings. SQLite has `high_scores(id, score, timestamp)`, uniquely keyed `settings(key, value)` rows covering every setting, and format versioning in database metadata. Validate the entire file before changing results, settings, cookies or URL parameters; failed restores show a clear error and preserve them. Save and Restore are manual operations.

## Interface and platform behavior

Arrange browser and desktop panels left to right: leaderboard; game information and controls; centered board; settings; controls/help. Keep the board and game information visible and the board centered when auxiliary panels toggle. Individual leaderboard, settings and help toggle buttons sit above the two gameplay buttons in game information.

The only clickable gameplay controls are Start/Restart on the left and Pause/Start on the right at the panel bottom. Every other gameplay action uses the keyboard. Configuration, panel toggles and file controls retain their specified clickable behavior.

Adapt the shared interface to a narrow, resizable extension sidebar while retaining all delivered capabilities. Gameplay runs in the sidebar page, never the background worker. Persistent extension settings use extension-local storage. Leaderboards retain session-only behavior, including manually restored results. Cookie/URL and file operations receive explicit extension adaptations; closing/reopening and focus changes must not advance an unattended game.

## Proposed consequential choices

These recommendations require confirmation before dependent design. Detailed signatures, schemas, scoring tables, timing constants and acceptance cases belong to the later design and specification.

| Concern | Recommended direction |
| --- | --- |
| Implementation | TypeScript with a framework-free DOM interface and Canvas board; a shared deterministic game core, static browser build and thin platform adapters. |
| Baseline | A 10×20 visible board; simple scoring and level progression. The initial baseline already uses the requested full-interval lock default. Modern movement/randomization features remain later increments. |
| Dynamic ghost | Hide only when all projected cells are above the midline. A landing straddling the midline, or touching its lower half, stays visible. |
| Lock timing | Start a full interval on first grounding. Grounded movement, rotation and delayed hard drop do not restart it. Lifting off clears it; later grounding starts a new full interval. Pausing freezes remaining time. |
| Penetrator interactions | Start with zero bonuses; activation spends one immediately and cannot be cancelled or refunded. Disable hold while penetrator is active. Movement/rotation may cross occupied cells only while a valid final landing remains reachable below. Lock only at a valid pose; locked penetrator cells retain white. |
| Defaults and invalid values | Ghost shown; hard drop, next preview and hold enabled once delivered; general full-interval locking; hard drop follows general locking. Invalid URL values fall through to valid cookies/defaults with a non-blocking warning. Invalid cookies are ignored. Invalid file content rejects the entire restore. |
| Setting changes | Apply visibility and action enablement immediately; retain a disabled hold slot for later re-enablement. Lock-policy changes take effect with the next piece, preserving the active piece's deadline. Restores apply settings atomically under the same effect rules. |
| Completed games and ties | Record game over once; restarting an unfinished game abandons it without a score entry. Break equal-score ties by earlier completion, then stable ID. Keep session results across game restarts. |
| Focus and reopening | Focus loss pauses without automatic resume. Preserve a paused extension game and its session leaderboard across panel close/reopen within the same browser session; browser restart ends that session. Persistent settings alone survive browser restart. |
| Extension persistence and files | Use extension-local persistent settings in place of cookies and URL updates; do not alter the host page URL. Keep game/session data in session-scoped extension state, with no background gameplay. Save downloads one file and Restore uses a file picker. |
| Buttons and keyboard | Start/Restart starts a fresh game; Pause/Start pauses or explicitly resumes. Recommend arrows for movement/soft drop, Up/X and Z for rotation, Space for hard drop, C for hold and P for penetrator; help lists every binding. |

## Scope limits and remaining detail

No network leaderboard, accounts, multiplayer, mobile touch controls, installer signing or store publication is requested. Unsigned development distribution is the proposed starting point; platform instructions must state its installation limits accurately.

The exact scoring curve, repeat timing, browser support versions, packaging choices and native verification facilities will be established during design/specification and planning. These details may not contradict the confirmed gameplay choices or weaken artifact verification requirements.
