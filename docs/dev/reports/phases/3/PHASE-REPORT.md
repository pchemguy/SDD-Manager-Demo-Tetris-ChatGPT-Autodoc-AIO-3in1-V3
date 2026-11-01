# Phase 3 — Penetrator bonuses

## Delivered outcome and source

T-018–T-024 deliver R4 penetrator mechanics and their R2/R3/UI interactions: earn one bonus for four lines (cap three), spend one through P, traverse occupied cells toward the deepest legal final landing, prohibit hold while active, preserve interval locking, and draw active/settled/ghost penetrators white. Ordinary controls and seven-bag/hold/kick/ghost/drop behavior remain supported. Dynamic visibility, selectable settings, persistence/files, final layout and additional platforms remain in their mapped later phases.

Reviewed the whole difference from v0.2.0 `f6888905635e3601aafce9fd9f76b326b02c88dd` through T-023 `44798866dbd4cfaa12a216078ce462850fbe39bb` plus this report-only T-024. Inspected geometry/landing/traversal bounds, engine activation/down/kick/ground/lock/score events, controller consumers, board/preview/inventory rendering, key/focus behavior, composition/disposal, documentation, fixtures, packaging and workflow. Milestone reports 3.1/3.2 retain detailed findings and checks. M3.2-F01's board-clipping focus defect is fixed and rechecked. No scoped blocker or deferred TODO remains.

## Verification and evidence limits

Current production evidence: 78 domain/controller unit cases, type check/build, 30 source app/public-component Chromium headless-shell/managed-Firefox cases and 22 extracted-package normal-entry cases pass. Eight source-only cases are explicitly excluded from the ZIP run: two module consumers and six authored-state consumers. The latter consume public controller/mount APIs and use native keys; no production debug state hook or fixture is shipped.

The authored scenario earns from a four-row clear at score 808, spends its symbol, soft-drops through an occupied retained barrier, and locks white cells below at score 832. Literal geometry/state/score/inventory and actual white pixels are checked. Rendering also covers all regular colors and underlying data during overlap. Full-page pass-through/bonus and focused-viewport output were inspected. Ordinary/modern lifecycle, pause/lock timing, input repetition/forms, gameover/restart and responsive output regressions pass. No dynamic-selector delivery is inferred.

Rebuilt a clean-source candidate at T-023 and passed stable names, ZIP safety/inventory, local runtime URLs, notices, version/source metadata, byte checksums and credential exclusions. SHA-256: `7ab087f71950ee7aa044b567ac0cb3ba60fc3a2310962006395d74e274624fb7`. Runtime/instructions/notices byte-match the tested extracted candidate; only source metadata changed, so no unchanged gameplay suite was repeated for this report. GitHub Actions run `41328256525` succeeded for exact T-023 source.

Audited each T-018–T-023 closing commit: one leading owning ID, task-owned result/evidence and its sole initial task completion together. Phase activation's uncertain first issue readback was settled through read-only reconciliation before a bounded idempotent retry; the complete projection was verified before product edits/tests and no duplicate was created. Both delivery milestones are closed/read back.

## Remaining transition

T-024 publication, issue 33 and review milestone 11 closure follow this commit. Then explicitly integrate/publish Phase 3 into main, prepare the eligible v0.3.0 release commit, rebuild/recheck clean exact-source assets, test extracted entry, publish/read back tag/release/latest and re-download/compare all assets. Only then activate Phase 4. Full implementation through T-072 remains authorized.

Native Windows execution, OS-native focus delivery and full-browser/sidebar behavior remain unverified/outside this browser phase. Browser focus/scroll and application lifecycle handling were tested; no native-only omission is represented as a pass.
