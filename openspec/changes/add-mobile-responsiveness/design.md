# Design: Mobile Responsiveness

## Overview
This design adds mobile support by introducing dynamic cell sizing via CSS custom properties and media queries for layout adjustments.

## Breakpoints

| Breakpoint | Description |
|------------|-------------|
| ≥ 768px | Desktop/Tablet (current behavior) |
| < 768px | Mobile layout |

## Dynamic Cell Sizing

### Approach
Use CSS `calc()` and viewport units to compute cell size based on screen width.

```css
:root {
  --board-columns: 7;
  --board-padding: 16px; /* total horizontal padding/margin */
  --cell-gap: 0px;
  /* Default desktop size */
  --cell-size: 70px;
}

@media (max-width: 767px) {
  :root {
    /* Fill screen width: (100vw - padding) / columns */
    --cell-size: calc((100vw - var(--board-padding)) / var(--board-columns));
  }
}
```

### Component Updates
- `Cell.css`: Change `width: 70px; height: 70px;` to `width: var(--cell-size); height: var(--cell-size);`
- `Piece.tsx/css`: Scale piece emojis/icons proportionally

## Layout Changes

### SetupScreen (Mobile)
```
┌────────────────────────────┐
│   "Opponent connected" msg │  ← Above board (conditional)
├────────────────────────────┤
│                            │
│         BOARD              │  ← Full width
│                            │
├────────────────────────────┤
│  [King Tray] [Pit Tray]    │  ← Below board (before placement)
│   OR                       │
│  [Shuffle] [Start Game]    │  ← After King+Pit placed
└────────────────────────────┘
```

### GameScreen (Mobile)
```
┌────────────────────────────┐
│     "Your Turn!" badge     │  ← Above board
│     "You are RED/BLUE"     │
├────────────────────────────┤
│                            │
│         BOARD              │  ← Full width
│                            │
└────────────────────────────┘
```

## CSS Files to Modify

| File | Changes |
|------|---------|
| `index.css` or `App.css` | Add CSS variables for `--cell-size` |
| `Cell.css` | Use `var(--cell-size)` instead of fixed 70px |
| `Piece.css` | Scale piece size relative to cell |
| `SetupScreen.css` | Add mobile media query for vertical stacking |
| `GameScreen.css` | Add mobile media query for header repositioning |
| `Board.css` | Ensure flexbox adapts to dynamic cell size |

## Touch Considerations
- Click-to-move already implemented (works on touch)
- Drag & drop may need `touch-action: none` to prevent scroll conflicts
- Ensure tap targets are at least 44px (Apple HIG minimum)

## Viewport Meta Tag
Ensure `index.html` has:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
```
