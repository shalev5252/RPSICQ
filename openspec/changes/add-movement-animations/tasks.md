# Tasks: Add Movement Animations

## Tasks

### 1. Setup
- [ ] Install `framer-motion` in `@rps/client` workspace.
- [ ] Verify installation by checking `client/package.json`.

### 2. Implementation
- [x] Update `Piece.tsx` (`client/src/components/setup/Piece.tsx`):
    - Import `motion` from `framer-motion`.
    - Change `div` to `motion.div`.
    - Accept `id` prop and pass to `layoutId`.
- [x] Update `Cell.tsx` (`client/src/components/setup/Cell.tsx`):
    - Pass `piece.id` to `Piece` component.

### 3. Verification
- [ ] Verify local moves animate smoothly.
- [ ] Verify opponent moves animate smoothly.
- [ ] Verify pieces don't "teleport" unexpectedly (unless new game starts).
