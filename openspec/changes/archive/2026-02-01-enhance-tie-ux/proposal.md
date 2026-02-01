# Proposal: Enhance Tie-Breaker UX

## Goal
Improve the user experience during combat ties by making the UI less intrusive, adding clarity to the board state, and enhancing the visual feedback of the tie-breaking process.

## Problem
- The current tie-breaker modal blocks the view of the board, preventing players from analyzing the context of the battle.
- When a tie occurs, it's not visually obvious which cell is being contested or what pieces caused the tie (since they are hidden).
- The "tie again" screen is static and lacks excitement.
- The resolution of a tie (what each player picked) is not clearly communicated if it ends the tie.

## Solution
1.  **Interactable Window**: Make the tie-breaker modal draggable and minimizable.
    -   Players can move it aside to see the board.
    -   Players can "minimize" it to a small button and re-open it.
2.  **On-Board Visualization**: Highlight the contested cell with a unique "Split Piece" visual.
    -   The piece will be colored half Player A's color and half Player B's color (vertical split).
    -   It will display the icon of the piece (since it's a tie, they are the same type).
3.  **Tie Animation**: Replace the simple "retry" icon with an animation.
    -   Show two pieces colliding, backing off, and colliding again to represent the clash.
4.  **Clarity**: Ensure the final choice of each player is clearly shown after the tie is resolved.

## Risks
-   **Complexity**: Coordinating the "Split Piece" visual requires passing transient combat state to the `Board` component.
-   **Mobile**: Draggable/minimizable windows need careful handling on mobile (similar to Settings Window).
