# Rematch Flow

## ADDED Requirements

### Requirement: Rematch Request
Players MUST be able to request a rematch after a game ends.

#### Scenario: Player requests rematch
- GIVEN a game has ended
- WHEN a player clicks "Play Again"
- THEN a rematch request is sent to the server
- AND the opponent is notified
- AND the requesting player sees a "Waiting for opponent..." message

### Requirement: Mutual Agreement
Both players MUST agree to a rematch for the game to reset.

#### Scenario: Both players agree
- GIVEN Player Red has requested a rematch
- WHEN Player Blue also requests a rematch
- THEN both players are notified that the rematch is accepted
- AND the game state is reset to setup phase
- AND both players see the SetupScreen

#### Scenario: Only one player requests
- GIVEN Player Red has requested a rematch
- WHEN Player Blue has not yet requested
- THEN the game remains in finished state
- AND Player Red sees "Waiting for opponent..."
- AND Player Blue sees "Opponent wants to play again!"

### Requirement: State Reset
When a rematch is accepted, the game state MUST be reset to allow a fresh game.

#### Scenario: Game state reset on rematch
- GIVEN both players have accepted a rematch
- WHEN the rematch is confirmed
- THEN the board is cleared of all pieces
- AND both players' piece arrays are emptied
- AND setup flags are reset (hasPlacedKingPit=false, hasShuffled=false, isReady=false)
- AND the game phase transitions to 'setup'
- AND player colors remain the same (Red stays Red, Blue stays Blue)

### Requirement: Session Persistence
The same session MUST be reused for a rematch.

#### Scenario: Session continuity
- GIVEN a rematch is initiated
- WHEN the game resets
- THEN the session ID remains unchanged
- AND both players remain connected to the same session
- AND socket connections are preserved
