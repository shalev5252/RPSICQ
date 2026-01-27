# Board Setup Specification

## MODIFIED Requirements

### Requirement: Board Display
The system SHALL display a game board appropriately sized for the game mode (6x7 for Classic, 6x6 for RPSLS) when two players enter the setup phase, with each player seeing their designated rows at the bottom of the screen.

#### Scenario: Red player sees their rows at bottom
- **GIVEN** a red player has entered the setup phase
- **WHEN** the board is rendered
- **THEN** rows 0 and 1 appear at the bottom of the board display
- **AND** rows 4 and 5 appear at the top of the board display

#### Scenario: Blue player sees their rows at bottom
- **GIVEN** a blue player has entered the setup phase
- **WHEN** the board is rendered
- **THEN** rows 4 and 5 appear at the bottom of the board display (visually flipped)
- **AND** rows 0 and 1 appear at the top of the board display

### Requirement: Shuffle RPS Pieces
Players MUST use a shuffle button to randomly distribute their pieces (Rock, Paper, Scissors, and optional others) in the remaining empty cells of their designated rows, based on the specific counts for the active game mode.

#### Scenario: Shuffle button enabled after King and Pit placed
- **GIVEN** a player has placed both their King and Pit
- **WHEN** the setup screen is displayed
- **THEN** the shuffle button is enabled

#### Scenario: Shuffle button disabled before King and Pit placed
- **GIVEN** a player has not yet placed both King and Pit
- **WHEN** the setup screen is displayed
- **THEN** the shuffle button is disabled

#### Scenario: Player shuffles pieces in Classic Mode
- **GIVEN** the game mode is "Classic"
- **AND** a player has placed their King and Pit
- **WHEN** the player taps the shuffle button
- **THEN** the server randomly distributes 4 Rock, 4 Paper, and 4 Scissors pieces into the remaining 12 empty cells
- **AND** the King and Pit remain in their placed positions

#### Scenario: Player shuffles pieces in RPSLS Mode
- **GIVEN** the game mode is "RPSLS"
- **AND** a player has placed their King and Pit
- **WHEN** the player taps the shuffle button
- **THEN** the server randomly distributes 2 Rock, 2 Paper, 2 Scissors, 2 Lizard, and 2 Spock pieces into the remaining 10 empty cells
- **AND** the King and Pit remain in their placed positions

#### Scenario: Player reshuffles pieces
- **GIVEN** a player has already shuffled their RPS pieces
- **WHEN** the player taps the shuffle button again
- **THEN** the server re-randomizes only the pawn piece positions
- **AND** the King and Pit remain in their placed positions
