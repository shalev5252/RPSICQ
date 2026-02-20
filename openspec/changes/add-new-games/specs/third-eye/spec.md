## ADDED Requirements

### Requirement: The Third Eye Game Flow
The system MUST implement The Third Eye as a multiplayer-only number-guessing game.
The Third Eye is a multiplayer-only number-guessing game. Once both players are ready, the server generates a random integer range (with at least 100 between min and max) and a hidden "lucky number" within that range. Both players see the range and have 20 seconds to pick a number inside it. The player whose pick is closest to the lucky number scores a point. First to 3 points wins.

#### Scenario: Round start
- **WHEN** both players are in an active The Third Eye session
- **THEN** the server generates a random range [min, max] with max − min ≥ 100
- **AND** the server generates a lucky number uniformly within [min, max]
- **AND** both players see the range displayed on-screen
- **AND** a 20-second countdown timer starts

### Requirement: Number Selection
Each player MUST select exactly one integer within the displayed range and confirm their choice before the timer expires.

#### Scenario: Player picks a number
- **WHEN** a player selects a number within the range and confirms
- **THEN** their choice is locked and sent to the server
- **AND** the player sees a confirmation that their pick is submitted

#### Scenario: Player picks a number outside the range
- **WHEN** a player attempts to submit a number outside [min, max]
- **THEN** the submission is rejected with an error message

### Requirement: Countdown Timer
The system MUST display a visible countdown timer (20 seconds) during each round. The timer is enforced server-side.

#### Scenario: Timer counts down
- **WHEN** a round starts
- **THEN** both players see a countdown timer starting at 20 seconds, decrementing each second

#### Scenario: Timer expires without a pick
- **WHEN** a player does not submit a number before the timer reaches 0
- **THEN** that player loses the round (the opponent scores a point)
- **AND** the result is displayed showing the timeout

#### Scenario: Both players timeout
- **WHEN** neither player submits a number before the timer expires
- **THEN** the round is a tie and no points are awarded

### Requirement: Round Resolution
After both players submit (or the timer expires), the server MUST reveal the lucky number and determine the round winner.

#### Scenario: Different distances
- **WHEN** Player A's pick is closer to the lucky number than Player B's pick
- **THEN** Player A scores 1 point
- **AND** both players see the lucky number, both picks, and the distances

#### Scenario: Equal distances (tie)
- **WHEN** both players' picks are at equal distance from the lucky number
- **THEN** the round is a tie and no points are awarded

#### Scenario: One player timed out
- **WHEN** one player submitted a number and the other timed out
- **THEN** the player who submitted scores 1 point

### Requirement: Score Display
The system MUST display each player's current score prominently on the game screen throughout the match.

#### Scenario: Score visibility
- **WHEN** a round ends
- **THEN** both players see updated scores on the game board
- **AND** scores persist and accumulate across rounds

### Requirement: Match Victory
The system MUST end the match when the first player reaches 3 points.

#### Scenario: Player reaches 3 points
- **WHEN** a player's score reaches 3 after a round
- **THEN** the match ends immediately
- **AND** a victory screen is shown (same pattern as RPS Battle game-over screen)

#### Scenario: Rematch
- **WHEN** both players click "Rematch" after a match ends
- **THEN** a new match starts with both scores reset to 0
