# Tasks: Add Special Game Modes

## Phase 1: Shared Types & Constants

- [ ] **1.1** Add `GameVariant` type (`'standard' | 'clearday' | 'onslaught'`) to `shared/src/types.ts`
- [ ] **1.2** Add `GameModeKey` type for queue keys to `shared/src/types.ts`
- [ ] **1.3** Add `gameVariant` field to `GameState` interface (default: `'standard'`)
- [ ] **1.4** Update `JoinQueuePayload`, `StartSingleplayerPayload`, `CreateRoomPayload` to include optional `gameVariant`
- [ ] **1.5** Add Onslaught board configurations to `BOARD_CONFIG` in `shared/src/constants.ts`:
  - `classic-onslaught`: 5×3, pieces: rock:2, paper:2, scissors:2
  - `rpsls-onslaught`: 5×5, pieces: rock:2, paper:2, scissors:2, lizard:2, spock:2
- [ ] **1.6** Add `ONSLAUGHT_END_PIECE_COUNT = 2` constant

## Phase 2: Server - Matchmaking & Session Creation

- [ ] **2.1** Update `MatchmakingService` to initialize 6 queues (classic, rpsls, classic-clearday, rpsls-clearday, classic-onslaught, rpsls-onslaught)
- [ ] **2.2** Modify `addToQueue()` to construct queue key from gameMode + gameVariant
- [ ] **2.3** Update `createMatch()` to pass variant to session creation
- [ ] **2.4** Update `GameService.createSession()` to accept and store `gameVariant`
- [ ] **2.5** Update socket handlers to extract `gameVariant` from payloads (with default fallback)

## Phase 3: Server - Clear Day Logic

- [ ] **3.1** In `GameService.startGame()`, add logic to reveal all pieces when variant is `'clearday'`
- [ ] **3.2** Ensure `getPlayerView()` respects pre-revealed pieces in Clear Day mode
- [ ] **3.3** Add test: Clear Day pieces are hidden during setup, revealed at game start

## Phase 4: Server - Onslaught Logic

- [ ] **4.1** Modify setup phase to skip King/Pit placement for Onslaught (no `place_king_pit` requirement)
- [ ] **4.2** Update piece generation to use Onslaught config (no King/Pit pieces)
- [ ] **4.3** Implement Onslaught win condition check after each combat:
  - Count remaining pieces
  - If ≤2 pieces, determine winner or trigger tie-breaker
- [ ] **4.4** Implement `resolveOnslaughtEndgame()` method:
  - Different elements → instant winner
  - Same elements → trigger tie-breaker
- [ ] **4.5** Add Onslaught tie-breaker flow (reuse existing tie-breaker UI/logic)
- [ ] **4.6** Disable stalemate/auto-skip logic for Onslaught (no immovable pieces)
- [ ] **4.7** Add tests for Onslaught win conditions

## Phase 5: Server - AI Opponent Adaptation

- [ ] **5.1** Update AI to handle Clear Day (may already work since AI sees all pieces internally)
- [ ] **5.2** Update AI evaluation for Onslaught:
  - Remove King-capture priority
  - Add piece-count awareness
- [ ] **5.3** Test AI plays correctly in both special modes

## Phase 6: Client - Mode Selection UI

- [ ] **6.1** Add variant selector (Standard / Clear Day / Onslaught) to SetupScreen
- [ ] **6.2** Store selected variant in game store
- [ ] **6.3** Update `JOIN_QUEUE` and `START_SINGLEPLAYER` emissions to include `gameVariant`
- [ ] **6.4** Update room creation flow to include variant selection
- [ ] **6.5** Add localization strings for new modes (en, he)

## Phase 7: Client - Game UI Updates

- [ ] **7.1** Add visual indicator for Clear Day mode (e.g., sun icon) on game board
- [ ] **7.2** Add visual indicator for Onslaught mode (e.g., swords icon) on game board
- [ ] **7.3** Display remaining piece count in Onslaught mode
- [ ] **7.4** Handle Onslaught endgame UI (winner announcement based on element matchup)
- [ ] **7.5** Handle Onslaught tie-breaker UI (reuse existing tie-breaker components)

## Phase 8: Testing & Polish

- [ ] **8.1** Integration test: Full Clear Day game flow
- [ ] **8.2** Integration test: Full Onslaught game flow with different endgame scenarios
- [ ] **8.3** Test matchmaking isolation (no cross-variant matching)
- [ ] **8.4** Test backward compatibility (clients without variant default to standard)
- [ ] **8.5** Update GameOverScreen to show appropriate messages for Onslaught wins

## Dependencies
- Phase 1 must complete before Phases 2-5
- Phase 2 must complete before Phases 3-4
- Phase 6 can run in parallel with Phases 3-5
- Phase 7 depends on server-side changes being complete
