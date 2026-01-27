# Sound Effects Specification

## ADDED Requirements

### Requirement: Background Music
The application MUST play background music continuously while the user is engaged with the game.
#### Scenario: Continuous Playback
- **WHEN** the user has interacted with the page (unlocking Audio context)
- **THEN** the `bgm.mp3` should play in a loop at a moderate volume.

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
