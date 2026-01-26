# Design: Click-to-Move Feature

## Overview
This design adds click-based piece selection and movement as an alternative to drag & drop, both methods coexisting.

## Interaction Model

### Short Click vs Long Press
- **Short click** (< 300ms): Enters selection mode, shows valid moves
- **Long press** (≥ 300ms): Initiates drag & drop (existing behavior)

### Selection State
When a piece is selected via short click:
1. The piece cell gets a "selected" visual indicator
2. All valid destination cells show a glowing border
3. Invalid cells remain unchanged

### Movement Execution
- **Double-click** (two clicks within 400ms) on a valid highlighted cell executes the move
- Single click on a valid cell could also work, but double-click prevents accidental moves

### Cancellation
- Click on own piece that is already selected → deselects
- Click on any invalid cell → deselects
- Click on a different own piece → switches selection to new piece

## UI Components

### Modified Components
- `GameScreen.tsx` - Add click handlers and selection state
- `Cell.tsx` (setup) / create `GameCell.tsx` - Add glowing border styles on valid cells

### New CSS Classes
```css
.cell--selected {
  /* Visual indicator for selected piece */
  box-shadow: 0 0 0 3px #ffd700, 0 0 15px #ffd700;
}

.cell--valid-move {
  /* Glowing border for valid destination cells */
  box-shadow: 0 0 0 3px #00ff88, 0 0 15px #00ff88;
  cursor: pointer;
  animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 3px #00ff88, 0 0 15px #00ff88; }
  50% { box-shadow: 0 0 0 4px #00ff88, 0 0 25px #00ff88; }
}
```

## State Management

### New State in GameScreen
```typescript
const [selectedPieceId, setSelectedPieceId] = useState<string | null>(null);
const [validMoves, setValidMoves] = useState<Position[]>([]);
const [lastClickTime, setLastClickTime] = useState<number>(0);
const [lastClickedCell, setLastClickedCell] = useState<Position | null>(null);
```

### Click Handler Logic
```typescript
const handleCellClick = (row: number, col: number) => {
  const now = Date.now();
  const cell = board[row][col];
  
  // Check for double-click on valid move cell
  if (lastClickedCell?.row === row && lastClickedCell?.col === col) {
    if (now - lastClickTime < 400 && isValidMove(row, col)) {
      executeMove(row, col);
      return;
    }
  }
  
  setLastClickTime(now);
  setLastClickedCell({ row, col });
  
  // Toggle selection or select new piece
  if (cell?.piece?.owner === myColor && isMovablePiece(cell.piece)) {
    if (selectedPieceId === cell.piece.id) {
      clearSelection();
    } else {
      selectPiece(cell.piece);
    }
  } else if (isValidMove(row, col)) {
    // Single click on valid - wait for double-click
  } else {
    clearSelection();
  }
};
```

## Backward Compatibility
- Drag & drop continues to work exactly as before
- Both methods can be used interchangeably within the same game
- No settings or toggles needed
