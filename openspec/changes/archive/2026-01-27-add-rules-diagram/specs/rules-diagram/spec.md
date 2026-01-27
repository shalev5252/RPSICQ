# Spec: Rules Diagram Feature

## ADDED Requirements

### Requirement: Rules Modal Behavior
The system SHALL display a modal explaining game rules when requested.

#### Scenario: Opening Rule Modal
- **WHEN** the user clicks the "Rules" button (❓)
- **THEN** a modal appears overlaying the screen
- **AND** the modal displays the weakness/strength relationships relevant to the current `gameMode`

### Requirement: Rules Display Logic
The modal SHALL display diagrams appropriate for the active game mode.

#### Scenario: Classic Mode Display
- **GIVEN** the game mode is "Classic"
- **WHEN** the modal is open
- **THEN** it shows Rock, Paper, Scissors
- **AND** indicates R > S, S > P, P > R (Triangle layout)

#### Scenario: RPSLS Mode Display
- **GIVEN** the game mode is "RPSLS"
- **WHEN** the modal is open
- **THEN** it shows Rock, Paper, Scissors, Lizard, Spock
- **AND** indicates all 10 win conditions (Pentagon layout)

### Requirement: Modal Interactivity
The modal SHALL be dismissible.

#### Scenario: Closing the modal
- **WHEN** the user clicks "Close" or the background overlay
- **THEN** the modal is dismissed
