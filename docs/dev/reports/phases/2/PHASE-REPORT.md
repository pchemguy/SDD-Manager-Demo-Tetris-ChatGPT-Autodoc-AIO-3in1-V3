# Phase 2 — Modern piece controls

## Delivered outcome and reviewed source

T-011–T-017 deliver R2 and ordinary R3/R4 modern behavior: unbiased seven-bag, non-consuming next preview, once-per-lock hold, ordered wall kicks, outlined ghost and shared-landing hard drop with captured locking policy. The browser UI exposes next/held shapes and C/Space bindings while retaining exactly two gameplay buttons. Phase 1 behavior is preserved. Penetrator, settings, persistence/files, final layout and other platforms remain in their later assigned phases.

Reviewed the complete difference from v0.1.0 `b304c51700824bff6fe94b63987a7f357b5d872b` through T-016 `fc3ce8f3b4b03c70b32dc21d5116390bc2ac2041` plus this report-only T-017. Inspected engine/sequence/projection/geometry interactions, controller time/command flow, keyboard repeat/one-shot routing, board and miniature presentation, mount/composition/disposal, documentation, packaging and tests. Milestone 2.1/2.2 reports retain focused findings and RED/GREEN evidence. M2.2-F01's C4 mount-name/mode alignment is resolved. No remaining scoped blocker or deferred TODO was found.

## Verification and audit

Current production sources are identical to the passing T-016 check: 61/61 unit cases, type check/build, 20/20 source-app Chromium headless-shell/managed-Firefox cases, and 18 extracted-package browser cases with two explicit source-module-only exclusions. Full-page modern/ghost and compact screenshots were inspected. GitHub Actions run `41324234370` completed successfully for exact T-016 source.

Rebuilt the clean-source v0.2.0 candidate at T-016 and verified stable names, archive safety/content, local runtime URLs, version/exact source, checksums and credential-marker exclusions. Candidate ZIP SHA-256: `8992909f0c91ce8c163b0e4c8bcf957c67d71031d410cb627f14b1df9038f35a`. Its runtime, instructions and notices byte-match the tested extracted candidate; only BUILD-INFO source metadata changes. No unchanged gameplay suite was repeated merely for this report. The final release source will be rebuilt/rechecked after integration.

Audited all six T-011–T-016 closing commits: each has its single leading owning task ID, task-owned result/evidence and exactly its initial owning task checkbox transition. Phase branch-off identity, version/capability metadata, published task results, both delivery milestone closures and source-bound Phase 2 associations are established. Whole-phase review includes cross-milestone queue/hold/kick/drop/timer and UI/palette interactions, not only test counts.

## Limits and next gates

No native Windows or full-browser sidebar delivery is claimed. OS-native window focus remains unverified; application lifecycle events are covered. The default UI uses full interval/general hard-drop policy; public engine tests also check failed/immediate inputs without claiming an unexposed settings panel.

T-017 publication, issue 26 and milestone 8 closure follow this commit. Then explicitly integrate/publish the complete phase into main, prepare the eligible v0.2.0 release commit, rebuild clean exact-source assets, test the extracted package, publish/read back tag/release/latest and re-download/compare every hosted asset. Only then activate Phase 3. Full implementation T-001–T-072 remains authorized; no new human checkpoint is pending.
