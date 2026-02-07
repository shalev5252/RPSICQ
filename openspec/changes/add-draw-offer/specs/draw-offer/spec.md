## ADDED Requirements

### Requirement: Draw Offer
The system SHALL allow the current player to offer a draw during multiplayer games.

#### Scenario: Player offers draw
- **WHEN** it is the player's turn during `playing` phase in a PvP game
- **AND** the player has not already offered a draw this turn
- **THEN** the player can click "Offer Draw" button
- **AND** the opponent receives a draw offer notification

#### Scenario: Draw offer accepted
- **WHEN** an opponent receives a draw offer
- **AND** the opponent clicks "Accept"
- **THEN** the game ends immediately with result `draw`
- **AND** both players see the game over screen with draw result

#### Scenario: Draw offer declined
- **WHEN** an opponent receives a draw offer
- **AND** the opponent clicks "Decline"
- **THEN** the offering player is notified that draw was declined
- **AND** the offering player cannot offer draw again until their next turn
- **AND** normal gameplay continues

#### Scenario: Draw offer not available in singleplayer
- **WHEN** the player is in a singleplayer game against AI
- **THEN** the "Offer Draw" button is not displayed

#### Scenario: Draw offer only on player's turn
- **WHEN** it is not the player's turn
- **THEN** the "Offer Draw" button is disabled or hidden

#### Scenario: One offer per turn
- **WHEN** the player has already offered a draw this turn
- **THEN** the "Offer Draw" button is disabled until the player's next turn
