# Fix Gameplay Bugs

## Summary

This change fixes three bugs discovered during gameplay testing:

1. **Setup Phase Fog of War** - Opponent pieces visible during setup phase when they should be completely hidden
2. **Tie-Breaker Title Bug** - Shows "tie again" on first combat tie, and indicator sometimes missing
3. **Auto-Pass for Immobile Players** - No handling when a player can't move any pieces

---

## User Review Required

> [!IMPORTANT]
> **Bug #1 (Setup Fog of War)**: Currently the server sends opponent piece positions during setup (as "hidden" type). The fix will completely exclude opponent pieces from the setup board view. This changes behavior - opponent piece positions will only appear after GAME_START.

---

## Proposed Changes

### Bug 1: Complete Fog of War During Setup

Currently `getPlayerSetupView` sends opponent pieces with type "hidden". Per the project spec: "Fog of War: Players cannot see opponent's piece types (only color)" - but during setup, pieces shouldn't be visible at all.

#### [MODIFY] [GameService.ts](file:///Users/shalevshasha/rps/server/src/services/GameService.ts)

Update `getPlayerSetupView` to completely exclude opponent pieces from the board view during setup phase.

---

### Bug 2: Tie-Breaker Title and Indicator

Two issues:
- `retryCount` starts at 0, so first tie shows "tie again" because the component checks `retryCount > 0`
- The tie indicator may not show if the component state isn't properly reset between combats

#### [MODIFY] [TieBreakerModal.tsx](file:///Users/shalevshasha/rps/client/src/components/game/TieBreakerModal.tsx)

- Track whether this is the first tie for the current combat (not just retry count)
- Ensure proper reset when entering new combat

#### [MODIFY] [gameStore.ts](file:///Users/shalevshasha/rps/client/src/store/gameStore.ts)

- Reset `tieBreakerState.retryCount` when entering tie_breaker phase

---

### Bug 3: Auto-Pass Turn for Immobile Players

When a player only has King and/or Pit (which cannot move), their turn should auto-pass with a notification.

#### [MODIFY] [GameService.ts](file:///Users/shalevshasha/rps/server/src/services/GameService.ts)

Add `hasMovablePieces(socketId)` method to check if player has any pieces that can move.

#### [NEW] [constants.ts](file:///Users/shalevshasha/rps/shared/src/constants.ts)

Add `TURN_SKIPPED` socket event.

#### [MODIFY] [handlers.ts](file:///Users/shalevshasha/rps/server/src/socket/handlers.ts)

After each move, check if next player has movable pieces. If not, emit `TURN_SKIPPED` and pass turn.

#### [NEW] [TurnSkippedModal.tsx](file:///Users/shalevshasha/rps/client/src/components/game/TurnSkippedModal.tsx)

Display "Can't move - passes turn to opponent" for 2 seconds.

---

## Verification Plan

### Manual Testing

1. **Setup Fog of War**
   - Start new game with two tabs
   - Place King/Pit and shuffle in one tab
   - Verify opponent tab shows NO pieces in player's rows during setup

2. **Tie-Breaker Title**
   - Trigger first combat tie → should show "It's a Tie!" (not "tie again")
   - Choose same element → should show "It's a tie again!" then reset

3. **Auto-Pass Turn**
   - Eliminate all opponent's RPS pieces (leaving only King/Pit)
   - Verify they see "Can't move" message and turn passes automatically
