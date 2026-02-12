# Tasks: Restore Active Sessions

## Client Implementation

- [ ] Create `client/src/utils/sessionStorage.ts` utility module
  - [ ] `setActiveSession(sessionId, phase)` - saves to localStorage
  - [ ] `getActiveSession()` - retrieves and validates (age < 5 min)
  - [ ] `clearActiveSession()` - removes from localStorage
  - [ ] Add `rps_active_session` key constant

- [ ] Update `client/src/store/gameStore.ts`
  - [ ] Add `storedSessionId: string | null` state
  - [ ] Add `isRestoringSession: boolean` state
  - [ ] Add `setStoredSessionId(id)` action
  - [ ] Add `setIsRestoringSession(value)` action

- [ ] Update `client/src/App.tsx`
  - [ ] On mount: check `getActiveSession()`
  - [ ] If session found: set `storedSessionId` in store
  - [ ] If session not found: clear any stale data

- [ ] Update `client/src/hooks/useSocket.ts`
  - [ ] On `GAME_FOUND`: call `setActiveSession(sessionId, 'setup')`
  - [ ] On `GAME_START`: update session phase to 'playing'
  - [ ] On `SESSION_RESTORED`: set `isRestoringSession = false`
  - [ ] On `GAME_OVER`: call `clearActiveSession()`
  - [ ] On `OPPONENT_DISCONNECTED`: call `clearActiveSession()`
  - [ ] On manual `LEAVE_SESSION`: call `clearActiveSession()`

- [ ] Update `client/src/hook s/useSocket.ts` handshake auth
  - [ ] Pass `sessionId` (if exists) along with `playerId` in socket auth

## Testing

- [ ] Manual test: Join game, refresh browser → verify auto-rejoin
- [ ] Manual test: Join game, close tab, reopen within grace period → verify auto-rejoin
- [ ] Manual test: Join game, wait > grace period, reopen → verify clean state
- [ ] Manual test: End game normally → verify localStorage cleared
- [ ] Manual test: Opponent disconnects → verify localStorage cleared
- [ ] Edge case: localStorage disabled → verify graceful fallback

## Documentation

- [ ] Update `openspec/specs/session-persistence/spec.md` with requirements and scenarios
