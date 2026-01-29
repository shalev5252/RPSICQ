# Spec Delta: Piece Visibility

## MODIFIED Requirements

### Requirement: Combat Cell Visualization
The board MUST clearly indicate exactly where a combat or tie is taking place.

#### Scenario: Split Piece Rendering
- **GIVEN** two pieces are in combat (tie breaker phase)
- **WHEN** the board is rendered
- **THEN** the cell where the combat is occurring displays a specific "Duel" piece
- **AND** this piece is colored with a vertical split (Left: Player A color, Right: Player B color)
- **AND** the icon on this piece is the unit type that caused the tie (e.g. Rock if both played Rock)
- **AND** if hidden info prevents knowing the unit, a generic "Clash" icon is used (but for ties, unit is known)
