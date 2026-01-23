# Victory Conditions

## ADDED Requirements

### Requirement: King Capture
The game MUST end immediately when a King is attacked by any piece.

#### Scenario: Attack on King
- GIVEN a Red Rock moves to a cell occupied by the Blue King
- WHEN the move is processed
- THEN the Blue King is defeated
- AND the Red player is declared the Winner
- AND the game phase changes to `finished`

### Requirement: Game Over State
When the game ends, players MUST be informed of the result.

#### Scenario: Displaying results
- GIVEN the game has ended
- WHEN the client receives the `GAME_OVER` event
- THEN a victory/defeat screen is displayed
- AND players can return to the main menu
