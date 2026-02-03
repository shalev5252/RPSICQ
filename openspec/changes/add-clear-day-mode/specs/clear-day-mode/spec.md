# clear-day-mode Specification

## Purpose
Defines the Clear Day variant which disables fog of war, revealing all pieces when gameplay begins.

## ADDED Requirements

### Requirement: Clear Day Variant Selection
Players MUST be able to select the Clear Day variant when choosing a game mode.

#### Scenario: Mode selection includes Clear Day option
- **GIVEN** a player is on the mode selection screen
- **WHEN** they view the available variants
- **THEN** they should see "Clear Day" as an option alongside "Standard"
- **AND** Clear Day can be combined with either Classic or RPSLS rule sets

### Requirement: Setup Phase Privacy
The setup phase MUST remain private even in Clear Day mode.

#### Scenario: Pieces hidden during setup
- **GIVEN** a Clear Day game is in the setup phase
- **AND** Player A places their King and Pit
- **WHEN** Player B views the board
- **THEN** Player A's rows should appear empty (same as standard mode)
- **AND** Player B cannot see Player A's piece positions or types

### Requirement: Full Reveal at Game Start
All pieces MUST be revealed when the game transitions from setup to playing phase.

#### Scenario: Pieces revealed on game start
- **GIVEN** both players have confirmed their setup in a Clear Day game
- **WHEN** the game phase transitions to 'playing'
- **THEN** all pieces on the board should have `isRevealed: true`
- **AND** both players can see the exact type of every piece
- **AND** no pieces display the hidden "?" indicator

### Requirement: Clear Day Visual Indicator
The game UI MUST indicate when Clear Day mode is active.

#### Scenario: Visual mode indicator
- **GIVEN** a Clear Day game is in the playing phase
- **WHEN** the player views the game board
- **THEN** a sun icon (☀️) should be visible to indicate Clear Day mode is active
