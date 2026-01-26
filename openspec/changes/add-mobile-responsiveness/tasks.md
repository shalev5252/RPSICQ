# Tasks: Add Mobile Responsiveness

## Prerequisites
- Existing CSS files for SetupScreen, GameScreen, Board, Cell
- Click-to-move feature already works (touch-compatible)

---

## Task 1: Add CSS Custom Properties for Cell Sizing
**Files**: `client/src/index.css` or new `client/src/styles/variables.css`

Add CSS custom properties for dynamic cell sizing with mobile breakpoint.

**Acceptance**:
- [x] `--cell-size` variable defaults to 70px
- [x] Media query at 767px sets `--cell-size` to `calc((100vw - 16px) / 7)`
- [x] Variables accessible globally

---

## Task 2: Update Cell.css to Use Dynamic Sizing
**Files**: `client/src/components/setup/Cell.css`

Replace fixed 70px dimensions with CSS variable.

**Acceptance**:
- [x] Cell uses `var(--cell-size)` for width and height
- [x] Cell appearance unchanged on desktop
- [x] Cells scale correctly on 375px viewport

---

## Task 3: Update Piece Sizing for Mobile
**Files**: `client/src/components/setup/Piece.tsx`, `client/src/components/setup/Piece.css`

Ensure piece icons/emojis scale with cell size.

**Acceptance**:
- [x] Piece size relative to cell (e.g., 80% of cell size)
- [x] Readable on mobile viewport

---

## Task 4: Update SetupScreen Layout for Mobile
**Files**: `client/src/components/setup/SetupScreen.tsx`, `client/src/components/setup/SetupScreen.css`

Reorder layout for mobile: status above, board, then tray/buttons below.

**Acceptance**:
- [x] Mobile media query stacks elements vertically
- [x] Opponent status appears above board on mobile
- [x] Tray appears below board on mobile
- [x] After placement, tray replaced with Shuffle/Start buttons
- [x] Desktop layout unchanged

---

## Task 5: Update GameScreen Layout for Mobile
**Files**: `client/src/components/game/GameScreen.tsx`, `client/src/components/game/GameScreen.css`

Ensure turn indicator and color badge above board work on mobile.

**Acceptance**:
- [x] Turn indicator readable on mobile (smaller font if needed)
- [x] Board fills width on mobile
- [x] Desktop layout unchanged

---

## Task 6: Ensure Viewport Meta Tag
**Files**: `client/index.html`

Verify/add proper viewport meta tag for mobile.

**Acceptance**:
- [x] `<meta name="viewport" content="width=device-width, initial-scale=1.0">` present

---

## Task 7: Manual Testing on Mobile Viewport

**Verification steps**:
1. Open browser DevTools, set viewport to iPhone (375x667)
2. Navigate to matchmaking, setup, and game screens
3. Verify board fits within screen width
4. Verify tray appears below board in setup
5. Verify turn indicator appears above board in game
6. Test click-to-move and drag on touch simulator
