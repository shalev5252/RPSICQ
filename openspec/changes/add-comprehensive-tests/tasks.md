## 1. Test Infrastructure Setup
- [ ] 1.1 Install Vitest + `@vitest/coverage-v8` in root `devDependencies`
- [ ] 1.2 Create `vitest.config.ts` for server workspace
- [ ] 1.3 Add `test`, `test:unit`, `test:integration` npm scripts to `server/package.json` and root `package.json`
- [ ] 1.4 Install Playwright + `@playwright/test` in root `devDependencies`
- [ ] 1.5 Create `playwright.config.ts` at repo root; add `test:e2e` script
- [ ] 1.6 Verify `npm run test:unit` runs successfully (zero tests, zero failures)

## 2. Server Unit Tests — Game Logic
- [ ] 2.1 `GameService.createSession` — creates valid session with correct board dimensions for classic & RPSLS
- [ ] 2.2 `GameService.placeKingPit` — valid/invalid placement, duplicate placement, wrong phase
- [ ] 2.3 `GameService.randomizePieces` — fills remaining setup cells, correct piece counts
- [ ] 2.4 `GameService.confirmSetup` — single player ready, both ready transition
- [ ] 2.5 `GameService.resolveCombat` — all RPS matchups (rock/paper/scissors, tie, king/pit specials)
- [ ] 2.6 `GameService.resolveCombat` — RPSLS matchups (lizard/spock)
- [ ] 2.7 `GameService.getValidMoves` — king/pit cannot move, mobile pieces move 1 step, boundary checks, own-piece blocking
- [ ] 2.8 `GameService.makeMove` — successful move to empty cell, combat trigger, turn switch
- [ ] 2.9 `GameService.makeMove` — king capture ends game, pit defeats attacker
- [ ] 2.10 `GameService.hasMovablePieces` + `skipTurn` — auto-pass when only immovable pieces remain
- [ ] 2.11 `GameService.checkDraw` + `setDraw` — draw when both players have only immovable pieces
- [ ] 2.12 `GameService.forfeitGame` — game ends with opponent as winner
- [ ] 2.13 `GameService.offerDraw` / `respondToDraw` — offer/accept/decline, once-per-turn limit
- [ ] 2.14 `GameService.requestRematch` + `resetGameForRematch` — single/both request, board reset
- [ ] 2.15 `GameService.handleDisconnect` / `handleTemporaryDisconnect` / `handleReconnect` — grace period logic

## 3. Server Unit Tests — Supporting Services
- [ ] 3.1 `MatchmakingService` — add to queue, prevent duplicate, match two players, zombie cleanup
- [ ] 3.2 `RoomService` — create room, join room, join own room blocked, room expiry, cancel room

## 4. Shared Unit Tests
- [ ] 4.1 Constants validation — COMBAT_OUTCOMES table correctness, RPSLS_WINS completeness
- [ ] 4.2 Board config sanity — piece counts match expected totals per mode

## 5. Socket.IO Integration Tests
- [ ] 5.1 Full multiplayer flow: connect → join_queue → game_found → place_king_pit → confirm_setup → game_start → make_move → game_state → game_over
- [ ] 5.2 Tie-breaker flow: combat_choice → tie_breaker_reveal → tie_breaker_retry → resolution
- [ ] 5.3 Forfeit flow: forfeit_game → game_over with reason `forfeit`
- [ ] 5.4 Draw offer flow: offer_draw → draw_offered → respond_draw (accept/decline)
- [ ] 5.5 Rematch flow: request_rematch → rematch_requested → rematch_accepted
- [ ] 5.6 Room flow: create_room → room_created → join_room → game_found
- [ ] 5.7 Disconnect/reconnect: disconnect → opponent_reconnecting → reconnect → session_restored

## 6. E2E Browser Tests
- [ ] 6.1 Add minimal `data-testid` attributes to key UI elements (buttons, board cells, modals)
- [ ] 6.2 Happy path: Two tabs — matchmake → setup → play → game over
- [ ] 6.3 Setup phase: drag-and-drop king/pit, randomise, confirm
- [ ] 6.4 Game over screen: verify winner message, rematch button

## 7. CI Integration
- [ ] 7.1 Update `.github/workflows/ci.yml` to run `test:unit` and `test:integration` after build
- [ ] 7.2 Add Playwright install step and run `test:e2e` in CI
