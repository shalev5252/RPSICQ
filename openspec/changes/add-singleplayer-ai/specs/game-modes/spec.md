## MODIFIED Requirements

### Requirement: Mode Selection
The application MUST allow players to select a game mode and opponent type before entering a game.

#### Scenario: Mode Selection UI
- **WHEN** a player is on the main menu
- **THEN** they should see options to select "Classic" or "RPSLS" mode.
- **AND** a mode must be selected before proceeding.

#### Scenario: Opponent Type Selection UI
- **WHEN** a player has selected a game mode
- **THEN** they should see options to play "vs Player" or "vs Computer"
- **AND** selecting "vs Player" enters the matchmaking queue as before
- **AND** selecting "vs Computer" starts a singleplayer game session immediately without queuing
