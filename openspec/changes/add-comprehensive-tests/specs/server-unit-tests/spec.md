## ADDED Requirements

### Requirement: Game Logic Unit Test Coverage
The server SHALL have unit tests covering core game logic functions including session creation, piece placement, combat resolution, movement validation, victory conditions, and special rules (draw, forfeit, draw-offer).

#### Scenario: Combat resolution covers all matchups
- **WHEN** unit tests for `resolveCombat` execute
- **THEN** every attacker-defender combination for classic (RPS + king + pit) and RPSLS modes SHALL be verified

#### Scenario: King capture ends game
- **WHEN** a unit test moves a piece onto the opponent's King
- **THEN** the game phase SHALL transition to `finished` and the attacker's owner SHALL be the winner

#### Scenario: Pit defeats any attacker
- **WHEN** a unit test moves any mobile piece onto the opponent's Pit
- **THEN** the attacker is removed and the Pit's owner retains the cell

### Requirement: Supporting Service Unit Tests
Unit tests SHALL cover `MatchmakingService` (queue add/remove/match/zombie cleanup) and `RoomService` (create/join/expire/cancel).

#### Scenario: Matchmaking pairs two players
- **WHEN** two players are added to the same queue
- **THEN** a match is created and both are removed from the queue
