# Sound Effects Specification

## ADDED Requirements

### Requirement: Background Music
The application MUST play background music continuously while the user is engaged with the game.
#### Scenario: Continuous Playback
**Given** the user is on any screen (Setup, Game, etc.)
**When** the user has interacted with the page (unlocking Audio context)
**Then** the `bgm.mp3` should play in a loop at a moderate volume.

### Requirement: Movement Sounds
The application MUST play a distinct sound effect when a piece moves.
#### Scenario: Player moves piece
**Given** it is the player's turn
**When** the player moves a piece to an empty cell
**Then** the assigned move sound (`move1.mp3` or `move2.mp3`) for that player plays.

### Requirement: Battle Sounds
The application MUST play a battle sound when combat occurs.
#### Scenario: Combat or Tie
**Given** a piece moves to a cell occupied by an opponent
**When** the move is executed
**Then** the `battle.mp3` sound plays instead of the standard move sound.

### Requirement: Victory/Defeat Sounds
The application MUST play a result sound when the game ends.
#### Scenario: Player Wins
**Given** the game ends with the player as the winner
**Then** `winner.mp3` plays.

#### Scenario: Player Loses
**Given** the game ends with the player as the loser
**Then** `looser.mp3` plays.
