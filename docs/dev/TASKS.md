# Implementation tasks

The complete executable hierarchy derives from [PLAN](PLAN.md), [SPEC](SPEC.md), [layout](layout.md), [DECOMPOSITION](DECOMPOSITION.md), [MODELS](MODELS.md) and [API-DESIGN](API-DESIGN.md). Checkoffs record verified implementation progress; task commits and reports establish completion.

## Execution and evidence rules

Each delivery task includes its meaningful tests, module/user documentation and verified result. Use test-first behavior checks where applicable; do not create redundant tests for mechanical changes. The first delivery task in each phase updates its version/capability metadata and requires the previous phase's verified integration, release and hosted closures. The first phase instead requires published accepted preparation and phase activation.

Each task closes with its owned result, required evidence and initial checkbox in one commit, followed by verified publication and issue closure. All delivery milestones below have three delivery tasks: their final task also owns whole-milestone code review, relevant tests/repairs, report and HANDOFF. A separate review task is not added below the lifecycle threshold. The final dedicated phase-review milestone is always retained.

Package-bearing tasks prepare/verify candidates. After complete phase review/closure, the coordinator explicitly integrates/publishes main, prepares the eligible release source, builds/rechecks applicable artifacts, publishes the tag/release and verifies hosted downloads before a further authorized phase. No release is published from an unfinished phase task. Unavailable native Windows/full-sidebar execution is an explicit evidence limit, never a hidden task prerequisite; feasible required failures block completion.

Report paths below designate future evidence outputs, not existing files. Implementation remains subject to selected ranges, current QC and tracking activation.

## Phase 1 — Classic browser baseline

- [x] Phase 1 — Classic browser baseline
    - [x] Milestone 1.1 — Deterministic classic engine
        - [x] T-001 — Establish the local toolchain and isolated runners
            Scope: package.json/lockfile, TypeScript/Vite/unit/Playwright configuration and README/AGENTS setup guidance. Contract: R1/R12; C8.
            Depends on: none; accepted/published preparation and Phase 1 activation.
            Evidence: Pin compatible local tools and establish public-entry compilation plus isolated browser provisioning/launch evidence under the central browser policy. Classify actual environment failures and record executable modes without treating installation as application acceptance.
            Phase entry: set the PLAN version/capabilities and verify the predecessor integration/release/closure gate (or initial preparation gate for Phase 1).
            Verification: Tooling-only task: npm install --ignore-scripts installed 42 pinned packages; npm run check and npm run build pass. TETRIS_FIREFOX_SANDBOX_WORKAROUND=1 timeout 90s npm run probe:browsers passed two isolated input/Canvas-glyph/screenshot/teardown cycles each on Chromium shell 156.0.8078.4 and Firefox 157.0. Chromium CDN returned HTTP 200 HTML; official Playwright 1.64.1 OCI platform digest d65108d1a8095d8b0c4a5e32bf1807a40a5ce90ff0c78473e1116b1c243235e8 and browser layer eb005fbb9cada4cd1b9476577a1eef0e000a2a0e9e319f84ecf4bfff1a4f28bb were SHA-256/size verified, selected paths safely extracted and archive-derived executable modes restored after EACCES. Firefox official fallback installed; its content-process uid_map EPERM was diagnosed and the documented process-local override verified. npm warns about the host http-proxy environment setting; it did not prevent install/check/build. No game acceptance or native Windows evidence is claimed.
        - [x] T-002 — Implement classic piece geometry and landing
            Scope: src/models.ts and src/domain geometry/shapes/landing public exports, tests/unit/domain. Contract: R1; C1.
            Depends on: T-001.
            Evidence: Check all seven matrices, rotations, bounds, above-top placement, collisions and ordinary lowest reachable landing through public consumers. Leave inputs immutable and compare expected board/pose fixtures.
            Verification: RED: the public geometry suite collected nine tests and observed seven intended behavioral failures against empty API stubs (missing cells, legal placement and landing). GREEN: npm run test:unit passes all nine tests; npm run check and npm run build pass. Coverage includes all seven four-cell shapes, matrix rotations, active-above-top versus lock bounds, settled collision, first-blocker landing, invalid/top-out landing and caller immutability. No browser or gameplay-engine claim is made by this pure-domain task.
        - [x] T-003 — Implement deterministic falling and interval locking
            Scope: src/domain engine/sequence and tests/unit/domain. Contract: R1/R3; C2.
            Depends on: T-001, T-002.
            Evidence: Create idle/running games with explicit seeds, support baseline movement and pause transitions, uniform sequence, gravity and independent grounded interval timers. Verify exact expiry, lift/re-ground, no-reset movement and top-out without a DOM.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/1/1.1.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
            Verification: RED: eight intended engine failures against stubs; after initial green, independent review found nonzero-source sampling bias and six fixed-seed regressions failed before correction. GREEN: all 29 unit tests, npm run check and npm run build pass. Independent focused recheck confirmed the sampler correction and milestone readiness. Full independent grounding intervals, no grounded reset, lifting reset, pause preservation, exact lock/gravity order, leftover elapsed time, immutable state and safe top-out are verified. Includes Milestone 1.1 whole-capability code review/report and HANDOFF; TODO None. Scoring/UI/modern features remain assigned later work.
    - [x] Milestone 1.2 — Playable browser session
        - [x] T-004 — Implement line clearing scoring and level progression
            Scope: src/domain scoring/engine and tests/unit/domain. Contract: R1/R3; C2.
            Depends on: T-003.
            Evidence: Verify simultaneous one-to-four-row compaction, score before level changes, soft-drop points, safe-integer saturation and the gravity curve. Preserve timer/spawn behavior and exactly one game-over event.
            Verification: RED: all nine new public-engine scoring cases failed before implementation. GREEN: full unit suite passes 38/38, npm run check and npm run build pass. Verified one-to-four line bases, simultaneous row compaction and surviving-cell shifts, pre-clear level multiplication, next-spawn level/interval changes, soft-drop points only for actual movement, no gravity points and maximum-safe score saturation. Tests use literal independent board/score expectations; no new browser claim.
        - [x] T-005 — Integrate the application controller and browser ports
            Scope: src/application and src/platform browser/ports, tests/unit/application. Contract: R1/R3; C3/C7.
            Depends on: T-004.
            Evidence: Compose fixed baseline defaults, serial command/time dispatch, run IDs, immutable views and subscription/disposal. Verify start/pause/resume/restart and clock-independent controller behavior with public domain operations.
            Verification: Six controller behavioral tests failed against the unimplemented API, then all 44 unit tests passed. npm run check and npm run build pass. Verified one monotonic clock, input-before-frame accounting, pause freezing, lock-before-input order, isolated snapshots and lifecycle disposal. C3 tick API refinement recorded in focused specification/planning/task conformance revisions. Persistent settings and file operations remain unavailable until their assigned increments.
        - [x] T-006 — Deliver playable Canvas keyboard and game information UI
            Scope: src/ui, src/entry/browser.ts, index.html and tests/e2e. Contract: R1/initial R9; C4.
            Depends on: T-004, T-005.
            Evidence: Render board/score/level/status, route movement/rotation/soft drop and expose exactly the two specified clickable gameplay buttons. Demonstrate a playable full run from the actual browser app with inspected Canvas output.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/1/1.2.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
            Verification: Recovered existing UI without discarding work. Label regressions failed before correction; final type check, build, 44/44 unit tests and 2/2 actual Chromium/Firefox gameplay tests pass. Inspected Canvas screenshot. Milestone 1.2 code review/report and HANDOFF included; no scoped TODO. Lifecycle/repeat acceptance remains T-007.
    - [x] Milestone 1.3 — Browser distribution
        - [x] T-007 — Complete baseline lifecycle and keyboard repeat behavior
            Scope: src/ui/input.ts and browser lifecycle/controller integration. Contract: R1/R3/R9; C3/C4/C7.
            Depends on: T-006.
            Evidence: Verify paused timer preservation, focus/visibility suspension, held-key clearing, repeat timings and abandoned restart behavior. Confirm focused form/button input does not double-dispatch game actions and Start/resume returns keyboard focus to gameplay.
            Verification: Four browser cases first failed for missing timed repeat and contenteditable key leakage. Added scoped keyboard owner with 150/50ms directional and 40ms soft-drop repeats, one-shot rotation/Escape, keyup/pause/blur clearing and gameplay-focus routing. Corrected the test clock to pause real-time advancement for exact boundaries. Final check/build, 44 unit tests and 8 Chromium/Firefox browser tests pass; actual button Enter and gameplay focus verified, blur modeled as an application event.
        - [x] T-008 — Verify baseline browser gameplay and rendering
            Scope: tests/e2e, playwright.config.ts and browser test evidence. Contract: R1/R3/R9; C4/C8.
            Depends on: T-007.
            Evidence: Exercise the actual application in isolated managed Chromium headless shell and Firefox with finite session/teardown bounds. Check game over/restart, timing and Canvas output; report unavailable modes distinctly and repair feasible required failures.
            Verification: 16/16 actual-app Chromium headless-shell and managed Firefox tests pass, covering full run/gameover/restart, exact repeats, gravity without score, cell-by-cell Canvas translation/inverse rotation, paused-frame stability and no overflow at 320/768/1440px. Screenshots retained locally and 320px output inspected. Fixed test-clock past-time race and replaced 60000ms RAF replay with clock fast-forward; no product requirement was weakened. Native OS focus/full sidebar modes remain unverified and outside this baseline.
        - [x] T-009 — Package the deployable browser baseline
            Scope: scripts build/package/verify, .github/workflows/verify.yml, INSTALL.md and release candidate assets. Contract: R12; C8.
            Depends on: T-007, T-008.
            Evidence: Produce/extract tetris-browser.zip and verify local asset loading, version, stable output names and absence of development secrets. Share direct/CI package checks and installation instructions; do not publish a release before phase integration.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/1/1.3.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
            Verification: Static ZIP candidate, INSTALL and SHA256SUMS pass stable-name/content/byte/source/version/secret checks; deliberately versioned-name and corrupt-byte candidates fail. Extracted static package passes 14 Chromium/Firefox application checks; 2 source-module consumer checks explicitly excluded, while actual input cases run. Type check/build pass; milestone 1.3 code review/report/HANDOFF included. Candidate has honest dirty-source metadata; exact clean release-source rebuild follows phase integration. CI workflow prepared, not claimed executed.
    - [x] Milestone 1.4 — Phase review
        - [x] T-010 — Review test and report Phase 1
            Depends on: T-003, T-006, T-009 and verified completion/closure of every delivery milestone in this phase.
            Scope: whole-phase implementation/consumer code review, in-scope SPEC/PLAN exits, relevant cumulative regressions, candidate package checks, blocker repairs and `docs/dev/reports/phases/1/PHASE-REPORT.md` plus HANDOFF.
            Evidence: record actual commands/environments/results, delivered versus deferred scope, source/artifact identities, TODO dispositions and explicit native/full-browser limits. Commit the verified report and initial task/parent completion together, publish/read back and reconcile issue/milestone closures before phase integration.
            Verification: Whole-phase code/consumer review and task-commit audit pass. Fixed P1-F01 missing Vite helper notice: strengthened package check fails before notice inclusion and passes after. Final check, 44 unit tests, build, stable package verification, 16 source-browser cases and 14 extracted-package cases pass (2 explicit source-only exclusions). Phase report/HANDOFF and initial task/phase/review-milestone checkoffs included. Integration and exact-source hosted release remain subsequent gates; no scoped TODO.

## Phase 2 — Modern piece controls

- [x] Phase 2 — Modern piece controls
    - [x] Milestone 2.1 — Sequence and piece controls
        - [x] T-011 — Implement seven-bag sequence and next preview
            Scope: src/domain/sequence.ts, projections and focused tests. Contract: R2; C2.
            Depends on: T-010.
            Evidence: Check nonbiased seeded bag shuffling, every bag containing all seven kinds, refill boundaries and preview reads without consumption. Preserve serializable generator state and baseline play.
            Phase entry: set the PLAN version/capabilities and verify the predecessor integration/release/closure gate (or initial preparation gate for Phase 1).
            Verification: Verified predecessor v0.1.0 integration/release, all hosted bytes and Phase 2 tracking before work. Two intended modern factory/preview failures preceded implementation. Final 47 unit tests, type check and build pass: four complete bags for three seeds, immutable preview/next-spawn agreement across refill boundaries, serializable determinism, disabled preview and retained unbiased baseline uniform sequence. v0.2.0/capability metadata and phase branch-off checkpoint included.
        - [x] T-012 — Implement once-per-piece hold
            Scope: src/domain/engine.ts and controller views/tests. Contract: R2/R3; C2/C3.
            Depends on: T-011.
            Evidence: Check empty hold versus swap queue consumption, spawn resets, second-use prohibition, lock reset of holdUsed and failed replacement spawn. Capture selected policy only on the replacement piece.
            Verification: Four intended hold/projection failures preceded implementation. Final 51 unit tests, type check and build pass. Verified empty hold consumes the queued next kind, nonempty swap preserves sequence, once-per-lock reset, spawn pose/timer/policy capture, input immutability, capability/setting/paused/penetrator no-ops, retained disabled-slot projection and exact-once safe above-top replacement failure. Controller consumes the same public projection; UI key/panel integration remains T-016.
        - [x] T-013 — Implement ordered wall kicks
            Scope: src/domain geometry/engine and tests/unit/domain. Contract: R2/R3; C1/C2.
            Depends on: T-011, T-012.
            Evidence: Check clockwise/counterclockwise candidate order, wall/floor/stack cases, unchanged O rotation and complete failure. Recheck hold/sequence and grounded/lifted lock behavior through public engine operations.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/2/2.1.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
            Verification: Three intended wall/stack kick failures preceded implementation. Final 55 unit tests, type check and build pass. Public-engine checks cover exact left-before-right candidate order for both rotations, I wall/floor offsets, unchanged O, complete failure, preserved grounded deadlines and cleared lifted deadline. Whole milestone sequence/hold/kick code review, report and HANDOFF included; no scoped TODO and no complete SRS claim.
    - [x] Milestone 2.2 — Projection and hard drop
        - [x] T-014 — Render ghost from the shared ordinary landing
            Scope: src/domain projections and src/ui/board.ts. Contract: R4; C1/C2/C4.
            Depends on: T-013.
            Evidence: Use the same landing result as drop, including zero-distance projection, and verify ghost rendering never changes the board or simulation. Keep default ghost visibility shown until configurable modes are delivered.
            Verification: One public projection case and both browser outline cases failed before implementation. Final 56 unit tests, check/build and 18 Chromium/Firefox browser tests pass. Literal blocker/zero-distance/null fixtures verify non-mutating landing; actual Canvas edge/center pixels verify four translucent outlined ghost cells separate from active fills. Screenshot inspected. Board presentation extracted into its planned private owner; no gameplay state mutation or new click target.
        - [x] T-015 — Implement delayed hard drop and policy precedence
            Scope: src/domain/engine.ts, input binding and domain/controller tests. Contract: R2/R3; C2/C3/C4.
            Depends on: T-014.
            Evidence: Verify final pose, actual-distance points, zero-distance repeat and a full remaining interval without grounding reset. Cover failed-policy and immediate-policy public inputs while the UI still uses fixed defaults.
            Verification: Three hard-drop domain cases and both Space-binding consumer cases failed before implementation. Final 61 unit tests, type check/build and 18 Chromium/Firefox browser cases pass. Verified shared ghost/drop landing, actual-distance points, no zero-distance repeat points/reset, independent full remaining interval, captured failed/immediate policy precedence, disabled/non-running no-ops and controller single-clock integration. Space is one-shot until keyup. Modern preview/help integration remains T-016.
        - [x] T-016 — Integrate modern controls previews and browser distribution
            Scope: src/ui panels/help, tests/e2e, INSTALL.md and browser packaging. Contract: R2/R3/R4/R12; C4/C8.
            Depends on: T-014, T-015.
            Evidence: Expose next/held/ghost and keyboard bindings, exercise combined bag/hold/kick/drop play and rebuild the extracted browser package. Confirm no extra gameplay click targets or predecessor regressions.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/2/2.2.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
            Verification: Both browser integration cases failed for missing preview elements before implementation. Final 61 unit checks, type check/build, 20 source-app browser cases and 18 extracted-package cases pass (2 source-only exclusions). Next/held miniatures, C hold, Space delayed drop, wall movement/rotation, lock/queue behavior and two-button limit verified; full-page modern/ghost screenshots inspected. Aligned C4 mount export/mode with accepted API. Updated install/help, milestone 2.2 report/HANDOFF and stable browser candidate; no scoped TODO.
    - [x] Milestone 2.3 — Phase review
        - [x] T-017 — Review test and report Phase 2
            Depends on: T-013, T-016 and verified completion/closure of every delivery milestone in this phase.
            Scope: whole-phase implementation/consumer code review, in-scope SPEC/PLAN exits, relevant cumulative regressions, candidate package checks, blocker repairs and `docs/dev/reports/phases/2/PHASE-REPORT.md` plus HANDOFF.
            Evidence: record actual commands/environments/results, delivered versus deferred scope, source/artifact identities, TODO dispositions and explicit native/full-browser limits. Commit the verified report and initial task/parent completion together, publish/read back and reconcile issue/milestone closures before phase integration.
            Verification: Whole-phase code/consumer review and single-task closing-commit audit pass with no scoped TODO. Reused current identical production evidence: 61 unit tests, check/build, 20 source-browser cases and 18 extracted-package cases (2 explicit source-only exclusions). Rebuilt clean T-016 package passes all checks and byte-matches tested runtime assets; GitHub Actions 41324234370 succeeded for that exact source. Phase report/HANDOFF and initial task/parent checkoffs included; integration and exact-source release remain subsequent gates.

## Phase 3 — Penetrator bonuses

- [x] Phase 3 — Penetrator bonuses
    - [x] Milestone 3.1 — Penetrator mechanics
        - [x] T-018 — Implement lowest valid penetrator landing
            Scope: src/domain/landing.ts and tests/unit/domain. Contract: R4; C1.
            Depends on: T-017.
            Evidence: Scan through blockers to the deepest wholly in-board non-overlapping pose. Verify disconnected holes, invalid floor pose, null landing and exact agreement of candidate reachability with final placement checks.
            Phase entry: set the PLAN version/capabilities and verify the predecessor integration/release/closure gate (or initial preparation gate for Phase 1).
            Verification: Predecessor v0.2.0 integration/release and hosted bytes verified; uncertain Phase 3 create settled read-only and full projection verified without duplicates before work. Three intended landing/traversal failures preceded implementation. Final 65 unit tests, type check/build pass: pass-through blockers, disconnected holes, invalid geometric floor, null final pose, no upward repair, all shape rotations and input immutability. v0.3.0/capability/branch checkpoint included; activation and locking remain following tasks.
        - [x] T-019 — Implement activation and pass-through traversal
            Scope: src/domain/engine.ts and domain/controller tests. Contract: R4/R3; C2/C3.
            Depends on: T-018.
            Evidence: Spend one available bonus, preserve activation until lock, permit intermediate overlap and reject moves/rotations with no reachable landing below. Verify zero inventory, repeated activation and non-running no-ops.
            Verification: Four intended activation/traversal/kick/timer failures preceded implementation. Final 71 unit tests, type check/build pass. Verified one-bonus spend and event, repeated/cancel/hold no-ops, exhausted/capability/non-running/no-landing rejection, soft-drop/gravity intermediate overlap with settled cells unchanged, candidate reachability for moves/rotations, lifted versus unchanged grounded deadlines and controller single-clock integration. Final white lock and bonus awards remain T-020.
        - [x] T-020 — Integrate safe locking and bonus awards
            Scope: src/domain engine/scoring and tests/unit/domain. Contract: R4/R2/R3; C2.
            Depends on: T-018, T-019.
            Evidence: Check non-overlapping final placement, no destruction by traversal, four-line earn-one, cap-three, spend/re-earn and no refunds. Verify hold prohibition, hard-drop/ghost landing agreement and active interval behavior.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/3/3.1.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
            Verification: Three intended bonus/re-earn/white-lock failures preceded implementation. Final 78 unit tests, check/build pass. Verified exact four-line earn-one/cap-three, no awards for 1–3 rows or absent capability, spend/re-earn, no refund, ghost/drop equality and traversed-distance points, preserved delayed lock and no settled-cell destruction. Invalid overlapping final lock safely ends without writing. Whole mechanics review/report/HANDOFF included; no scoped TODO.
    - [x] Milestone 3.2 — Visibility and bonus experience
        - [x] T-021 — Render white penetrators and matching ghost
            Scope: src/ui/board.ts and projection/render checks. Contract: R4; C4.
            Depends on: T-020.
            Evidence: Render active/locked penetrator cells and their projection white without using white for regular kinds. Inspect overlap rendering and confirm draw order never changes settled board data.
            Verification: Characterization of existing prepared board branches, without fabricating a prior RED or rewriting correct code. Type check and 2 authored-state Chromium/Firefox render cases pass. Actual RGBA verifies pure white active/settled cells, translucent white ghost, seven distinct non-white regular kinds and retained settled data under active overlap. Full-page screenshot inspected. Test-only controller/mount fixture is outside release build inputs; ordinary packaged-entry regressions remain T-023.
        - [x] T-022 — Expose bonus inventory and penetrator hotkey
            Scope: src/ui panels/input/help and controller integration. Contract: R4/R9; C3/C4.
            Depends on: T-021.
            Evidence: Show one lightning symbol per bonus; update on spend/award. Exercise the P hotkey, exhausted inventory and active hold prohibition with clear help and no added gameplay button.
            Verification: Four intended inventory/help browser failures preceded implementation. Final type check/build, 78 unit tests and 26 Chromium/Firefox browser cases pass. Inventory renders 3→2 lightning symbols after native P, repeated activation cannot cancel/spend, C preserves held/next state while active, hold status/help explain prohibition, and ordinary packaged-capable entry ignores exhausted P without changing Canvas. Exactly two gameplay buttons remain; full-page active/bonus screenshot inspected. Authored-state fixtures are excluded from production.
        - [x] T-023 — Verify penetrator play and cumulative browser artifact
            Scope: tests/e2e, domain integration fixtures and browser packaging/docs. Contract: R4/R12; C1-C4/C8.
            Depends on: T-021, T-022.
            Evidence: Demonstrate a four-line award, activation through a stack and valid lock. Compare ghost/drop and bonus rendering, check ordinary controls regressions and verify the extracted browser package. Do not claim dynamic visibility before its Phase 4 selector.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/3/3.2.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
            Verification: Native-keyboard public-component four-line award/spend/overlap/pass-through/white-lock scenario passes with literal score 832 and retained barrier assertions. Review found board clipping after low gameplay-button focus: both browser tests failed before bounded focus/scroll repair. Final check/build, current 78 units, 30 source/public-component browser cases and 22 extracted-package entry cases pass (8 explicit source-only exclusions). Fixtures excluded, screenshots inspected, stable package checks pass. Milestone 3.2 report/HANDOFF included; no dynamic-visibility or native platform claim.
    - [x] Milestone 3.3 — Phase review
        - [x] T-024 — Review test and report Phase 3
            Depends on: T-020, T-023 and verified completion/closure of every delivery milestone in this phase.
            Scope: whole-phase implementation/consumer code review, in-scope SPEC/PLAN exits, relevant cumulative regressions, candidate package checks, blocker repairs and `docs/dev/reports/phases/3/PHASE-REPORT.md` plus HANDOFF.
            Evidence: record actual commands/environments/results, delivered versus deferred scope, source/artifact identities, TODO dispositions and explicit native/full-browser limits. Commit the verified report and initial task/parent completion together, publish/read back and reconcile issue/milestone closures before phase integration.
            Verification: Whole-phase code/consumer review and task-commit audit pass; no scoped TODO. Current identical production evidence: 78 units, check/build, 30 source/public-component browser cases and 22 packaged-entry cases (8 explicit source-only exclusions). Clean candidate passes all checks and byte-matches tested runtime/instructions/notices; exact T-023 GitHub Actions 41328256525 succeeded. Phase report/HANDOFF and initial task/parent checkoffs included; integration/exact-source release remain subsequent gates.

## Phase 4 — Session configuration

- [x] Phase 4 — Session configuration
    - [x] Milestone 4.1 — Session settings model
        - [x] T-025 — Define typed session settings and defaults
            Scope: src/rules/settings.ts, src/models.ts consumers and tests/unit/rules. Contract: R5; C5.
            Depends on: T-024.
            Evidence: Validate exactly six keys, defaults, typed patches and invalid-value rejection without coercion. Keep selected values separate from active PiecePolicy and expose no persistent effects.
            Phase entry: set the PLAN version/capabilities and verify the predecessor integration/release/closure gate (or initial preparation gate for Phase 1).
            Verification: Valid-settings acceptance first failed against the compilable unimplemented validator, then all 81 unit tests, npm run check and npm run build passed. Complete six-key typed values are copied; missing/extra keys, wrong values and accessor/inherited inputs reject without coercion or effects. Browser initializes frozen canonical defaults; v0.4.0/settings capability selected. Predecessor main integration, closed tracking and v0.3.0 exact-source release/download gate verified; Phase 4 full projection read back after reconciling collection lag.
        - [x] T-026 — Implement dynamic midline ghost visibility
            Scope: src/domain projections and domain/render tests. Contract: R4/R5; C2/C4.
            Depends on: T-025.
            Evidence: Check hide/show/dynamic modes at y=9/y=10 and straddling projected shapes for normal and penetrator pieces. Preserve shared landing/drop calculations and all non-visibility state.
            Verification: Two normal/penetrator above-midline fixtures failed before implementation, then all 88 units and npm run check passed. Hide/show/dynamic tested at bottom rows 9,10 and11, including a straddling O; dynamic displays when any projected cell reaches row10. Projection preserves state/other fields and all modes retain identical shared landing, hard-drop pose and score.
        - [x] T-027 — Apply settings through the controller policy boundary
            Scope: src/application/controller.ts and tests/unit/application. Contract: R5/R2/R3; C3.
            Depends on: T-025, T-026.
            Evidence: Apply visibility/action toggles immediately, retain disabled hold state and capture lock-policy changes only on a new piece. Check policy hints, held replacements and invalid patches with no partial selected-state change.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/4/4.1.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
            Verification: Five controller cases failed against the unavailable setter; final check/build, 95 units and all30 cumulative source Chromium/Firefox cases pass. Edits validate atomically before clock/state writes, apply current visibility/action toggles, retain disabled held kind and selected settings across restart, preserve current-piece policy/deadline until ordinary or held replacement spawn, and never call persistence. Reentrant edits serialize coherent views and disposal resolves cancelled queued promises. Whole-capability review found no scoped TODO; milestone4.1 report/HANDOFF and parent checkbox included.
    - [x] Milestone 4.2 — Settings panel integration
        - [x] T-028 — Build the six-control session settings panel
            Scope: src/ui/panels.ts/styles and browser UI checks. Contract: R5/R9; C4.
            Depends on: T-027.
            Evidence: Provide all six labeled controls with defaults and next-piece policy feedback. Keyboard interactions in controls must not move the board; settings remain accessible without new gameplay click targets.
            Verification: All four new cross-browser panel cases first failed because controls were absent. After implementation, check/build and14 focused Chromium/Firefox panel/render/layout cases pass. Six exact labels/defaults and every choice, next-piece pending hint clearing after hold replacement, normal select focus without game actions, exactly two gameplay buttons and320/768/1440 no-overflow/board-focus regressions verified. Inspected desktop and320px screenshots; settings listeners dispose with mount. Milestone4.1 closure/readback verified before this task.
        - [x] T-029 — Integrate disabled-action and preview feedback
            Scope: src/ui views/input and controller/browser tests. Contract: R5/R2/R4; C3/C4.
            Depends on: T-028.
            Evidence: Exercise hard-drop/hold enablement, preview hiding and each ghost mode in actual play. Verify stored hold retention, penetrator prohibition and correct control/view state across restart.
            Verification: Four actual-page browser cases exposed missing Disabled preview feedback and stale effective-policy text before repair. Final check/build and18 focused Chromium/Firefox cases pass. Native play verifies disabled Space/C do nothing, held kind survives disabling, hidden preview toggles coherently, restart retains selected values, old interval survives pending edits and next spawn uses immediate/failed policy. Prepared source-only public composition fixture checks hide/show/dynamic raster equality at rows9/10/11 for normal/penetrator and immutable game state, including hold prohibition after re-enabling. No production state hook added.
        - [x] T-030 — Verify session isolation and package configuration release
            Scope: tests/e2e, adapter write spies and browser packaging/docs. Contract: R5/R12; C7/C8.
            Depends on: T-028, T-029.
            Evidence: Confirm settings survive game restart but reset on reload and write no cookies, query parameters or persistent browser storage. Recheck all choices plus gameplay and package the complete session-only increment.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/4/4.2.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
            Verification: Characterization passes without product repair: actual source/extracted app keeps all six selected values on Restart, resets defaults on reload, ignores/preserves preexisting setting/query data and records zero cookie/Storage/history writes. Check,95 units,42 source browser cases,package verification and32 packaged browser cases pass (10 explicit source-only exclusions). Reviewed controls/queue/ports/runtime and desktop/320px screenshots; no scoped TODO. Candidate ce201a4eb9cda8336302ff21071713c2fb628b088d49247721e2dfa28d7d10bf honestly dirty metadata matches tested local runtime; final release remains gated. Milestone4.2 report/HANDOFF/docs and parent checkoff included.
    - [x] Milestone 4.3 — Phase review
        - [x] T-031 — Review test and report Phase 4
            Depends on: T-027, T-030 and verified completion/closure of every delivery milestone in this phase.
            Scope: whole-phase implementation/consumer code review, in-scope SPEC/PLAN exits, relevant cumulative regressions, candidate package checks, blocker repairs and `docs/dev/reports/phases/4/PHASE-REPORT.md` plus HANDOFF.
            Evidence: record actual commands/environments/results, delivered versus deferred scope, source/artifact identities, TODO dispositions and explicit native/full-browser limits. Commit the verified report and initial task/parent completion together, publish/read back and reconcile issue/milestone closures before phase integration.
            Verification: Whole-phase C2–C5/browser/consumer and task-commit audit passes with no scoped blocker/TODO. Current identical production evidence:95 units,check/build,42 source and32 packaged Chromium/Firefox cases (10 explicit source-only exclusions). Clean exact T-030 source rebuilt and package rechecked/tested:97e915fab3c5da7bee99e77f72a179f65c220bd46776b76fe8157ef0c4ba5496,sourceDirty=false. Exact Actions41331208378 succeeded. Six choices, selected/effective timers, ghost raster and session no-persistence acceptance covered; report/HANDOFF and initial task/parent checkoffs included. Integration/exact-release source remain subsequent gates.
            Forward correction: P4-F01 found after first main integration and before tagging: missing public rules entry/direct implementation imports violated layout. T-031 retains its initial closure; a task-specific repair adds the planned index and switches all four consumers. Reassessment check/build,95 units and42 source browser cases pass; no private rules import remains and built runtime bytes match the package-tested candidate. Report preserves the unsupported earlier boundary claim and corrective evidence; review issue40/milestone14 reopened pending correction publication/reclosure/reintegration.

## Phase 5 — Persistent configuration

- [ ] Phase 5 — Persistent configuration
    - [ ] Milestone 5.1 — Per-key configuration restoration
        - [x] T-032 — Implement strict per-key query and cookie parsing
            Scope: src/rules/settings.ts and src/platform/browser/settings.ts. Contract: R6; C5/C7.
            Depends on: T-031.
            Evidence: Parse canonical names/values, duplicate known query keys, corrupt cookies and mixed sources independently. Preserve valid cookie values when URL keys are omitted/invalid and leave unknown keys alone.
            Phase entry: set the PLAN version/capabilities and verify the predecessor integration/release/closure gate (or initial preparation gate for Phase 1).
            Verification: All seven new public rules/adapter cases failed before implementation, then check/build and all102 units pass. Every canonical string including explicit defaults resolves per-key URL→valid cookie→default; empty/wrong-case/padded values and known duplicate query groups warn/fall through, corrupt/duplicate cookies are isolated and unknown data untouched. Inputs remain immutable and parser write spies remain zero. Public C5 index is used by all consumers; canonical GhostMode alias aligns models. v0.5.0/persistentSettings selected and predecessor full v0.4 release/closure gate plus complete Phase5 projection verified; HANDOFF records recovered state. Startup integration/transactions remain assigned later.
        - [ ] T-033 — Integrate persistent startup resolution
            Scope: src/application bootstrap and browser settings adapter. Contract: R6; C3/C7.
            Depends on: T-032.
            Evidence: Resolve URL then cookie then default per key. Save valid explicit URL defaults as well as nondefaults, write only those startup keys and report unavailable persistence without blocking usable resolved page settings.
        - [ ] T-034 — Verify real-origin configuration restoration
            Scope: tests/integration/platform and tests/e2e. Contract: R6/R5; C5/C7.
            Depends on: T-032, T-033.
            Evidence: Check every setting across reload, mixed sources, invalid/duplicate query values and omitted keys using a real HTTP origin. Verify warning behavior, unrelated data preservation and existing session-only score boundaries.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/5/5.1.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
    - [ ] Milestone 5.2 — Transactional setting updates
        - [ ] T-035 — Implement compensated cookie and URL setting commits
            Scope: src/platform/browser/settings.ts and adapter contract tests. Contract: R6; C7.
            Depends on: T-034.
            Evidence: Capture old persistence/URL, write and read back changed keys, and compensate handled failures before a live-state swap. Verify fragments/unrelated cookies/parameters and no reload/navigation.
        - [ ] T-036 — Integrate persistence errors with selected settings
            Scope: src/application/controller.ts and src/ui feedback/tests. Contract: R6/R5; C3/C4.
            Depends on: T-035.
            Evidence: Serialize asynchronous edits, apply selected values only on adapter success and retain current results/game state on failure. Report startup synchronization and rollback failures honestly; preserve next-piece policy effects.
        - [ ] T-037 — Verify persistent edits and cumulative browser package
            Scope: tests/e2e, persistence fixtures and browser packaging/docs. Contract: R6/R12; C7/C8.
            Depends on: T-035, T-036.
            Evidence: Exercise all six edits, explicit defaults, reload and invalid fallbacks. Run failure-injection and successful real-origin checks, recheck gameplay/session behavior and verify the extracted artifact.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/5/5.2.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
    - [ ] Milestone 5.3 — Phase review
        - [ ] T-038 — Review test and report Phase 5
            Depends on: T-034, T-037 and verified completion/closure of every delivery milestone in this phase.
            Scope: whole-phase implementation/consumer code review, in-scope SPEC/PLAN exits, relevant cumulative regressions, candidate package checks, blocker repairs and `docs/dev/reports/phases/5/PHASE-REPORT.md` plus HANDOFF.
            Evidence: record actual commands/environments/results, delivered versus deferred scope, source/artifact identities, TODO dispositions and explicit native/full-browser limits. Commit the verified report and initial task/parent completion together, publish/read back and reconcile issue/milestone closures before phase integration.

## Phase 6 — Session results and portable files

- [ ] Phase 6 — Session results and portable files
    - [ ] Milestone 6.1 — Session leaderboard
        - [ ] T-039 — Implement result validation and deterministic ranking
            Scope: src/rules/results.ts and tests/unit/rules. Contract: R7; C5.
            Depends on: T-038.
            Evidence: Check valid IDs, safe integer scores, UTC calendar times, ties, sorting without mutation and truncation to ten. Preserve ID/timestamp representations rather than regenerating imported identity.
            Phase entry: set the PLAN version/capabilities and verify the predecessor integration/release/closure gate (or initial preparation gate for Phase 1).
        - [ ] T-040 — Record completed games exactly once
            Scope: src/application/controller.ts and clock/ID port tests. Contract: R7; C3/C7.
            Depends on: T-039.
            Evidence: Insert final score/time for each run once, reject duplicate completion events and exclude abandoned restarts. Retain results across restarts while leaving reload persistence absent.
        - [ ] T-041 — Deliver the session leaderboard panel
            Scope: src/ui/panels.ts, controller integration and tests/e2e. Contract: R7/R9; C4.
            Depends on: T-039, T-040.
            Evidence: Display the ordered top ten and empty state, update after game over and verify duplicate/tied/overflow histories. Exercise a real session end and show that score history is not written persistently.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/6/6.1.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
    - [ ] Milestone 6.2 — JSON snapshots
        - [ ] T-042 — Define portable schema and complete snapshot validation
            Scope: schemas/snapshot.schema.json, scripts/build-schemas.mjs, src/files/validation.ts and fixtures. Contract: R8; C5/C6.
            Depends on: T-041.
            Evidence: Generate a standalone validator and check exact fields, six settings, unique IDs, safe scores, timestamps with real dates and complete result bounds. Reject duplicate JSON properties and unsupported versions without partial loading.
        - [ ] T-043 — Implement bounded JSON codec worker
            Scope: src/files/json.ts, codec.worker.ts/index.ts and codec fixtures. Contract: R8; C6.
            Depends on: T-042.
            Evidence: Encode/decode UTF-8 snapshots with header/format detection, 4 MiB bound, ten-second cancellation and resource cleanup. Verify valid/empty round trips, malformed content and stale/disposed worker responses without blocking UI.
        - [ ] T-044 — Integrate manual JSON Save and Restore
            Scope: src/application/controller.ts, src/ui settings/file controls and browser file adapter. Contract: R8/R6; C3/C4/C7.
            Depends on: T-042, T-043.
            Evidence: Download one JSON file and restore only after complete validation plus successful persistence commit. Preserve results/settings/cookies/URL on failure, exclude gameplay, pause file interactions and expose clear errors/cancellation behavior.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/6/6.2.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
    - [ ] Milestone 6.3 — SQLite snapshots
        - [ ] T-045 — Bundle SQLite runtime and local worker assets
            Scope: package lock/build assets, src/files/sqlite.ts initialization and worker integration. Contract: R8; C6/C8.
            Depends on: T-044.
            Evidence: Pin matching sql.js JS/WASM and resolve them locally in the actual built worker path. Verify initialization failure, finite startup/operation cleanup and no CDN requests; document the asset integration gate before SQL consumers.
        - [ ] T-046 — Implement strict SQLite snapshot conversion
            Scope: src/files/sqlite.ts and tests/integration/files. Contract: R8; C6.
            Depends on: T-045.
            Evidence: Encode required tables/metadata and validate header, integrity, schema, storage types, exact setting rows, versions and every result. Reject foreign objects/unsafe scores/dates/duplicates and close statements/databases on all paths.
        - [ ] T-047 — Verify both formats and complete file experience
            Scope: src/ui format selector, cross-format/rollback fixtures, tests/e2e and browser packaging/docs. Contract: R7/R8/R12; C3-C8.
            Depends on: T-045, T-046.
            Evidence: Compare equivalent JSON/SQLite snapshots and preserved IDs/timestamps/settings. Exercise invalid-file no-mutation, timeout/cancel/disposal and real downloads/restores; verify local worker/WASM assets from the extracted browser package.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/6/6.3.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
    - [ ] Milestone 6.4 — Phase review
        - [ ] T-048 — Review test and report Phase 6
            Depends on: T-041, T-044, T-047 and verified completion/closure of every delivery milestone in this phase.
            Scope: whole-phase implementation/consumer code review, in-scope SPEC/PLAN exits, relevant cumulative regressions, candidate package checks, blocker repairs and `docs/dev/reports/phases/6/PHASE-REPORT.md` plus HANDOFF.
            Evidence: record actual commands/environments/results, delivered versus deferred scope, source/artifact identities, TODO dispositions and explicit native/full-browser limits. Commit the verified report and initial task/parent completion together, publish/read back and reconcile issue/milestone closures before phase integration.

## Phase 7 — Centered panel layout

- [ ] Phase 7 — Centered panel layout
    - [ ] Milestone 7.1 — Centered wide panels
        - [ ] T-049 — Implement centered five-panel wide geometry
            Scope: src/ui/styles.css/panels.ts and wide-layout checks. Contract: R9; C4.
            Depends on: T-048.
            Evidence: Place leaderboard/info/board/settings/help in required order with board anchoring independent of auxiliary visibility. Retain readable info and correct board aspect/device-pixel sizing.
            Phase entry: set the PLAN version/capabilities and verify the predecessor integration/release/closure gate (or initial preparation gate for Phase 1).
        - [ ] T-050 — Integrate independent auxiliary toggles and control placement
            Scope: src/ui/panels.ts and focus/visibility checks. Contract: R9; C4.
            Depends on: T-049.
            Evidence: Put three independent show/hide toggles above the bottom Start/Restart and Pause/Start row. Hide all settings file controls with their panel and remove hidden content from focus navigation.
        - [ ] T-051 — Verify every wide panel visibility combination
            Scope: tests/e2e layout/Canvas evidence and UI guide. Contract: R9; C4.
            Depends on: T-049, T-050.
            Evidence: Measure board center within one CSS pixel for all eight combinations at wide widths. Inspect rendered output, button order, info visibility and file-control hiding; fix geometry/focus regressions.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/7/7.1.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
    - [ ] Milestone 7.2 — Compact accessible layout
        - [ ] T-052 — Implement compact responsive layout
            Scope: src/ui/styles.css/panels.ts and resize checks. Contract: R9; C4.
            Depends on: T-051.
            Evidence: Keep a centered board, essential info and accessible auxiliary sections at compact browser/sidebar sizes. Check 320/600/1024/1280/1920 CSS pixel targets, no horizontal clipping and state retention during resize.
        - [ ] T-053 — Complete accessible keyboard and file-control navigation
            Scope: src/ui/input.ts/panels.ts and browser focus tests. Contract: R9/R8; C4.
            Depends on: T-052.
            Evidence: Check labels, aria-expanded, hidden-focus exclusion, normal input/select/button behavior, status/errors and no double-dispatch. Keep Save/Restore at settings bottom and other gameplay keyboard-only.
        - [ ] T-054 — Verify final browser layout and cumulative artifact
            Scope: tests/e2e screenshots/measurements, browser packaging and user guidance. Contract: R9/R12; C4/C8.
            Depends on: T-052, T-053.
            Evidence: Inspect representative device-pixel Canvas output and compact/wide layouts, run input/settings/file regressions and verify the extracted browser build. Record the completed pre-Electron layout exit.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/7/7.2.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
    - [ ] Milestone 7.3 — Phase review
        - [ ] T-055 — Review test and report Phase 7
            Depends on: T-051, T-054 and verified completion/closure of every delivery milestone in this phase.
            Scope: whole-phase implementation/consumer code review, in-scope SPEC/PLAN exits, relevant cumulative regressions, candidate package checks, blocker repairs and `docs/dev/reports/phases/7/PHASE-REPORT.md` plus HANDOFF.
            Evidence: record actual commands/environments/results, delivered versus deferred scope, source/artifact identities, TODO dispositions and explicit native/full-browser limits. Commit the verified report and initial task/parent completion together, publish/read back and reconcile issue/milestone closures before phase integration.

## Phase 8 — Windows desktop delivery

- [ ] Phase 8 — Windows desktop delivery
    - [ ] Milestone 8.1 — Local desktop runtime
        - [ ] T-056 — Establish the isolated Electron local-origin shell
            Scope: src/platform/electron main/origin and pinned Electron configuration. Contract: R10; C7.
            Depends on: T-055.
            Evidence: Pin Electron and register standard secure app origin on its persistent session before loading the shared renderer. Disable renderer Node integration, retain isolation/sandbox and restrict asset paths/navigation without a server.
            Phase entry: set the PLAN version/capabilities and verify the predecessor integration/release/closure gate (or initial preparation gate for Phase 1).
        - [ ] T-057 — Integrate desktop renderer persistence and file assets
            Scope: src/entry/desktop.ts, Electron adapter/build and platform tests. Contract: R10/R6/R8; C7/C8.
            Depends on: T-056.
            Evidence: Load the same shared UI/controller and local codec worker/WASM. Exercise cookie/query settings and portable files through the packaged origin, with no preload filesystem bridge or external runtime dependency.
        - [ ] T-058 — Verify desktop lifecycle and origin boundaries
            Scope: tests/integration/platform and host-supported Electron smoke evidence. Contract: R10/R3; C7.
            Depends on: T-056, T-057.
            Evidence: Check blur pauses and explicit resume, close ends session, traversal/foreign-origin requests fail and local assets resolve. Separate actual host runtime evidence from unavailable native Windows behavior.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/8/8.1.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
    - [ ] Milestone 8.2 — Windows portable delivery
        - [ ] T-059 — Produce the unsigned Windows portable runtime
            Scope: scripts/package.mjs and Windows assembly inputs. Contract: R10/R12; C8.
            Depends on: T-058.
            Evidence: Build tetris-windows-x64.zip with the executable, Electron runtime, shared application/assets and license notices. Verify version/source agreement and no need for Node.js, server or developer files.
        - [ ] T-060 — Verify the extracted Windows artifact and retained browser build
            Scope: scripts/verify-packages.mjs, tests/packages and package evidence. Contract: R10/R12; C8.
            Depends on: T-059.
            Evidence: Inspect archive paths/executable metadata/runtime/assets and exercise feasible shared-origin/runtime checks. Recheck the browser ZIP from the same source; report native Windows launch excluded when unavailable rather than passed.
        - [ ] T-061 — Complete cumulative desktop installation and package guidance
            Scope: INSTALL.md, README, package/checksum candidates and packaging integration. Contract: R10/R12; C8.
            Depends on: T-059, T-060.
            Evidence: Document extraction/launch, unsigned development status, supported checks/limits and browser availability. Prepare both stable-name assets, checksums and release-note inputs; retain the post-integration exact-source publication gate.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/8/8.2.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
    - [ ] Milestone 8.3 — Phase review
        - [ ] T-062 — Review test and report Phase 8
            Depends on: T-058, T-061 and verified completion/closure of every delivery milestone in this phase.
            Scope: whole-phase implementation/consumer code review, in-scope SPEC/PLAN exits, relevant cumulative regressions, candidate package checks, blocker repairs and `docs/dev/reports/phases/8/PHASE-REPORT.md` plus HANDOFF.
            Evidence: record actual commands/environments/results, delivered versus deferred scope, source/artifact identities, TODO dispositions and explicit native/full-browser limits. Commit the verified report and initial task/parent completion together, publish/read back and reconcile issue/milestone closures before phase integration.

## Phase 9 — Chromium and Firefox sidebars

- [ ] Phase 9 — Chromium and Firefox sidebars
    - [ ] Milestone 9.1 — Shared sidebar sessions
        - [ ] T-063 — Implement versioned sidebar session coordination
            Scope: src/platform/extension/session.ts/background.ts and adapter tests. Contract: R11; C7.
            Depends on: T-062.
            Evidence: Acquire window-scoped writer generations, serialize acknowledged revisions into storage.session and reject stale writers. Validate checkpoints, clear closed-window sessions and recover coordinator restarts without advancing gameplay.
            Phase entry: set the PLAN version/capabilities and verify the predecessor integration/release/closure gate (or initial preparation gate for Phase 1).
        - [ ] T-064 — Implement extension-local settings and file adapters
            Scope: src/platform/extension/index.ts, shared ports and adapter contract fixtures. Contract: R11/R6/R8; C7.
            Depends on: T-063.
            Evidence: Persist only six settings in storage.local, keep results/game in session storage and adapt Blob download/file input without host-page URL/cookie changes. Check acknowledgement, failures and coherent settings/restore commits.
        - [ ] T-065 — Integrate paused sidebar reopening and compact UI
            Scope: src/entry/sidebar.ts, shared lifecycle/UI and integration tests. Contract: R11/R9/R3; C3/C4/C7.
            Depends on: T-063, T-064.
            Evidence: Restore the last acknowledged game paused with remaining timers/results, clear pressed input and handle corrupt/stale checkpoints/storage failure. Exercise close/reopen/window/browser-session boundaries and resizing with no background game loop.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/9/9.1.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
    - [ ] Milestone 9.2 — Chromium sidebar delivery
        - [ ] T-066 — Wire the Chromium MV3 sidebar shell
            Scope: platforms/chromium manifest, sidebar HTML and Chromium background/action wiring. Contract: R11; C7/C8.
            Depends on: T-065.
            Evidence: Declare side_panel, minimum API version and minimal permissions. Open from a user gesture and bind the shared page/session broker; verify no host-page content script, backend or gameplay service worker.
        - [ ] T-067 — Verify Chromium bundled assets and CSP
            Scope: Chromium build target, standalone validator/worker/WASM assets and manifest checks. Contract: R11/R8; C8.
            Depends on: T-066.
            Evidence: Check local resources, wasm-capable CSP without runtime eval/remote code, entry resolution and version agreement. Exercise shared-page settings/files/session acceptance with isolated browser facilities.
        - [ ] T-068 — Package and verify Chromium development distribution
            Scope: scripts packaging/verifier, tests/packages, INSTALL.md and Chromium ZIP. Contract: R11/R12; C8.
            Depends on: T-066, T-067.
            Evidence: Extract/load unpacked where available and verify manifest, sidebar entry, assets and feasible runtime/adapters. Record full-browser native open/close exclusions honestly; do not release the extensions platform before Firefox is ready.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/9/9.2.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
    - [ ] Milestone 9.3 — Firefox sidebar delivery
        - [ ] T-069 — Wire the Firefox sidebar and background script
            Scope: platforms/firefox manifest and Firefox adapter/assembly entry. Contract: R11; C7/C8.
            Depends on: T-068.
            Evidence: Use sidebar_action and a supported background script, keep shared application/session logic and confirm minimum API/tool compatibility. Verify platform-specific API differences without duplicating gameplay.
        - [ ] T-070 — Validate Firefox runtime permissions and temporary installation
            Scope: Firefox validation tools/config, platform tests and INSTALL.md. Contract: R11/R8; C8.
            Depends on: T-069.
            Evidence: Pin the validator and check manifest/CSP/version/assets, bundled worker/WASM and shared session/file behavior. State unsigned temporary installation limits and actual full-browser evidence/exclusions.
        - [ ] T-071 — Package Firefox and verify all delivered distributions
            Scope: scripts packaging/verifier, tests/packages, all four candidate ZIPs and install/release inputs. Contract: R11/R12; C8.
            Depends on: T-069, T-070.
            Evidence: Verify Firefox ZIP extraction and feasible acceptance, then browser/Windows/Chromium cumulative asset/source/version checks. Prepare checksums and complete instructions with no standalone Node/server/remote-runtime requirement.
            Milestone exit: review the whole capability and consumers, run relevant tests/regressions, repair blockers, and include `docs/dev/reports/phases/9/9.3.md` plus HANDOFF with this task completion; report TODOs as None or evidence-backed eligible deferrals.
    - [ ] Milestone 9.4 — Phase review
        - [ ] T-072 — Review test and report Phase 9
            Depends on: T-065, T-068, T-071 and verified completion/closure of every delivery milestone in this phase.
            Scope: whole-phase implementation/consumer code review, in-scope SPEC/PLAN exits, relevant cumulative regressions, candidate package checks, blocker repairs and `docs/dev/reports/phases/9/PHASE-REPORT.md` plus HANDOFF.
            Evidence: record actual commands/environments/results, delivered versus deferred scope, source/artifact identities, TODO dispositions and explicit native/full-browser limits. Commit the verified report and initial task/parent completion together, publish/read back and reconcile issue/milestone closures before phase integration.
            Final outcome: include `docs/dev/reports/IMPLEMENTATION-REPORT.md`, aggregate all unresolved eligible milestone/phase TODOs with options/provenance, and assess complete R1-R12 plus all four distributions without claiming future release publication.
