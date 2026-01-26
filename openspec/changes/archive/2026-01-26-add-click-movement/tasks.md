# Tasks: Add Click-to-Move Feature

## Prerequisites
- Existing drag & drop movement working
- GameScreen.tsx and Cell.tsx components available

---

## Task 1: Add Selection State Management
**Files**: `client/src/components/game/GameScreen.tsx`

Add state for tracking selected piece, valid moves, and click timing for double-click detection.

**Acceptance**:
- [x] `selectedPieceId` state tracks which piece is selected
- [x] `validMoves` state holds array of valid positions
- [x] Click timing state for double-click detection
- [x] Selection cleared after move execution

---

## Task 2: Add Click Handler for Piece Selection
**Files**: `client/src/components/game/GameScreen.tsx`

Implement short-click detection that distinguishes from drag start. Show valid moves on piece selection.

**Acceptance**:
- [x] Short click (< 300ms) triggers selection
- [x] Long press initiates drag (existing behavior)
- [x] Click on selected piece clears selection
- [x] Click on different piece switches selection

---

## Task 3: Add Glowing Border CSS for Valid Move Cells
**Files**: `client/src/components/game/GameScreen.css`, `client/src/components/setup/Board.css` or `Cell.css`

Create CSS classes for selected piece and valid move highlighting with glowing animated border.

**Acceptance**:
- [x] `.cell--valid-move` class with green glowing border
- [x] Pulse animation on valid move cells
- [x] Styles don't conflict with existing drag highlighting

---

## Task 4: Implement Double-Click to Execute Move
**Files**: `client/src/components/game/GameScreen.tsx`

Add double-click detection on valid move cells to execute the move.

**Acceptance**:
- [x] Two clicks within 400ms triggers move
- [x] Move emitted via socket `MAKE_MOVE` event
- [x] Selection cleared after move
- [x] Single click on valid cell waits for second click

---

## Task 5: Wire Up Cell Click Events
**Files**: `client/src/components/setup/Cell.tsx`, `client/src/components/game/GameScreen.tsx`

Pass click handlers through Board to Cell components, add CSS classes based on selection state.

**Acceptance**:
- [x] Cells receive `onClick` prop
- [x] Cells apply `cell--valid-move` when in validMoves array
- [x] Click events propagate correctly

---

## Task 6: Manual Testing
**Verification steps**:
1. Start game with two browser windows
2. On your turn, short-click on a rock/paper/scissors piece
3. Verify valid destination cells glow with green border
4. Double-click a glowing cell → piece moves
5. Verify drag & drop still works (long press and drag)
6. Verify clicking selected piece again clears selection
7. Verify clicking off-board or invalid cell clears selection
