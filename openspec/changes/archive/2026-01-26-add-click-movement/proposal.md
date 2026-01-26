# Add Click-to-Move Feature

## Summary
Add an alternative piece movement method alongside the existing drag & drop. Users can click on their own piece to highlight valid destination cells with a glowing border, then double-click a valid cell to execute the move.

## Motivation
Some users prefer click-based interaction over drag & drop, especially on touch devices or for accessibility reasons. This provides flexibility while maintaining the existing movement functionality.

## User Experience Flow
1. **Short click** on own piece (during player's turn) → highlights valid move cells with glowing border
2. **Double-click** on a highlighted cell → executes the move
3. **Click elsewhere** (invalid cell or off-board) → cancels selection
4. **Long press / drag** → existing drag & drop behavior (unchanged)

## Scope
- **In Scope**: Click selection, glowing cell borders, double-click to move, coexistence with drag & drop
- **Out of Scope**: Touch gesture optimization, mobile-specific interactions, settings/preferences UI

## Related Specs
- [piece-movement](specs/piece-movement/spec.md) - Modified to add click-based selection and movement
