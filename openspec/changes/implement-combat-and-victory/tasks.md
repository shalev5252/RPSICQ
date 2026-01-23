# Tasks

## Phase 1: Core Combat Logic (Server)
- [x] Implement `resolveCombat(attacker, defender)` helper in `GameService`
- [x] Handle standard RPS interactions (Rock beats Scissors, etc.)
- [x] Handle Pit defense (Attacker always loses)
- [x] Handle King capture (Attacker wins game)
- [x] Handle Ties (Triggers Tie Breaker state)

## Phase 2: Tie Breaker System (Server & Client)
- [x] Add `tie_breaker` phase to `GamePhase` type in shared
- [x] Implement `submitTieBreakerChoice` in `GameService` to store choices
- [x] Create `TieBreakerModal` component on Client
- [x] Handle specific socket events for tie breaking (`COMBAT_CHOICE`)
- [x] Re-trigger combat resolution after both players choose

## Phase 3: Visuals & State Updates
- [x] Update `makeMove` to return combat results
- [x] Implement reveal & halo logic (winner gets `isRevealed` and `hasHalo`)
- [x] Remove defeated pieces from board
- [x] Send `GAME_OVER` event when King is captured

## Phase 4: UI Feedback
- [x] Show Game Over screen with Winner/Loser status
- [x] (Optional) Simple combat animation or notification - Skipped for now

## Validation
- [x] Build passes: Client and Server
- [ ] Manual test: Play full game until King capture with tie scenarios
