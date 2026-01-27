# Piece Movement Specification

## ADDED Requirements

### Requirement: Smooth Movement Animation
The application MUST animate the movement of pieces between cells.

#### Scenario: Visual Tracking
- **WHEN** a piece moves from one cell to another (either by player or opponent)
- **THEN** the piece should visually slide to the new position over a short duration (e.g. 0.2-0.5s) instead of appearing instantly.
