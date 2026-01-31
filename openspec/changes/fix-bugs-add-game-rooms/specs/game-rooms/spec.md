## ADDED Requirements

### Requirement: Room Creation
A player SHALL be able to create a private game room and receive a unique 7-digit numeric code to share with a friend.

#### Scenario: Player creates a private room
- **GIVEN** a player is on the matchmaking screen
- **AND** the player has selected a game mode (Classic or RPSLS)
- **AND** the player chooses "Play with Friend" then "Create Room"
- **WHEN** the client emits `CREATE_ROOM` with `{ gameMode }`
- **THEN** the server generates a unique 7-digit numeric code (0000000–9999999)
- **AND** the server stores the room with the host's socket ID, game mode, and creation timestamp
- **AND** the server starts a 10-minute expiry timer for the room
- **AND** the server emits `ROOM_CREATED` with `{ roomCode, gameMode }` to the creator
- **AND** the client displays the room code for the player to share

#### Scenario: Room code uniqueness
- **GIVEN** there are active (unexpired) rooms in the system
- **WHEN** the server generates a new room code
- **THEN** the generated code MUST NOT match any currently active room code
- **AND** the server retries generation if a collision is detected

### Requirement: Room Joining
A player SHALL be able to join an existing private room by entering the room code.

#### Scenario: Player joins a valid room
- **GIVEN** a room exists with a valid, unexpired code
- **AND** the room has exactly one player (the creator) waiting
- **WHEN** a second player emits `JOIN_ROOM` with `{ roomCode }`
- **THEN** the server pairs both players into a game session using the room's game mode
- **AND** the server emits `GAME_FOUND` to both players with session ID and assigned colors
- **AND** the room is removed from the active rooms list
- **AND** the expiry timer is cancelled

#### Scenario: Player enters an invalid room code
- **GIVEN** no active room exists with the entered code
- **WHEN** a player emits `JOIN_ROOM` with `{ roomCode }`
- **THEN** the server emits `ROOM_ERROR` with `{ code: 'ROOM_NOT_FOUND', message: '...' }`
- **AND** the player remains on the matchmaking screen

#### Scenario: Player enters an expired room code
- **GIVEN** a room existed but its 10-minute expiry has passed
- **WHEN** a player emits `JOIN_ROOM` with `{ roomCode }`
- **THEN** the server emits `ROOM_ERROR` with `{ code: 'ROOM_EXPIRED', message: '...' }`

#### Scenario: Player tries to join their own room
- **GIVEN** a player has created a room
- **WHEN** the same player emits `JOIN_ROOM` with their own room code
- **THEN** the server emits `ROOM_ERROR` with `{ code: 'CANNOT_JOIN_OWN_ROOM', message: '...' }`

### Requirement: Room Expiration
Rooms SHALL automatically expire after 10 minutes if no second player joins.

#### Scenario: Room expires after timeout
- **GIVEN** a room was created 10 minutes ago
- **AND** no second player has joined
- **WHEN** the 10-minute timer fires
- **THEN** the room is removed from the active rooms list
- **AND** the server emits `ROOM_EXPIRED` to the creator's socket (if still connected)

### Requirement: Room Cancellation
The room creator SHALL be able to cancel a waiting room before a second player joins.

#### Scenario: Creator cancels room
- **GIVEN** a player has created a room and is waiting for an opponent
- **WHEN** the player emits `CANCEL_ROOM`
- **THEN** the room is removed from the active rooms list
- **AND** the expiry timer is cancelled
- **AND** the player returns to the matchmaking screen

### Requirement: Room Cleanup on Disconnect
The server SHALL clean up rooms when the creator disconnects.

#### Scenario: Creator disconnects while waiting for opponent
- **GIVEN** a player has created a room
- **WHEN** the creator's socket disconnects
- **THEN** the room is removed from the active rooms list
- **AND** the expiry timer is cancelled

### Requirement: Game Mode Inheritance
The joining player SHALL play in the game mode chosen by the room creator, regardless of the joiner's own mode selection.

#### Scenario: Joiner enters a room with a different mode selected
- **GIVEN** the room creator selected "RPSLS" mode when creating the room
- **AND** the joining player has "Classic" selected on their matchmaking screen
- **WHEN** the joining player enters the room code and joins
- **THEN** the game session uses "RPSLS" mode (the creator's choice)
- **AND** both players enter the setup phase for RPSLS
