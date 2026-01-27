# Add RPSLS Game Mode

## Summary
Implement Rock-Paper-Scissors-Lizard-Spock (RPSLS) as an alternative game mode with its own matchmaking queue, board size (6x6), and extended combat rules.

## Motivation
User requested an extended game mode inspired by "The Big Bang Theory" RPSLS variant, adding Lizard and Spock units with their own combat interactions.

## Why
Expands gameplay variety without altering the core Classic Mode experience. Players can choose between familiar RPS or the extended RPSLS ruleset.

## What Changes

### 1. Game Mode Selection
- Main menu must allow selection between **Classic** and **RPSLS** modes.
- Mode selection determines board size, unit types, and matchmaking queue.

### 2. Matchmaking
- Separate queues for Classic and RPSLS modes.
- Players can only be matched with others of the same mode.

### 3. Board Configuration
- **Classic**: 6 rows × 7 columns (unchanged).
- **RPSLS**: 6 rows × 6 columns.

### 4. Unit Types (RPSLS Mode)
| Type | Quantity | Defeats |
|------|----------|---------|
| King | 1 | — |
| Pit | 1 | Any attacker |
| Rock | 2 | Scissors, Lizard |
| Paper | 2 | Rock, Spock |
| Scissors | 2 | Paper, Lizard |
| Lizard | 2 | Spock, Paper |
| Spock | 2 | Scissors, Rock |

### 5. Combat Resolution (RPSLS Mode)
- Tie resolution includes Lizard and Spock options.
- Symmetric interaction matrix (no attacker/defender advantage).

### 6. UI/UX
- Setup screen: Allow placing Lizard and Spock.
- Tie resolution screen: Include Lizard and Spock choices.
- Visually distinct icons for all five standard units.

## Scope
- **In Scope**:
  - Game mode selection UI.
  - Separate matchmaking queues.
  - Board size configuration per mode.
  - Lizard/Spock unit types and icons.
  - Extended combat matrix.
- **Out of Scope**:
  - Turn order, movement rules, King/Pit behavior, win conditions (unchanged).

## Related Specs
- `specs/game-modes/spec.md` (new)
- `specs/matchmaking/spec.md` (modified)
- `specs/board-setup/spec.md` (modified)
- `specs/combat/spec.md` (new)
