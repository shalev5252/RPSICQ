## MODIFIED Requirements

### Requirement: Queue Management
The system MUST maintain separate queues of players waiting to play a game for each game mode. Players can join and leave these queues at will. When the "Human Player" opponent type is selected, players choose between "Random Opponent" (joins the matchmaking queue) and "Play with Friend" (uses the room system).

#### Scenario: Player joins matchmaking queue
- **Given** a player is connected to the server
- **And** the player is currently on the "Home" or "Start" screen
- **And** the player has selected "Random Opponent" under the Human Player option
- **When** the player sends a `JOIN_QUEUE` event with a `gameMode` (e.g. 'classic' or 'rpsls')
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

#### Scenario: No Cross-Mode Matching
- **WHEN** one player selects "Classic" and another selects "RPSLS"
- **THEN** they must NOT be placed in the same match

#### Scenario: Player chooses Play with Friend
- **GIVEN** a player has selected "Human Player" as opponent type
- **WHEN** the player selects "Play with Friend"
- **THEN** the player is presented with options to "Create Room" or "Join Room"
- **AND** the player is NOT added to the random matchmaking queue
