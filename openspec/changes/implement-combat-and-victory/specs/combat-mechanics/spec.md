# Combat Mechanics

## ADDED Requirements

### Requirement: RPS Interaction rules
The system MUST resolve combat based on the following hierarchy:
- Rock beats Scissors
- Scissors beats Paper
- Paper beats Rock

#### Scenario: Rock attacks Scissors
- GIVEN a Red Rock moves to a cell occupied by Blue Scissors
- WHEN the move is processed
- THEN the Blue Scissors is removed from the board
- AND the Red Rock occupies the target cell
- AND the Red Rock becomes revealed
- AND the Red Rock gains a "Halo" effect

### Requirement: Pit Interaction rules
The Pit MUST defeat any attacking piece, regardless of type. The Pit itself CANNOT move, so it is always the defender.

#### Scenario: Rock attacks Pit
- GIVEN a Red Rock moves to a cell occupied by a Blue Pit
- WHEN the move is processed
- THEN the Red Rock is removed from the board
- AND the Blue Pit is revealed
- AND the Blue Pit gains a "Halo" effect

### Requirement: Tie Resolution
When two pieces of the same type clash (e.g. Rock vs Rock), the system MUST initiate a Tie Breaker phase.

#### Scenario: Tie Breaker Trigger
- GIVEN a Red Rock attacks a Blue Rock
- WHEN the move is processed
- THEN the game phase changes to `tie_breaker`
- AND both players are presented with a selection screen

#### Scenario: Tie Breaker Resolution
- GIVEN the game is in `tie_breaker` phase for a Rock vs Rock clash
- WHEN both players submit their new choice (e.g., Red chooses Paper, Blue chooses Scissors)
- THEN the pieces on the board are updated to the new types PERMANENTLY
- AND the combat is re-evaluated immediately
- AND in this case (Paper vs Scissors), Blue Scissors wins
- AND the game returns to `playing` phase (or ends if King involved, though King triggers instant win)

### Requirement: Piece Reveal
Winning pieces MUST be revealed to the opponent.

#### Scenario: Piece winning combat
- GIVEN a piece wins a combat interaction
- WHEN the combat ends
- THEN the piece's type is visible to the opponent
- AND the piece displays a visual Halo
