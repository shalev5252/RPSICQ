# sound-effects Specification

## Purpose
TBD - created by archiving change add-sound-effects. Update Purpose after archive.
## Requirements
### Requirement: Background Music
The application MUST play background music continuously, with user-adjustable volume.

#### Scenario: Adjusting BGM Volume
- **GIVEN** the user has the settings window open
- **WHEN** the user moves the BGM volume slider
- **THEN** the background music volume changes in real-time
- **AND** the new volume preference is saved

### Requirement: Movement Sounds
The application MUST play a distinct sound effect when a piece moves.
#### Scenario: Player moves piece
- **WHEN** the player moves a piece to an empty cell
- **THEN** the assigned move sound (`move1.mp3` or `move2.mp3`) for that player plays.

### Requirement: Battle Sounds
The application MUST play a battle sound when combat occurs.
#### Scenario: Combat or Tie
- **WHEN** a piece moves to a cell occupied by an opponent
- **THEN** the `battle.mp3` sound plays instead of the standard move sound.

### Requirement: Victory/Defeat Sounds
The application MUST play a result sound when the game ends.
#### Scenario: Player Wins
- **WHEN** the game ends with the player as the winner
- **THEN** `winner.mp3` plays.

#### Scenario: Player Loses
- **WHEN** the game ends with the player as the loser
- **THEN** `looser.mp3` plays.

