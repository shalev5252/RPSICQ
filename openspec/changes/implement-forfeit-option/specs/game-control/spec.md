# Game Control Spec

## ADDED Requirements

### Requirement: Forfeit Button
The game interface MUST provide a way for players to unconditionally surrender the game during active play or setup.

#### Scenario: Forfeit during Setup
- Given I am in the Setup phase
- When I look at the screen controls
- Then I see a button to "Give Up" or "Back to Menu"

#### Scenario: Forfeit during Gameplay
- Given I am in the Playing phase
- When I look at the screen controls
- Then I see a button to "Give Up" or "Back to Menu"

### Requirement: Forfeit Confirmation
Accidental forfeits MUST be prevented via a confirmation dialog.

#### Scenario: Confirming Forfeit
- Given I have clicked the "Give Up" button
- Then a confirmation modal appears asking "Are you sure you want to forfeit the game?"
- When I confirm "Yes"
- Then the game is forfeited
- And I am navigated to the main menu immediately

#### Scenario: Cancelling Forfeit
- Given I have clicked the "Give Up" button
- Then a confirmation modal appears
- When I cancel or click "No"
- Then the modal closes
- And the game continues uninterrupted

### Requirement: Forfeit Resolution
The server MUST handle the forfeit by ending the game and assigning victory to the opponent.

#### Scenario: Opponent Wins by Forfeit
- Given my opponent has confirmed a forfeit
- Then the game phase updates to "Finished"
- And I am declared the Winner
- And the win reason is recorded as "forfeit"

### Requirement: Post-Forfeit UX
The post-game experience MUST provide the standard Game Over options, including Rematch, to both players.

#### Scenario: Winner View
- Given I have won by forfeit
- When I see the Game Over screen
- Then the "Rematch" option IS available
- And I see a message indicating the opponent forfeited

#### Scenario: Loser View
- Given I have forfeited the game
- Then I see the Game Over screen
- And the "Rematch" option IS available
- And I see a message indicating/confirming I forfeited
