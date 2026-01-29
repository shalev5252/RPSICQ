# Design: Enhance Tie-Breaker UX

## Architecture

### Movable & Minimizable Modal
We will reuse the pattern from `SettingsWindow` but extend it with a "minimized" state.
- **State**: `isMinimized` (boolean).
- **UI**: 
    - When `true`: Renders as a floating button/tag (e.g., "Open Tie Breaker").
    - When `false`: Renders the full modal (draggable).
- **Positioning**: Use `framer-motion` for smooth transitions between states.

### Split Piece Visualization
The `GameScreen` knows which cell is in combat during a `tie_breaker` phase (from `gameState.combat`).
We need to pass this information down to `Board`.
- **Prop**: `combatPosition: Position | null` passed to `Board`.
- **Rendering**:
    - If a cell matches `combatPosition`, we override the standard piece rendering.
    - **Style**: CSS `background: linear-gradient(90deg, var(--color-player-a) 50%, var(--color-player-b) 50%)`.
    - **Icon**: The unit type is known (it's a tie, so both are the same). However, strictly speaking, pieces might be hidden? 
    - *Clarification*: The user said "Icon of the object both players played". In a tie, they revealed their pieces, so yes, it is known.

### Tie Animation
Instead of a static "Try Again" message:
- **Component**: `CombatClashAnimation`.
- **Behavior**:
    - Animate two icons (User's choice vs Opponent's choice) moving towards center.
    - "Hit" effect.
    - Move back.
    - Repeat or fade out.
- **Timing**: Replaces the 2-second timeout view in `TieBreakerModal`.

## Data Flow
1. `GameScreen` receives `gameState` with `phase: 'tie_breaker'` and `combat` details.
2. `GameScreen` calculates `combatCell` and passes to `Board`.
3. `Board` renders the split piece at that location.
4. `TieBreakerModal` handles the interactive UI.
