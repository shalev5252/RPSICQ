# Game Modes Specification

## ADDED Requirements

### Requirement: Mode Selection
The application MUST allow players to select a game mode before entering matchmaking.

#### Scenario: Mode Selection UI
- **WHEN** a player is on the main menu
- **THEN** they should see options to select "Classic" or "RPSLS" mode.
- **AND** a mode must be selected before joining the matchmaking queue.

### Requirement: Mode-Specific Configuration
The game MUST use mode-specific configuration for board size and unit types.

#### Scenario: Classic Mode Configuration
- **WHEN** "Classic" mode is selected
- **THEN** the board size should be 6 rows × 7 columns.
- **AND** the available RPS units should be Rock (×4), Paper (×4), Scissors (×4).

#### Scenario: RPSLS Mode Configuration
- **WHEN** "RPSLS" mode is selected
- **THEN** the board size should be 6 rows × 6 columns.
- **AND** the available units should be Rock (×2), Paper (×2), Scissors (×2), Lizard (×2), Spock (×2).
