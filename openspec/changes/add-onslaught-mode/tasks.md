# Tasks: Add Onslaught Mode

## 1. Shared Logic & Types
- [x] 1.1 Update `GameVariant` type to include `'onslaught'` in `shared/src/types.ts`.
- [x] 1.2 Define `ONSLAUGHT_CONFIG` in `shared/src/constants.ts` with board sizes (6x3, 6x5) and piece counts.
- [x] 1.3 Add `isGameVariant(variant)` helper if needed. (Not strictly needed, string check sufficed)

## 2. Server - Core Logic
- [x] 2.1 Update `MatchmakingService` to add `classic-onslaught` and `rpsls-onslaught` queues.
- [x] 2.2 Update `GameService.createSession` to use `ONSLAUGHT_CONFIG` dimensions/pieces when variant is Onslaught.
- [x] 2.3 Implement `GameService.checkWinCondition` update:
  - [x] Add specific logic for Onslaught:
    - [x] Count red/blue pieces.
    - [x] If one count is 0, other wins.
    - [x] If total count is 2 (1 each), trigger Showdown logic.
- [x] 2.4 Implement Showdown logic:
  - [x] Compare elements.
  - [x] If decisive match, declare winner.
  - [x] If tie, trigger Tie Breaker phase but with "Game Win" consequence.

## 3. Server - Setup
- [x] 3.1 Modify `GameService.createSession` or setup flow to Skip `place_king_pit` phase for Onslaught.
- [x] 3.2 Auto-trigger `randomizeBoard` and skip manual confirmation steps on server (integrated into initialization).

## 4. Client - UI
- [x] 4.1 Update `MatchmakingScreen` to show "Onslaught" option in Variant Selector.
- [x] 4.2 Update `Board` component to handle dynamic columns. (Handled by existing flexible CSS)
- [x] 4.3 Hide "Setup" instructions related to King/Pit if in Onslaught.
- [x] 4.4 Update `GameScreen` to show "Onslaught" badge (Sword icon?).
- [x] 4.5 Hide Turn Timer if variant is Onslaught. (Timer not visually present yet, skipped)

## 5. Verification
- [ ] 5.1 Manual Test: Classic Onslaught (6x3 board, 2 of each piece, no king/pit). winning logic.
- [ ] 5.2 Manual Test: RPSLS Onslaught (6x5 board, 2 of each piece).
