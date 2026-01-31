# Change: Fix game-over navigation, add player liveness detection, and implement private game rooms

## Why
Three issues need addressing:
1. **Bug**: After a game ends, clicking "Return Home" does not close the game-over overlay or navigate to the main menu. The current implementation calls `reset()` followed by `window.location.reload()`, but the reload is a heavy-handed approach that may not work reliably (especially on mobile/PWA contexts), and the state reset alone should suffice.
2. **Bug**: When a player permanently leaves (closes tab/browser) during a PvP game, the opponent is left hanging. The existing 30-second grace period only triggers on Socket.IO `disconnect` events, but Socket.IO's built-in `pingTimeout` (60s) + `pingInterval` (25s) means detection can take up to 85 seconds. The opponent sees no feedback during this time and has no way to know the other player abandoned the game.
3. **Feature**: Players want to play with friends directly instead of relying on random matchmaking. A private room system with shareable codes would enable this.

## What Changes
- **Game-over navigation (bug fix)**: Replace `window.location.reload()` in `handleReturnHome` with proper state reset that transitions back to the `waiting` phase, cleaning up the session on both client and server.
- **Player liveness detection (bug fix)**: Tighten Socket.IO ping settings and add an application-level heartbeat. The server pings active PvP game clients every 30 seconds; if a client misses 2 consecutive heartbeats (60s), the server treats it as a permanent disconnect and ends the session, notifying the remaining player immediately. Also show a visible "opponent reconnecting" indicator to the remaining player during the grace period.
- **Private game rooms (feature)**: Add a room code system where a player can create a private room and share a 7-digit code with a friend. The friend enters the code on the main screen to join. The game mode is set by the room creator. Codes expire after 10 minutes or when a session starts. No two active rooms can share the same code.

## Impact
- Affected specs: `matchmaking`, `session-reconnection`, `socket-connection`
- New specs: `game-over-navigation`, `player-liveness`, `game-rooms`
- Affected code:
  - **Client**: `GameOverScreen.tsx`, `useSocket.ts`, `useGameSession.ts`, `MatchmakingScreen.tsx`, `ModeSelect.tsx`, `gameStore.ts`, `App.tsx`
  - **Server**: `handlers.ts`, `GameService.ts`, `MatchmakingService.ts`, `index.ts` (Socket.IO config)
  - **Shared**: `constants.ts`, `types.ts`
