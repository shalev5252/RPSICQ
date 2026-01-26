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
The client MUST highlight valid cells when a piece is selected (via drag OR click).

#### Scenario: Dragging own piece during turn
**Given** it is player's turn
**When** dragging their own piece
**Then** highlight all valid destination cells

#### Scenario: Clicking own piece during turn
**Given** it is player's turn
**When** short-clicking their own movable piece
**Then** highlight all valid destination cells with a glowing border

#### Scenario: Cannot drag or click opponent's piece
**Given** any game state
**When** attempting to drag or click opponent's piece
**Then** the piece should not be selectable

---

### Requirement: Piece Re-selection
Players MUST be able to cancel a move by dropping on the same cell OR clicking the selected piece again.

#### Scenario: Drop on same cell
**Given** player is dragging a piece
**When** dropping on the same cell the piece started from
**Then** the move is cancelled and player can select another piece

#### Scenario: Click on selected piece
**Given** player has selected a piece via click
**When** clicking on the same piece again
**Then** the selection is cancelled and player can select another piece

### Requirement: Click-to-Select Piece
The client MUST allow players to select their own piece by clicking on it.

#### Scenario: Short click on own piece during turn
**Given** it is player's turn
**When** short-clicking (< 300ms) on their own movable piece
**Then** the piece becomes selected and valid destination cells are highlighted with a glowing border

#### Scenario: Click on already selected piece
**Given** a piece is currently selected
**When** clicking on the same piece again
**Then** the selection is cleared and no cells are highlighted

#### Scenario: Click on different own piece
**Given** a piece is currently selected
**When** clicking on a different own movable piece
**Then** the selection switches to the new piece and its valid moves are highlighted

---

### Requirement: Valid Move Cell Highlighting
The client MUST display a glowing border on valid destination cells when a piece is selected.

#### Scenario: Piece selected shows valid moves
**Given** a movable piece is selected via click
**When** viewing the game board
**Then** all valid destination cells display a glowing green border with pulse animation

#### Scenario: Invalid cells not highlighted
**Given** a piece is selected
**When** viewing cells that are out of bounds, contain friendly pieces, or blocked
**Then** those cells do NOT display any highlighting

---

### Requirement: Double-Click to Move
The client MUST execute a move when a valid destination cell is double-clicked.

#### Scenario: Double-click on valid cell
**Given** a piece is selected and valid moves are highlighted
**When** double-clicking (two clicks within 400ms) on a highlighted cell
**Then** the move is executed and the piece moves to that cell

#### Scenario: Single click on valid cell
**Given** a piece is selected and valid moves are highlighted  
**When** single-clicking on a highlighted cell (no second click within 400ms)
**Then** the move is NOT executed, awaiting potential double-click

---

### Requirement: Selection Cancellation
The client MUST clear selection when clicking on an invalid area.

#### Scenario: Click on invalid cell
**Given** a piece is selected
**When** clicking on a cell that is not a valid move destination and not own movable piece
**Then** the selection is cleared

---

