## MODIFIED Requirements

### Requirement: Queue Management
The system MUST maintain separate queues of players waiting to play a game for each game type and mode. Players can join and leave these queues at will. Queue keys include: `rps-classic`, `rps-rpsls`, `ttt-classic`, and `third-eye`.

#### Scenario: Player joins matchmaking queue
- **Given** a player is connected to the server
- **And** the player is currently on a game's matchmaking screen
- **When** the player sends a `JOIN_QUEUE` event with a `gameMode` (e.g. `'rps-classic'`, `'rps-rpsls'`, `'ttt-classic'`, `'third-eye'`)
- **Then** the server adds the player to the matchmaking queue corresponding to that mode
- **And** the server does not immediately start a game if no other players are waiting in that specific queue

#### Scenario: Player leaves matchmaking queue
- **Given** a player is in the matchmaking queue
- **When** the player sends a `LEAVE_QUEUE` event OR disconnects
- **Then** the server removes the player from the queue
- **And** the player is not matched if another player subsequently joins

#### Scenario: Same-Mode Matching
- **WHEN** a player joins the matchmaking queue with a selected game mode
- **THEN** they should only be matched with other players who selected the same game mode

#### Scenario: No Cross-Game Matching
- **WHEN** one player selects a Tic Tac Toe queue and another selects an RPS Battle queue
- **THEN** they MUST NOT be placed in the same match
