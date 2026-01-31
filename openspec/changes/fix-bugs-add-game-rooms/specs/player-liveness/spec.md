## ADDED Requirements

### Requirement: Faster Disconnect Detection
The server SHALL detect player disconnections within approximately 25 seconds using tightened Socket.IO transport-level ping settings.

#### Scenario: Player closes browser tab during PvP game
- **GIVEN** two human players are in an active game session
- **WHEN** one player closes their browser tab (without refresh)
- **THEN** the Socket.IO transport-level ping detects the disconnection within ~25 seconds (`pingInterval: 10000` + `pingTimeout: 15000`)
- **AND** the server fires the `disconnect` event for that player's socket

### Requirement: Opponent Reconnecting UI Feedback
The client SHALL display a visible indicator to the remaining player when the opponent's connection is interrupted during gameplay.

#### Scenario: Opponent temporarily disconnects during playing phase
- **GIVEN** two human players are in the `playing` or `tie_breaker` phase
- **WHEN** the server emits `OPPONENT_RECONNECTING` to the remaining player
- **THEN** the client displays a visible banner or overlay stating the opponent is reconnecting
- **AND** the banner remains visible until `OPPONENT_RECONNECTED` or `OPPONENT_DISCONNECTED` is received

#### Scenario: Opponent reconnects successfully
- **GIVEN** the "opponent reconnecting" indicator is displayed
- **WHEN** the server emits `OPPONENT_RECONNECTED`
- **THEN** the indicator is dismissed
- **AND** gameplay resumes normally

### Requirement: Opponent Disconnected During Gameplay
The client SHALL handle the `OPPONENT_DISCONNECTED` event during active gameplay by notifying the player and returning to the matchmaking screen.

#### Scenario: Opponent permanently disconnects during playing phase
- **GIVEN** two human players are in the `playing`, `tie_breaker`, or `finished` phase
- **WHEN** the server emits `OPPONENT_DISCONNECTED` (after grace period expires)
- **THEN** the client displays a notification that the opponent has left the game
- **AND** the client resets game state and transitions to the `waiting` phase (matchmaking screen)
