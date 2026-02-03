# onslaught-mode Specification

## Purpose
Defines the Onslaught variant - a fast-paced elimination mode with no Kings/Pits, smaller boards, equal piece distribution, and a unique endgame win condition.

## ADDED Requirements

### Requirement: Onslaught Variant Selection
Players MUST be able to select the Onslaught variant when choosing a game mode.

#### Scenario: Mode selection includes Onslaught option
- **GIVEN** a player is on the mode selection screen
- **WHEN** they view the available variants
- **THEN** they should see "Onslaught" as an option alongside "Standard" and "Clear Day"
- **AND** Onslaught can be combined with either Classic or RPSLS rule sets

### Requirement: Onslaught Board Configuration
Onslaught MUST use smaller board sizes with no Kings or Pits.

#### Scenario: Classic Onslaught board
- **GIVEN** a player starts a Classic + Onslaught game
- **THEN** the board size should be 5 rows × 3 columns (15 cells)
- **AND** each player receives: Rock (×2), Paper (×2), Scissors (×2)
- **AND** there are no King or Pit pieces
- **AND** total pieces on board is 12 (6 per player)

#### Scenario: RPSLS Onslaught board
- **GIVEN** a player starts a RPSLS + Onslaught game
- **THEN** the board size should be 5 rows × 5 columns (25 cells)
- **AND** each player receives: Rock (×2), Paper (×2), Scissors (×2), Lizard (×2), Spock (×2)
- **AND** there are no King or Pit pieces
- **AND** total pieces on board is 20 (10 per player)

### Requirement: Onslaught Setup Phase
The setup phase MUST skip King/Pit placement and allow direct piece shuffling.

#### Scenario: Setup without King/Pit
- **GIVEN** an Onslaught game begins
- **WHEN** the player enters the setup phase
- **THEN** there should be no King/Pit placement step
- **AND** the player can immediately shuffle/randomize their combat pieces
- **AND** each player uses 2 setup rows (closest to their side)

#### Scenario: Equal piece distribution
- **GIVEN** an Onslaught setup is randomized
- **THEN** each player has exactly 2 of each element type
- **AND** both players have identical piece counts per element

### Requirement: Onslaught Win Condition
The game MUST end when only 2 pieces remain on the board, with winner determined by element matchup.

#### Scenario: Two different elements remain
- **GIVEN** an Onslaught game is in progress
- **AND** after a combat, only 2 pieces remain on the board
- **AND** the pieces are different elements (e.g., Rock vs Scissors)
- **WHEN** the win condition is checked
- **THEN** the game ends immediately
- **AND** the winner is the player whose element beats the other (Rock beats Scissors)
- **AND** the game shows the appropriate win message

#### Scenario: Two identical elements remain
- **GIVEN** an Onslaught game is in progress
- **AND** after a combat, only 2 pieces remain on the board
- **AND** both pieces are the same element (e.g., Rock vs Rock)
- **WHEN** the win condition is checked
- **THEN** a tie-breaker round is triggered
- **AND** each player chooses an element (RPS or RPSLS based on rule set)
- **AND** the winner of the tie-breaker wins the game

#### Scenario: Single piece remains
- **GIVEN** an Onslaught game is in progress
- **AND** after a combat, only 1 piece remains (mutual elimination edge case)
- **WHEN** the win condition is checked
- **THEN** the owner of the remaining piece wins

### Requirement: Onslaught Fog of War
Onslaught MUST use standard fog of war rules (pieces hidden until revealed through combat).

#### Scenario: Hidden pieces in Onslaught
- **GIVEN** an Onslaught game is in the playing phase
- **WHEN** a player views opponent pieces
- **THEN** unrevealed opponent pieces show as hidden ("?")
- **AND** pieces are revealed through combat wins (standard behavior)

### Requirement: Onslaught Visual Indicator
The game UI MUST indicate when Onslaught mode is active.

#### Scenario: Visual mode indicator
- **GIVEN** an Onslaught game is in progress
- **WHEN** the player views the game board
- **THEN** a visual indicator should show that Onslaught mode is active
- **AND** the win condition (pieces remaining) may be displayed

### Requirement: No Stalemate in Onslaught
The system MUST NOT apply stalemate conditions since there are no immovable pieces (King/Pit) in Onslaught.

#### Scenario: All pieces can move
- **GIVEN** an Onslaught game is in progress
- **WHEN** it is a player's turn
- **THEN** at least one of their pieces can make a valid move
- **AND** the auto-skip turn logic for immovable-only players does not apply
