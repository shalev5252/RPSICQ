# session-reconnection Specification

## Purpose
Allow players to reconnect to their active game session after a page refresh without losing their game progress.

## ADDED Requirements

### Requirement: Persistent Player Identity
The system SHALL maintain a persistent player identity across page refreshes using localStorage.

#### Scenario: First visit generates player ID
- **GIVEN** a user visits the game for the first time
- **AND** no playerId exists in localStorage
- **WHEN** the page loads
- **THEN** a unique playerId is generated and stored in localStorage
- **AND** this playerId is sent to the server with the socket connection

#### Scenario: Returning visit uses existing player ID
- **GIVEN** a user has previously visited the game
- **AND** a playerId exists in localStorage
- **WHEN** the page loads
- **THEN** the existing playerId is retrieved from localStorage
- **AND** this playerId is sent to the server with the socket connection

### Requirement: Disconnect Grace Period
The server SHALL wait for a grace period before ending a session when a player disconnects.

#### Scenario: Player disconnects during game
- **GIVEN** a player is in an active game session
- **WHEN** the player's socket disconnects
- **THEN** the server starts a 30-second grace period timer
- **AND** the opponent is notified that the player is reconnecting
- **AND** the session is NOT immediately ended

#### Scenario: Grace period expires without reconnection
- **GIVEN** a player has disconnected
- **AND** the 30-second grace period has started
- **WHEN** the grace period expires without reconnection
- **THEN** the session is ended
- **AND** the opponent is notified and re-queued for matchmaking

### Requirement: Session Reconnection
The server SHALL restore a player to their active session when they reconnect within the grace period.

#### Scenario: Player reconnects within grace period
- **GIVEN** a player has disconnected
- **AND** a grace period timer is active
- **WHEN** the player reconnects with the same playerId
- **THEN** the grace period timer is cancelled
- **AND** the player's socket ID is updated in the session
- **AND** the player receives their full game state
- **AND** the opponent is notified that the player has reconnected

#### Scenario: Player reconnects after grace period
- **GIVEN** a player has disconnected
- **AND** the grace period has expired
- **WHEN** the player connects with the same playerId
- **THEN** they are treated as a new player
- **AND** no session restoration occurs
