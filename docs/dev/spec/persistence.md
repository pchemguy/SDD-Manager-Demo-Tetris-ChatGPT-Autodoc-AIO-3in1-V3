# Settings, leaderboard and file contracts

## R5 Settings and selected/effective values

The six canonical keys and defaults are:

| Key | Values / exact serialized strings | Default |
| --- | --- | --- |
| ghost | `hide`, `dynamic`, `show` | `show` |
| hardDrop | boolean / `true`, `false` | `true` |
| nextPreview | boolean / `true`, `false` | `true` |
| hardDropLock | `general`, `immediate` | `general` |
| lockPolicy | `failed`, `interval` | `interval` |
| hold | boolean / `true`, `false` | `true` |

Exactly these six keys form Settings. Session-only settings initialize defaults on each page load and write no cookies, URL, localStorage or extension persistent storage. Game restart retains them. Feature controls appear only when their corresponding capability is delivered; unavailable actions remain unavailable regardless of a stored default.

An accepted valid setting edit changes the selected value; visibility/action enablement affects the current view/next action immediately. Lock policies are captured for each new piece, so the current piece keeps its deadline and a small settings hint identifies pending next-piece policies. Disabling hold does not discard the held kind. Restored settings follow the same activation rules. Invalid typed patches reject the entire patch, without coercion or partial changes.

## R6 Browser and desktop persistence

Use query names `ghost`, `hardDrop`, `nextPreview`, `hardDropLock`, `lockPolicy`, `hold`; corresponding cookies are `tetris.<key>`. Cookie values are percent-encoded canonical strings, scoped to path `/`, SameSite=Lax, one-year Max-Age and Secure for secure origins. Preserve unrelated cookies, URL parameters and fragments.

Resolve independently per key: a valid explicit query value, else a valid saved cookie, else default. An empty, unknown, wrongly cased or whitespace-padded value is invalid. Duplicate occurrences of a known query key are invalid as a group. Ignore an invalid query for resolution, emit a non-blocking warning and fall through; invalid cookies are ignored. An omitted/invalid query must not replace an existing valid cookie with a default. Persist each valid explicit query value, even a default; do not rewrite unrelated setting cookies at startup. Unknown URL keys are ignored.

On user edit, persist the changed settings and replace the corresponding query keys with exactly one canonical value using history replacement. On Restore, write all six selected settings to both stores. Do not navigate/reload the game. Electron uses these same contracts on its standard secure local origin and persistent session; it needs no listening web server.

The adapter owns a handled-error transaction: capture previous cookie representations and URL, apply/verify requested writes, and compensate back to those previous values on an error before reporting persistence-failed. Do not swap live selected settings/results until adapter success. A validation failure performs no persistence operation at all. Browser crash atomicity and changes made concurrently by external software are outside this transaction guarantee. When persistence is unavailable, report the problem; gameplay remains usable with its last successful selected settings. A failed edit/restore does not pretend persistence succeeded. A failed startup cookie synchronization leaves the resolved values usable for that page and visibly reports non-persistence.

For extensions, query input is empty and saved settings come from one versioned storage.local object. Edits/restores validate a complete next object and replace it with one acknowledged storage write. No host-page URL or cookies are changed; files retain the same six selected values. Never persist scores or a game checkpoint in storage.local.

## R7 Completed-game leaderboard

Each game-over event inserts one result using the run's stable ID, final score and UTC completion time, after checking that run ID has not already been recorded by the live controller. Pause/resume, repeated rendering and duplicate game-over events do not insert again. Restarting a running/paused game abandons that run without a result. Idle does not count. Keep at most ten results sorted by score descending, timestamp instant ascending, then case-sensitive ID code-unit order. An empty leaderboard displays an empty state.

Score is an integer in [0, 9007199254740991]. IDs and timestamp representations follow MODELS exactly; generate current timestamps from the UTC clock port and preserve restored strings. A page reload ends browser/desktop leaderboard history. Extension window-session checkpoints preserve it across panel reopen, while browser restart/window close ends that window session. Configuration persistence never makes scores persistent. A successful Restore replaces, rather than merges, session results and preserves each restored ID/score/timestamp.

## R8 Portable JSON format and validation

JSON is UTF-8 (one UTF-8 BOM permitted) and has exactly `formatVersion`, `results`, `settings`. Version is the integer 1; results is an array of zero through ten complete ScoreResults with unique IDs; settings has exactly the six correctly typed keys above. Additional root/result/setting properties, duplicate JSON property names, non-finite numbers, numeric strings, nulls, missing values and unsupported versions are rejected. Accept valid unsorted results and rank them after full validation without rewriting IDs or timestamp strings.

Provide a JSON Schema draft 2020-12 asset specifying required fields, additionalProperties=false, all value domains, limits and timestamp/ID syntax. Runtime validation uses that schema plus explicit semantic checks for real calendar dates, UTC timestamps, ID uniqueness and safe integers; format annotations alone are insufficient. Generated/standalone validator code avoids runtime eval in extension CSP. All content is validated, including rows outside any eventual top-ten truncation; imports above ten are rejected, not silently truncated.

## R8 SQLite format and validation

SQLite files use `PRAGMA user_version = 1` and `PRAGMA application_id = 1413829714` (hex `54455452`, TETR). Their application tables are:

```sql
CREATE TABLE high_scores (
    id TEXT PRIMARY KEY NOT NULL,
    score INTEGER NOT NULL,
    timestamp TEXT NOT NULL
);
CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
);
```

Each of the six setting keys has exactly one row, with canonical string values from the settings table. Results have the same maximum count, ID uniqueness, safe integer score and calendar/UTC timestamp semantics as JSON. Check storage types (`typeof`), table/column/key structure, full row data and version metadata, rather than trusting declared SQLite affinity. Extra application tables, views, triggers, unexpected indexes other than implicit primary-key indexes, missing/duplicate/unknown settings and incompatible metadata are rejected. SQLite internal bookkeeping is not an application table. Run integrity checking before reading candidates and restrict import to read operations in an isolated in-memory database; never execute imported SQL text or attach a file.

The bundled sql.js runtime and matching .wasm file are initialized with local asset resolution. Use no CDN, remote extension code or host-installed SQLite. Close every statement/database on success and failure. The same validated PortableSnapshot is supplied to both encoders and produced by both decoders.

## R8 File operations and failure boundaries

Save reads one coherent selected-settings/results snapshot and offers JSON or SQLite, downloading `tetris-save.json` or `tetris-save.sqlite`. It excludes current gameplay, panel state and internal session metadata. Save fails clearly without downloading a partly generated file. A successful download request does not claim an OS write beyond the browser/host acknowledgement.

Restore accepts a file picker selection, identifies SQLite by its header or parses JSON bytes, and rejects input above 4 MiB before decoding. Unsupported or empty formats report unsupported-format; malformed/inconsistent content reports invalid-data. Use a bounded codec operation (10 seconds), terminate/dispose owned codec work on timeout and keep the UI responsive; runtime initialization failure reports runtime-unavailable. Cancellation makes no change. Decode, schema/semantic validation and persistence preparation complete before committing live results/settings. On every rejected file or reported commit failure, preserve previous results/settings/cookies/URL, apart from the visible error message. An external storage failure that also prevents compensating rollback must be reported as such, without claiming rollback passed.

Serialize Restore/setting edits/Save through the controller operation queue. Pause gameplay during file interaction and retain remaining timers; require explicit resume afterward. Multiple queued restores cannot interleave their effects. Closing/disposal or an invalid session generation prevents a late decode from committing. Manual restore never imports an active run.

## Acceptance groups

Exercise mixed per-key sources, valid explicit defaults, omitted keys, invalid/duplicate query keys, corrupt cookies, each setting edit and unrelated URL preservation. Confirm no writes in session-only delivery. Verify empty/tied/truncated leaderboards, repeated completion events and abandoned restarts. For both file formats check valid/empty round trips, every missing/extra/invalid field, unsafe scores, duplicate IDs, impossible calendar dates, wrong version, corrupt SQLite/header/schema/types, oversize, timeout and cancellation. Snapshot live results/settings and persistence before each rejected Restore and compare after it. Exercise persistence-failure compensation with an adapter double, plus successful real-origin cookie/history and extension-storage paths where facilities permit.
