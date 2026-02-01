# Spec Delta: Tie Breaker UX

## MODIFIED Requirements

### Requirement: Tie-Breaker Modal Display
The tie-breaker modal MUST be non-intrusive and allow players to view the board state.

#### Scenario: Movable and Minimizable Modal
- **GIVEN** the tie-breaker modal is open
- **WHEN** the user drags the modal
- **THEN** moves freely on the screen
- **AND** when the user clicks the "Minimize" button
- **THEN** the modal shrinks to a small floating action button
- **AND** clicking the floating button restores the modal

#### Scenario: Tie Retry Animation
- **GIVEN** a tie occurs during the tie-breaker phase
- **WHEN** the result is displayed
- **THEN** an animation plays showing the two identical pieces colliding and rebounding
- **AND** the static "Tie Again" screen is NOT shown

### Requirement: Tie Clarity
The game MUST clearly communicate the outcome of a resolved tie.

#### Scenario: Resolution Feedback
- **GIVEN** a tie is resolved (one player wins or another tie occurs)
- **THEN** the choices of both players are clearly displayed
- **AND** the winning/losing logic is visually apparent (e.g. Rock crushes Scissors)
