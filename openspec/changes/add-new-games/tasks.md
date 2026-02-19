## 1. Game Portal (Foundation)
- [x] 1.1 Add `activeGame` state to Zustand store (`'none' | 'rps' | 'ttt' | 'third-eye'`)
- [x] 1.2 Create `GamePortal` component with game cards (RPS Battle, Tic Tac Toe, The Third Eye)
- [x] 1.3 Add "Ultimate (Coming Soon)" disabled card for Tic Tac Toe
- [x] 1.4 Update `App.tsx` to render portal when `activeGame === 'none'`, delegate to game components otherwise
- [x] 1.5 Add back-to-portal navigation button on pre-match screens
- [x] 1.6 Style portal with premium aesthetics (game icons, hover effects, animations)

## 2. Shared Types & Events
- [x] 2.1 Add `GameType` type to shared (`'rps' | 'ttt' | 'third-eye'`)
- [x] 2.2 Add TTT-specific types: `TttGameState`, `TttCell`, `TttMark`
- [x] 2.3 Add Third Eye types: `ThirdEyeGameState`, `ThirdEyeRound`, `ThirdEyeScore`
- [x] 2.4 Add new socket events with game prefixes (`TTT_MOVE`, `TTT_GAME_OVER`, `TE_PICK_NUMBER`, `TE_ROUND_RESULT`, etc.)

## 3. Matchmaking Updates
- [x] 3.1 Extend matchmaking queue keys to include `'ttt-classic'` and `'third-eye'`
- [x] 3.2 Update `JOIN_QUEUE` handler to accept new game modes
- [x] 3.3 Ensure session creation routes to the correct game service based on queue key

## 4. Tic Tac Toe — Server
- [x] 4.1 Create `TttGameService` with board state, turn management, win/draw detection
- [x] 4.2 Create `tttHandlers.ts` with socket event handlers (`TTT_MOVE`, `TTT_REMATCH`)
- [x] 4.3 Implement win-check logic (rows, columns, diagonals)
- [x] 4.4 Implement turn timer (optional, reuse RPS pattern if desired)

## 5. Tic Tac Toe — AI
- [x] 5.1 Create `TttAI` service with Minimax + alpha-beta pruning
- [x] 5.2 Implement Easy mode (random moves)
- [x] 5.3 Implement Medium mode (Minimax depth-3, 30% suboptimal moves)
- [x] 5.4 Implement Hard mode (full Minimax, optimal play)
- [x] 5.5 Unit tests for AI (verify Hard never loses, Easy sometimes loses)

## 6. Tic Tac Toe — Client
- [x] 6.1 Create `TttModeSelection` component (Play Online / Play vs Computer / Ultimate Coming Soon)
- [x] 6.2 Create `TttDifficultySelection` component (Easy / Medium / Hard)
- [x] 6.3 Create `TttBoard` component (3×3 grid, mark placement, winning line highlight)
- [x] 6.4 Create `TttGameScreen` wrapper (board + turn indicator + status)
- [x] 6.5 Integrate with `useSocket` for online mode
- [x] 6.6 Create local game loop for vs-AI mode (no socket needed)
- [x] 6.7 Create `TttGameOverScreen` with rematch support
- [x] 6.8 Style with animations (mark placement, winning line glow)

## 7. The Third Eye — Server
- [x] 7.1 Create `ThirdEyeGameService` with range generation, lucky number, round management, scoring
- [x] 7.2 Create `thirdEyeHandlers.ts` with socket event handlers (`TE_PICK_NUMBER`, `TE_ROUND_RESULT`, `TE_GAME_OVER`)
- [x] 7.3 Implement 20-second server-side timer with timeout handling
- [x] 7.4 Implement round resolution logic (distance comparison, tie detection)
- [x] 7.5 Implement match victory (first to 3 points)

## 8. The Third Eye — Client
- [x] 8.1 Create `ThirdEyeGameScreen` component (range display, number input, submit button)
- [x] 8.2 Create countdown timer component (20s, visual countdown, clock-tick ready)
- [x] 8.3 Create score display component (both players' scores)
- [x] 8.4 Create round-result overlay (lucky number reveal, distances, who scored)
- [x] 8.5 Create `ThirdEyeGameOverScreen` with victory/rematch support
- [x] 8.6 Style with premium aesthetics (number animations, timer urgency effects)

## 9. Localization
- [x] 9.1 Add English translations for all new UI strings (portal, TTT, Third Eye)
- [x] 9.2 Add Hebrew translations for all new UI strings

## 10. Testing & Validation
- [x] 10.1 Unit tests for TTT win/draw detection
- [x] 10.2 Unit tests for Third Eye range generation, scoring, timer logic
- [x] 10.3 Integration tests for socket events (TTT and Third Eye flows)
- [x] 10.4 Build verification (`npm run build --workspaces`)
