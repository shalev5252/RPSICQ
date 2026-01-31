## MODIFIED Requirements

### Requirement: Disconnect Grace Period
The server SHALL wait for a grace period of 30 seconds before ending a session when a player disconnects. Disconnect detection is handled by tightened Socket.IO ping settings (~25s detection), while the grace period provides time for legitimate reconnections.

#### Scenario: Player disconnects during game
- **GIVEN** a player is in an active game session
- **WHEN** the player's socket disconnects
- **THEN** the server starts a 30-second grace period timer
- **AND** the opponent is notified that the player is reconnecting
- **AND** the session is NOT immediately ended

#### Scenario: Grace period expires without reconnection
- **GIVEN** a player has disconnected
- **AND** the 30-second grace period has started
- **WHEN** the grace period expires without reconnection
- **THEN** the session is ended
- **AND** the opponent is notified via `OPPONENT_DISCONNECTED`
- **AND** the opponent's client resets to the matchmaking screen
