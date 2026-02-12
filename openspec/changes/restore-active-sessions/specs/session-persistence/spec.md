# Session Persistence

## ADDED Requirements

### Requirement: Store active session in browser localStorage
When a game session begins (GAME_FOUND event received), the client MUST persist the sessionId and current game phase to localStorage with key `rps_active_session`.

#### Scenario: Player joins matchmaking queue and gets matched
```
GIVEN the player has joined the matchmaking queue
WHEN the GAME_FOUND event is received with sessionId "abc-123"
THEN localStorage["rps_active_session"] contains { sessionId: "abc-123", phase: "setup", timestamp: <current_time> }
```

#### Scenario: Game transitions from setup to playing
```
GIVEN the player is in setup phase with stored sessionId "abc-123"
WHEN the GAME_START event is received
THEN localStorage["rps_active_session"] is updated with { sessionId: "abc-123", phase: "playing", timestamp: <updated_time> }
```

### Requirement: Clear session storage on game completion or abandonment
The client MUST remove the stored session from localStorage when the game ends through normal or abnormal termination.

#### Scenario: Game ends normally (game over)
```
GIVEN an active game session is stored in localStorage
WHEN the GAME_OVER event is received
THEN localStorage["rps_active_session"] is deleted
```

#### Scenario: Opponent disconnects permanently
```
GIVEN an active game session is stored in localStorage
WHEN the OPPONENT_DISCONNECTED event is received
THEN localStorage["rps_active_session"] is deleted
```

#### Scenario: Player explicitly leaves session
```
GIVEN an active game session is stored in localStorage
WHEN the player clicks "Leave Game" or "Return Home"
AND the LEAVE_SESSION event is emitted
THEN localStorage["rps_active_session"] is deleted immediately
```

### Requirement: Attempt session restoration on application load
When the application mounts, if a valid session is found in localStorage, the client MUST attempt to rejoin that session automatically.

#### Scenario: Player refreshes browser during active game
```
GIVEN the player is in an active game with sessionId "abc-123"
AND the sessionId is stored in localStorage
WHEN the player refreshes the browser
AND the session is still active on the server (within grace period)
THEN the app detects the stored sessionId on mount
AND the socket connects with the stored playerId
AND the server's handleReconnect finds the active session
AND the SESSION_RESTORED event is emitted
AND the player is returned to their game at the correct phase
```

#### Scenario: Player closes tab and reopens within grace period
```
GIVEN the player closes the browser tab during an active game
AND the sessionId "abc-123" is stored in localStorage
WHEN the player reopens the site within the 30-second grace period
THEN the app detects the stored sessionId
AND attempts automatic reconnection
AND the player rejoins the active game seamlessly
```

#### Scenario: Stored session is stale (> 5 minutes old)
```
GIVEN a sessionId is stored in localStorage with timestamp > 5 minutes ago
WHEN the application mounts
THEN the stored session is considered expired
AND localStorage["rps_active_session"] is cleared
AND the player is shown the matchmaking screen
AND no reconnection attempt is made
```

#### Scenario: Stored session not found on server
```
GIVEN a sessionId "abc-123" is stored in localStorage
WHEN the application mounts and attempts reconnection
AND the server's handleReconnect returns null (session not found)
THEN localStorage["rps_active_session"] is cleared
AND the player is shown the matchmaking screen
AND an appropriate message is logged (session expired/not found)
```

### Requirement: Graceful handling when localStorage is unavailable
The application MUST function normally even when localStorage is unavailable or disabled.

#### Scenario: localStorage is disabled
```
GIVEN localStorage is unavailable (e.g., private browsing mode)
WHEN the player joins a game session
THEN session storage operations fail silently
AND the game continues without persistence
AND disconnected players cannot auto-rejoin (current behavior)
```

---

## MODIFIED Requirements

None - this is purely additive functionality.

---

## REMOVED Requirements

None.
