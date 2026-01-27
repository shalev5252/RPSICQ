# Design: Sound Effects System

## Architecture

### 1. Sound Assets
Directory: `client/src/assets/sounds/`
Files (to be provided/placeholder):
- `bgm.mp3` (Background Music)
- `move1.mp3`
- `move2.mp3`
- `battle.mp3`
- `winner.mp3`
- `looser.mp3`

### 2. SoundManager (Context/Hook)
We will implement a `SoundProvider` wrapping the app (in `App.tsx` or `main.tsx`) to manage the background music `Audio` instance ensuring it persists across navigation.

**Interface:**
```typescript
interface SoundContextType {
    playBGM: () => void;
    stopBGM: () => void;
    playSound: (effect: SoundEffect) => void;
    toggleMute: () => void; // Basic mute functionality
    isMuted: boolean;
}

type SoundEffect = 'move1' | 'move2' | 'battle' | 'winner' | 'looser';
```

### 3. Move Sound Assignment
In `GameScreen` or `useGameSession`, when the game initializes:
- Assign `move1` or `move2` to `myColor`.
- Ideally deterministic based on player color or random but consistent.
- *User Request*: "game start... assigned sound from options... for each player".
- Logic: `const myMoveSound = myColor === 'red' ? 'move1' : 'move2';` (Simple deterministic assignment prevents collision if we want them distinct, or random). I'll implement random assignment stored in a ref or state.

### 4. Integration Points

- **`App.tsx`**: Wrap with `SoundProvider`.
- **`GameScreen.tsx`**:
    - `handleCellDrop` / `socket.on(MAKE_MOVE)`: Trigger move sound.
    - *Wait*: We need to know *who* moved to play *their* sound. The `board` update or socket event contains the `from`/`to`.
    - `socket.on(GAME_OVER)`: Stop BGM? Or just play result sound? Usually victory music replaces BGM.
- **`GameOverScreen.tsx`**: Play win/loss sound on mount.

## Technical Considerations
- **Autoplay Policy**: Browsers block audio until user interaction. The "Start Game" or any click in Setup will likely unlock Audio context. BGM might need a "Enable Sound" button if it starts immediately, but usually `App` mount is too early. We'll try to start BGM on first interaction or explicitly in Setup/Lobby.
- **Asset Loading**: Import mp3 files as URLs using Vite's asset handling.

## Code Changes

### `client/src/store/soundStore.ts` (Optional or just Context)
Since it's UI-heavy logic (Audio API), a Context is standard.

```typescript
// Proposed Hook Usage
const { playSound } = useSound();

// In GameScreen
useEffect(() => {
    if (lastMove.hadCombat) {
        playSound('battle');
    } else {
        playSound(playerMoveSound);
    }
}, [lastMove]);
```
*Note*: `gameState` might not track "last move combat" deeply enough to diff. I might need to hook into the socket events directly in `GameScreen` or update the store to surface "last event type".
The `socket.on('gameStateUpdate', ...)` replaces the whole board.
*Better Strategy*: `useSocket` listeners in `GameScreen` can trigger sounds *before* or *alongside* state updates.
- Listen for `GAME_UPDATE`? Or distinct events? The server sends `gameState`.
- I might need to diff the board or rely on separate events if they exist.
- *Wait*, `MAKE_MOVE` is emitted by client. But we need to hear opponent moves too.
- Server likely sends `gameState` broadcast.
- *Refinement*: I'll verify if `GameState` has a "lastAction" field. If not, diffing local `board` vs `newBoard` is complex.
- *Alternative*: If the server emits specific events for battle, utilize those. If not, I might need to modify server to send `lastEvent` meta-data or just simple diffing (count pieces?).
- **Actually**, `socket.on('gameStateUpdate')` is the main sync.
- Let's check `shared/types.ts` to see if `GameState` has event log.

## Verification
- Test Move sounds.
- Test Battle sound (collision).
- Test Win/Loss.
