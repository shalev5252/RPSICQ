# pattern-recognition Specification

## Purpose
TBD - created by archiving change enhance-ai-pattern-recognition. Update Purpose after archive.
## Requirements
### Requirement: The AI shall detect cross-battle first-choice patterns
The AI SHALL track the *first* tie-breaker choice made by the player in each combat encounter across the entire session. If the player tends to start ties with the same element (e.g., always opens with "Rock"), the AI SHALL exploit this pattern.
#### Scenario: Cross-battle first-choice repetition
- **WHEN** a new tie-breaker begins after the player has started the last 3 tie-breakers with "Rock"
- **THEN** the AI predicts the player will choose "Rock" first
- **THEN** the AI chooses "Paper" to counter.

### Requirement: The AI shall detect intra-battle consecutive choice patterns
The AI SHALL track the player's choices *within* a single prolonged tie-breaker (multiple rounds in the same combat). It SHALL detect:
- **Repetition**: Player keeps picking the same element (e.g., Rock, Rock, Rock).
- **Rotation**: Player cycles through elements predictably (e.g., R -> P -> S -> R).
- **Preference**: Player favors certain elements over others.
#### Scenario: Intra-battle repetition detection
- **WHEN** a tie-breaker is ongoing and the player has chosen "Scissors" in the last 2 consecutive rounds
- **THEN** the AI predicts "Scissors" again for the next round
- **THEN** the AI chooses "Rock" to win.

#### Scenario: Intra-battle rotation detection
- **WHEN** a tie-breaker is ongoing and the player's last 3 choices were "Rock", "Paper", "Scissors"
- **THEN** the AI predicts "Rock" (cycle restart) for the next round
- **THEN** the AI chooses "Paper" to counter.

### Requirement: The AI shall use random fallback when no pattern is confident
When no strong pattern is detected (confidence below threshold), the AI SHALL default to a random choice to remain unpredictable.
#### Scenario: Fallback to Random
- **WHEN** a tie-breaker occurs and the player has no discernible pattern
- **THEN** the AI prediction confidence is low
- **THEN** the AI chooses a random counter-move (standard behavior).

### Requirement: The AI shall persist learning within a session
The pattern history SHALL persist across multiple games within the same session to exploit long-term tendencies.
#### Scenario: History Persistence
- **WHEN** a new game starts after a player plays multiple matches in the same session
- **THEN** the AI retains the tie-breaker history from previous games
- **THEN** uses it to predict moves in the new game.

