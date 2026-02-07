# Design: Onslaught Mode Architecture

## Data Structures

### Board Configuration
Currently `BOARD_CONFIG` is keyed by `GameMode` ('classic' | 'rpsls').
We will introduce `BOARD_CONFIG_VARIANT` or a nested structure to support variants.

Proposed structure:
```typescript
interface BoardLayout {
  rows: number;
  cols: number;
  pieces: Record<PieceType, number>;
}

// Default/Standard configs
const STANDARD_CONFIGS: Record<GameMode, BoardLayout> = { ... };

// Onslaught configs
const ONSLAUGHT_CONFIGS: Record<GameMode, BoardLayout> = {
  classic: { rows: 6, cols: 3, pieces: { ... } },
  rpsls: { rows: 6, cols: 5, pieces: { ... } }
};

// Helper to get config
function getBoardConfig(mode: GameMode, variant: GameVariant): BoardLayout {
  if (variant === 'onslaught') return ONSLAUGHT_CONFIGS[mode];
  return STANDARD_CONFIGS[mode];
}
```

## Win Condition Logic
`checkWinCondition` in `GameService` is currently checking for `king` capture.
It needs to become polymorphic or conditional based on `gameVariant`.

```typescript
checkWinCondition(session: GameState): ... {
  if (session.gameVariant === 'onslaught') {
    return this.checkOnslaughtWin(session);
  }
  return this.checkStandardWin(session);
}
```

### Onslaught Win Logic
1. Count pieces for Red and Blue.
2. If `redCount === 0` -> Blue Wins.
3. If `blueCount === 0` -> Red Wins.
4. If `redCount === 1 && blueCount === 1` -> Trigger Showdown.

### Showdown Logic
1. Get the type of the remaining RED piece and BLUE piece.
2. Determine winner using `COMBAT_OUTCOMES`.
3. If outcome is `win` -> Red wins game.
4. If outcome is `lose` -> Blue wins game.
5. If outcome is `tie` -> Trigger `tie_breaker` phase.
   - Note: This tie breaker needs to be treated as "Final Game Winning Tie Breaker".
   - Current tie breaker logic restarts combat. We can reuse this, but the Result of the combat must be Game Over, not just piece removal (since pieces are reused or removed, but here we just need a winner). 
   - Actually, standard tie breaker logic allows players to pick a new element. Then they fight again. This works perfectly. If they pick different elements, one wins -> Game Over. If they pick same -> Tie again.

## Client Rendering
`Board.tsx` renders a grid.
CSS: `.board-grid` uses `grid-template-columns: repeat(7, 1fr)`.
Logic:
```typescript
const cols = board[0].length;
const style = { gridTemplateColumns: `repeat(${cols}, 1fr)` };
```
We need to pass this dynamic style or class to the component.

## Setup
`GameService.createSession`:
- If Onslaught:
  - Generate pieces (randomized).
  - Place them on valid rows (0,1 for Red; 4,5 for Blue).
  - Set phase to `setup` (so users can see), but maybe auto-mark `isReady`? 
  - User proposal said "Auto shuffle". Usually means "I don't have to place them". 
  - Let's keep phase `setup` but pre-fill board randomly. User just clicks "Ready".
  - Skip "Place King/Pit" step. Confirm button enabled immediately.

# Security
- Ensure `joinQueue` validation accepts visible pieces if variant is Onslaught? (Actually matchmaking just adds to queue).
- Ensure `confirmSetup` validates piece counts match Onslaught rules.
