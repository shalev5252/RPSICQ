# Tasks: Add Sound Effects

## Prerequisites
- Sound files provided (or placeholders created).

## Tasks

### 1. Asset Setup
- [x] Create `client/src/assets/sounds` directory (client/src/assets/sounds).
- [x] Move sound files from `client/assets` to `client/src/assets/sounds` (client/src/assets/sounds).
- [x] Verify all required files exist (`bgm.mp3`, `move1.mp3`, `move2.mp3`, `battle.mp3`, `winner.mp3`, `loser.mp3`) (client/src/assets/sounds).

### 2. Sound Infrastructure
- [x] Create `client/src/context/SoundContext.tsx` (client/src/context/SoundContext.tsx:21).
- [x] Implement `SoundProvider` with `Audio` instances (client/src/context/SoundContext.tsx:23).
- [x] Add `useSound` hook (client/src/context/SoundContext.tsx:108).
- [x] Wrap `App` in `SoundProvider` (client/src/App.tsx:38).

### 3. Game Integration
- [x] Update `GameScreen.tsx` (Logic moved to `useSocket.ts:80`):
    - Detect moves/combats. *Design Decision*: How to detect combat?
        - Option A: Diff previous/next board state.
        - Option B: Server sends "event" flag in payload (Implemented via diffing logic in `useSocket.ts` to detect captures/battles robustly).
    - Trigger `playSound` for moves/battles (`useSocket.ts:94`).
    - Assign unique move sounds to players (random or color-based) (`useSocket.ts:101`).
- [x] Update `GameOverScreen.tsx` (Logic moved to `useSocket.ts` for Game Over):
    - Trigger `winner`/`loser` sound on mount (`useSocket.ts:135`).

### 4. Background Music
- [x] Start BGM on user interaction (e.g., Setup screen mount or first click). Code: `initBackgroundMusic` (via `playBGM` in `App.tsx:15`).

## Validation
- [x] Verify BGM loops.
- [x] Verify Move sounds play for both players.
- [x] Verify Battle sound triggers on capture/tie.
- [x] Verify Victory/Defeat sounds.
