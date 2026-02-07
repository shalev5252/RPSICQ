# onslaught-mode Specification

## Purpose
Defines the "Onslaught" game mode variant, characterized by visible pieces, smaller boards, no special units (King/Pit), and Last Man Standing / Showdown win conditions.

## ADDED Requirements

### Requirement: Onslaught Variant Configuration
The game MUST support distinct board configurations for Onslaught mode based on the base rule set.

#### Scenario: Classic Onslaught Configuration
- **GIVEN** a game is created with mode `classic` and variant `onslaught`
- **WHEN** the game session is initialized
- **THEN** the board dimensions are 6 rows x 3 columns
- **AND** each player receives 6 pieces (2 Rock, 2 Paper, 2 Scissors)
- **AND** the board contains NO King or Pit pieces

#### Scenario: RPSLS Onslaught Configuration
- **GIVEN** a game is created with mode `rpsls` and variant `onslaught`
- **WHEN** the game session is initialized
- **THEN** the board dimensions are 6 rows x 5 columns
- **AND** each player receives 10 pieces (2 Rock, 2 Paper, 2 Scissors, 2 Lizard, 2 Spock)
- **AND** the board contains NO King or Pit pieces

### Requirement: Elimination Win Condition
The game MUST declare a winner when all opponent pieces are eliminated.

#### Scenario: Player wins by elimination
- **GIVEN** an Onslaught game is in progress
- **WHEN** Player A captures Player B's last piece
- **THEN** Player A is declared the winner immediately
- **AND** the game ends

### Requirement: Showdown Win Condition
When only two pieces remain (one per player), the game MUST be decided by element supremacy using RPSLS_WINS.

#### Scenario: Showdown with decisive matchup
- **GIVEN** exactly one piece remains for Player A (Rock)
- **AND** exactly one piece remains for Player B (Scissors)
- **WHEN** the game state is evaluated (e.g., after the capture that led to this state)
- **THEN** Player A (Rock) is declared the winner immediately
- **BECAUSE** Rock beats Scissors per RPSLS_WINS

#### Scenario: Showdown with tie
- **GIVEN** exactly one piece remains for Player A (Rock)
- **AND** exactly one piece remains for Player B (Rock)
- **WHEN** the game state is evaluated
- **THEN** a "Final Tie Breaker" phase MUST be triggered
- **AND** the winner of this tie breaker wins the game

### Requirement: No Fog of War
Onslaught mode MUST use Clear Day visibility rules.

#### Scenario: Visible pieces
- **GIVEN** an Onslaught game starts
- **WHEN** the game session is initialized
- **THEN** all pieces are visible to both players (`isRevealed: true`)

### Requirement: Setup Automation
Setup SHALL be automated to speed up gameplay.

#### Scenario: Auto-placement
- **GIVEN** an Onslaught game session is created
- **WHEN** the game session is initialized
- **THEN** pieces are automatically randomly placed on the player's valid setup rows
- **AND** players do not need to manually drag pieces onto the board

### Requirement: Infinite Time
Onslaught mode SHALL be untimed.

#### Scenario: No turn timer
- **GIVEN** it is a player's turn in Onslaught mode
- **WHEN** the player is considering their move
- **THEN** the turn timer does not tick down
- **AND** the turn does not auto-pass
