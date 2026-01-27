# Tasks: Add Sound Effects

## Prerequisites
- Sound files provided (or placeholders created).

## Tasks

### 1. Asset Setup
- [ ] Create `client/src/assets/sounds` directory.
- [ ] Move sound files from `client/assets` to `client/src/assets/sounds`.
- [ ] Verify all required files exist (`bgm.mp3`, `move1.mp3`, `move2.mp3`, `battle.mp3`, `winner.mp3`, `looser.mp3`).

### 2. Sound Infrastructure
- [ ] Create `client/src/context/SoundContext.tsx`.
- [ ] Implement `SoundProvider` with `Audio` instances.
- [ ] Add `useSound` hook.
- [ ] Wrap `App` in `SoundProvider`.

### 3. Game Integration
- [ ] Update `GameScreen.tsx`:
    - Detect moves/combats. *Design Decision*: How to detect combat?
        - Option A: Diff previous/next board state.
        - Option B: Server sends "event" flag in payload.
    - Trigger `playSound` for moves/battles.
    - Assign unique move sounds to players (random or color-based).
- [ ] Update `GameOverScreen.tsx`:
    - Trigger `winner`/`looser` sound on mount.

### 4. Background Music
- [ ] Start BGM on user interaction (e.g., Setup screen mount or first click).

## Validation
- [ ] Verify BGM loops.
- [ ] Verify Move sounds play for both players.
- [ ] Verify Battle sound triggers on capture/tie.
- [ ] Verify Victory/Defeat sounds.
