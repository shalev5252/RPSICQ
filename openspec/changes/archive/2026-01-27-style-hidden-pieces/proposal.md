# Style Hidden Pieces

## Summary
Update the visual representation of hidden pieces to match the styling of revealed pieces (using the player's color) but without displaying the specific rank icon.

## Motivation
The user requested a cosmetic update where opponent pieces, while hidden, should still reflect the opponent's color rather than being a generic placeholder, without revealing their identity ("שלא יכילו את האייקון שמסגיר אותם").

## Why
Currently, hidden pieces are rendered as a generic dashed circle (`cell__piece--hidden`). This breaks visual consistency. Using the standard `Piece` component for hidden pieces ensures they look like actual game pieces (proper size, color, shape) while maintaining the "Fog of War" mechanic by hiding the rank icon.

## What Changes
- `Cell.tsx`: Remove the custom "hidden" div and use the `Piece` component for `type='hidden'` well.
- `Piece.tsx`: Ensure `type='hidden'` renders the piece container with the correct `owner` color but uses a generic icon (or empty).
  - *Decision*: We will use a simple question mark `?` or empty string. The user said "not contain the icon that gives them away". `?` does not give them away. But to be safe and cleaner, an empty string might be better, or just keeping `?` inside the colored piece. I will stick with current `?` in `PIECE_ICONS` but now it will be inside a colored `Piece` div instead of the transparent one.

## Scope
- **In Scope**:
    - `Cell.tsx` rendering logic.
    - `Piece.tsx` styling for hidden state (if needed).
- **Out of Scope**:
    - changing game mechanics.

## Related Specs
- `openspec/changes/style-hidden-pieces/specs/piece-visibility/spec.md`
