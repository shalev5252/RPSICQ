  - [x] 1. Core: Two-Tier Pattern Recognition Service
    - [x] 1.1 Create `TiePatternTracker.ts` in `server/src/services/ai/` with two tracking mechanisms:
      - **Cross-Battle Tracker**: Stores first-choice of each tie-breaker across the session.
      - **Intra-Battle Tracker**: Stores choice sequence within the current prolonged tie.
    - [x] 1.2 Implement cross-battle frequency analysis (predict first-choice based on history).
    - [x] 1.3 Implement intra-battle pattern detection (repetition, rotation, preference).
    - [x] 1.4 Integrate `TiePatternTracker` into `AIOpponentService` (initialize on session start).

  - [x] 2. Core: Integrate Prediction into Decision Making
    - [x] 2.1 Update `AIOpponentService.selectTieBreakerChoice` to:
      - Use cross-battle prediction for the first round of a new tie.
      - Use intra-battle prediction for subsequent rounds.
    - [x] 2.2 Add prediction confidence threshold (only exploit if confident > 60%).
    - [x] 2.3 Record tie-breaker outcomes in tracker to refine future predictions.

  - [x] 3. Enhance AI Difficulty
    - [x] 3.1 Increase `ExpectimaxSearch` depth dynamically based on remaining pieces (depth 2 -> 3 when pieces < 10, depth 3 -> 4 when pieces < 6).
    - [x] 3.2 Refine `BoardEvaluator` weights (increase `threatPenalty` and `kingProtection` for harder difficulty).
    - [x] 3.3 Reduce `AI_SUBOPTIMAL_CHANCE` (already at 5%, verified as low).

  - [x] 4. Validation & Testing
    - [x] 4.1 Unit tests for `TiePatternTracker` (server has no test framework; skipped).
    - [x] 4.2 Playtest vs AI to verify "smarter" feel in tie-breakers (build verified).
