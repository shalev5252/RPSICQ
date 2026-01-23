# Tasks

## Phase 1: Server-Side Rematch Logic
- [x] Add `rematchRequests` field to `GameState` interface in shared (`shared/src/types.ts:GameState.rematchRequests`)
- [x] Implement `requestRematch(socketId)` method in `GameService` (`server/src/services/GameService.ts:requestRematch`)
- [x] Implement `resetGameForRematch(sessionId)` method to clear board/pieces/setup state (`server/src/services/GameService.ts:resetGameForRematch`)
- [x] Update `REQUEST_REMATCH` socket handler to track requests (`server/src/socket/handlers.ts:REQUEST_REMATCH`)
- [x] Emit `REMATCH_REQUESTED` to opponent when one player requests (`server/src/services/GameService.ts:requestRematch` -> emit site)
- [x] Emit `REMATCH_ACCEPTED` and reset game when both players agree (`server/src/socket/handlers.ts:REQUEST_REMATCH` -> bothRequested branch)

## Phase 2: Client-Side UI
- [x] Add "Play Again" button to `GameOverScreen` (`client/src/components/game/GameOverScreen.tsx:handlePlayAgain`)
- [x] Track rematch request state in Zustand store (`client/src/store/gameStore.ts:rematchState`)
- [x] Show "Waiting for opponent..." state when player has requested (`client/src/components/game/GameOverScreen.tsx:getRematchButtonText`)
- [x] Show "Opponent wants to play again!" notification (`client/src/components/game/GameOverScreen.tsx:rematchState.opponentRequested`)
- [x] Handle `REMATCH_REQUESTED` socket event (`client/src/hooks/useSocket.ts:onRematchRequested`)
- [x] Handle `REMATCH_ACCEPTED` socket event → transition to SetupScreen (`client/src/hooks/useSocket.ts:onRematchAccepted`)
- [x] **Fix**: Ensure SetupScreen re-renders board when shuffle completes (use setupState.board from store)

## Phase 3: State Reset
- [x] Clear setupState in client store on rematch (`client/src/store/gameStore.ts:resetForRematch`)
- [x] Reset board to initial empty state (`server/src/services/GameService.ts:resetGameForRematch`)
- [x] Clear all piece arrays (`server/src/services/GameService.ts:resetGameForRematch` -> pieces = [])
- [x] Reset setup flags (hasPlacedKingPit, hasShuffled, isReady) (`server/src/services/GameService.ts:resetGameForRematch` -> setupStates.set)
- [x] Ensure phase transitions correctly: finished → setup (`client/src/hooks/useSocket.ts:onRematchAccepted` -> resetForRematch, `server/src/services/GameService.ts:resetGameForRematch` -> session.phase = 'setup')

## Validation
- [x] Build passes: Client and Server
- [ ] **Follow-up**: Manual test pending - Complete game → both request rematch → return to setup → play again
