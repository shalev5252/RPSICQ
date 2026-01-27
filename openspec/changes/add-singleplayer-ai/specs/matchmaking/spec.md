## ADDED Requirements

### Requirement: Singleplayer Session Creation
The system MUST support creating a game session with an AI opponent that bypasses the matchmaking queue entirely.

#### Scenario: Player starts singleplayer game
- **WHEN** a player sends a `START_SINGLEPLAYER` event with a `gameMode` (e.g. 'classic' or 'rpsls')
- **THEN** the server MUST immediately create a new game session
- **AND** the server MUST assign the human player as one color and an AI opponent as the other color
- **AND** the server MUST emit a `GAME_FOUND` event to the human player with `{ sessionId, color }`
- **AND** no matchmaking queue is involved

#### Scenario: AI player identification
- **WHEN** an AI opponent is created for a singleplayer session
- **THEN** the AI player MUST have an ID prefixed with `ai-` (e.g. `ai-session123`)
- **AND** the AI player MUST have a virtual socket ID prefixed with `ai-socket-`
- **AND** disconnect/reconnect logic MUST be skipped for AI players
