# Phase 9 — Chromium and Firefox sidebars

## Outcome and distinct phase review

The complete Phase9 capability is implemented: shared acknowledged window sessions, extension-local settings/manual files, compact reopening, Chromium MV3 side_panel, Firefox sidebar_action/event background, four deployable development ZIPs and one cumulative six-asset verification path. [9.1](9.1.md), [9.2](9.2.md) and [9.3](9.3.md) retain milestone evidence. The complete phase is ready for explicit integration into main, followed by exact clean-source v1.0.0 release preparation. Publication is not claimed by this report.

Independent phase review inspected the complete97271e4..a5f60cc implementation and all C3/C4/C6/C7/C8 consumers, rather than relying only on milestone tests. M9.1-F01–F03 and M9.2-F01–F02 remain resolved. A separate whole-project R1–R12 review checked current domain/rules/controller/input/UI, browser transactions, codecs, platform adapters and product instructions. It found P9-F01 below and found no further correctness/contract blocker after recheck.

| Finding | Impact and repair | Evidence |
| --- | --- | --- |
| P9-F01 / R6-F01 | Extension settings were stored in separate unversioned keys, contrary to the accepted single versioned local-object contract. Replace with tetris.settings containing formatVersion1 and all six typed settings; read/validate the complete envelope, use one normal acknowledged set and compensate the complete previous object on failure. | Four adapter assertions observed RED before repair. Eight adapter cases and240 full deterministic checks pass; independent source recheck resolves the finding. Rebuilt extracted extensions pass4 runtime cases,4 source sidebar cases and a native Firefox temporary install with clean SDK exit. |

No specification amendment was used to excuse this implementation defect. Earlier task/report history is retained; this phase review owns the forward correction. Unknown versions/incomplete values reject without mutation; missing saved settings remain defaults and startup writes nothing unnecessarily. Neither scores nor game state enters local persistent storage.

## Verification and coverage

- `npm run check`: both TypeScript configurations pass. `npm run test:unit`:240 deterministic/actual-build/codec/adapter checks pass after the repair.
- Full source Chromium/Firefox suite:198 passed,12 scope exclusions. This run preceded the extension-only P9-F01 repair; all affected source sidebar4 and rebuilt extracted extension4 cases were rerun afterward. Core browser/desktop application graphs are unaffected by that adapter correction.
- Full extracted browser suite:168 passed,42 explicit source/transport/build-only exclusions. Full extracted Windows-renderer suite:168 passed,42 corresponding exclusions. Both use the verified Phase9 candidate; native Windows execution is not substituted by these HTTP checks.
- Repaired Chromium and Firefox extracted runtime:2 cases each under the actual packaged CSP, real codec worker/SQLite WASM, JSON/SQLite Save/Restore, local versioned settings, no remote request/host cookie/query modification and paused recovery.
- Firefox native temporary installation: the owned managed Firefox157 acknowledged the repaired extracted add-on; runner.exit returned successfully. Visible native sidebar action/open-close and minimum-version execution remain unverified.
- Cumulative six-name/source/version/checksum and all four platform verifiers pass. Extra asset, missing platform and duplicate checksum negatives reject3/3. Each extension rejects six hostile mutations and a renamed archive. Firefox's pinned validator reports0errors/0notices and five narrowly reviewed warnings, documented in milestone9.3.
- Git audit before this closure found71 unique initial task closures, each in its own commit; Phase9's nine preceding closures are unique. T-072 closes with this report and parent checkoffs; final committed composition/publication and hosted closure are checked before integration. Issues72–80 and milestones28–30 are closed/read back. Exact T-071 Actions41395272676 succeeded; it predates the final adapter repair and is not represented as its CI evidence.

A source-suite attempt overlapped generated-asset writes and reloaded Vite pages; its failure was diagnosed and the isolated full rerun passed. A strict cumulative gate rejected a mirrored obsolete extension chunk; fresh owned temporary build roots and isolated build-test outputs passed without relaxing inventories. Final release builds use fresh extension outputs.

## Reviewed candidate identities and environment

The repaired cumulative set at `/tmp/tetris-phase9-reviewed-candidate` identifies a5f60ccc8129b6a469df42a7f10c4e77428b4ac5 plus T-072 sourceDirty:true. It is review evidence, not the final clean release set.

| Asset | SHA256 |
| --- | --- |
| tetris-browser.zip | b72b28bcb7b669b246f98ebe4afe6dc853e2d2a3a713be9a6f5ebc0eb15d70b4 |
| tetris-windows-x64.zip | 4a07dac2322ce5399dd53447652d16ee85703760a9603b9aa524c76cb8f8e54c |
| tetris-chromium.zip | e4347c42bb3fb1910d03e03ed6c5eedfdfce55fb73125a48ef7cfb16f7738bca |
| tetris-firefox.zip | 916d0d9b21a6faa1be3ce286f1aaf7e81868239fba135f1561822e34c509f58f |
| INSTALL.md | e4fa354ed071fce009e518354718a6c052ab813ea12aef91c68a381e3e500c18 |
| SHA256SUMS.txt | f55e23c7cb8e2ebc5a888219240d85006f104f3d2013aaa475e7a1a62edb285c |

Linux/Node24.22.1/npm11.9.0, Playwright1.64.1. Project-owned Chromium headless shell156.0.8078.80 revision1248 and Firefox157.0 revision1555 use isolated profiles/cache. Firefox's namespace workaround is explicit and limited to trusted local content. Full Chromium cannot create its required UNIX socket; native sidebar load/action/open-close is excluded. Native Windows launch/install and visible Firefox sidebar behavior are excluded/unverified. Unsigned portable/unpacked/temporary development distributions are distinguished from signed/store packages throughout instructions and release inputs.

## TODO and next authorized boundary

None within the complete requested implementation scope. No eligible milestone/phase TODO remains unresolved; unavailable native facilities are evidence exclusions, not deferred product features. [IMPLEMENTATION-REPORT](../../IMPLEMENTATION-REPORT.md) records complete R1–R12 coverage. Reconcile T-072/issue81/milestone31 publication and final72-task audit, explicitly merge the complete phase into its recorded parent main97271e4, verify/publish, prepare exact complete release notes and eligible release commit, rebuild clean v1.0.0 all-six assets, then publish/read back tag/release/latest/body and every hosted byte. The optional v1.0.0 comprehensive prerelease advisory was emitted once; no separate campaign was selected and no human checkpoint is pending.
