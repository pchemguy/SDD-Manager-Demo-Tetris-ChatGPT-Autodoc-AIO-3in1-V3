# Playing Tetris

## Wide layout

At 1280 CSS pixels and above, panels appear in this order: session top ten, game information/controls, board, settings, controls/help. The board remains horizontally centered when optional panels are hidden; game information remains beside it. Its score, level, lines, status, next/held pieces and penetrator inventory describe the current game.

Use the three Hide/Show buttons above the gameplay row to change leaderboard, settings and help independently. Hidden settings include all six settings and manual file controls, and their controls leave keyboard/accessibility navigation. Showing a panel retains its state. These choices belong to the current presentation and do not become portable settings or change cookies/URL settings.

The bottom row has exactly two gameplay buttons: Start/Restart on the left and Pause/Start on the right. Left Start/Restart starts a fresh game; right Start resumes a paused game or begins a fresh game from idle/gameover. These buttons return keyboard focus to the board. Other gameplay actions use the keyboard.

## Keyboard

Focus the board for Left/Right movement, Down soft drop, Up/X clockwise rotation, Z counterclockwise rotation, Space hard drop, C hold and P penetrator. Escape pauses/resumes an existing game. Input/select/button controls keep their normal keyboard behavior; game keys there do not also move a piece. Enter invokes a focused button. Leaving the application pauses it and clears held keys.

Help describes selected/current lock policies: a current piece retains the policies captured when it spawned; newly selected policies apply at the next piece. Pause freezes its deadlines. Four cleared lines earn a penetrator bonus, up to three; hold is unavailable during an active penetrator.

## Settings and manual files

Settings contain Ghost, Hard drop, Next preview, Hard drop lock, Lock policy and Hold. Save format, Save and Restore are at their bottom. Choose JSON or SQLite for a manual snapshot of the session top ten and all six settings. Restore detects content rather than relying on the filename, validates the complete file and pauses play. It preserves the active game and captured piece policies; resume explicitly afterward. A failed file does not replace accepted live data. The selected Save format and panel visibility are not portable settings.

Completed games enter the session top ten once. Restart retains the list; a fresh page ends the session unless you restore an explicit snapshot. Configuration persistence does not automatically save game/results. See [installation](../INSTALL.md) for serving, file limits, download acknowledgments and handled persistence limitations.

## Current delivery boundary

The Phase 7 wide-layout increment is verified in Chromium and Firefox. Compact/sidebar resizing and the final accessibility review are the next Phase 7 milestone; native Windows/sidebar packaging follows later phases. This guide will be updated as those verified increments land.
