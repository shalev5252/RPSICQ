# Restore Active Sessions

## Why

**Problem**: When a player accidentally disconnects (e.g., browser refresh, network hiccup, tab closure) during an active game, they currently:
1. Land on the homepage/matchmaking screen when returning to the site
2. Cannot rejoin their active game session
3. Cause their opponent to wait during the grace period before the game is aborted

This creates a poor user experience, especially when the disconnection is accidental and the opponent is still engaged.

**User Impact**: Lost game progress, frustrated players, and wasted time during the 30-second grace period. Real incident: A player's session was logged out while their opponent remained active. When they re-entered the site (within grace period), they were directed to homepage and couldn't return, eventually forcing both players out of the game.

## What Changes

Add automatic session persistence and restoration:

1. **Client-Side Persistence**: Store active `sessionId` in localStorage when a game session begins
2. **Auto-Restoration on Mount**: On app load, check for stored `sessionId` and automatically attempt reconnection if the session is still active
3. **Session Cleanup**: Clear stored `sessionId` when:
   - Game ends normally (game over, forfeit)
   - Grace period expires
   - User explicitly leaves session
4. **Optional: Restoration Alert**: (Alternative to auto-restore) Show an alert/notification when the app detects an active session, allowing the user to choose whether to rejoin

### Behavior Flow

**Current state**:
- Player disconnects → grace period starts → player refreshes → lands on homepage → can't rejoin → grace period expires → both kicked

**New state**:
- Player disconnects → grace period starts → player refreshes → client detects stored sessionId → **automatically rejoins** → game continues seamlessly

## Impact

**User-Facing Changes**:
- Players who disconnect will automatically return to their active game when they reload the site (within grace period)
- No new UI required for Option 1 (auto-restore), or a simple modal for Option 2 (confirmation alert)

**Breaking Changes**: None - this is purely additive functionality

**Dependencies**: None

**Risks**:
- If sessionId persists after server has cleaned up the session, client will get "session not found" error (mitigated by clearing on OPPONENT_DISCONNECTED event)
- Session hijacking concerns if localStorage is compromised (low risk in practice for a game app)
