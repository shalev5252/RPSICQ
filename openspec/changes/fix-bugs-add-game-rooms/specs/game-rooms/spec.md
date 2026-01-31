## ADDED Requirements

### Requirement: Room Creation
A player SHALL be able to create a private game room and receive a unique 7-digit numeric code to share with a friend.

#### Scenario: Player creates a private room
- **WHEN** the player emits `CREATE_ROOM` with `{ gameMode }`
- **THEN** the server SHALL generate a unique 7-digit numeric code (0000000–9999999)
- **AND** the server SHALL store the room with the host's socket ID, game mode, and creation timestamp
- **AND** the server SHALL start a 10-minute expiry timer for the room
- **AND** the server SHALL emit `ROOM_CREATED` with `{ roomCode, gameMode }` to the creator

#### Scenario: Room code uniqueness
- **WHEN** the server generates a new room code
- **THEN** the generated code MUST NOT match any currently active room code
- **AND** the server MUST retry generation if a collision is detected

### Requirement: Room Joining
A player SHALL be able to join an existing private room by entering the room code.

#### Scenario: Player joins a valid room
- **WHEN** a second player emits `JOIN_ROOM` with `{ roomCode }`
- **THEN** the server SHALL pair both players into a game session using the room's game mode
- **AND** the server SHALL emit `GAME_FOUND` to both players with session ID and assigned colors
- **AND** the room SHALL be removed from the active rooms list
- **AND** the expiry timer SHALL be cancelled

#### Scenario: Player enters an invalid room code
- **WHEN** a player emits `JOIN_ROOM` with an invalid `roomCode`
- **THEN** the server SHALL emit `ROOM_ERROR` with `{ code: 'ROOM_NOT_FOUND', message: '...' }`
- **AND** the player SHALL remain on the matchmaking screen

#### Scenario: Player enters an expired room code
- **WHEN** a player emits `JOIN_ROOM` with an expired `roomCode`
- **THEN** the server SHALL emit `ROOM_ERROR` with `{ code: 'ROOM_EXPIRED', message: '...' }`

#### Scenario: Player tries to join their own room
- **WHEN** a player emits `JOIN_ROOM` with their own room code
- **THEN** the server SHALL emit `ROOM_ERROR` with `{ code: 'CANNOT_JOIN_OWN_ROOM', message: '...' }`

### Requirement: Room Expiration
Rooms SHALL automatically expire after 10 minutes if no second player joins.

#### Scenario: Room expires after timeout
- **WHEN** the 10-minute timer fires
- **THEN** the room SHALL be removed from the active rooms list
- **AND** the server SHALL emit `ROOM_EXPIRED` to the creator's socket (if still connected)

### Requirement: Room Cancellation
The room creator SHALL be able to cancel a waiting room before a second player joins.

#### Scenario: Creator cancels room
- **WHEN** the player emits `CANCEL_ROOM`
- **THEN** the room SHALL be removed from the active rooms list
- **AND** the expiry timer SHALL be cancelled
- **AND** the player SHALL return to the matchmaking screen

### Requirement: Room Cleanup on Disconnect
The server SHALL clean up rooms when the creator disconnects.

#### Scenario: Creator disconnects while waiting for opponent
- **WHEN** the creator's socket disconnects
- **THEN** the room SHALL be removed from the active rooms list
- **AND** the expiry timer SHALL be cancelled

### Requirement: Game Mode Inheritance
The joining player SHALL play in the game mode chosen by the room creator, regardless of the joining player's own mode selection.

#### Scenario: Joiner enters a room with a different mode selected
- **WHEN** the joining player enters the room code and joins
- **THEN** the game session SHALL use the creator's chosen game mode
- **AND** both players SHALL enter the setup phase for that mode
