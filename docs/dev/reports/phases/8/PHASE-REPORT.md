# Phase 8 — Windows desktop delivery

## Outcome

The browser application is retained and a self-contained unsigned Windows x64 portable package is implemented and verified across the feasible host-side boundary. Electron 45.2.1 supplies the desktop runtime; the game, UI, settings and manual JSON/SQLite functionality remain shared. No separate Node installation, development server or backend is required by the desktop package. Integration and publication of v0.8.0 are subsequent authorized operations, not claimed complete by this report.

R10 and applicable cumulative R12 exits pass within the central cross-platform verification policy. Native Windows execution is excluded on this Linux host. Browser/sidebar installation remains Phase 9 scope. The reports for [local runtime](8.1.md) and [portable delivery](8.2.md) retain scoped findings and receipts.

## Whole-phase review

A distinct independent read-only phase review assessed the full c52b5e85aa944641491c37684f134ba1f1fcb2ab..dd91ad81659e25898697739e8873c0a584c7b0cd delta and its consumers against current SPEC/PLAN. It rechecked main/renderer separation, persistent session/origin boundaries, session-only game/results and persistent selected settings, local worker/WASM/file composition, pristine runtime and closed app inventories, checksums, direct/CI commands and installation claims. Independent origin/shell/inventory checks pass 8/8. No new phase blocker was found. Milestone reviews were inputs rather than substitutes for this assessment.

M8.2-F01 is resolved by forward correction 288ad23729429a8535db4c0360cce5f119be5cea: required main/notices and closed app paths/dependency metadata are enforced independently for local and packaged trees. Its intended missing-main regression failed before the correction; 207 tests and real-CLI absent-main/developer-file negative checks pass afterward. The reviewer rechecked the fix. The earlier evidence-paragraph placement correction 18cc22594fe6c62afe87f96fca928bb07dcad5d9 changes only record attachment.

Task-history audit inspected every closing parent diff and result/evidence composition: T-056 fe5aec7, T-057 3be9f73, T-058 981acb6, T-059 b6419c3, T-060 340995d and T-061 dd91ad8 each initially close exactly their one owning task. The two identified forward corrections close no task and are distinguished from initial boundaries. Folded milestone reports and HANDOFF accompany T-058/T-061. This final review/result and initial T-062/phase checkoffs close together. No unrelated or closed campaign record is changed by the phase delta.

## Fresh exact-source verification

Clean published source dd91ad81659e25898697739e8873c0a584c7b0cd passes:

- `npm run check`: shared/DOM and Node-only Electron configurations.
- `npm run test:unit`: 207/207 deterministic and composed checks.
- Browser and desktop builds, pinned official runtime identity, both independent platform verifiers and the exact four stable asset/checksum gate with sourceDirty=false.
- Complete source application suite in managed Chromium/Firefox: 194 passed, 10 build-only/desktop-transport exclusions.
- Actual Windows ZIP extracted renderer via production handler over labeled HTTP transport: 168 passed, 36 source/nested-browser exclusions.
- Actual extracted browser ZIP: 168 passed, 36 source/desktop-transport exclusions. Browser-only nested deployment remains tested here.
- GitHub Actions run 41383953642 for this exact source: completed success. It includes the declared browser and desktop jobs; this is separate remote execution evidence.

The strict gate again detected workspace synchronization partial copies in the mirrored output directory. No production allowance was added. A fresh output at `/tmp/tetris-phase8-candidate` avoided that environment interference and passed the unchanged complete inventory/platform/clean-source gates. This temporary location contains the verified candidates; it does not alter the stable public filenames.

Candidate identities from that clean source:

| Asset | SHA-256 |
| --- | --- |
| tetris-browser.zip | 361f26c986cbd26cb5969493acf4bc00096c845f2c8333b1db75c8857dda3067 |
| tetris-windows-x64.zip | 2dafbd63ed42585d357e7c45c728aeba788f263a638604bfc21581a498509c45 |
| INSTALL.md | d385087f06430e1da6b22a1d7c095371cca56e53eb87df12be205d45f35330da |

These candidate hashes are not final release-source receipts. Final release metadata must identify the later eligible default-branch release commit and be rebuilt/rechecked before upload. Hosted bytes must then match that final local set.

## Evidence limits and continuation

Linux, Node 24.22.1; managed Chromium headless shell 156.0.8078.80 and Firefox 157.0 with dedicated binaries/profiles. Each browser passed two isolated input/Canvas/font/screenshot/teardown probes; screenshots and responsive/interaction checks were inspected. Firefox's documented override remains opt-in for trusted local tests. Browser provisioning identities and recovery details are in the milestone reports.

Artifact identity, archive/executable metadata and extracted shared-renderer behavior are verified. HTTP transport and native-host recorders do not establish native Electron app-scheme/cookie integration, native OS focus delivery or Windows installation/launch. Those checks were not executed and are not relabeled as passed. The portable package is unsigned development distribution, not signed/store distribution. The browser remains a deployable static ZIP.

All Phase 8 delivery task issues and milestones 25/26 are closed/read back before this review. Publish/read back T-062, close issue 71/milestone 27, explicitly integrate and publish main, prepare the eligible v0.8.0 release commit/tag, rebuild/check the cumulative four assets for that exact source and verify the hosted release/downloads. Only then activate Phase 9. The optional comprehensive prerelease advisory was emitted once; no separate campaign was selected or required to continue.

## TODO

None. Full authorized implementation continues through T-072 after the required release gate. Phase 9 remains unfinished; no extension platform is claimed delivered.
