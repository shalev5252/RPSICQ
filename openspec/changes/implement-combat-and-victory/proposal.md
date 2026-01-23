# Implement Combat and Victory Logic

## Goal
Implement the core combat mechanics, tie resolution system, and victory conditions for the game. This ensures that when pieces collide, the correct game rules are applied, and the game concludes when a victory condition is met.

## Why
Currently, the game allows movement but does not resolve what happens when a piece moves onto an occuped cell. We need to implement the Rock-Paper-Scissors combat rules to make the game playable. Additionally, we need to enforce the victory condition (capturing the King) to allow the game to end.

## What Changes

### Combat Mechanics
- **Interaction**: specific logic when a piece moves to a cell occupied by an opponent.
- **Resolution**:
    - **Rock > Scissors**
    - **Scissors > Paper**
    - **Paper > Rock**
    - **Pit > All Attacking Pieces** (Attacker dies)
    - **Any Attacker > King** (Victory for attacker)
- **Tie Resolution**:
    - When pieces of the same type collide (e.g., Rock vs Rock).
    - Transitions to a `tie_breaker` phase.
    - Both players selected a new piece type from a UI modal.
    - The pieces are permanently updated to the new type.
    - Combat is re-evaluated with the new types.
- **Visuals**:
    - **Halo Effect**: Winning piece gets a visual halo and is permanently revealed.
    - **Reveal**: Both pieces are revealed during combat.

### Victory Conditions
- **King Capture**: Game ends immediately if a King is attacked.
- **Victory Screen**: Displays the winner and allows returning to lobby/home.

## User Interface
- **Combat Animation**: Optional simple feedback for now (or modal).
- **Tie Breaker Modal**: A dialog for players to choose their new piece type.
- **Game Over Screen**: Clear indication of win/loss.

## API / Data Model Changes
- **GameState**: Add `combat` phase or sub-state to handle ties.
- **Socket Events**:
    - `COMBAT_RESULT`: Notify clients of combat outcome (winner, loser, or tie).
    - `TIE_BREAKER_INIT`: Notify clients to show selection screen.
    - `TIE_BREAKER_COMMIT`: Client sends selected type.
    - `GAME_OVER`: Notify clients of winner.
