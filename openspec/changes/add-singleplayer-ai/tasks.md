## 1. Shared Types & Constants
- [x] 1.1 Add `OpponentType` type (`'human' | 'ai'`) to `shared/src/types.ts`
- [x] 1.2 Add AI configuration constants to `shared/src/constants.ts` (response delay range, AI ID prefix)
- [x] 1.3 Add `START_SINGLEPLAYER` socket event to `SOCKET_EVENTS`

## 2. AI Opponent Service
- [ ] 2.1 Create `server/src/services/AIOpponentService.ts` with core class structure
- [ ] 2.2 Implement `generateSetup(gameMode)` — strategic King/Pit placement and piece randomization
- [ ] 2.3 Implement `selectMove(gameState, aiColor)` — weighted move evaluation with piece tracking, positional scoring, and combat risk assessment
- [ ] 2.4 Implement `selectTieBreakerChoice(gameMode, knownOpponentType?)` — strategic element selection for tie-breaker
- [ ] 2.5 Implement piece inference tracking — update beliefs about hidden pieces based on combat outcomes
- [ ] 2.6 Add randomized delay wrapper for natural-feeling responses

## 3. Server Integration
- [ ] 3.1 Update `GameService` to support AI as a virtual player (accept AI player state with `ai-` prefixed IDs)
- [ ] 3.2 Add `createSingleplayerSession(socketId, playerId, gameMode)` to `GameService` — creates session with AI player auto-assigned as opponent
- [ ] 3.3 Update `GameService` move/combat flow to trigger AI response after human player's turn
- [ ] 3.4 Handle AI setup phase — auto-place King/Pit and randomize pieces for AI, then auto-confirm
- [ ] 3.5 Handle AI tie-breaker — auto-submit tie-breaker choice when AI is involved in combat tie
- [ ] 3.6 Skip disconnect/reconnect logic for AI player (AI never disconnects)

## 4. Socket Handler Updates
- [ ] 4.1 Add `START_SINGLEPLAYER` handler in `handlers.ts` — receives `{ gameMode }`, creates singleplayer session, emits `GAME_FOUND`
- [ ] 4.2 After human player confirms setup, trigger AI setup and auto-start game
- [ ] 4.3 After human player makes a move (and it's AI's turn), schedule AI move with delay

## 5. Client Updates
- [ ] 5.1 Add opponent type selection to `ModeSelect.tsx` — "vs Player" and "vs Computer" buttons
- [ ] 5.2 Update `MatchmakingScreen.tsx` — when "vs Computer" is selected, emit `START_SINGLEPLAYER` instead of `JOIN_QUEUE` (skip queue UI)
- [ ] 5.3 Update `gameStore.ts` — add `opponentType` state field
- [ ] 5.4 Update `GameOverScreen.tsx` — adjust rematch flow for singleplayer (instant rematch, no waiting for opponent)

## 6. Testing & Validation
- [ ] 6.1 Test AI setup produces valid board state for both Classic and RPSLS modes
- [ ] 6.2 Test AI move selection always returns a valid move
- [ ] 6.3 Test full singleplayer game flow: start → setup → play → finish
- [ ] 6.4 Test tie-breaker with AI opponent
- [ ] 6.5 Test AI does not trigger disconnect/reconnect logic
- [ ] 6.6 Playtest AI difficulty — verify it provides a meaningful challenge
