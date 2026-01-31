## ADDED Requirements

### Requirement: Return to Main Menu After Game Over
The client SHALL allow a player to return to the main menu (matchmaking screen) after a game ends, without requiring a full page reload.

#### Scenario: Player clicks Return Home after winning
- **GIVEN** the game has ended and the player sees the game-over screen
- **AND** the player is the winner
- **WHEN** the player clicks "Return Home"
- **THEN** the client resets all game state (session, board, phase) to initial values
- **AND** the client emits a `LEAVE_SESSION` event to the server
- **AND** the game-over overlay is dismissed
- **AND** the matchmaking screen is displayed

#### Scenario: Player clicks Return Home after losing
- **GIVEN** the game has ended and the player sees the game-over screen
- **AND** the player is the loser
- **WHEN** the player clicks "Return Home"
- **THEN** the client resets all game state to initial values
- **AND** the client emits a `LEAVE_SESSION` event to the server
- **AND** the game-over overlay is dismissed
- **AND** the matchmaking screen is displayed

### Requirement: Server Session Cleanup on Leave
The server SHALL clean up session resources when a player explicitly leaves via `LEAVE_SESSION`.

#### Scenario: Player leaves session after game over
- **GIVEN** a game session is in the `finished` phase
- **WHEN** a player emits `LEAVE_SESSION`
- **THEN** the server removes the player from the session map
- **AND** the server removes the player from the Socket.IO room
- **AND** if the opponent is still connected and has not left, the opponent's session state is preserved for potential rematch
