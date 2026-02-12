# Tasks: Restore Active Sessions

## Client Implementation

- [x] Create `client/src/utils/sessionStorage.ts` utility module
  - [x] `setActiveSession(sessionId, phase)` - saves to localStorage
  - [x] `getActiveSession()` - retrieves and validates (age < 5 min)
  - [x] `clearActiveSession()` - removes from localStorage
  - [x] Add `rps_active_session` key constant

- [x] Update `client/src/App.tsx`
  - [x] On mount: check `getActiveSession()`
  - [x] If session found: set `storedSessionId` in store
  - [x] If session not found: clear any stale data

- [x] Update `client/src/hooks/useSocket.ts`
  - [x] On `GAME_FOUND`: call `setActiveSession(sessionId, 'setup')`
  - [x] On `GAME_START`: update session phase to 'playing'
  - [x] On `SESSION_RESTORED`: set `isRestoringSession = false`
  - [x] On `GAME_OVER`: call `clearActiveSession()`
  - [x] On `OPPONENT_DISCONNECTED`: call `clearActiveSession()`
  - [x] On manual `LEAVE_SESSION`: call `clearActiveSession()`

## Testing

- [ ] Manual test: Join game, refresh browser → verify auto-rejoin
- [ ] Manual test: Join game, close tab, reopen within grace period → verify auto-rejoin
- [ ] Manual test: Join game, wait > grace period, reopen → verify clean state
- [ ] Manual test: End game normally → verify localStorage cleared
- [ ] Manual test: Opponent disconnects → verify localStorage cleared
- [ ] Edge case: localStorage disabled → verify graceful fallback

## Documentation

- [x] Update `openspec/specs/session-persistence/spec.md` with requirements and scenarios
