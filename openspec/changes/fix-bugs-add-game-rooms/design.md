## Context
The RPS Battle game uses Socket.IO for real-time communication between a React client and Node.js server. The game has matchmaking (random queue), setup, playing, and finished phases. Two bugs affect game-end UX and player disconnect detection. A new private room system is being added alongside the fixes.

## Goals / Non-Goals
- **Goals:**
  - Fix return-to-home-screen navigation after game ends
  - Detect permanent player departures faster and notify the remaining player
  - Allow friends to play together via a shareable room code
- **Non-Goals:**
  - User authentication or persistent accounts
  - Room chat or lobby features
  - Spectator mode for rooms
  - Password-protected rooms (code is sufficient)

## Decisions

### 1. Game-Over Navigation
- **Decision:** Remove `window.location.reload()` and instead call `useGameStore.getState().reset()` plus emit a `LEAVE_SESSION` event to the server so the server cleans up the session. The store reset sets `gamePhase` to `'waiting'`, which unmounts `GameOverScreen` and mounts `MatchmakingScreen`.
- **Alternatives considered:**
  - Keep `window.location.reload()` but fix potential timing issues → rejected because reload is wasteful and causes flicker.
  - Use React Router navigation → rejected because the app is single-page with phase-based rendering, not route-based.

### 2. Player Liveness Detection
- **Decision:** Tighten Socket.IO transport-level ping settings (`pingInterval: 10000`, `pingTimeout: 15000`) so disconnects are detected within ~25 seconds. On top of this, show an "opponent reconnecting" banner to the remaining player as soon as `OPPONENT_RECONNECTING` fires (already exists but has no UI). Keep the reconnect grace period at 30s — the bottleneck was detection time, not grace time, and 30s gives legitimate reconnections (network blips, Wi-Fi switching) enough room.
- **Implementation Targets:**
  - **Server**: `server/src/index.ts` (SocketIO config), `GameService.handleDisconnect`, `GameService.handleTemporaryDisconnect`.
  - **Client**: `useSocket` (event listeners), `gameStore` (state `opponentReconnecting`), `GameScreen` (UI banner).

### 3. Private Game Rooms
- **Decision:** Create a `RoomService` on the server that manages room creation, code generation, joining, and expiration. Room codes are 7-digit random numbers stored in a `Map<string, RoomEntry>`. The service ensures uniqueness of active codes and auto-expires rooms after 10 minutes via `setTimeout`.
- **New Events:** `CREATE_ROOM`, `JOIN_ROOM`, `ROOM_CREATED`, `ROOM_JOINED`, `ROOM_ERROR`, `ROOM_EXPIRED`.
- **Implementation Targets:**
  - **Server**: `RoomService` class, `handlers.ts` (handlers for `CREATE_ROOM`, `JOIN_ROOM`), `GameService.createSession` (reused).
  - **Client**: `MatchmakingScreen` (UI for "Play with Friend"), `useSocket` (emitters/listeners), `gameStore` (room state).
- **Alternatives considered:**
  - Reuse matchmaking queue with room filter → rejected, conceptually different flow.
  - Use short alphanumeric codes → rejected, user requested 7-digit numeric codes.
  - WebRTC peer-to-peer rooms → rejected, over-engineered for this use case.

### Client UI for Rooms
- When "Human Player" is selected as opponent type, show two sub-options: "Random Opponent" and "Play with Friend".
- "Random Opponent" behaves as today (joins queue).
- "Play with Friend" shows two choices: "Create Room" and "Join Room".
  - "Create Room": Emits `CREATE_ROOM` with selected game mode. Shows the 7-digit code to share.
  - "Join Room": Shows an input field for the 7-digit code. On submit, emits `JOIN_ROOM` with the code. Player is matched into the creator's session.

## Risks / Trade-offs
- **Room code collision:** With 7-digit codes (10M possibilities) and likely <100 concurrent rooms, collision probability is negligible. The service retries on collision.
- **Room expiration cleanup:** `setTimeout` handles expiration. If the server restarts, all rooms are lost (acceptable for this scale; rooms are ephemeral).
- **Tighter ping settings:** More frequent pings increase bandwidth slightly (~1 ping/10s vs ~1 ping/25s). Negligible for this application.

## Open Questions
- None; requirements are clear from the user's request.
