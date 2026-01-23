# Implement Rematch System

## Goal
Allow players to request and accept a rematch after a game ends. When both players agree, reset the game state and return them to the setup phase to arrange their boards again while keeping the same session and player assignments.

## Why
After a game ends, players often want to play again immediately with the same opponent. Currently, they would need to disconnect and search for a new match. A rematch feature provides a seamless experience for players who want to continue playing together.

## What Changes

### Rematch Flow
- **Request**: After game ends, players can click a "Play Again" button
- **Notification**: When one player requests rematch, notify the opponent
- **Acceptance**: Both players must agree to rematch
- **Reset**: When both agree, reset the game to setup phase while keeping:
  - Same session ID
  - Same player assignments (Red/Blue)
  - Same socket connections
  
### State Management
- Track rematch requests in GameState
- Clear board and piece state
- Reset setup state flags (hasPlacedKingPit, hasShuffled, isReady)
- Transition phase from `finished` → `setup`

### UI Updates
- Add "Play Again" button to GameOverScreen
- Show waiting state when player has requested but opponent hasn't
- Show "Opponent wants to rematch" notification
- Transition to SetupScreen when both accept

## API / Data Model Changes

### GameState
```typescript
interface GameState {
  // ... existing fields
  rematchRequests?: {
    red: boolean;
    blue: boolean;
  };
}
```

### Socket Events (Already exists in constants)
- `REQUEST_REMATCH` (client → server)
- `REMATCH_REQUESTED` (server → client, notify opponent)
- `REMATCH_ACCEPTED` (server → both clients, game resets)
