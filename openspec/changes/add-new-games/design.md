## Context
The site is a monorepo (client / server / shared) using React + Vite on the frontend and Node.js + Socket.IO on the backend. All current logic is tightly coupled to the RPS Battle game. This change introduces two new independent games and a portal to navigate between them.

## Goals / Non-Goals
- **Goals**:
  - Add a game-selection portal as the new landing page.
  - Implement Tic Tac Toe (Classic 3×3) with online multiplayer and AI (3 difficulty levels).
  - Implement The Third Eye as an online multiplayer number-guessing game.
  - Reuse existing infrastructure (Socket.IO, matchmaking queues, game-over/rematch patterns).
- **Non-Goals**:
  - Ultimate Tic Tac Toe implementation (placeholder only).
  - AI opponent for The Third Eye.
  - User authentication or persistent accounts.

## Decisions

### 1. Game Router (Client)
- **Decision**: Add a lightweight client-side game router using Zustand state (`activeGame: 'none' | 'rps' | 'ttt' | 'third-eye'`). When `activeGame` is `'none'`, the portal screen is shown; otherwise, the corresponding game component mounts.
- **Alternatives**: React Router — rejected because the app is a SPA without URL-based navigation and adding a router dependency is unnecessary for 3 games.

### 2. Server Namespace Separation
- **Decision**: Use a single Socket.IO namespace (`/`) with game-specific event prefixes (e.g., `TTT_MOVE`, `TE_PICK_NUMBER`). Matchmaking queues are already keyed by game mode string.
- **Alternatives**: Separate Socket.IO namespaces per game — rejected to avoid connection overhead and keep the existing singleton socket pattern.

### 3. Tic Tac Toe AI (Minimax)
- **Decision**: Implement Minimax with alpha-beta pruning. Difficulty levels control pruning behavior:
  - **Easy**: Random moves (no search).
  - **Medium**: Minimax at depth 3 with random imperfection (30% chance of choosing a suboptimal move).
  - **Hard**: Full Minimax (optimal play — never loses).
- **Alternatives**: Q-learning — rejected as overkill for a solved game.

### 4. The Third Eye — Range Generation
- **Decision**: Server picks `min` uniformly in [1, 500], then `max = min + uniform(100, 300)`. Lucky number = uniform(min, max). This keeps ranges human-friendly.
- **Alternatives**: Fixed range (e.g., 1–200 always) — rejected for monotony.

### 5. Shared Game-Over / Rematch Pattern
- **Decision**: Reuse the existing `GameOverScreen` component pattern. Each game emits `GAME_OVER` with a `gameType` field; the client delegates to the appropriate game-over view. Rematch uses the same `REMATCH_REQUEST` / `REMATCH_ACCEPT` flow.

## Risks / Trade-offs
- **Event name collision** → Mitigated by game-type prefixes (`TTT_`, `TE_`).
- **Growing handler file** → Mitigated by splitting into per-game handler modules (`tttHandlers.ts`, `thirdEyeHandlers.ts`).
- **Timer drift** → The 20-second timer in The Third Eye is enforced server-side; client countdown is cosmetic.

## Open Questions
- None at this time; all questions were resolved with the user.
