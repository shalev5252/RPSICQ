## ADDED Requirements

### Requirement: E2E Browser Test Coverage
E2E tests using Playwright SHALL simulate two players interacting in separate browser contexts through the full game flow.

#### Scenario: Two-player happy path
- **WHEN** two browser contexts navigate to the app, select a game mode, matchmake, complete setup, and play until one King is captured
- **THEN** both contexts SHALL see the game-over screen with the correct winner displayed

#### Scenario: Setup phase interaction
- **WHEN** a player drags the King and Pit onto the board and clicks confirm
- **THEN** the setup screen SHALL transition to waiting for the opponent or to the game start
