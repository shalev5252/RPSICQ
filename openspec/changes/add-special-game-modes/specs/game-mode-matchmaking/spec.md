# game-mode-matchmaking Specification

## Purpose
Extends the matchmaking system to support separate queues for each game mode + variant combination.

## MODIFIED Requirements

### Requirement: Queue Management
The system MUST maintain separate queues of players waiting to play a game for each game mode and variant combination. Players can join and leave these queues at will.

#### Scenario: Six distinct queues
- **GIVEN** the matchmaking service initializes
- **WHEN** the server starts accepting connections
- **THEN** it should create queues for:
  - `classic` (Classic + Standard)
  - `rpsls` (RPSLS + Standard)
  - `classic-clearday` (Classic + Clear Day)
  - `rpsls-clearday` (RPSLS + Clear Day)
  - `classic-onslaught` (Classic + Onslaught) [future]
  - `rpsls-onslaught` (RPSLS + Onslaught) [future]

#### Scenario: Player joins matchmaking queue
- **GIVEN** a player is connected to the server
- **AND** the player is currently on the "Home" or "Start" screen
- **WHEN** the player sends a `JOIN_QUEUE` event with a `gameMode` and `gameVariant`
- **THEN** the server adds the player to the appropriate combined queue
- **AND** the server does not immediately start a game if no other players are waiting in that specific queue

#### Scenario: No cross-variant matching
- **GIVEN** Player A joins the `classic` queue
- **AND** Player B joins the `classic-clearday` queue
- **WHEN** the matchmaking service tries to match
- **THEN** Players A and B are NOT matched together
- **AND** each waits for another player in their respective queue

#### Scenario: Same-variant matching
- **GIVEN** Player A joins the `rpsls-clearday` queue
- **AND** Player B joins the `rpsls-clearday` queue
- **WHEN** the matchmaking service runs
- **THEN** Players A and B are matched together
- **AND** a new RPSLS Clear Day game session is created

#### Scenario: Backward compatibility
- **GIVEN** an older client sends JOIN_QUEUE with only `{ gameMode: 'rpsls' }`
- **WHEN** the server processes the request
- **THEN** `gameVariant` defaults to `'standard'`
- **AND** the player is added to the `rpsls` queue

## ADDED Requirements

### Requirement: Singleplayer Variant Support
Starting a singleplayer game MUST support variant selection.

#### Scenario: AI game with variant
- **GIVEN** a player sends START_SINGLEPLAYER with `{ gameMode: 'classic', gameVariant: 'clearday' }`
- **WHEN** the server creates the AI game session
- **THEN** the session uses Classic rules with Clear Day variant settings
- **AND** all pieces are revealed when the game starts

### Requirement: Room Variant Support
Private room creation MUST support variant selection.

#### Scenario: Creating a room with variant
- **GIVEN** a player sends CREATE_ROOM with `{ gameMode: 'rpsls', gameVariant: 'clearday' }`
- **WHEN** the room is created
- **THEN** the room stores both gameMode and gameVariant
- **AND** when another player joins, the game session uses RPSLS Clear Day settings
