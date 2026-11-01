# Phase 1 — Classic browser baseline

## Delivered outcome

T-001–T-010 deliver the R1/default-R3 classic engine, application controller, playable Canvas interface, lifecycle/input handling and static browser packaging required by initial R9/R12. All seven pieces, uniform seeded sequence, immutable state, score/line/level progression, full independent gravity-interval locking and safe top-out are covered. Modern controls, settings, persistence/files, final panel layout, Electron and extensions remain in their mapped later phases.

## Source and code review

Reviewed the complete phase capability from preparation integration `eeb0dcc81ccb6e34687623eab665a6e51f1f4e1b`, through T-009 `364da117c21f9821c6524847ca7fa9479c1e9459` and this T-010 repair/report. Inspected domain geometry/sequence/engine/scoring, controller/ports, UI/input/disposal, build/configuration, package checker, tests, instructions and direct/CI workflow. Single-clock accounting, equal-deadline lock ordering, no grounded reset, lifecycle freezing, caller isolation and input focus ownership agree with the scoped contracts. Milestone reports 1.1–1.3 retain their detailed evidence; no earlier scoped TODO remains.

Audited each T-001–T-009 closing commit: exactly one leading owning task ID, its result/evidence and sole initial task checkbox transition occur together. Newer UI work was recovered without resets. T-006's unobserved original test-first chronology is explicitly characterized; its discovered label defect has observed RED/GREEN evidence.

## Findings and repair

P1-F01: the generated browser JavaScript includes Vite's module-preload helper, but the initial candidate omitted its applicable MIT notice. Added a checker requirement first: packaging failed with missing required member. Added THIRD-PARTY-NOTICES.txt copied from the pinned Vite core license and included it in the ZIP; packaging/recheck passes with six members. No application behavior or future-phase scope changed. All scoped blockers are resolved; TODO None.

## Acceptance evidence

Final type check, 44/44 unit tests, production build and package verification pass. Actual Vite application: 16/16 isolated Chromium headless-shell/managed-Firefox tests pass. Extracted static ZIP: 14 cases pass, with two source-only module-consumer cases explicitly excluded; actual gameplay/input tests are included. Coverage includes gameover/restart, exact repeat timing, focus/form handling, Canvas cell translation/inverse rotation, gravity without points, frozen paused rendering and 320/768/1440px layouts. Canvas screenshots were inspected. T-001 owns browser distribution/version/provisioning evidence; the project-local runner and diagnosed process-only Firefox override were reused.

The repaired candidate hash is `90024e0d7660389d0f8fea46c338f261d8a38f1bb5659fd1b002ad20c91e4cad`, built from T-009 plus the disclosed T-010 working changes. Final release bytes must be rebuilt from the exact clean release commit; this candidate does not claim that source identity. Stable names/checksums, required members, local runtime URLs, version/source metadata, archive safety and credential-marker exclusions pass; bad-name and corrupt-byte fixtures were rejected. CI is prepared, without a claim of hosted execution.

## Integration and release readiness

Delivery milestones 1.1–1.3 are closed/read back. T-010 publication, issue 19 and milestone 5 closure remain subsequent effects. Then explicitly integrate the verified complete phase into main, recheck/publish that merge and create the v0.1.0 default-branch release commit. Rebuild/verify clean exact-source packages, publish/read back tag/release, and compare hosted download bytes before Phase 2 activation.

Native Windows execution and full-browser/sidebar APIs are outside this browser phase. Application blur delivery is modeled; OS-native window focus is unverified. No missing native-only check blocks the feasible browser acceptance above. Browser assets are delivered by HTTP(S), not direct file opening.
