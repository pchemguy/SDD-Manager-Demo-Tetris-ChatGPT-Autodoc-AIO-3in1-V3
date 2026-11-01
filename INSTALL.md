# Install and play

## Browser application

Download `tetris-browser.zip` and `SHA256SUMS.txt` from the same release. Verify the ZIP SHA-256 against the checksum file, then extract it into an empty directory. Serve that directory over HTTP(S) using any static web server; for example, with Python installed:

```text
python -m http.server 8080 --directory PATH_TO_EXTRACTED_FOLDER
```

Open `http://localhost:8080`. A hosted static deployment needs no Python or Node.js on the player's computer. Direct `file:` opening is not supported. Runtime JavaScript and CSS are bundled locally; no CDN, backend or development server is needed.

Use Left/Right to move, Down to soft drop, Up/X to rotate clockwise and Z to rotate back. Space hard drops and C holds once per lock. Clearing exactly four rows earns one penetrator bonus (maximum three); P spends one to activate a white piece until lock. It can pass through occupied cells but locks only in a non-overlapping final pose. Hold is unavailable while penetrator is active. Escape pauses/resumes. Start/Restart starts a fresh game; Pause/Start pauses or resumes. Losing window focus pauses and clears held keys. This modern browser release uses seven-bag pieces, ordered wall kicks, next/held previews and an outlined ghost. Hard drop uses the ghost landing, awards actual-distance points and follows the full remaining gravity-interval grounding delay; repeating a zero-distance drop does not restart it. Selectable settings, files and other platforms are scheduled later.

Chromium headless shell and Playwright-managed Firefox were tested on Linux. Native Windows execution and browser sidebar installation are not claimed for this browser-only phase. This package is a deployable static application, not a signed installer or store package.

`BUILD-INFO.json` inside the ZIP identifies its version, source commit and whether candidate source changes were uncommitted. Published release packages must report `sourceDirty: false` and match the release tag's commit.
