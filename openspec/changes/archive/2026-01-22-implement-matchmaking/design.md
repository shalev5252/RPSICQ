# Matchmaking System Design

## Architecture

### Server-Side
- **MatchmakingQueue**: A simple array or list of `Socket` or `Player` objects representing users waiting for a game.
- **GameSessionManager**: A Map storing active game sessions keyed by `sessionId`.
- **Flow**:
    1.  User emits `JOIN_QUEUE`.
    2.  Server adds user to `MatchmakingQueue`.
    3.  Server checks if `MatchmakingQueue.length >= 2`.
    4.  If yes:
        -   Pop User A and User B.
        -   Generate unique `sessionId` (UUID).
        -   Randomly assign "Red" and "Blue" to A and B.
        -   Create initial `GameState`.
        -   Store in `GameSessionManager`.
        -   Emit `GAME_START` to both A and B with session details.

### Client-Side
- **Matchmaking Store (Zustand)**:
    -   `status`: 'idle' | 'searching' | 'connected'
-   **UI**:
    -   Start Screen with "Play" button.
    -   Loading overlay/component when `status === 'searching'`.

## Data Structures

### Shared Types (Packet payloads)
```typescript
// Existing in @rps/shared (verify/add)
export interface GameStartPayload {
  sessionId: string;
  role: 'red' | 'blue';
  opponentName?: string; // Optional for now
}
```

### Server Internal
```typescript
interface QueueEntry {
  socketId: string;
  userId: string; // generated or provided
}

class MatchmakingService {
    private queue: QueueEntry[] = [];
    
    addToQueue(socketId: string, userId: string) { ... }
    removeFromQueue(socketId: string) { ... }
    tryMatch() { ... } // returns [PlayerA, PlayerB] or null
}
```

## Risk Mitigation

### Concurrency (Race Conditions)
Since Node.js is single-threaded, `tryMatch()` will execute synchronously.
- We MUST ensure that the logic checking queue size and popping players happens in a single synchronous block.
- **Atomic Match**: `if (queue.length >= 2) { pop A; pop B; match(A,B); }`
- This prevents a scenario where a third player joins in the middle of a match creation and messes up the pairing.

### Zombies (stale connections)
- **Active Cleanup**: We listen to `socket.on('disconnect')` for every connected client.
    - Implementation: `handleDisconnect` must call `matchmakingService.removeFromQueue(socket.id)`.
- **Lazy Validation (Safety Net)**: When `tryMatch()` pops a player, we check `socket.connected`.
    - If `false`: Discard this player (clean up) and try to match the other player with the next person in queue.
    - This ensures a game never starts with a disconnected player.
