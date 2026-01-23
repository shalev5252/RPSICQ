# Tasks for fix-gameplay-bugs

## Bug 1: Setup Phase Fog of War
- [x] 1.1 Modify `getPlayerSetupView` in GameService.ts to exclude opponent pieces entirely
- [x] 1.2 Verify client correctly handles empty opponent rows during setup
- [x] 1.3 Test: opponent pieces invisible during setup, visible after GAME_START

## Bug 2: Tie-Breaker Title Fix
- [x] 2.1 Reset `tieBreakerState.retryCount` to 0 when game phase changes to `tie_breaker`
- [x] 2.2 Update TieBreakerModal to show "It's a Tie!" on first appearance (retryCount === 0)
- [x] 2.3 Show "It's a tie again!" only when retryCount > 0 (after TIE_BREAKER_RETRY)
- [x] 2.4 Test: first tie shows correct title, subsequent ties show "again"

## Bug 3: Auto-Pass Turn for Immobile Players
- [x] 3.1 Add `hasMovablePieces(socketId)` method to GameService
- [x] 3.2 Add `TURN_SKIPPED` event to socket constants
- [x] 3.3 Add turn skip check in handlers.ts after each move
- [x] 3.4 Create TurnSkippedModal component with 2-second display
- [x] 3.5 Handle TURN_SKIPPED event in useSocket.ts
- [x] 3.6 Test: player with only King/Pit sees message and turn passes
