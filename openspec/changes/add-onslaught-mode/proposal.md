# Proposal: Add Onslaught Mode

## Summary
Add "Onslaught" game variant, a fast-paced elimination mode with no Kings/Pits, smaller boards, visible pieces (no fog of war), and specific win conditions based on total pieces remaining.

## Motivation
Players want a quicker, more aggressive game mode that focuses on pure element matchup strategy without the hidden information or King-protection aspects of the standard game.

## Solution

### Game Rules
- **Variant Name**: `onslaught`
- **Visibility**: All pieces are revealed at game start (No Fog of War).
- **Setup**: 
  - Players do NOT manually place pieces.
  - Pieces are automatically shuffled and placed on the board by the server.
  - Setup area is 2 rows per player (same as standard).
- **Turn Timer**: No turn timer (infinite time).
- **Movement**: Standard movement rules (1 tile orthogonal).

### Board Configuration
Board dimensions and piece counts are adjusted per game mode:

1. **Classic Onslaught** (`classic` + `onslaught`)
   - **Board Size**: 6 Rows x 3 Columns.
   - **Pieces per Player**: 6 total (2 Rock, 2 Paper, 2 Scissors).
   - **No King, No Pit**.
   - **Columns**: 1 column per element type (3 distinct elements = 3 columns).

2. **RPSLS Onslaught** (`rpsls` + `onslaught`)
   - **Board Size**: 6 Rows x 5 Columns.
   - **Pieces per Player**: 10 total (2 of each: Rock, Paper, Scissors, Lizard, Spock).
   - **No King, No Pit**.
   - **Columns**: 1 column per element type (5 distinct elements = 5 columns).

### Win Conditions
The game ends when **either**:
1. **Elimination**: Only one player has pieces remaining on the board.
2. **Showdown**: Exactly 2 pieces total remain on the board (one for each player).
   - **Stronger Element**: If elements are different, the piece that beats the other wins the game immediately.
   - **Tie (Same Element)**: If elements are the same, a "Tie Breaker Round" occurs. The winner of this tie breaker wins the entire game.

## Implementation Details

### Shared
- Update `GameVariant` to include `'onslaught'`.
- Update `BOARD_CONFIG` or add `ONSLAUGHT_CONFIG` to support variable board sizes.

### Server
- **MatchmakingService**: Add queues `classic-onslaught`, `rpsls-onslaught`.
- **GameService**: 
  - Handle Onslaught board initialization (custom rows/cols).
  - Implement auto-shuffle setup (bypass manual placement).
  - Implement full piece reveal (reuse Clear Day logic).
  - Implement new win condition checks after every move/combat.
  - Implement Showdown logic.

### Client
- **MatchmakingScreen**: Add "Onslaught" to variant selector.
- **GameScreen**:
  - Render dynamic board sizes correctly.
  - Display "Onslaught" indicator.
  - Handle Showdown UI if special messaging is needed.
  - Remove turn timer UI for this mode.

## Risks
- Dynamic board size might break assumptions in `Board.tsx` grid rendering if CSS expects fixed 7 columns.
- Auto-shuffle implementation needs to ensure valid placements (though random is fine).
- Showdown logic needs careful edge case handling (e.g., if somehow 2 pieces remain but both are same player? Should be covered by Elimination condition first).

## Alternatives
- Could reuse `classic` board (6x7) but leave columns empty? preferred solution is resizing board to fit tightly.

