## Context
The board setup phase occurs after matchmaking and before gameplay. Two players have been matched and assigned colors (red/blue). Each player must place their King and Pit pieces via drag & drop, then shuffle their RPS pieces. The game starts only when both players confirm.

**Constraints:**
- Red player setup rows: 0, 1 (appears as bottom rows in their view)
- Blue player setup rows: 4, 5 (appears as bottom rows in their view)
- Each player places exactly 14 pieces (1 King, 1 Pit, 4 Rock, 4 Paper, 4 Scissors)
- Players cannot see opponent piece types (fog of war)

## Goals / Non-Goals
**Goals:**
- Players can drag & drop King and Pit to any cell in their two rows
- Shuffle button randomizes RPS pieces in remaining empty cells
- Each shuffle tap re-randomizes (only RPS pieces, King/Pit stay fixed)
- "Let's Start" button confirms readiness
- Game waits for both players before starting
- Board renders from each player's perspective (their rows at bottom)

**Non-Goals:**
- Manual placement of RPS pieces (shuffle only)
- Timer during setup phase (may be added later)
- Undo/reset placement

## Decisions

### Board Rendering Perspective
**Decision:** Transform board coordinates client-side so each player sees their rows at the bottom.
- Red sees rows 0-1 at bottom (no transform needed)
- Blue sees rows 4-5 at bottom (reverse row order in rendering)

**Alternative:** Server sends different board views per player - rejected for simplicity, single source of truth.

### Piece Placement Flow
**Decision:**
1. Player drags King from "piece tray" to a cell in their rows
2. Player drags Pit from "piece tray" to a cell in their rows
3. Shuffle button becomes enabled
4. Player can tap shuffle multiple times to re-randomize RPS pieces
5. "Let's Start" button confirms

**State on server:**
- Store piece positions per player
- Track `hasPlacedKingPit` and `isReady` flags per player

### Shuffle Implementation
**Decision:** Server-side shuffle for fairness and to prevent cheating.
- Client sends `RANDOMIZE_PIECES` event
- Server shuffles RPS pieces into empty cells in player's rows
- Server emits updated game state back to player

## Risks / Trade-offs
- **Risk:** Drag & drop library complexity
  - Mitigation: Use React DnD (already in tech stack)
- **Risk:** Race condition if both players confirm simultaneously
  - Mitigation: Server checks both `isReady` flags atomically before transitioning phase

## Open Questions
None - requirements clarified with user.
