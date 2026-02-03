# Proposal: Add Special Game Modes

## Summary
Add two new special game modes to RPS Battle:
1. **Clear Day** - Standard game rules with fog of war disabled (all pieces revealed at game start)
2. **Onslaught** - A fast-paced elimination mode with no Kings/Pits, smaller boards, and equal piece distribution

## Motivation
- Provides gameplay variety beyond the standard modes
- Clear Day appeals to players who prefer pure strategy over hidden information
- Onslaught offers quick, action-focused matches with a different win condition

## Scope

### Clear Day Mode
- Combines with existing rule sets (Classic + Clear Day, RPSLS + Clear Day)
- Fog of war disabled: all pieces revealed when game phase transitions to 'playing'
- Setup phase remains private (opponents don't see placements until game starts)
- All other rules (King capture win condition, Pit behavior, movement) remain unchanged

### Onslaught Mode
- Also combines with existing rule sets (Classic + Onslaught, RPSLS + Onslaught)
- **No Kings or Pits** - only RPS (or RPSLS) combat pieces
- **Smaller boards** with equal piece distribution:
  - Classic Onslaught: 5 rows × 3 cols, 2 of each element (6 pieces/player, 12 total on 15 squares)
  - RPSLS Onslaught: 5 rows × 5 cols, 2 of each element (10 pieces/player, 20 total on 25 squares)
- **Win condition**: Game ends when only 2 pieces remain on the board
  - If different elements: winner is the player whose element beats the other
  - If same element: tie-breaker round (standard RPS/RPSLS choice) determines winner
- Setup phase: players place all their pieces freely in their designated rows (2 rows each)

### Matchmaking
- Each mode combination has its own matchmaking queue
- Currently implemented queue keys: `classic`, `rpsls`, `classic-clearday`, `rpsls-clearday`
- Future queue keys (when Onslaught is implemented): `classic-onslaught`, `rpsls-onslaught`
- AI opponent mode works with all special modes

## Out of Scope
- Combining Clear Day + Onslaught (could be future enhancement)
- New UI themes/visuals specific to modes
- Ranked/competitive mode separation

## Dependencies
- Existing game-modes spec (for rule variants)
- Existing matchmaking spec (for queue management)
- AI opponent system (must work with new modes)

## Risks
- Onslaught's 2-piece endgame logic is a new win condition system
- Queue fragmentation with 6 queues may increase wait times
