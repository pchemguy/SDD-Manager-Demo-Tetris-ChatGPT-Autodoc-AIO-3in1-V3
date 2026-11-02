# Tetris implementation report

## Delivered scope

The complete requested browser Tetris and reusable Windows Electron, Chromium sidebar and Firefox sidebar implementations are verified. Phases1–8 have published releases v0.1.0–v0.8.0. Phase9 completes both extensions together for v1.0.0; this report precedes its main integration and release publication. The release asset list is authoritative for published downloads.

| Contract | Implemented behavior | Verification owners |
| --- | --- | --- |
| R1 | Playable10×20 classic board, seven shapes, movement/rotation, gravity, line clearing, score/level, pause/restart/game over | Domain/controller suites and actual browser baseline/rendering |
| R2 | Seven-bag randomization, hold, next preview, ordered wall kicks, hard drop and keyboard ownership | Modern/sequence/input tests and shared runtime |
| R3 | Failed-step or full grounding-interval lock policy; no grounded reset unless lifted; selected hard-drop policy; pause preserves remaining time | Engine/controller timing boundaries and real settings/play tests |
| R4 | Ghost show/hide/dynamic any-cell-midline rule; white penetrator pass-through/deepest valid landing, shared ghost/drop, hold prohibition, four-line bonus/max3 | Geometry/landing/penetrator/ghost suites and Canvas/input scenarios |
| R5 | Six typed settings, sensible defaults, session-only increment, immediate action/visibility effects and next-piece captured lock policy | Pure settings/controller and session-only zero-write/reload tests |
| R6 | Independent URL→cookie→default browser/desktop precedence, explicit-default persistence, omission retention, transactional edit/Restore; one versioned extension-local settings object | Resolution/transaction tests; extension complete-object acknowledgement/version/rollback and no-host-effects checks |
| R7 | Session top ten, stable IDs/nonnegative safe integer scores/real UTC timestamps, deterministic ranking and once-per-completion recording | Ranking/controller/authored completion and actual application history |
| R8 | Manual JSON/SQLite Save/Restore, shared complete validation/schema/versioning, strict tables/keys/metadata, whole-file rejection without mutation, bounded worker/memory/resource lifecycle | Unit/integration codecs, actual local worker/WASM/file-picker/download, invalid/failure/timeout/disposal cases |
| R9 | Centered wide five-panel order and auxiliary toggles, essential board/info, two gameplay buttons, compact/sidebar320–600 access, keyboard/accessibility/Canvas | All visibility combinations, responsive/DPR/input/focus and both browser engines |
| R10 | Static browser build; unsigned portable Windows x64 with pinned pristine Electron45.2.1, secure local app origin, sandbox/isolation/no renderer Node/preload | Strict browser/Windows archive/runtime/PE/source gates, production-origin recorders and extracted renderer tests |
| R11 | Chromium MV3 side panel and Firefox event-background sidebar, shared compact UI, acknowledged window sessions, paused reopen, local settings/manual files | Broker/adapter/native-host recorders, extracted actual-CSP runtime, Mozilla lint and isolated Firefox temporary add-on load |
| R12 | Appropriate staged versions, integrated release boundaries, stable four ZIP names plus INSTALL/checksums, local and hosted-byte verification | Prior release receipts; cumulative producer/verifiers/negative cases; final v1.0.0 publication remains the next authorized boundary |

The architecture keeps pure geometry/game/rules, application orchestration, UI, file codecs and platform effects separate. All runtime assets are local; desktop/extension players need no Node.js installation, dev server or backend. Browser deployment is static HTTP(S). No signing/store distribution was added.

## Final review and evidence

[Phase9 report](phases/9/PHASE-REPORT.md) owns final review, resolved findings, exact candidate identities and commands. Independent phase and whole-project code/consumer reviews found one final R6 settings-envelope mismatch, repaired in T-072 without weakening the accepted specification. Earlier marker/ranking/error-precedence, archive-basename and test-transport containment findings are also resolved. The corrected adapter preserves the complete prior object on handled failure and rejects unsupported/incomplete saved settings without mutation.

After repair:240 deterministic checks and both TypeScript configurations pass. Full source acceptance passed198 cases with12 declared exclusions before the extension-only correction; all affected source sidebar4 and rebuilt/extracted extension4 cases pass afterward. Full extracted browser and Windows-renderer suites each pass168 cases with42 source/transport/build exclusions. Native Firefox157 temporary installation of the repaired candidate is acknowledged and cleanly torn down. Cumulative all-six verification and hostile archive/checksum/inventory negatives pass. The exact T-071 CI run succeeded before the final correction; final-source CI must be read separately if claimed.

The project retains one unique initial closing commit per implementation task, with owning checkbox/result/evidence together. The audit confirms T-001–T-071; T-072 closes with these final reports and is checked again before integration. GitHub task/milestone reconciliation follows each verified publication. Reports do not claim their own future push/merge/provider release effects.

## Verification limits and remaining work

Native Windows application launch/install, full Chromium native sidebar installation/action/open-close and visible Firefox sidebar interaction were not executed. Chromium full-browser startup is prevented by a diagnosed UNIX socket restriction on this host. Headless shared-page and origin/host-recorder evidence remains distinct. Firefox minimum115 is the supported API floor, not an executed115 binary. Mozilla validation's three static code-owned-template warnings and two older no-data-metadata compatibility warnings are explicitly bounded; other warnings/errors fail.

No requested capability or eligible implementation TODO is deferred. Native checks are policy-scoped evidence exclusions, not missing packaged runtime assets. T-072 verification supports main integration; final release operations still require exact eligible main source/complete notes/tag agreement, clean rebuilt four ZIPs plus INSTALL/SHA256SUMS, provider publication/latest/body readback and comparison of every hosted download. Consult the final GitHub release for the completed publication outcome and its signed/store limitations.
