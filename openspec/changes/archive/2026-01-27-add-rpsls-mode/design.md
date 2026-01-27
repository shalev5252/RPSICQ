# Design: RPSLS Game Mode

## Architecture

### 1. Game Mode Configuration
A new `GameMode` type will be introduced:
```typescript
type GameMode = 'classic' | 'rpsls';
```

All mode-dependent logic will branch based on this value:
- Board dimensions
- Allowed piece types
- Setup quantities
- Combat resolution matrix

### 2. Shared Constants
`shared/src/constants.ts` will be extended:
```typescript
export const BOARD_CONFIG = {
  classic: { rows: 6, cols: 7, pieces: { rock: 4, paper: 4, scissors: 4 } },
  rpsls: { rows: 6, cols: 6, pieces: { rock: 2, paper: 2, scissors: 2, lizard: 2, spock: 2 } }
};
```

### 3. Combat Matrix
Extended for RPSLS:
```typescript
const RPSLS_WINS: Record<string, string[]> = {
  rock: ['scissors', 'lizard'],
  paper: ['rock', 'spock'],
  scissors: ['paper', 'lizard'],
  lizard: ['spock', 'paper'],
  spock: ['scissors', 'rock']
};
```

### 4. Matchmaking
- `JOIN_QUEUE` event payload includes `gameMode`.
- Server maintains separate queues: `classicQueue`, `rpslsQueue`.

### 5. UI Components
- `ModeSelect` screen (new): Modal/buttons for mode selection.
- `Piece.tsx`: Add Lizard 🦎 and Spock 🖖 icons.
- `TieBreaker` modal: Add Lizard/Spock buttons (conditionally if RPSLS mode).

## Technical Considerations
- Mode is set *before* entering matchmaking.
- Mode is stored in session state and propagated to game state.
- Client and server must agree on mode before game starts.

## Verification
- Unit tests for extended combat matrix.
- E2E test: RPSLS match with Lizard/Spock combat.
