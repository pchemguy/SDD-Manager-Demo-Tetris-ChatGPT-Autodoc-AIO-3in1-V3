# SQLite asset integration gate — T-045

## Outcome before application SQL consumers

The local runtime gate passes. T-045 pins sql.js 1.15.2 and types 1.4.11, copies its exact browser loader/WASM pair into ignored `vendor/sqlite`, and bundles that loader and local binary through the production codec worker. The runtime reports SQLite 3.54.0 in isolated Chromium and Firefox. T-046 application snapshot conversion has not started: public SQLite encoding and header-detected SQLite imports remain explicitly unavailable in this increment. Once this verified task is published/read back, T-046 may consume the established runtime without another human checkpoint.

`npm run build:assets` checks the exact installed/declaration version, validates the WASM magic/version, copies both companions and fingerprints them. Check, unit tests, dev and build regenerate these assets. The bundled loader comes from the same pinned installed browser export; independent packaging verification compares its copied source bytes and matching WASM with that installed package. Runtime initialization resolves only the expected browser companion, with no CDN or host-installed SQLite fallback.

| Source asset | SHA-256 |
| --- | --- |
| `sql-wasm-browser.js` | `17e880ef4c40827f93ead7766ab960937259368a8341b9d231984a7d8f9fbd41` |
| `sql-wasm-browser.wasm` | `0dfeecda2070b36da0cd4f6afa250af9453de528a983770f85b13d5d6b667572` |

The candidate ZIP is `f8614a079e3f6654ebb37b6a98269f9d31372f7211b584845cd45290b4b89ae7`, ten members, based on T-044 `258f6ff2315955f87292fa8c2445200fab307d31` with sourceDirty=true. Its production worker is `assets/codec.worker-CVX7lQzQ.js`, and its matching binary is `assets/sql-wasm-browser-B-9ndiyM.wasm`. BUILD-INFO records package version and both source hashes. Verification requires the referenced worker and matching referenced WASM, validates source bytes and includes the complete sql.js/SQLite notices. Generated assets, installed dependencies and fixtures are excluded from release inputs.

## Actual built-worker proof

`TETRIS_FIREFOX_SANDBOX_WORKAROUND=1 npm run probe:sqlite` rebuilds, verifies/extracts the actual browser ZIP and runs six isolated readiness cases against its production worker, not an alternate test worker. The private C6/C8 runtime protocol checks SQLite version and integrity with a temporary database, closes it before reporting readiness, and closes the worker after its one response. This diagnostic is not a player-facing file format or SQL execution API.

Both browsers initialize twice from local same-origin assets under a worker response CSP allowing `wasm-unsafe-eval` but not JavaScript `unsafe-eval`. Both report SQLite 3.54.0, integrity `ok` and closed connection. A missing local WASM response returns a finite typed runtime-unavailable result with no CDN request. A stalled WASM fetch is terminated at the owned probe's ten-second deadline while gameplay input stays responsive; the deadline is advanced with the test clock rather than a ten-second wall-clock wait. The production codec owner's timeout/abort cleanup is independently covered by T-043; application SQL conversion will use that same owner after this gate.

Normal JSON Save/Restore does not fetch the WASM binary. The source network counter initially mistook Vite's `?import&url` JavaScript module for a binary request, then incorrectly required a Content-Type on a cached304 response. The corrected check distinguishes URL modules and validates JavaScript responses or304, retaining the strict zero-binary-fetch assertion. No product worker URL/CSP/filesystem workaround was applied. This physical Linux built path showed no HTML-entry/MIME rejection or late optimizer reload; linked Windows behavior is not claimed.

## Verification and limits

Four unit runtime/interface scenarios and four initial built-readiness browser scenarios failed before the runtime implementation/integration. Final `npm run check`, all182 deterministic checks (180 unit +2 composed adapter integration), the six-case standalone built gate, fourteen source JSON worker/native file regressions and twelve packaged JSON/readiness regressions pass. Missing/corrupt WASM fixtures with correctly recomputed checksums are rejected, as is a mismatched declared package version before copying assets. Current report does not claim the full source/package campaigns were rerun after this task; their latest cumulative boundary is M6.2, and the next milestone owns cumulative verification.

SQL snapshot/schema/storage-class validation and conversion remain T-046. Format selection and cross-format/manual-file regression completion remain T-047. TODOs: None within this runtime asset gate. Native Windows and installed sidebars are later platform work.

Primary references: [sql.js loading and API](https://github.com/sql-js/sql.js), [Vite worker bundling](https://vite.dev/guide/features#web-workers), and [WASM-specific CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/script-src#unsafe_webassembly_execution).
