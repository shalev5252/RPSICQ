# Add Movement Animations

## Summary
Implement smooth animations for game pieces when they move between cells on the board.

## Motivation
The user requested movement animations ("הוספת אנימציות של תנועה") to improve the visual experience and make gameplay feel more fluid.

## Why
Current piece movement is instantaneous, which can make it hard to track moves, especially rapid ones or those triggered by opponents. Animation helps tracking and game feel.

## What Changes
- Install `framer-motion` in the client.
- Update `Piece` component to support animation via `layoutId`.
- Update `Cell` to pass the piece ID to `Piece`.

## Scope
- **In Scope**:
    - Installing `framer-motion` (`client/package.json`).
    - Updating `client/src/components/setup/Piece.tsx` to use `motion.div`.
    - Updating `client/src/components/setup/Cell.tsx` to pass unique `layoutId`.
- **Out of Scope**:
    - Complex combat animations (explosions, etc.), though `layoutId` might handle the "move to target" part of an attack nicely.
    - Sound effects (already handled).

## Related Specs
- `openspec/changes/add-movement-animations/specs/piece-movement/spec.md`: Adds UI requirement for animation.
