# Persist Session on Page Refresh

## Summary

Currently, when a player refreshes their browser, the socket disconnects and the game session is immediately terminated. This change will allow players to reconnect to their active session after a page refresh.

---

## User Review Required

> [!IMPORTANT]
> **Grace Period Duration**: How long should the server wait before declaring a player as truly disconnected? I suggest **30 seconds** - long enough for a page refresh but not so long that the opponent waits forever. Is this acceptable?

> [!NOTE]
> During the grace period, the opponent will see a "Waiting for opponent to reconnect..." message instead of being immediately re-queued.

---

## Proposed Changes

### Overview

1. **Persistent Player ID**: Store a unique player ID in localStorage that persists across page refreshes
2. **Grace Period**: Server waits 30 seconds before ending a session on disconnect
3. **Reconnection**: Client sends player ID on connect, server restores them to their session

---

### Client-Side Changes

#### [MODIFY] [socket/index.ts](file:///Users/shalevshasha/rps/client/src/socket/index.ts)

- Generate and store a persistent `playerId` in localStorage
- Send `playerId` in socket auth on connection

#### [MODIFY] [useSocket.ts](file:///Users/shalevshasha/rps/client/src/hooks/useSocket.ts)

- Handle `SESSION_RESTORED` event to restore game state after reconnection
- Handle `OPPONENT_RECONNECTING` event to show waiting indicator

---

### Server-Side Changes

#### [MODIFY] [GameService.ts](file:///Users/shalevshasha/rps/server/src/services/GameService.ts)

- Add `disconnectTimers: Map<string, NodeJS.Timeout>` to track pending disconnects
- Add `handleTemporaryDisconnect(socketId)`: Start grace period timer
- Add `handleReconnect(playerId, newSocketId)`: Cancel timer and restore player
- Modify session to track `playerId` separately from `socketId`

#### [MODIFY] [handlers.ts](file:///Users/shalevshasha/rps/server/src/socket/handlers.ts)

- On `disconnect`: Start grace period instead of immediate session end
- On `connection`: Check if this is a reconnecting player and restore session
- Add `REJOIN_SESSION` event for explicit reconnection

#### [MODIFY] [constants.ts](file:///Users/shalevshasha/rps/shared/src/constants.ts)

- Add `SESSION_RESTORED`, `OPPONENT_RECONNECTING`, `REJOIN_SESSION` events

---

## Verification Plan

### Manual Testing

1. Start a game with two browser tabs
2. Refresh one tab during:
   - Setup phase → should restore to setup
   - Playing phase → should restore to playing with correct board state
3. Verify opponent sees "Reconnecting..." message briefly
4. Verify if player doesn't reconnect within 30s, session ends normally
