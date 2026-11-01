# Phase 5 — Persistent configuration

## Delivered boundary and reviewed source

T-032–T-037 deliver v0.5.0's independent URL/cookie/default startup resolution and compensated acknowledged setting edits. Both delivery milestones are complete: issues 41–46 and native milestones 15/16 are closed/read back. This dedicated T-038 review closes Phase 5 on `phase/5-persistent-configuration`, based on released v0.4.0 `c1baeb81480dcb7ed5e4ff0ff617ca146d1eb1c4`. Reviewed published implementation/test/docs/package source is `b5c8ddf65f992adb3a775714f4980b8d49c96fdb`.

The six delivery task closing commits pass audit: each has exactly one leading owning task ID, its verified result/evidence and its initial completion checkbox together, with each published/read back before progression. Parent checkoffs belong to their assigned final delivery tasks. No task history rewrite or composition exception is involved in this phase.

## Whole-phase code and consumer review

Reviewed the complete C3/C4/C5/C7/C8 capability, not just the last diff: canonical domains/models and public rules entry; strict raw parsing and per-key precedence; explicit defaults/omission/duplicate/corruption semantics; selected versus active policy; queued initialization and async edit ownership; coherent subscriptions, monotonic time, lifecycle snapshots and disposal; cookie/history preflight, declared write scope, acknowledgment and all attempted compensations; native controls, error persistence/retry and truthful storage hint; README/INSTALL/navigation; stable distribution contents/version/source, licenses and shared CI verifier wiring.

External affected components use public entries; source boundary scans pass. Pure rules have no host effects and C4 never mutates domain/settings directly. C3 validates a complete proposed edit before any persistence call, serializes async effects and applies live selections only after acknowledgment. Failed edits preserve game/results/settings (apart from the visible error); startup synchronization failure intentionally keeps resolved page values usable and reports non-persistence. Disposed/late responses cannot commit live data, active/queued setting promises settle, and a completion releases queue ownership before a subsequent command. Existing current-piece policies/deadlines remain intact until the next accepted spawn/replacement.

Cookie writes are canonical and scoped. Startup writes only valid explicit query keys and never normalizes/replaces the URL. User edits replace exactly the requested known groups with one canonical value, retaining raw unrelated tokens/fragment/history state and avoiding navigation/new history entries. Restore adapter transactions require all six values. Handled failures compensate accessible prior cookie values/URL; if external storage prevents compensation, the visible error explicitly says recovery is incomplete. Browser crash atomicity and concurrent external mutation remain outside the accepted handled-error guarantee.

M5.2-F01 missing project MIT notice was independently reproduced and corrected in T-037. Every current candidate contains exact source project LICENSE and third-party notices; missing/wrong-license archives with valid checksums fail their specific verifier gates. No unresolved scoped blocker, defect, eligible deferred code issue or TODO remains. Leaderboard/files, final five-panel geometry and native/sidebar variants are later assigned scope, not claimed delivered here.

## Executed verification and evidence

On managed Linux, pinned isolated Chromium headless shell and Playwright-managed Firefox use project-owned binaries; Firefox retains the previously diagnosed trusted-local opt-in sandbox workaround. Current unchanged implementation/test coverage passes: check/build, 136 unit plus 2 actual composed-adapter integration checks (138 total), 122 source/public-component browser cases, and 108 extracted-package cases with 14 explicit source-only exclusions. The new 26 native-choice cases and 42 real-origin restoration cases also passed separately before the cumulative run.

The clean exact-source review campaign reran `npm run check`, all 138 deterministic checks, `npm run package`, `npm run verify:package -- --clean-source` and packaged Chromium/Firefox acceptance (108 passed/14 excluded) against the reviewed source above. The 122-case source campaign from T-037 covers identical production/tests; no product/test change followed it. Exact T-037 Actions [41337951112](https://github.com/pchemguy/SDD-Manager-Demo-Tetris-ChatGPT-Autodoc-AIO-3in1-V3/actions/runs/41337951112) completed successfully.

Acceptance covers all canonical choices and effective actions/projections/policies, native form focus, every duplicate query group, corrupt/mixed/omitted sources, explicit defaults, cookie path/SameSite/one-year attributes, HTTP Secure=false and HTTPS adapter-double Secure=true, unrelated raw data/history preservation, no gameplay restart on edits, score/game session reset, invalid/empty no effects, serial acknowledgment/failure/throw/reentrancy/disposal, old deadlines/new-piece capture, real cookie/history failure compensation, externally blocked rollback, persistent error across Restart and successful retry. Source/packaged error screenshots were inspected. Ordinary/modern/penetrator/raster/input/layout-width regressions remain green.

## Clean candidate and limits

Clean candidate SHA-256: `f8c1798fd8b50d924ca1534a7097ccc9c32de1c29f81a5d7cb238871162cab2b`. BUILD-INFO identifies 0.5.0, exact source `b5c8ddf65f992adb3a775714f4980b8d49c96fdb`, sourceDirty=false. Seven safe allowlisted ZIP members contain local JS/CSS, metadata, source-matching installation instructions/project license/notices, with fixtures/credentials excluded. Stable asset names remain `tetris-browser.zip`, `INSTALL.md`, `SHA256SUMS.txt`. Final integration/release source must still be rebuilt/rechecked and all hosted assets downloaded/byte-matched.

The fourteen package exclusions are source-module input/adapter consumers and authored penetrator/dynamic/session-only public-component fixtures. The actual delivered persistent entry—including native successful/error/rollback edit cases—runs on the package. Queue delays and HTTPS origin attributes use controlled component evidence where stated; real HTTP-origin Chromium/Firefox behavior is exercised. Native Windows and full installed-browser sidebar execution are not applicable/claimed for this browser-only phase.

## Exit and next effects

R6/Phase 5 PLAN exits and preserved R1–R5/browser delivery pass. TODOs: None. An optional comprehensive prerelease review was recommended once for v0.5.0; no separate campaign was selected or claimed. Required phase verification and the retained release grant continue.

Publish/read back T-038, close issue 47 and milestone 17, explicitly integrate/publish a two-parent main merge, persist the default-branch exact-message v0.5.0 source, rebuild/test it, then verify tag/release/latest/body/three stable assets and hosted download bytes. Only after that gate activate Phase 6 and continue T-039–T-072 under the full implementation grant. No new human checkpoint is pending.
