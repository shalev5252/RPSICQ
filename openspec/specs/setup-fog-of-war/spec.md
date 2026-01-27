# setup-fog-of-war Specification

## Purpose
TBD - created by archiving change fix-gameplay-bugs. Update Purpose after archive.
## Requirements
### Requirement: Fog of War During Setup
Players SHALL NOT see ANY opponent pieces during the setup phase - not even their positions.

#### Scenario: Opponent pieces completely hidden during setup
- **GIVEN** player A is in the setup phase
- **AND** player B has placed their King and Pit
- **AND** player B has shuffled their RPS pieces
- **WHEN** player A's board is displayed
- **THEN** player B's pieces are NOT rendered at all
- **AND** player B's designated rows appear empty to player A

#### Scenario: Opponent pieces appear after game starts
- **GIVEN** both players have confirmed setup
- **WHEN** the game phase transitions to 'playing'
- **THEN** opponent pieces are visible with "hidden" type (fog of war)
- **AND** opponent pieces show their color but not their type

