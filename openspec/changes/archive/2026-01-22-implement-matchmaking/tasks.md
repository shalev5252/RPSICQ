# Matchmaking Implementation Tasks

<!-- VALIDATION: START -->
- [x] Run `npm run test` to ensure no regressions in existing logic.
- [x] Run `openspec validate implement-matchmaking --strict` to ensure spec compliance.
<!-- VALIDATION: END -->

## Shared Requirements
1. [x] Define `GameStartPayload` in `@rps/shared` if missing. (Existing `GameFoundPayload` covers the spec intent, `GameStartPayload` is reserved for gameplay phase)
2. [x] Define `PlayerRole` type ('red' | 'blue').

## Backend Implementation
3. [x] Create `server/src/services/MatchmakingService.ts` class.
    1. [x] Implement `addToQueue(socketId)`.
    2. [x] Implement `removeFromQueue(socketId)`.
    3. [x] Implement `tryMatch()`.
4. [x] Integrate service into `server/src/socket/handlers.ts`.
    1. [x] Handle `JOIN_QUEUE` event.
    2. [x] Handle `LEAVE_QUEUE` event.
    3. [x] Handle `disconnect` (remove from queue).
5. [x] Implement `GameSession` creation and storage (simple in-memory Map for now).
6. [x] Emit `GAME_START` event when match is found.

## Frontend Implementation
7. [x] Create/Update `useMatchmaking` hook in `client/src/hooks/`.
8. [x] Create `MatchmakingScreen` or "Find Game" button component.
9. [x] Handle `GAME_START` event in `client/src/store/gameStore.ts` (or relevant store) to switch view to Game Board.
    - (Implemented in `useMatchmaking` which updates the store)
10. [x] Add "Cancel Search" button functionality.

## Verification
11. [x] Manual Test: Open two browser tabs, click "Find Game" in both. Verify both enter game state with different roles.
12. [x] Manual Test: Connect 3 players. Ensure first two match, third stays in queue.
13. [x] Manual Test: Join queue, then disconnect. Ensure server doesn't crash or try to match matched player.
