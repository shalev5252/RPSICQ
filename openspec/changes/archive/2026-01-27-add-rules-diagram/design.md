# Design: Rules Diagram

## Components

### `RulesModal.tsx`
*   **Props**: `onClose: () => void`, `gameMode: GameMode`
*   **State**: None (stateless presentation)
*   **Render**:
    *   Overlay
    *   Card container
    *   Title: "Combat Rules"
    *   **Content**:
        *   If `classic`: Simple Rock-Paper-Scissors cycle.
        *   If `rpsls`: Pentagon diagram or list of interactions.
    *   Close Button

### `RulesButton.tsx` (Optional, or just inline)
*   Standard icon button styling.

## CSS Styling (`RulesModal.css`)
*   **Diagram Layout**:
    *   **Classic**: 3 items in a triangle. Arrows using CSS/SVG backgrounds or simple `::after` elements.
    *   **RPSLS**: 5 items in a circle (pentagon).
        *   Position items using `transform: rotate(...) translate(...) rotate(...)`.
        *   Draw lines using SVG overlay ideally, or just list the text rules below the icons if drawing lines is too hard to make responsive.
        *   *Idea*: A simple "Who Beats Who" list might be more readable on mobile than a complex graph.
        *   *Refined Idea*: Show the icons in a circle, and when you hover/tap one, highlight who it beats (Green) and who beats it (Red). This is interactive and cleaner.

## Interaction
1.  User clicks "?" button.
2.  Modal opens.
3.  User clicks outside or "Close" to dismiss.
