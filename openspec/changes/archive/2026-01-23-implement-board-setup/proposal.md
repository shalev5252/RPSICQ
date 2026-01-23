# Change: Implement Board Setup Phase

## Why
After two players are matched, they need to set up their pieces before gameplay can begin. This is a core game mechanic where players strategically place their King and Pit, then shuffle their remaining RPS pieces before confirming readiness.

## What Changes
- Add `SetupScreen` component that displays the 6x7 board with player's perspective (their rows at the bottom)
- Implement drag & drop for King and Pit placement on player's two closest rows
- Add shuffle button to randomly distribute Rock/Paper/Scissors pieces in player's rows
- Add "Let's Start" confirmation button
- Server-side logic to handle piece placement, shuffling, and ready state
- Both players must confirm before transitioning to playing phase
- Each player sees their own color pieces and the opponent's rows (empty or with hidden pieces)

## Impact
- Affected specs: New `board-setup` capability
- Affected code:
  - `client/src/components/` - New SetupScreen, Board, Cell, Piece components
  - `client/src/store/gameStore.ts` - Setup state management
  - `server/src/services/GameService.ts` - Piece placement and validation logic
  - `server/src/socket/handlers.ts` - Wire up setup event handlers
  - `shared/src/types.ts` - May need minor additions for setup-specific payloads
