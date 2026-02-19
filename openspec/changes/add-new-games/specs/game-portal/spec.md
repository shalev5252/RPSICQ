## ADDED Requirements

### Requirement: Game Portal Landing Page
The application MUST display a game-selection portal as the default landing page when no game is active. The portal SHALL present all available games with their names, icons, and short descriptions.

#### Scenario: Portal displays available games
- **WHEN** a player opens the application
- **THEN** they see a portal screen listing: "RPS Battle", "Tic Tac Toe", and "The Third Eye"
- **AND** each game card shows an icon, the game name, and a brief description

#### Scenario: Selecting a game
- **WHEN** a player clicks on a game card
- **THEN** they are navigated to that game's matchmaking or mode-selection screen
- **AND** a "Back" button is available to return to the portal

### Requirement: Back-to-Portal Navigation
The application MUST provide a way to return to the game portal from any game's pre-match screen (matchmaking, mode selection).

#### Scenario: Returning to portal from matchmaking
- **WHEN** a player clicks the "Back" or "Home" button while on a game's matchmaking screen
- **THEN** they leave the matchmaking queue (if joined) and return to the portal

#### Scenario: Cannot leave during active game
- **WHEN** a player is in an active game session (setup, playing, or tie-breaker)
- **THEN** the back-to-portal button is NOT available (the player must finish, forfeit, or disconnect)
