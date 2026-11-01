# Gameplay contracts

## R1 Board, pieces and baseline

Coordinates use x=0–9 from left and y=0–19 from top. Spawn origins center a piece at x=3 (O at x=4), y=-2. Shape matrices are I 4×4, O 2×2 and all others 3×3. Occupied spawn coordinates within each square are:

| Kind | Local occupied cells |
| --- | --- |
| I | (0,1), (1,1), (2,1), (3,1) |
| J | (0,0), (0,1), (1,1), (2,1) |
| L | (2,0), (0,1), (1,1), (2,1) |
| O | (0,0), (1,0), (0,1), (1,1) |
| S | (1,0), (2,0), (0,1), (1,1) |
| T | (1,0), (0,1), (1,1), (2,1) |
| Z | (0,0), (1,0), (1,1), (2,1) |

Clockwise rotation maps local (x,y) to (n-1-y,x); counterclockwise uses its inverse. O does not change pose. Baseline rotation tries its unchanged origin only. An ordinary piece cannot move through occupied cells or side/bottom boundaries; active cells above the top are permitted until locking. Failed spawn or a lock with any above-top cell causes game over without writing out-of-range/overlapping cells. A locked valid piece is inserted atomically, full rows are removed simultaneously and empty rows are inserted at the top.

Restart starts a fresh board, score=0, lines=0, level=1, empty hold, zero bonuses, a fresh run ID/seed and no lock timer. It keeps selected settings and the session leaderboard. Idle has no falling piece and advances no timers. Game over freezes the board and emits one gameOver event for the run.

Baseline sequence chooses independent kinds uniformly. Modern mode uses seven-bag: shuffle one of each kind before consuming the bag and generate the next bag when needed. The serializable nonzero xorshift32 generator is the only source of domain randomness; uniform bounded draws avoid modulo bias. The same seed/actions/time produce the same state/events. Preview reads the pending queue without consuming it.

## R1 Score, level and time

Score line clears with 100, 300, 500 or 800 points for one through four rows, multiplied by the level before the clear. Award 1 point per soft-drop row and 2 per hard-drop row, including traversed penetrator rows. No points are awarded for blocked moves, gravity or ignored actions. Level is `1 + floor(totalLines / 10)`. Gravity interval is `max(100, floor(1000 * 0.85 ** (level - 1)))` milliseconds.

Advance processes elapsed active time in event order; lock expiry precedes gravity at an equal timestamp. It can cross multiple events and pieces without losing elapsed time. UI scheduling does not use frame count as gravity. A newly spawned piece starts a full gravity interval; a lock or line clear never inherits the previous piece's partial gravity interval.

## R2 Movement, hold, kicks and hard drop

Left/right move one cell. Soft drop requests one downward step. Rotation directions are as above. With modern wall kicks, try offsets in this exact order: (0,0), (-1,0), (1,0), (-2,0), (2,0), (0,-1), (0,-2). Accept the first legal candidate or leave state unchanged. This is the project's wall-kick rule, not a claim of complete Guideline/SRS implementation. Penetrator candidates use traversal/reachability validation. O rotation remains a no-op.

Hold is allowed once between locks, if enabled and not penetrator-active. Holding an empty slot consumes the next queued kind; swapping a nonempty slot does not. The falling replacement has spawn pose, a captured current PiecePolicy and no penetrator flag. holdUsed remains true until a lock, preventing a second swap. A disabled slot retains its stored kind and displays its disabled status. A swap that cannot spawn ends the game normally.

Hard drop moves directly to the shared landing result and awards only actual downward distance. Repeated hard drop at the same pose awards no points and does not restart locking. When disabled or outside the modern capability it does nothing. With immediate hard-drop policy it locks synchronously, including a zero-distance hard drop. Otherwise it follows the piece's captured general locking policy.

## R3 Grounding and locking

For an ordinary piece, grounded means a one-row downward move cannot be placed. For a penetrator, grounded means it has reached its lowest valid landing under the current x/rotation. Starting or moving into a grounded pose starts a lock timer equal to the gravity interval at that grounding when interval policy is active. An existing grounded timer is preserved across legal sideways moves, rotations and delayed hard drop that remain grounded. A move that lifts the piece off its ground clears that timer; re-grounding starts a new full interval. No arbitrary reset count exists.

Under interval policy, a failed downward attempt does not lock early; only expiry locks. Under failed policy, the first failed downward attempt (soft drop, gravity or a general-policy hard drop's final failed-step attempt) locks. A general-policy hard drop therefore locks immediately under failed policy, while interval mode waits the full remaining grounded interval. Immediate hard-drop selection overrides either general mode.

Before dispatching an input, the controller advances time to that event's monotonic timestamp. An input arriving exactly at expiry cannot rescue an already due lock. Pause, visibility/focus loss and suspend freeze remaining gravity/lock duration and clear pressed input. Resume starts a new wall-clock reference without adding paused/closed elapsed time. Selected lock-policy edits affect the next spawned piece, including a held replacement; the current PiecePolicy remains unchanged.

## R4 Ghost visibility and penetrator

Landing for an ordinary piece is the last reachable valid pose before its first downward collision. Landing for a penetrator scans downward through occupied cells and selects the greatest y with all cells inside the board and no overlap. It may be above the geometric floor when lower poses overlap the stack. The same exact result supplies hard drop and ghost. A missing valid final pose yields null and disallows the penetrating transition/activation that would create it.

Activation requires a running normal piece, an available bonus and at least one valid final pose at/below its current origin. Spend exactly one bonus and set penetrator until lock; repeated activation is ignored. It cannot be cancelled, held or refunded. Movement and rotation may overlap settled cells, but must remain within side/bottom limits and have a valid final landing at/below the candidate origin. Gravity/soft drop traverse one row at a time toward that landing, including intermediate overlap. Locking writes only a fully in-board, non-overlapping pose; settled cells are never destroyed by traversal. Standard full-line removal after lock still removes complete rows.

Award one bonus for exactly four rows cleared by a lock, capped at three. This includes penetrator clears. Activation spends before any later earned bonus. Reset inventory on restart; keep it between pieces. Render active and locked penetrator cells white, ordinary I/J/L/O/S/T/Z cells respectively cyan/blue/orange/yellow/green/purple/red, and visible ghost as a translucent outlined projection of that kind (white for penetrator). White is never a regular-piece color. Overlapping active penetrator cells are drawn above settled cells without mutating them. Show one lightning symbol per unspent bonus, updated on both award and spend.

Ghost hidden mode draws none. Show mode draws any valid projected landing, including zero drop distance. Dynamic mode hides only if every ghost cell has y<10. A cell at y=10 or lower makes it visible; a straddling shape stays visible. The ghost itself never changes collision, scoring or lock timing.

## Gameplay boundary acceptance

Exercise spawn/top-out, all seven shapes, clockwise/counterclockwise reversal, kick candidate ordering and complete failure, hold empty/swap/second-use/disabled/penetrator cases, seven-bag boundaries and preview non-consumption. Check line compaction and level-transition score/interval values. Compare ghost/drop for ordinary and penetrator boards with multiple holes and an invalid bottom pose. Check bonus zero/cap/spend/re-earn and an attempted invalid penetrator transition. Verify midline y=9/y=10 and straddling cases. Exercise interval timing independently of the previous gravity tick, failed-policy attempts, zero-distance hard drop, lifting, pause and exact simultaneous deadlines.
