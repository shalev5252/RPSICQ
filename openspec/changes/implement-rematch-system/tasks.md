# Tasks

## Phase 1: Server-Side Rematch Logic
- [x] Add `rematchRequests` field to `GameState` interface in shared
- [x] Implement `requestRematch(socketId)` method in `GameService`
- [x] Implement `resetGameForRematch(sessionId)` method to clear board/pieces/setup state
- [x] Update `REQUEST_REMATCH` socket handler to track requests
- [x] Emit `REMATCH_REQUESTED` to opponent when one player requests
- [x] Emit `REMATCH_ACCEPTED` and reset game when both players agree

## Phase 2: Client-Side UI
- [x] Add "Play Again" button to `GameOverScreen`
- [x] Track rematch request state in Zustand store
- [x] Show "Waiting for opponent..." state when player has requested
- [x] Show "Opponent wants to play again!" notification
- [x] Handle `REMATCH_REQUESTED` socket event
- [x] Handle `REMATCH_ACCEPTED` socket event → transition to SetupScreen
- [x] **Fix**: Ensure SetupScreen re-renders board when shuffle completes (use setupState.board from store)

## Phase 3: State Reset
- [x] Clear setupState in client store on rematch
- [x] Reset board to initial empty state
- [x] Clear all piece arrays
- [x] Reset setup flags (hasPlacedKingPit, hasShuffled, isReady)
- [x] Ensure phase transitions correctly: finished → setup

## Validation
- [x] Build passes: Client and Server
- [ ] Manual test: Complete game → both request rematch → return to setup → play again
