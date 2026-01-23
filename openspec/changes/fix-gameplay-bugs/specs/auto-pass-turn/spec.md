# auto-pass-turn Specification

## Purpose
Handle the edge case where a player has no movable pieces by automatically passing their turn.

## ADDED Requirements

### Requirement: Auto-Pass Turn Detection
The system SHALL detect when the current player has no movable pieces.

#### Scenario: Server detects no movable pieces
- **GIVEN** it is player A's turn
- **AND** player A's only remaining pieces are King and/or Pit
- **WHEN** the turn begins
- **THEN** the server determines player A cannot make a valid move

### Requirement: Turn Skip Notification
When a player cannot move, the system SHALL notify both players and pass the turn.

#### Scenario: Player with no moves sees notification
- **GIVEN** player A has no movable pieces
- **WHEN** it becomes player A's turn
- **THEN** player A sees "Can't move - passes turn to opponent" message
- **AND** the message displays for 2 seconds
- **AND** then the turn automatically passes to the opponent

#### Scenario: Opponent is notified of skipped turn
- **GIVEN** player A's turn is being skipped
- **WHEN** the skip occurs
- **THEN** player B is notified that player A's turn was skipped
- **AND** the turn indicator updates to show it's player B's turn

### Requirement: Draw Detection
If both players have only immovable pieces, the game SHALL end in a draw.

#### Scenario: Both players immobile results in draw
- **GIVEN** player A has only King and/or Pit remaining
- **AND** player B has only King and/or Pit remaining
- **WHEN** either player's turn would occur
- **THEN** the game ends with a draw result
- **AND** both players see the game over screen with Draw message
