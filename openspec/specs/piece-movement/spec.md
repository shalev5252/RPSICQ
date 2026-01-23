# piece-movement Specification

## Purpose
TBD - created by archiving change implement-piece-movement. Update Purpose after archive.
## Requirements
### Requirement: Valid Move Calculation
The server MUST calculate valid moves for a piece based on movement rules.

#### Scenario: Rock/Paper/Scissors piece movement
**Given** a Rock, Paper, or Scissors piece at position (row, col)
**When** calculating valid moves
**Then** return cells in 4 directions (up, down, left, right) that are:
  - Within board boundaries (0-5 rows, 0-6 cols)
  - Empty OR contain an enemy piece
  - Do NOT contain a friendly piece

#### Scenario: King and Pit cannot move
**Given** a King or Pit piece
**When** calculating valid moves
**Then** return an empty list (these pieces cannot move)

---

### Requirement: Move Execution
The server MUST execute a valid move and update game state.

#### Scenario: Move to empty cell
**Given** it is player's turn and they select their piece
**When** moving to a valid empty cell
**Then** the piece moves to the new position, turn switches to opponent

#### Scenario: Invalid move rejected
**Given** it is player's turn
**When** attempting to move to an invalid cell
**Then** return an error and do not change game state

#### Scenario: Move out of turn rejected
**Given** it is NOT player's turn
**When** attempting to move a piece
**Then** return an error and do not change game state

---

### Requirement: Turn Indication
The client MUST clearly indicate whose turn it is.

#### Scenario: Current player sees turn indicator
**Given** the game is in playing phase
**When** viewing the game screen
**Then** display a clear indicator showing "Your Turn" or "Opponent's Turn"

---

### Requirement: Valid Move Highlighting
The client MUST highlight valid cells when dragging a piece.

#### Scenario: Dragging own piece during turn
**Given** it is player's turn
**When** dragging their own piece
**Then** highlight all valid destination cells

#### Scenario: Cannot drag opponent's piece
**Given** any game state
**When** attempting to drag opponent's piece
**Then** the piece should not be draggable

---

### Requirement: Piece Re-selection
Players MUST be able to cancel a move by dropping on the same cell.

#### Scenario: Drop on same cell
**Given** player is dragging a piece
**When** dropping on the same cell the piece started from
**Then** the move is cancelled and player can select another piece

