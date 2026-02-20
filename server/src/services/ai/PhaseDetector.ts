import { GameState, PlayerColor, BOARD_CONFIG, RpsGameMode } from '@rps/shared';
import { GamePhase, EvalWeights, BayesianState } from './types.js';

/**
 * Detects game phase (opening/midgame/endgame) based on:
 * - Piece attrition ratio
 * - Knowledge ratio (how many opponent pieces are known)
 * Returns phase-specific weight profiles for the board evaluator.
 *
 * Weight calibration notes:
 * - forwardProgress multiplies row distance (0-5), so weight 8 => up to 40 per piece
 * - infiltration is flat bonus per piece in enemy territory
 * - threatPenalty multiplies normalized threat (0-1), so weight 10 => up to 10 per threat
 * - pieceAdvantage multiplies piece count difference
 * - kingProximity multiplies distance metric (0-11), so keep it moderate
 */
export class PhaseDetector {

    /**
     * Determine the current game phase.
     */
    public detectPhase(gameState: GameState, aiColor: PlayerColor, bayesianState: BayesianState | undefined): GamePhase {
        const config = BOARD_CONFIG[gameState.gameMode as RpsGameMode];
        const opponentColor: PlayerColor = aiColor === 'red' ? 'blue' : 'red';

        const aiPlayer = gameState.players[aiColor];
        const opponentPlayer = gameState.players[opponentColor];
        if (!aiPlayer || !opponentPlayer) return 'midgame';

        // Total pieces per side at game start
        const totalPerSide = (Object.values(config.pieces) as number[]).reduce((a, b) => a + b, 0);
        const currentTotal = aiPlayer.pieces.length + opponentPlayer.pieces.length;
        const startTotal = totalPerSide * 2;

        // Attrition ratio: percentage of total pieces lost
        const attritionRatio = 1 - (currentTotal / startTotal);

        // Knowledge ratio: how many opponent pieces we know about
        let knownCount = 0;
        if (bayesianState) {
            for (const tracked of bayesianState.trackedPieces.values()) {
                if (tracked.isRevealed && !tracked.isDead) {
                    knownCount++;
                }
            }
        }
        const aliveOpponentCount = opponentPlayer.pieces.length;
        const knowledgeRatio = aliveOpponentCount > 0 ? knownCount / aliveOpponentCount : 0;

        // King position known?
        const kingKnown = bayesianState?.knownKingPosition !== null;

        // Opening: <20% attrition AND <30% knowledge
        if (attritionRatio < 0.2 && knowledgeRatio < 0.3) {
            return 'opening';
        }

        // Endgame: >60% attrition OR <=6 total pieces OR king position known
        if (attritionRatio > 0.6 || currentTotal <= 6 || kingKnown) {
            return 'endgame';
        }

        // Midgame: everything else
        return 'midgame';
    }

    /**
     * Get evaluation weights for a given game phase.
     * Tuned for aggressive play that matches/exceeds greedy heuristic effectiveness.
     */
    public getWeights(phase: GamePhase): EvalWeights {
        switch (phase) {
            case 'opening':
                return {
                    forwardProgress: 8,    // push forward aggressively from the start
                    centerControl: 2,
                    kingProximity: 1,      // don't know where king is yet
                    kingProtection: 5,     // increased: protect king early
                    pieceAdvantage: 10,
                    infiltration: 20,      // strong incentive to cross midline
                    informationGain: 3,    // small bonus, don't sacrifice pieces for info
                    combatReward: 1,       // combat scores are already large (40/-30)
                    kingExposure: 15,      // high: punish open lanes to King early
                    probeDetection: 12,    // high: detect scouting toward back row
                    kingDangerMultiplier: 2.0,
                    compositionAdvantage: 3, // low: full composition, balanced
                    threatPenalty: 15      // increased: avoid threats more
                };

            case 'midgame':
                return {
                    forwardProgress: 8,
                    centerControl: 1,
                    kingProximity: 3,
                    kingProtection: 8,     // increased: defend king aggressively
                    pieceAdvantage: 15,
                    infiltration: 25,      // keep pushing
                    informationGain: 2,
                    combatReward: 1,
                    kingExposure: 8,       // moderate: still relevant
                    probeDetection: 6,     // moderate: mixed offense/defense
                    kingDangerMultiplier: 2.5,
                    compositionAdvantage: 8, // moderate: types start to matter
                    threatPenalty: 20      // increased: avoid risky positions
                };

            case 'endgame':
                return {
                    forwardProgress: 5,
                    centerControl: 0,
                    kingProximity: 5,      // approach known king
                    kingProtection: 12,    // increased: king safety is paramount
                    pieceAdvantage: 20,
                    infiltration: 15,
                    informationGain: 1,
                    combatReward: 1,
                    kingExposure: 3,       // low: lanes naturally open
                    probeDetection: 2,     // low: few pieces scouting
                    kingDangerMultiplier: 3.0, // high: every threat is critical
                    compositionAdvantage: 15, // high: remaining types define the matchup
                    threatPenalty: 25      // increased: can't afford losses in endgame
                };
        }
    }
}
