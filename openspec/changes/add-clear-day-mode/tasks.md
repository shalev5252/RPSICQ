# Tasks: Add Clear Day Mode

## 1. Shared Types & Constants
- [x] 1.1 Add `GameVariant` type (`'standard' | 'clearday'`) to `shared/src/types.ts`
- [x] 1.2 Add `gameVariant` field to `GameState` interface (default: `'standard'`)
- [x] 1.3 Update `JoinQueuePayload`, `StartSingleplayerPayload`, `CreateRoomPayload` to include optional `gameVariant`

## 2. Server - Matchmaking & Session
- [x] 2.1 Update `MatchmakingService` to add 2 new queues (`classic-clearday`, `rpsls-clearday`)
- [x] 2.2 Modify `addToQueue()` to construct queue key from gameMode + gameVariant
- [x] 2.3 Update `GameService.createSession()` to accept and store `gameVariant`
- [x] 2.4 Update socket handlers to extract `gameVariant` from payloads

## 3. Server - Clear Day Logic
- [x] 3.1 Add `revealAllPieces()` helper method in `GameService`
- [x] 3.2 Call `revealAllPieces()` in `confirmSetup()` when variant is `'clearday'` and both players ready

## 4. Client - Variant Selection
- [x] 4.1 Add `gameVariant` state to `gameStore.ts`
- [x] 4.2 Add variant selector (Standard / Clear Day) to mode selection screen
- [x] 4.3 Update `joinQueue` and `startSingleplayer` emissions to include `gameVariant`
- [x] 4.4 Add localization strings for Clear Day (en.json, he.json)

## 5. Client - Visual Indicator
- [x] 5.1 Add Clear Day indicator (☀️) to GameScreen header when variant is `'clearday'`
- [x] 5.2 Style the indicator badge

## 6. Validation
- [ ] 6.1 Manual test: Start Clear Day game vs AI, verify all pieces visible at game start
- [ ] 6.2 Manual test: Start Standard game vs AI, verify pieces still hidden until combat
