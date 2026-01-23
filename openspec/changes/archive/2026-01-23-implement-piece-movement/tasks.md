# Tasks

## Phase 1: Server-Side Movement Logic
- [x] Add `getValidMoves(pieceId)` method to `GameService` that returns valid target cells
- [x] Add `makeMove(socketId, pieceId, targetPosition)` method to `GameService`
- [x] Validate move is in player's turn, piece belongs to player, target is valid
- [x] Update board state and switch turn on successful move
- [x] Add socket handler for `MAKE_MOVE` event

## Phase 2: Client Game Screen
- [x] Create `GameScreen` component to display during `playing` phase
- [x] Add turn indicator showing whose turn it is
- [x] Route to `GameScreen` when game phase is `playing`

## Phase 3: Piece Drag & Drop During Game
- [x] Enable drag on own pieces only during player's turn
- [x] On drag start: emit event to get valid moves, highlight valid cells
- [x] On drop on same cell: cancel move, allow re-selection
- [x] On drop on valid cell: emit `MAKE_MOVE`, end turn

## Phase 4: Turn Synchronization
- [x] Add `GAME_STATE` event handler to update client state after moves
- [x] Update Zustand store with new board state and current turn
- [x] Disable interaction when not player's turn

## Validation
- [x] Run `npm run build` in client and server
- [x] Manual test: both players can take turns moving pieces
