# Game Control Spec

## ADDED Requirements

### Requirement: Forfeit Button
The game interface MUST provide a way for players to unconditionally surrender the game during active play or setup.

#### Scenario: Forfeit during Setup
- **GIVEN** I am in the Setup phase
- **WHEN** I look at the screen controls
- **THEN** I see a button to "Give Up" or "Back to Menu"

#### Scenario: Forfeit during Gameplay
- **GIVEN** I am in the Playing phase
- **WHEN** I look at the screen controls
- **THEN** I see a button to "Give Up" or "Back to Menu"

### Requirement: Forfeit Confirmation
Accidental forfeits MUST be prevented via a confirmation dialog.

#### Scenario: Confirming Forfeit
- **GIVEN** I have clicked the "Give Up" button
- **THEN** a confirmation modal appears asking "Are you sure you want to forfeit the game?"
- **WHEN** I confirm "Yes"
- **THEN** the game is forfeited
    - AND I am navigated to the main menu immediately

#### Scenario: Cancelling Forfeit
- **GIVEN** I have clicked the "Give Up" button
- **THEN** a confirmation modal appears
- **WHEN** I cancel or click "No"
- **THEN** the modal closes
    - AND the game continues uninterrupted

### Requirement: Forfeit Resolution
The server MUST handle the forfeit by ending the game and assigning victory to the opponent.

#### Scenario: Opponent Wins by Forfeit
- **GIVEN** my opponent has confirmed a forfeit
- **THEN** the game phase updates to "Finished"
    - AND I am declared the Winner
    - AND the win reason is recorded as "forfeit"

### Requirement: Post-Forfeit UX
The post-game experience MUST provide the standard Game Over options, including Rematch, to both players.

#### Scenario: Winner View
- **GIVEN** I have won by forfeit
- **WHEN** I see the Game Over screen
- **THEN** the "Rematch" option MUST be available
    - AND I see a message indicating the opponent forfeited

#### Scenario: Loser View
- **GIVEN** I have forfeited the game
- **THEN** I see the Game Over screen
    - AND the "Rematch" option MUST be available
    - AND I see a message indicating/confirming I forfeited
