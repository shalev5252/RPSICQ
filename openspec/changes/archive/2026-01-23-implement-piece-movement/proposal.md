# Implement Piece Movement

## Summary
Implement the gameplay phase where players move pieces on the board, with visual feedback for valid moves and turn indication.

## Motivation
After the setup phase is complete, players need to be able to move their pieces during their turn. This is the core gameplay mechanic.

## Scope

### In Scope
- Piece selection via drag & drop
- Highlight valid movement cells when dragging a piece
- Dropping piece on valid cell ends turn
- Turn passes to opponent after valid move
- Clear visual indicator showing whose turn it is
- Allow re-selecting/swapping pieces if dropped on same cell

### Out of Scope
- Combat resolution (separate change)
- Turn timer (future enhancement)
- Victory detection (separate change)

## Design Decisions
1. **Movement validation on server**: All move validation happens server-side to prevent cheating
2. **Optimistic UI**: Client shows immediate feedback while waiting for server confirmation
3. **Turn indicator**: Clear banner/highlight showing current player's turn

## Spec Deltas
- `specs/piece-movement/spec.md` - New spec for movement logic and validation rules

## Dependencies
- `board-setup` spec (completed)
- `socket-connection` spec (completed)

## Code References
- `client/src/components/game/GameScreen.tsx` - Component handling piece drag-and-drop and move UI
- `server/src/services/GameService.ts:getValidMoves` - Server-side move validation
- `server/src/services/GameService.ts:makeMove` - Move execution logic
- `server/src/socket/handlers.ts:MAKE_MOVE` - Socket handler for move requests
