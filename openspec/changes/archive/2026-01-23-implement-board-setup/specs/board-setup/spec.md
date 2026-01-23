## ADDED Requirements

### Requirement: Board Display
The system SHALL display a 6x7 game board when two players enter the setup phase, with each player seeing their designated rows at the bottom of the screen.

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

### Requirement: King and Pit Placement
Players MUST manually place their King and Pit pieces on their designated rows via drag and drop before they can shuffle their remaining pieces.

#### Scenario: Player drags King to valid cell
- **GIVEN** a player has not yet placed their King
- **AND** the player is in the setup phase
- **WHEN** the player drags the King piece to an empty cell in their designated rows
- **THEN** the King is placed in that cell
- **AND** the server stores the King's position

#### Scenario: Player drags Pit to valid cell
- **GIVEN** a player has not yet placed their Pit
- **AND** the player is in the setup phase
- **WHEN** the player drags the Pit piece to an empty cell in their designated rows
- **THEN** the Pit is placed in that cell
- **AND** the server stores the Pit's position

#### Scenario: Player attempts to place piece outside designated rows
- **GIVEN** a player is in the setup phase
- **WHEN** the player attempts to drag King or Pit to a cell outside their designated rows (rows 0-1 for red, rows 4-5 for blue)
- **THEN** the placement is rejected
- **AND** the piece returns to the piece tray

#### Scenario: Player attempts to place piece on occupied cell
- **GIVEN** a player has placed their King in a cell
- **WHEN** the player attempts to place their Pit in the same cell
- **THEN** the placement is rejected
- **AND** the Pit returns to the piece tray

### Requirement: Shuffle RPS Pieces
Players MUST use a shuffle button to randomly distribute their Rock, Paper, and Scissors pieces in the remaining empty cells of their designated rows.

#### Scenario: Shuffle button enabled after King and Pit placed
- **GIVEN** a player has placed both their King and Pit
- **WHEN** the setup screen is displayed
- **THEN** the shuffle button is enabled

#### Scenario: Shuffle button disabled before King and Pit placed
- **GIVEN** a player has not yet placed both King and Pit
- **WHEN** the setup screen is displayed
- **THEN** the shuffle button is disabled

#### Scenario: Player shuffles pieces
- **GIVEN** a player has placed their King and Pit
- **WHEN** the player taps the shuffle button
- **THEN** the server randomly distributes 4 Rock, 4 Paper, and 4 Scissors pieces into the remaining 12 empty cells in the player's designated rows
- **AND** the King and Pit remain in their placed positions
- **AND** the updated board state is sent to the player

#### Scenario: Player reshuffles pieces
- **GIVEN** a player has already shuffled their RPS pieces
- **WHEN** the player taps the shuffle button again
- **THEN** the server re-randomizes only the RPS piece positions
- **AND** the King and Pit remain in their placed positions

### Requirement: Confirm Setup
Players MUST confirm their setup by pressing a "Let's Start" button. The game waits for both players to confirm before transitioning to the playing phase.

#### Scenario: Lets Start button enabled after shuffle
- **GIVEN** a player has shuffled their pieces at least once
- **WHEN** the setup screen is displayed
- **THEN** the "Let's Start" button is enabled

#### Scenario: Lets Start button disabled before shuffle
- **GIVEN** a player has not yet shuffled their pieces
- **WHEN** the setup screen is displayed
- **THEN** the "Let's Start" button is disabled

#### Scenario: Player confirms setup
- **GIVEN** a player has shuffled their pieces
- **WHEN** the player presses the "Let's Start" button
- **THEN** the server marks the player as ready
- **AND** the button becomes disabled (cannot un-confirm)

#### Scenario: Both players confirm
- **GIVEN** player A has confirmed their setup
- **WHEN** player B presses the "Let's Start" button
- **THEN** the server transitions the game phase from 'setup' to 'playing'
- **AND** a starting player is randomly selected
- **AND** both players receive a `GAME_START` event with the initial game state

#### Scenario: Opponent ready indicator
- **GIVEN** a player is in the setup phase
- **WHEN** the opponent confirms their setup
- **THEN** the player sees an indicator that their opponent is ready

### Requirement: Fog of War During Setup
Players SHALL NOT see the type of their opponent's pieces during the setup phase.

#### Scenario: Opponent pieces are hidden
- **GIVEN** a player is in the setup phase
- **AND** the opponent has placed or shuffled pieces
- **WHEN** the board is displayed
- **THEN** opponent pieces are shown with a generic "hidden" appearance
- **AND** the piece type is not visible
