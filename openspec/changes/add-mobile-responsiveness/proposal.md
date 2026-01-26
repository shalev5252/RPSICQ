# Add Mobile Responsiveness

## Why
The game currently targets desktop and tablet screens but is not playable on mobile phones (iPhone, Android). The board cells are fixed at 70px, making the 7-column board 490px wide, which overflows on typical mobile screens (375px).

## What Changes
Add responsive CSS to make the game fully playable on mobile devices in portrait orientation, with dynamic cell sizing that adapts to screen width.

## Summary
- Target mobile viewport: 375px width (iPhone)
- Dynamic cell sizing: Board fills screen width
- Layout changes for Setup and Game screens
- Portrait orientation focus

## User Experience

### Setup Phase (Mobile)
1. Board displayed at top, full width
2. King and Pit tray displayed **below** the board
3. After King and Pit are placed, tray is replaced with:
   - Shuffle button
   - Start Game button
4. Opponent status message appears **above** the board

### Game Phase (Mobile)
1. Turn indicator displayed **above** the board
2. Board fills screen width
3. Player color badge below turn indicator

## Scope
- **In Scope**: CSS responsive breakpoints, dynamic cell sizing, layout reordering for mobile
- **Out of Scope**: Landscape optimization, pinch-to-zoom gestures, native app

## Related Specs
- New spec: `mobile-ui` - Mobile-specific UI requirements
