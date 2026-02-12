## ADDED Requirements

### Requirement: Socket.IO Integration Test Coverage
Integration tests SHALL validate the end-to-end Socket.IO event flow by connecting real client sockets to an in-process server.

#### Scenario: Full multiplayer happy path
- **WHEN** two socket clients connect, join queue, place king/pit, randomise, confirm setup, and make moves
- **THEN** both clients receive the correct sequence of `game_found`, `setup_state`, `game_start`, `game_state`, and `game_over` events

#### Scenario: Forfeit flow
- **WHEN** a player emits `forfeit_game`
- **THEN** both clients receive `game_over` with reason `forfeit` and the non-forfeiting player as winner

#### Scenario: Draw offer flow
- **WHEN** the current player emits `offer_draw` and the opponent emits `respond_draw` with `accepted: true`
- **THEN** both clients receive `game_over` with reason `draw_offer`
