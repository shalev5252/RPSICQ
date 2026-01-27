# piece-visibility Specification

## Purpose
TBD - created by archiving change style-hidden-pieces. Update Purpose after archive.
## Requirements
### Requirement: Hidden Piece Appearance
Hidden pieces MUST visually indicate their owner while concealing their rank.

#### Scenario: Visual Consistency
- **WHEN** an opponent's piece is hidden (Fog of War)
- **THEN** it should be rendered in the opponent's color (Red/Blue).
- **AND** it should NOT display the specific rank icon (Rock/Paper/Scissors).
- **AND** it MAY display a generic indicator (e.g. `?`) to show it is a game piece.

