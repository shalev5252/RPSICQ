# Design: Movement Animations

## Architecture

### 1. Library Selection: Framer Motion
We will use `framer-motion` because:
- It supports "Shared Layout" animations via `layoutId`. This is the perfect mechanism for animating an element (the Piece) moving from one DOM location (Cell A) to another (Cell B) as the React tree updates.
- It requires minimal state management code compared to manual CSS transitions.

### 2. Component Updates

#### `Piece.tsx`
- Convert the root `div` to `motion.div`.
- Accept a `layoutId` prop (which will be the unique `piece.id`).
- Add a defined `transition` (e.g., `type: 'spring'`, or simple `duration`).

#### `Cell.tsx` / `Board.tsx`
- Ensure the `Piece` component receives its stable `id` from the game state.
- When `board` state updates, the same `Piece` (by ID) will appear in a new `Cell`. Framer Motion detects the same `layoutId` in a new position and animates the delta.

## Technical Considerations
- **Z-Index**: Animaing pieces might clip under other cells if z-index isn't handled. `framer-motion` handles this reasonably well during layout animation, but we might need `zIndex: 1` on the moving piece.
- **Performance**: only animating `transform`.

## Verification
- Visually verify pieces slide to new positions instead of teleporting.
