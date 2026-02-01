## Context
The current AI opponent plays competently but lacks "meta-game" awareness. It chooses tie-breakers randomly (unless it knows the opponent's piece type) and has a fixed difficulty that can be prone to simple blunders due to random suboptimal moves. The goal is to make the AI feel "smarter" by exploiting human patterns in tie-breakers and increasing its overall playing strength.

## Goals
- **Tie-Breaker Exploitation**: The AI should notice if a player repeatedly chooses "Rock" after a tie, or rotates R -> P -> S, and counter it.
- **Increased Difficulty**: reduce "silly" mistakes and look further ahead in the game tree.
- **Adaptive Play**: The AI becomes harder to beat the more you play against it in a session (learning your habits).

## Decisions

### Decision: Two-Tier Tie Pattern Tracking
We will implement a `TiePatternTracker` class that tracks patterns at **two levels**:

#### Tier 1: Cross-Battle First-Choice Tracking
Tracks the **first choice** the player makes when *any* tie-breaker starts.
- **Data**: A rolling list of first-choices across all ties in the session.
- **Detection**: Frequency analysis (e.g., "Player opens with Rock 70% of the time").
- **Exploitation**: When a new tie starts, predict based on historical first-choice frequencies.

#### Tier 2: Intra-Battle Consecutive Tracking
Tracks choices **within a single prolonged tie** (multiple rounds in the same combat).
- **Data**: Current tie's choice sequence (e.g., [Rock, Rock, Paper]).
- **Detection**:
  - **Repetition**: Last N choices are the same (e.g., 3x Scissors).
  - **Rotation**: Detects cycles like R -> P -> S -> R.
  - **Preference**: Frequency within the current tie (e.g., Rock used 4/5 times).
- **Exploitation**: For the *next round* of the current tie, predict based on intra-battle patterns.

#### Priority
Intra-battle patterns take precedence during ongoing ties (more recent, more context-specific). Cross-battle patterns are used for the *first* round of a new tie.

### Decision: Dynamic Search Depth
Currently, `ExpectimaxSearch` uses a fixed depth (2 or 3). We will make this more granular:
- **Early Game (Many pieces)**: Depth 2 (Performance focus)
- **Mid Game (< 10 pieces)**: Depth 3
- **End Game (< 5 pieces)**: Depth 4 (Tactical precision)

This allows the AI to spot checkmates and traps in the endgame without slowing down early turns.

### Decision: Reduced Randomness "Suboptimal Chance"
The current `AI_SUBOPTIMAL_CHANCE` allows the AI to make a random move occasionally. We will:
- Reduce this chance significantly (e.g., from 0.2 to 0.05).
- Or remove it entirely for "Hard" mode behaviors if we implement difficulty levels later. For now, we'll just tune it down to make the default AI harder.

## Risks
- **Predictability**: If the AI becomes too deterministic in countering patterns, a savvy player might bait it.
    - *Mitigation*: Cap the prediction confidence. Even if 100% sure, keep a 10% chance to pick randomly to stay unpredictable.
- **Performance**: Deeper search (Depth 4) can be slow in JS.
    - *Mitigation*: Only use Depth 4 when total pieces are very low (<6), ensuring the branching factor is small enough.

## Open Questions
- Should this pattern tracking persist across games in the same session? **Yes**, as long as the session ID (socket) persists.
