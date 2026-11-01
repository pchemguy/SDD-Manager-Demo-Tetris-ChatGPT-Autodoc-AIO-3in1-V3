# Delivery plan

## Strategy and coverage

Deliver the [SPEC](SPEC.md) in nine bounded phases. Phase 1 is a usable classic browser game, including the required default full-interval locking and two gameplay buttons. It excludes independent modern controls, settings, files and additional platforms. Later phases preserve that working path and add the outcomes below; they do not require the complete product at every early exit.

The sequence deliberately delivers six session-only settings before cookie/query persistence, completes the browser layout before Electron, and delivers Chromium/Firefox sidebars together after Electron. Phase 6 groups session ranking with its two manual portable formats because a saved leaderboard/settings snapshot is the useful integrated outcome. No network services, installer signing or store submission are included.

| Phase | Version | Integrated outcome | SPEC coverage introduced |
| --- | --- | --- | --- |
| 1 | v0.1.0 | Playable classic browser game and deployable build | R1, default R3, initial R9 controls, R12 |
| 2 | v0.2.0 | Modern piece controls and projections | R2, ordinary ghost/hard-drop parts of R3–R4 |
| 3 | v0.3.0 | Penetrator bonuses and dynamic ghost | Remaining R4 and its R2–R3 interactions |
| 4 | v0.4.0 | Six configurable session-only settings | R5 |
| 5 | v0.5.0 | URL/cookie persistent configuration | R6 browser contracts |
| 6 | v0.6.0 | Session top ten with JSON/SQLite Save/Restore | R7–R8 |
| 7 | v0.7.0 | Centered, toggleable, responsive panel layout | Complete R9 |
| 8 | v0.8.0 | Self-contained Windows Electron package | R10, desktop R6/R8 lifecycle |
| 9 | v1.0.0 | Chromium and Firefox sidebar packages | R11 and complete cumulative R1–R12 |

Each phase starts only after its predecessor's verified integration/publication, required milestone closures and release publication. The first delivery task updates the version/capability metadata for that phase. A patch release may correct delivered behavior without skipping unfinished phases. Actual execution ranges and human stops are selected separately from this strategy.

## Common milestone and phase exits

Every delivery milestone ends with whole-capability code review, focused/relevant regression tests, blocker repair, a committed milestone report and HANDOFF. TASKS folds these obligations into its final delivery task when fewer than four delivery tasks are needed; otherwise it derives a standalone review task under the lifecycle policy. Each phase has a final dedicated review milestone with exactly one phase review/testing/report task, after all delivery milestone completions/closures.

The phase review checks all in-scope contracts and preserved predecessor behavior, carries unresolved eligible TODOs with rationale/options, and records packaging/readiness evidence. Required bugs and SPEC/PLAN violations are fixed before closure. The final phase review also aggregates final project results and TODOs. Native Windows/full-browser sidebar checks unavailable on the execution host are excluded and reported, not blocking native-only tasks; feasible required failures still block.

After phase completion, explicitly integrate into main, verify/publish the merged result and create the eligible default-branch release commit. Build/recheck applicable packages for that exact release source, verify stable asset names, publish/read back the tag and GitHub release, re-download/check hosted assets, then consider a further authorized phase. A candidate package prepared inside a milestone is not the final release-source proof. The receiving main branch and release remain cumulative.

## Phase 1 — Classic browser baseline

Establish the smallest playable end-to-end path. Uniform random pieces and origin-only rotation suffice here; fixed general interval locking is already part of the requested baseline behavior. Modern actions remain absent rather than partially exposed.

| Milestone | Outcome and exit evidence |
| --- | --- |
| 1.1 — Deterministic classic engine | Pin the initial build/test tools, document isolated browser provisioning under the central policy, and implement geometry, sequence and time/lock transitions. Public engine scenarios demonstrate falling, collision and full-interval locking without a DOM. |
| 1.2 — Playable browser session | Integrate scoring/clears/top-out, controller and Canvas/keyboard UI. A user can play through game over, see score/level and use only the two clickable gameplay buttons. Demonstrate the core loop early enough to amend usability before independent features grow. |
| 1.3 — Browser distribution | Complete pause/restart/focus behavior, representative Chromium/Firefox application checks and a static browser ZIP with installation/asset verification. Establish stable-name and version checks in direct packaging and CI. |
| 1.4 — Phase review | Review/test/report the baseline across engine, controller, UI and extracted browser artifact; prepare integration/release readiness. |

Exit: R1 and default R3 pass, the baseline is playable from the extracted package, Canvas output is inspected and browser evidence names actual modes/versions. Release includes browser only. Later contracts are explicitly deferred to their mapped phases.

## Phase 2 — Modern piece controls

Build on the usable baseline with seven-bag, hold, wall kicks, next preview, ghost and hard drop. These related movement/projection features share sequence and landing seams, while penetrator and configurable policies remain independent later scope.

| Milestone | Outcome and exit evidence |
| --- | --- |
| 2.1 — Sequence and piece controls | Seven-bag/preview state, hold and wall kicks work through public engine/controller consumers. Seeded queue/hold/kick scenarios pass and existing gameplay remains coherent. |
| 2.2 — Projection and hard drop | Shared normal landing drives visible ghost and hard drop; delayed locking and zero-distance behavior pass. UI/help and browser package expose the complete modern control set with fixed defaults. |
| 2.3 — Phase review | Review/test/report modern-rule interactions and cumulative browser package readiness. |

Exit: R2, normal ghost/hard-drop R3–R4 and classic regressions pass. Demonstrate repeated hold/drop/play with preview consistency; input/help evidence informs whether control clarity needs an in-scope correction before integration.

## Phase 3 — Penetrator and conditional ghost

Add the distinctive bonus mechanic and dynamic ghost rule without broadening configuration or persistence.

| Milestone | Outcome and exit evidence |
| --- | --- |
| 3.1 — Penetrator mechanics | Valid-final-landing search, pass-through movement, lock safety and bonus earn/spend/cap work together. Shared ghost/hard-drop comparison covers stacked boards and invalid geometric-floor poses. |
| 3.2 — Visibility and bonus experience | Dynamic y=10 visibility, entirely white penetrator rendering, bonus symbols, hold prohibition and help integrate with the browser UI and package. Demonstrate activation through a stack without destroying cells. |
| 3.3 — Phase review | Review/test/report complete R4 and interactions with R2/R3; retain cumulative browser artifact evidence. |

Exit: zero/capped inventory, activation, grounded timing, locking and midline boundaries pass. Dynamic mode is covered by the public settings projection seam before its selectable UI arrives in Phase 4; fixed defaults remain shown ghost until then.

## Phase 4 — Session configuration

Deliver all six choices in a settings panel, intentionally without reload persistence. A real session-only release is required before the persistence phase.

| Milestone | Outcome and exit evidence |
| --- | --- |
| 4.1 — Session settings model | Typed defaults/patch validation and selected-versus-active policy effects integrate with the controller, including disabled action/held-slot behavior. |
| 4.2 — Settings panel integration | Six accessible controls, next-piece policy feedback and a settings panel work in browser play. Reload/write-spy checks prove defaults reset and no persistent storage/URL writes occur. Prepare the cumulative browser package. |
| 4.3 — Phase review | Review/test/report R5 and all setting/gameplay interactions while verifying explicit non-persistence. |

Exit: every choice is demonstrable; configuration survives Restart and is lost on reload. Files/leaderboard and finalized five-panel geometry remain later scope.

## Phase 5 — Persistent configuration

Add browser cookie/query effects to the existing settings flow. Independent parsing and handled-error transaction boundaries limit failure complexity.

| Milestone | Outcome and exit evidence |
| --- | --- |
| 5.1 — Per-key configuration restoration | Strict serializers, URL/cookie reads and precedence initialize the application. Mixed sources, explicit defaults, omitted values and invalid inputs pass pure and real-origin checks. |
| 5.2 — Transactional setting updates | Edits update corresponding cookies/URL keys, preserve unrelated data and compensate handled failures. UI warnings and cumulative browser artifact prove success/failure behavior. |
| 5.3 — Phase review | Review/test/report R6, persistence limits and session-leaderboard exclusion; recheck gameplay and prior settings. |

Exit: all six settings restore independently, explicit valid default parameters persist, omissions retain cookies and failures never silently claim successful persistence. No automatic score persistence is introduced.

## Phase 6 — Session results and portable files

Deliver the session leaderboard and complete manual JSON/SQLite snapshot workflow. Ranking is independently demonstrable before file-format integration; JSON supplies the common snapshot validator before SQLite consumes it.

| Milestone | Outcome and exit evidence |
| --- | --- |
| 6.1 — Session leaderboard | Exact-once completion, deterministic top-ten ranking/identity/timestamps and the leaderboard UI work. Restart/duplicate-event/session-end cases pass. |
| 6.2 — JSON snapshots | Define schema/runtime validation, bounded codec-worker JSON operations and transactional Save/Restore UI. Valid round trips and invalid-file no-mutation checks include cookies/URL; save excludes gameplay. |
| 6.3 — SQLite snapshots | Pin/bundle SQLite JS/WASM, implement strict metadata/table/row validation and equivalent JSON/SQLite semantics. Worker asset loading, resource disposal, timeout/corrupt-file checks and extracted browser package run without CDN access. |
| 6.4 — Phase review | Review/test/report R7–R8 and cumulative persistence/gameplay behavior; inspect valid and rejected files in both formats. |

Exit: top ten is session-only, both formats preserve IDs/scores/timestamps/settings, complete invalid inputs cause no committed data/persistence changes, and Save/Restore are manual. Demonstrate successful restoration and clear rejection feedback before layout work.

## Phase 7 — Centered panel layout

Finalize the browser/desktop UI after all panels and file controls exist, before adapting the application to Electron.

| Milestone | Outcome and exit evidence |
| --- | --- |
| 7.1 — Centered wide panels | Five-panel order, fixed board anchoring and three independent toggles satisfy all eight visibility combinations. Buttons and Save/Restore placement meet R9. |
| 7.2 — Compact accessible layout | Compact browser/sidebar-ready layout, keyboard focus, hidden-panel semantics and Canvas resizing pass at 320, 600, 1024, 1280 and 1920 CSS pixel widths. Inspect output and cumulative browser package. |
| 7.3 — Phase review | Review/test/report complete R9, gameplay/file regressions and browser-layout readiness for Electron reuse. |

Exit: browser layout is implemented and verified before Phase 8. Evidence includes center measurements, form/game focus behavior, hidden file controls and representative Canvas screenshots, not DOM assertions alone.

## Phase 8 — Windows desktop delivery

Reuse the verified UI through a thin local Electron shell, then package the runtime. No new game features enter this phase.

| Milestone | Outcome and exit evidence |
| --- | --- |
| 8.1 — Local desktop runtime | Pin Electron, register secure local origin/session and integrate bundled app/worker/WASM paths, cookies/query settings and blur/pause lifecycle. Verify path restrictions and shared consumer behavior on the available host. |
| 8.2 — Windows portable delivery | Produce the unsigned x64 executable/runtime ZIP, verify metadata/contents/offline assets and installation instructions, and recheck browser delivery from the same source. Record Windows-native execution separately when unavailable. |
| 8.3 — Phase review | Review/test/report R10, desktop persistence/files/lifecycle and cumulative browser/Windows package readiness. |

Exit: a verified feasible Windows package and browser ZIP are release assets, with exact runtime/source identities and installation limits. Absence of Windows-native facilities is disclosed rather than substituted with an unchecked mandatory task.

## Phase 9 — Chromium and Firefox sidebars

Deliver both sidebar platforms together while retaining browser and Windows packages. Shared sidebar sessions come before platform package consumers; manifests/background entry differences stay in adapters/assembly.

| Milestone | Outcome and exit evidence |
| --- | --- |
| 9.1 — Shared sidebar sessions | Versioned session checkpoints, generations/revisions and storage-local settings/file adaptations integrate with the compact UI. Test paused reopen, stale writes, storage failure and browser/window-session boundaries. |
| 9.2 — Chromium sidebar delivery | MV3 side panel/action/background wiring and an unpacked-install ZIP satisfy permission/CSP/asset checks and shared runtime/adapter acceptance. Native sidebar checks run where available; exclusions are explicit. |
| 9.3 — Firefox sidebar delivery | sidebar_action/background-script wiring and a temporary-install ZIP satisfy Firefox validation and shared acceptance. Both extension packages and cumulative browser/Windows assets have install guidance and final package evidence. |
| 9.4 — Phase review | Review/test/report complete R1–R12, cross-platform drift, final implementation results/TODO aggregation and cumulative v1.0.0 release readiness. |

Exit: both sidebar packages pass feasible required checks, persistent settings and session-only scores are correctly separated, no background gameplay/server is required, and all four runtime artifacts are ready for final release-source verification.

## Risk, refinement and evidence ownership

- SQLite assets and worker initialization are a Phase 6 integration gate before file consumers/package claims; generated standalone schema validation avoids extension runtime eval. Invalid/oversize input and resource/time limits are required, not deferred polish.
- Electron origin/cookie support is exercised in Phase 8 before distribution; failures return to the adapter implementation/design owner without silently replacing persistence semantics.
- Sidebar close/reopen recovery uses acknowledged snapshots rather than unload-only saves. Phase 9 validates generation/revision and storage failures before package consumers rely on the session contract.
- Versions of Vite/TypeScript/Playwright, SQLite/validator tooling, Electron and extension validators are pinned in the first task that needs them. Private helpers/build details may be refined within MODELS/API-DESIGN/SPEC constraints; material surface/behavior changes return to their owners before dependent work.
- Each phase's applicable report records actual commands, versions, checks, findings and limitations. Browser isolation and provisioning follow the single central repository policy; do not duplicate it across task bodies.

Preparation review is retained beside this document. Physical allocation is owned by layout; executable task identities and edit scopes are owned by TASKS.
