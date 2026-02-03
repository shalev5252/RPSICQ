# Design: Add Special Game Modes

## Architecture Overview

This change introduces a **variant system** that layers on top of the existing `GameMode` (classic/rpsls). The design separates:
- **Rule Set** (`classic` | `rpsls`) - Determines which elements are in play
- **Variant** (`standard` | `clearday` | `onslaught`) - Determines special rules

## Data Model Changes

### Types (shared/src/types.ts)

```typescript
// New variant type
export type GameVariant = 'standard' | 'clearday' | 'onslaught';

// Compound mode key for queues and configuration
export type GameModeKey =
  | 'classic'
  | 'rpsls'
  | 'classic-clearday'
  | 'rpsls-clearday'
  | 'classic-onslaught'
  | 'rpsls-onslaught';

// Updated GameState
interface GameState {
  // existing fields...
  gameMode: GameMode;        // 'classic' | 'rpsls'
  gameVariant: GameVariant;  // 'standard' | 'clearday' | 'onslaught'
  // ...
}
```

### Constants (shared/src/constants.ts)

```typescript
export const BOARD_CONFIG = {
  classic: { /* existing */ },
  rpsls: { /* existing */ },
  'classic-onslaught': {
    rows: 5,
    cols: 3,
    pieces: { rock: 2, paper: 2, scissors: 2, lizard: 0, spock: 0, king: 0, pit: 0 }
  },
  'rpsls-onslaught': {
    rows: 5,
    cols: 5,
    pieces: { rock: 2, paper: 2, scissors: 2, lizard: 2, spock: 2, king: 0, pit: 0 }
  }
};

// Onslaught win condition: 2 pieces left
export const ONSLAUGHT_END_PIECE_COUNT = 2;
```

## System Flow Changes

### 1. Clear Day Mode - Visibility Logic

**Location**: `GameService.getPlayerView()` and piece reveal logic

**Current behavior**: Pieces have `isRevealed: false` initially, set to `true` after combat win.

**Clear Day behavior**: When `gameVariant === 'clearday'` and phase transitions from `setup` to `playing`, mark ALL opponent pieces as `isRevealed: true`.

```typescript
// In GameService.startGame() or when phase becomes 'playing'
if (session.gameVariant === 'clearday') {
  // Reveal all pieces on the board
  for (const row of session.board) {
    for (const cell of row) {
      if (cell.piece) {
        cell.piece.isRevealed = true;
      }
    }
  }
}
```

### 2. Onslaught Mode - Win Condition

**Location**: `GameService.makeMove()` after combat resolution

**New logic**: After each piece is eliminated, check total remaining pieces:

```typescript
// Count remaining pieces
const remainingPieces = session.board.flat()
  .filter(cell => cell.piece !== null)
  .map(cell => cell.piece!);

if (remainingPieces.length <= ONSLAUGHT_END_PIECE_COUNT) {
  // Determine winner based on remaining pieces
  this.resolveOnslaughtEndgame(session, remainingPieces);
}
```

**Endgame resolution**:
1. If 2 pieces remain:
   - Different elements → determine winner by RPS rules
   - Same element → trigger tie-breaker UI (similar to combat tie)
2. If 1 piece remains (edge case) → owner of that piece wins
3. If 0 pieces remain (mutual destruction) → draw

### 3. Onslaught Setup Phase

**Changes**:
- No King/Pit placement step (skip `place_king_pit` event handling)
- All pieces are RPS elements, placed via shuffle or manual placement
- Setup rows: 2 rows per player (existing logic works, but fewer cells to fill)

### 4. Matchmaking Queue Expansion

**Location**: `MatchmakingService`

**Changes**:
```typescript
// Expand queues map initialization
constructor() {
  const modeKeys: GameModeKey[] = [
    'classic', 'rpsls',
    'classic-clearday', 'rpsls-clearday',
    'classic-onslaught', 'rpsls-onslaught'
  ];
  for (const key of modeKeys) {
    this.queues.set(key, []);
  }
}
```

**Socket payload changes**:
```typescript
interface JoinQueuePayload {
  playerId: string;
  gameMode: GameMode;      // 'classic' | 'rpsls'
  gameVariant: GameVariant; // 'standard' | 'clearday' | 'onslaught'
}
```

### 5. AI Opponent Support

**Considerations**:
- Clear Day: AI benefits from perfect information (no inference needed)
- Onslaught: AI must adapt evaluation to new win condition

**Minimal changes**:
- For Clear Day: AI already sees all pieces; no change needed
- For Onslaught:
  - Disable king-capture priority (no king exists)
  - Add piece count awareness to evaluation
  - Endgame tie-breaker: random choice (same as human)

## UI Flow

### Mode Selection Screen (SetupScreen.tsx)

```
┌─────────────────────────────────────────┐
│         Select Game Mode                │
├─────────────────────────────────────────┤
│  Rule Set:    [Classic] [RPSLS]         │
│                                         │
│  Variant:     [Standard] [Clear Day]    │
│               [Onslaught]               │
│                                         │
│           [Find Match]                  │
│           [Play vs AI]                  │
└─────────────────────────────────────────┘
```

### Visual Indicators

- Clear Day: Show sun/eye icon on game board to indicate no fog of war
- Onslaught: Show crossed-out crown icon to indicate no King

## Migration & Compatibility

- Existing `gameMode` field preserved for backward compatibility
- New `gameVariant` defaults to `'standard'` if not provided
- Old clients sending only `gameMode` will be matched in standard variant queues
