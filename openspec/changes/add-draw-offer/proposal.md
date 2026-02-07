# Add Draw Offer

## Why
Players may want to end a game in a draw by mutual agreement, rather than playing to an indefinite conclusion. This is a common feature in strategy games like chess.

## What Changes

### Draw Offer Flow
1. During `playing` phase, the player whose turn it is can click "Offer Draw"
2. Opponent sees notification with Accept/Decline options
3. If accepted: game ends in draw
4. If declined: offering player cannot offer again until their next turn
5. Each player can only offer once per turn

### Constraints
- Only available in multiplayer (PvP) games
- Not available during `setup`, `tie_breaker`, or `finished` phases
- Draw offer does not pause the turn timer

### UI Elements
- "Offer Draw" button in game screen (visible only when it's player's turn)
- Notification modal for opponent with Accept/Decline buttons
- Visual indicator when draw offer is pending

## Impact
- Affected specs: new `draw-offer` capability
- Affected code: GameService, socket handlers, GameScreen, shared constants
