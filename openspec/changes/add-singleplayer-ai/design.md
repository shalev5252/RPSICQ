## Context
The game currently requires two human players connected via WebSocket. We want to add a computer opponent that plays on the server side, reusing the existing GameService flow. The AI must feel like a real player — it should not be trivially beatable and should adapt its strategy based on revealed information.

## Goals / Non-Goals
- Goals:
  - Provide a challenging AI opponent that feels human-like
  - Reuse the existing GameService and game flow (setup → playing → combat → finished)
  - Support both Classic and RPSLS game modes
  - AI makes decisions with short, natural-feeling delays (not instant)
  - No external dependencies or cloud services needed
- Non-Goals:
  - Difficulty selection (single challenging difficulty for now)
  - AI learning across sessions (no persistent memory)
  - Multiplayer co-op vs AI
  - AI chat or personality system

## Decisions

### Decision: AI runs server-side within existing GameService flow
The AI opponent is a server-side service that plugs into the existing game session as a virtual player. When the game needs the AI to act (setup, move, tie-breaker), the GameService delegates to AIOpponentService which returns the decision. This avoids duplicating game logic and keeps the client unaware of whether the opponent is human or AI.

**Alternatives considered:**
- Client-side AI: Would expose game logic and piece positions to the client. Rejected for security (cheating) reasons.
- Separate microservice: Over-engineered for this scope. The AI logic is simple enough to live in the same process.

### Decision: AI Strategy — Weighted Evaluation with Pattern Tracking
The AI uses a multi-factor scoring system for move selection:

1. **Piece tracking**: Tracks which opponent pieces have been revealed and infers hidden piece types from combat outcomes
2. **Positional evaluation**: Scores moves based on:
   - Proximity to opponent King (offensive pressure)
   - Protection of own King (defensive awareness)
   - Avoiding known Pit locations
   - Board control (center and forward positions valued higher)
3. **Combat risk assessment**: Before moving into an occupied cell, estimates win probability based on known/inferred piece types
4. **Randomized tie-breaking**: When multiple moves score similarly, adds controlled randomness to feel human-like (avoids always picking the "optimal" move)

**Alternatives considered:**
- Minimax with alpha-beta pruning: The hidden information nature of this game makes traditional tree search impractical — you can't evaluate positions you can't see.
- Pure random: Too easy to beat, not engaging.
- Machine learning: Requires training data and infrastructure, out of scope.

### Decision: AI Setup uses strategic King/Pit placement
The AI places King and Pit with strategic intent:
- King placed in back row (away from opponent), avoiding edges
- Pit placed to protect likely approach paths to King
- RPS pieces randomized after King/Pit placement (same as human flow)

### Decision: AI response timing
AI actions include a small randomized delay (500ms–2000ms) to feel natural. Instant responses feel robotic; too-long delays feel broken.

### Decision: Singleplayer bypasses matchmaking queue
When a player selects "vs Computer", the server immediately creates a game session with an AI player — no queue, no waiting. The AI player gets a virtual socket ID and player ID prefixed with `ai-` for easy identification.

## Risks / Trade-offs
- **Risk**: AI too easy → Mitigation: Aggressive positional scoring, piece tracking, and combat risk assessment make the AI non-trivial to beat
- **Risk**: AI too hard → Mitigation: Controlled randomness (10-20% chance of suboptimal move) prevents perfect play
- **Risk**: AI feels robotic → Mitigation: Randomized delays and occasional suboptimal moves simulate human behavior
- **Trade-off**: Single difficulty level keeps implementation simple but may frustrate very new or very experienced players. Can be extended later.

## Open Questions
- None currently blocking. Difficulty tuning will happen during testing.
