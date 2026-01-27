# combat Specification

## Purpose
TBD - created by archiving change add-rpsls-mode. Update Purpose after archive.
## Requirements
### Requirement: RPSLS Combat Matrix
In RPSLS mode, combat resolution MUST use the extended interaction matrix.

#### Scenario: Extended Combat Outcomes
- **WHEN** two units engage in combat in RPSLS mode
- **THEN** the winner is determined by:
  | Unit | Defeats |
  |------|---------|
  | Rock | Scissors, Lizard |
  | Paper | Rock, Spock |
  | Scissors | Paper, Lizard |
  | Lizard | Spock, Paper |
  | Spock | Scissors, Rock |

### Requirement: RPSLS Tie Resolution
In RPSLS mode, the tie resolution phase MUST include all five unit choices.

#### Scenario: Tie Resolution Options
- **WHEN** a tie occurs in RPSLS mode
- **THEN** the tie resolution UI should display options for Rock, Paper, Scissors, Lizard, and Spock.

