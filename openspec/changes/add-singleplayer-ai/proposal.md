# Change: Add Singleplayer Mode with AI Opponent

## Why
Players currently need a second human player to play the game. Adding a singleplayer mode with a capable AI opponent lets players enjoy the game anytime without waiting in a matchmaking queue, while still providing a challenging experience that imitates a real player.

## What Changes
- Add a new "vs Computer" option to the mode selection screen alongside Classic and RPSLS
- Introduce a server-side AI opponent service that handles board setup, move selection, and tie-breaker decisions
- The AI uses pattern recognition and adaptive strategy to provide a challenging, human-like opponent
- AI operates entirely on the server (no external APIs, no cloud functions) — "serverless" means no matchmaking queue or second player is needed
- Both Classic and RPSLS board configurations are supported in singleplayer mode
- AI performs setup (King/Pit placement + piece randomization) automatically with strategic placement logic
- AI selects moves using weighted evaluation of board state, opponent piece tracking, and positional advantage
- AI responds to tie-breaker situations with strategic element selection

## Impact
- Affected specs: `game-modes`, `matchmaking`, new `ai-opponent`
- Affected code:
  - `shared/src/types.ts` — new `OpponentType` type, updated `GameMode` usage
  - `shared/src/constants.ts` — AI configuration constants
  - `server/src/services/AIOpponentService.ts` — new AI logic service
  - `server/src/services/GameService.ts` — support AI player in game session
  - `server/src/services/MatchmakingService.ts` — bypass queue for singleplayer
  - `server/src/socket/handlers.ts` — handle singleplayer game creation
  - `client/src/components/MatchmakingScreen.tsx` — add "vs Computer" option
  - `client/src/components/ModeSelect.tsx` — opponent type selection
  - `client/src/store/gameStore.ts` — track opponent type
