# Change: Add New Games (Tic Tac Toe & The Third Eye) + Game Portal

## Why
The site currently hosts only RPS Battle. Adding two additional games and a game-selection portal turns the site into a multi-game platform, increasing user engagement and replay value.

## What Changes
- **Game Portal**: New top-level screen where users choose which game to play (RPS Battle / Tic Tac Toe / The Third Eye). Each game gets its own flow (matchmaking, gameplay, game-over).
- **Tic Tac Toe (Classic 3×3)**:
  - Online multiplayer via Socket.IO (same matchmaking pattern as RPS Battle).
  - Single-player vs AI with 3 difficulty levels (Easy / Medium / Hard) using Minimax with alpha-beta pruning.
  - Standard rules: first to get 3 in a row/column/diagonal wins; draw if board is full.
- **Tic Tac Toe (Ultimate)**: Placeholder only — listed as "Coming Soon" in the portal. Not implemented in this change.
- **The Third Eye** (multiplayer only):
  - Server generates a random integer range (≥100 gap) and a hidden "lucky number" within it.
  - Both players have 20 seconds to pick a number; a countdown timer is displayed on-screen.
  - Closest player scores a point; same distance = tie (no points); timeout = round loss.
  - First to 3 points wins. Victory screen + rematch (same pattern as RPS Battle).
- **Matchmaking**: Extended to support per-game queues (`rps-classic`, `rps-rpsls`, `ttt-classic`, `third-eye`).

## Impact
- Affected specs: `matchmaking` (modified), `game-modes` (modified for portal awareness)
- New specs: `game-portal`, `tic-tac-toe`, `third-eye`
- Affected code: `App.tsx` (routing), `MatchmakingScreen`, server handlers, shared types, new game-specific components and services
