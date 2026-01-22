# Matchmaking Specifications

## ADDED Requirements

### Requirement: Queue Management
The system MUST maintain a queue of players waiting to play a game. Players can join and leave this queue at will.

#### Scenario: Player joins matchmaking queue
- **Given** a player is connected to the server
- **And** the player is currently on the "Home" or "Start" screen
- **When** the player sends a `JOIN_QUEUE` event
- **Then** the server adds the player to the matchmaking queue
- **And** the server does not immediately start a game if no other players are waiting

#### Scenario: Player leaves matchmaking queue
- **Given** a player is in the matchmaking queue
- **When** the player sends a `LEAVE_QUEUE` event OR disconnects
- **Then** the server removes the player from the queue
- **And** the player is not matched if another player subsequently joins

### Requirement: Session Initialization
When two players are available in the queue, the system MUST create a new game session, assign roles, and notify both players.

#### Scenario: Two players match
- **Given** Player A is in the matchmaking queue
- **When** Player B sends a `JOIN_QUEUE` event
- **Then** the server removes both Player A and Player B from the queue
- **And** the server creates a unique session ID
- **And** the server randomly assigns one player as 'red' and the other as 'blue'
- **And** the server emits a `GAME_START` event to Player A with `{ sessionId, role: <RoleA> }`
- **And** the server emits a `GAME_START` event to Player B with `{ sessionId, role: <RoleB> }`

## MODIFIED Requirements
None.

## REMOVED Requirements
None.
