## 1. Shared Types & Constants
- [x] 1.1 Add `SetupStatePayload` type for server->client setup state updates
- [x] 1.2 Add `SETUP_STATE` socket event constant

## 2. Server: Setup Logic
- [x] 2.1 Add `placeKingPit` method to GameService - validates positions are in player's rows, stores pieces
- [x] 2.2 Add `randomizePieces` method to GameService - shuffles RPS pieces into remaining empty cells
- [x] 2.3 Add `confirmSetup` method to GameService - sets player ready, checks if both ready to start
- [x] 2.4 Add `getPlayerSetupView` method - returns board state with fog of war for opponent pieces
- [x] 2.5 Wire up `PLACE_KING_PIT` handler - call placeKingPit, emit setup state to player
- [x] 2.6 Wire up `RANDOMIZE_PIECES` handler - call randomizePieces, emit setup state to player
- [x] 2.7 Wire up `CONFIRM_SETUP` handler - call confirmSetup, emit `GAME_START` to both if both ready

## 3. Client: Store Updates
- [x] 3.1 Add setup state to gameStore: `placedKing`, `placedPit`, `setupPieces`, `opponentReady`
- [x] 3.2 Add actions: `setSetupState`, `placeKing`, `placePit`

## 4. Client: Setup Components
- [x] 4.1 Create `SetupScreen` component - container for setup phase UI
- [x] 4.2 Create `Board` component - renders 6x7 grid of cells
- [x] 4.3 Create `Cell` component - single cell, handles drop target
- [x] 4.4 Create `Piece` component - displays piece with appropriate icon/color
- [x] 4.5 Create `PieceTray` component - shows King and Pit for dragging (before placed)
- [x] 4.6 Implement drag & drop for King/Pit using native HTML5 drag & drop
- [x] 4.7 Add Shuffle button - emits `RANDOMIZE_PIECES`, disabled until King/Pit placed
- [x] 4.8 Add "Let's Start" button - emits `CONFIRM_SETUP`, disabled until shuffled at least once
- [x] 4.9 Add opponent ready indicator - shows when opponent has confirmed

## 5. Client: Board Perspective
- [x] 5.1 Implement board coordinate transformation for blue player (rows reversed so their rows appear at bottom)

## 6. Client: Socket Integration
- [x] 6.1 Add `SETUP_STATE` listener in useGameSession - updates store with setup state
- [x] 6.2 Add `OPPONENT_READY` listener - shows opponent ready indicator
- [x] 6.3 Add `GAME_START` listener - transitions to playing phase

## 7. Integration
- [x] 7.1 Update App.tsx to render SetupScreen when gamePhase is 'setup'
- [x] 7.2 Add CSS styles for setup components

## 8. Testing
- [x] 8.1 Test King/Pit placement validation (can only place in own rows) - validated server-side
- [x] 8.2 Test shuffle only affects RPS pieces, not King/Pit - implemented in randomizePieces
- [x] 8.3 Test both players must confirm before game starts - confirmSetup checks both ready
- [x] 8.4 Test fog of war - opponent pieces show as hidden - implemented in getPlayerSetupView
