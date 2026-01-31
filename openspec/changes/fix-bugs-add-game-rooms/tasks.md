## 1. Bug Fix: Game-Over Return to Home
- [x] 1.1 Add `LEAVE_SESSION` socket event to shared constants (`constants.ts`)
- [x] 1.2 Server: handle `LEAVE_SESSION` event in `handlers.ts` — clean up session, remove player from session map
- [x] 1.3 Client: in `GameOverScreen.tsx`, replace `window.location.reload()` with `reset()` only (which sets `gamePhase` to `'waiting'`, unmounting the game-over screen) and emit `LEAVE_SESSION` to notify server
- [x] 1.4 Verify the game-over overlay closes and matchmaking screen appears without page reload

## 2. Bug Fix: Player Liveness Detection
- [ ] 2.1 Tighten Socket.IO server config: set `pingInterval: 10000`, `pingTimeout: 15000` in `server/src/index.ts`
- [ ] 2.2 Keep reconnect grace period at 30s in `GameService.ts` (no change needed — faster detection via ping settings is the fix)
- [ ] 2.3 Client: add visible "Opponent reconnecting..." banner/overlay when `OPPONENT_RECONNECTING` event is received during gameplay (in `useSocket.ts` / game UI)
- [ ] 2.4 Client: add store state for `opponentReconnecting: boolean` in `gameStore.ts`
- [ ] 2.5 Client: dismiss the reconnecting banner when `OPPONENT_RECONNECTED` or `OPPONENT_DISCONNECTED` fires
- [ ] 2.6 Client: when `OPPONENT_DISCONNECTED` fires during gameplay (not just setup), show a notification and transition to waiting/matchmaking screen

## 3. Feature: Private Game Rooms
- [ ] 3.1 Add new socket events to shared constants: `CREATE_ROOM`, `JOIN_ROOM`, `ROOM_CREATED`, `ROOM_JOINED`, `ROOM_ERROR`, `CANCEL_ROOM`
- [ ] 3.2 Add payload types to shared types: `CreateRoomPayload`, `JoinRoomPayload`, `RoomCreatedPayload`, `RoomJoinedPayload`, `RoomErrorPayload`
- [ ] 3.3 Server: create `RoomService` class with:
  - `createRoom(socketId, gameMode)` → generates unique 7-digit code, stores room entry, sets 10-min expiry timer
  - `joinRoom(socketId, code)` → validates code, pairs players, creates game session
  - `cancelRoom(socketId)` → creator cancels waiting room
  - `removePlayerRooms(socketId)` → cleanup on disconnect
  - Room entry: `{ code, hostSocketId, gameMode, createdAt, expiryTimer }`
- [ ] 3.4 Server: add socket event handlers for `CREATE_ROOM`, `JOIN_ROOM`, `CANCEL_ROOM` in `handlers.ts`
- [ ] 3.5 Server: on room join success, create session via `GameService.createSession()` and emit `GAME_FOUND` to both players (same flow as matchmaking)
- [ ] 3.6 Server: clean up rooms on player disconnect (in `disconnect` handler)
- [ ] 3.7 Client: update `MatchmakingScreen.tsx` — when "Human Player" is selected, show sub-options: "Random Opponent" / "Play with Friend"
- [ ] 3.8 Client: create `RoomScreen` component with "Create Room" and "Join Room" sub-views
  - "Create Room": shows spinner while waiting, displays the 7-digit code, has a "Cancel" button
  - "Join Room": input field for 7-digit code, "Join" button, error display
- [ ] 3.9 Client: add room-related state to `gameStore.ts`: `roomCode`, `isCreatingRoom`, `isJoiningRoom`
- [ ] 3.10 Client: add socket event listeners for `ROOM_CREATED`, `ROOM_JOINED`, `ROOM_ERROR` in `useSocket.ts`
- [ ] 3.11 Client: allow joining a room from the main matchmaking screen (code input visible when "Play with Friend" is selected)
- [ ] 3.12 Add i18n translations for all new UI strings (room creation, joining, errors, opponent options)
- [ ] 3.13 Test: verify room creation returns a 7-digit code
- [ ] 3.14 Test: verify two players can join the same room and start a game
- [ ] 3.15 Test: verify room expires after 10 minutes
- [ ] 3.16 Test: verify duplicate room codes cannot exist simultaneously
- [ ] 3.17 Test: verify room cleanup on creator disconnect
