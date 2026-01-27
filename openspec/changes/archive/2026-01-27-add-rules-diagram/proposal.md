# Proposal: Rules Diagram Modal

## Goal
Add a "Rules" button to the game interface (both Setup and Play phases) that opens a visual diagram explaining the weakness/strength relationships between piece types. This helps new players understand the mechanics, especially for the complex RPSLS mode.

## Core Changes
1.  **New Component**: `RulesModal`
    *   Displays a diagram or chart of interactions.
    *   Adapts to `classic` (Triangle) vs `rpsls` (Pentagon) mode.
2.  **UI Integration**:
    *   Add a floating or header-integrated "?" or "Rules" button in `SetupScreen` and `GameScreen`.
    *   Button should be unobtrusive but accessible.

## Implementation Details
### Diagram Visualization
Since dynamic SVG might be complex, we can use a CSS-based approach with absolute positioning or a pre-defined SVG layout.
*   **Classic**: Rock -> Scissors -> Paper -> Rock.
*   **RPSLS**: The standard pentagon with arrows.
    *   Alternatively, a clean list of "X beats Y, Z" for clarity if a graph is too cluttered on mobile.
    *   *Decision*: Let's try to make a nice CSS-based graph if possible, or a clear grid matrix fallback.

### Data
*   Use `RPSLS_WINS` and `COMBAT_OUTCOMES` from `@rps/shared` to generate the logic/text if needed.

## User Interface
*   **Button**: A round icon button (e.g., `?` or `i`) in the top-right or top-left corner.
*   **Modal**: Standard overlay modal (reusing styles from `TieBreakerModal` or generic modal).
