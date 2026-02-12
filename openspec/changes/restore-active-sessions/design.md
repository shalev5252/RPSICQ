# Design: Restore Active Sessions

## Decision: Auto-Restore vs. Manual Confirmation

**Chosen Approach**: **Auto-restore on mount** (Option 1)

**Rationale**:
- Simpler UX - no modal to dismiss
- Faster rejoining - immediate restoration
- More intuitive - user expects to return to their game
- Consistent with mobile app behavior (background/foreground transitions)

**Alternative Considered**: Show a "Resume Game?" modal
- Pros: Explicit user control, clear about what's happening
- Cons: Extra click, slower restoration, interrupts flow
- **Decision**: Defer this to a future enhancement if users request it

## Architecture

### Client-Side Changes

#### 1. SessionStorage Manager (`client/src/utils/sessionStorage.ts`)
New utility module to manage session persistence:

```typescript
// Save active session
setActiveSession(sessionId: string, phase: GamePhase): void

// Retrieve stored session
getActiveSession(): { sessionId: string; phase: GamePhase } | null

// Clear session on game end
clearActiveSession(): void
```

**Why localStorage?** 
- Persists across tab refreshes/closure
- Simple key-value API
- No server dependency
- Survives brief disconnects

**Data Structure**:
```json
{
  "rps_active_session": {
    "sessionId": "uuid",
    "phase": "playing|setup|finished",
    "timestamp": 1234567890
  }
}
```

#### 2. App.tsx Modifications
On mount, before rendering UI:

1. Check `localStorage` for `rps_active_session`
2. If found and not expired (< 5 minutes old):
   - Set `sessionId` in game store
   - Socket connection will trigger `handleReconnect` server-side via handshake.auth.playerId
3. If SESSION_RESTORED event received → transition to appropriate phase
4. If session not found or expired → clear localStorage, show matchmaking screen

#### 3. useSocket Hook Updates
Add session lifecycle management:

- **On GAME_FOUND**: Save sessionId to localStorage
- **On GAME_OVER / OPPONENT_DISCONNECTED / LEAVE_SESSION**: Clear localStorage
- **On SESSION_RESTORED**: Already handled, no changes needed

#### 4. GameStore Updates
Add:
- `storedSessionId: string | null` - session pending restoration
- `isRestoringSession: boolean` - loading state during restoration

### Server-Side Changes

#### No Server Changes Required ✅

The server already supports reconnection via:
- `handleReconnect(playerId, newSocketId)` in GameService
- `SESSION_RESTORED` event emission in handlers.ts
- playerId passed via `socket.handshake.auth.playerId`

The key insight: **sessionId is already tied to playerId on the server**. When the client reconnects with the same playerId, the server automatically finds and restores the session.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Session expired on server | `handleReconnect` returns null → clear localStorage, show homepage |
| Opponent left during disconnect | `OPPONENT_DISCONNECTED` event → clear localStorage, show homepage |
| localStorage unavailable | Graceful fallback - works like current behavior (no restoration) |
| Stale sessionId (> 5 min old) | Ignore stored session, show matchmaking screen |
| User manually clicks "Leave" | Clear localStorage immediately |

## Open Questions

None - design is straightforward with existing infrastructure.
