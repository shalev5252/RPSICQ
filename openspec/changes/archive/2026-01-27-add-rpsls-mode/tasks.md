# Tasks: Add RPSLS Game Mode

## Phase 1: Shared Types & Constants
- [x] Add `GameMode` type to `shared/src/types.ts`.
- [x] Add `lizard` and `spock` to `PieceType`.
- [x] Add `BOARD_CONFIG` per mode to `shared/src/constants.ts`.
- [x] Add `RPSLS_WINS` combat matrix.

## Phase 2: Server - Matchmaking
- [x] Update `JOIN_QUEUE` payload to include `gameMode`.
- [x] Implement separate matchmaking queues (`classicQueue`, `rpslsQueue`).
- [x] Store `gameMode` in session state.

## Phase 3: Server - Game Logic
- [x] Pass `gameMode` to board initialization.
- [x] Use mode-specific board dimensions.
- [x] Use mode-specific setup piece counts.
- [x] Use mode-specific combat matrix in `resolveCombat`.

## Phase 4: Client - Mode Selection
- [x] Create `ModeSelect` component.
- [x] Integrate mode selection into lobby flow.
- [x] Pass `gameMode` in `JOIN_QUEUE` event.

## Phase 5: Client - UI Updates
- [x] Add Lizard 🦎 and Spock 🖖 icons to `Piece.tsx`.
- [x] Update `TieBreaker` modal to show Lizard/Spock (if RPSLS mode).
- [x] Update setup screen for RPSLS piece counts (2 of each).

## Phase 6: Verification
- [x] Unit tests for extended combat matrix.
- [x] E2E test: Full RPSLS match.
- [x] Verify mode separation (no mixed-mode matches).
