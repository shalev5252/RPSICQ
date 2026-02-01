# Tasks: Enhance Tie-Breaker UX

- [x] Spec Updates <!-- id: 0 -->
    - [x] Update `tie-breaker-ux` spec for movable window and animations
    - [x] Update `piece-visibility` or similar for "Split Piece" rendering
- [x] TieBreakerModal Improvements <!-- id: 1 -->
    - [x] Implement `framer-motion` drag (like SettingsWindow)
    - [x] Add minimize/maximize functionality
    - [x] Implement "Tie Animation" (collision) replacing static retry view
    - [x] Improve post-selection feedback
- [x] Board Visualization <!-- id: 2 -->
    - [x] Update `GameScreen` to pass "combat cell" info to Board
    - [x] Update `Board` and `BoardCell` to render "Split Piece" (vertical gradient)
    - [x] Ensure correct icon is shown on the split piece
- [x] Verification <!-- id: 3 -->
    - [x] Test drag/minimize behavior
    - [x] Verify split piece rendering on correct cell
    - [x] Verify animations play correctly
