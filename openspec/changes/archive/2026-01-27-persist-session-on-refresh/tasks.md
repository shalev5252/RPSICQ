# Tasks for persist-session-on-refresh

## Phase 1: Persistent Player ID (Client)
- [x] 1.1 Generate unique playerId and store in localStorage on first visit
- [x] 1.2 Pass playerId in socket.io auth handshake
- [x] 1.3 Retrieve playerId from localStorage on page load

## Phase 2: Grace Period (Server)
- [x] 2.1 Add `disconnectTimers` Map to GameService
- [x] 2.2 Create `handleTemporaryDisconnect(playerId)` - starts 30s timer
- [x] 2.3 Modify disconnect handler to call handleTemporaryDisconnect instead of immediate end
- [x] 2.4 Add `OPPONENT_RECONNECTING` event and emit to opponent

## Phase 3: Reconnection Logic (Server)
- [x] 3.1 Modify PlayerState to store `playerId` separately from `socketId`
- [x] 3.2 Create `handleReconnect(playerId, newSocketId)` - cancel timer, update socketId
- [x] 3.3 Add connection handler to check for existing session by playerId
- [x] 3.4 Add `SESSION_RESTORED` event and emit game state to reconnected player

## Phase 4: Client Reconnection Handling
- [x] 4.1 Add `SESSION_RESTORED` handler in useSocket.ts
- [x] 4.2 Add `OPPONENT_RECONNECTING` handler with UI indicator
- [x] 4.3 Restore local state (gamePhase, setupState, etc.) from restored session

## Phase 5: Testing
- [x] 5.1 Test refresh during setup phase
- [x] 5.2 Test refresh during playing phase  
- [x] 5.3 Test that 30s timeout still ends session properly
- [x] 5.4 Test opponent re-queue after timeout expires

## Phase 6: Bug Fixes (Session Collision)
- [x] 6.1 Switch from `localStorage` to `sessionStorage` to prevent tab identity collision
- [x] 6.2 Fix `useSocket.ts` types and `playerId` usage in `onSessionRestored`
- [x] 6.3 Ensure `joinQueue` uses consistent `playerId`
