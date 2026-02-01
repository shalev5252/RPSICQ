# Proposal: Enhance AI Agent Intelligence

This proposal aims to significantly improve the AI opponent by adding "meta-game" awareness (pattern recognition) and tuning its search parameters for harder gameplay. The AI will no longer just play the board; it will play the player.

## Capabilities

### 1. Tie-Breaker Pattern Recognition
The AI will track the history of the opponent's choices in RPS tie-breakers (Rock, Paper, Scissors, etc.). It will use frequency analysis and simple sequence detection to predict the opponent's next move and choose the optimal counter.

### 2. Adaptive Search Depth
To make the AI tactically sharper without sacrificing performance, the Lookahead Search (Expectimax) will use dynamic depth:
- **Depth 2**: Standard play (opening/midgame).
- **Depth 3**: Late midgame (< 10 pieces).
- **Depth 4**: Endgame (< 6 pieces) - allows solving complex endgames precisely.

### 3. "Harder" Behavior Tuning
- Reduce the "Suboptimal Move Chance" (random blunders) to make the AI more consistent.
- Tune evaluation weights to prioritize King safety and Threat avoidance more heavily in higher difficulty contexts.

## Architecture
- **New Service**: `TiePatternTracker` (Server-side) - Stores rolling history of move choices per session.
- **Integration**: `AIOpponentService` will query `TiePatternTracker` during `selectTieBreakerChoice`.
- **Logic**: Simple N-Gram prediction (probability based on last N moves).

## Validation
- **Unit Tests**: Verify pattern tracker correctly predicts simple sequences (Repetition, Rotation).
- **Playtesting**: Validate that the AI feels "smarter" and punishes predictable play.
