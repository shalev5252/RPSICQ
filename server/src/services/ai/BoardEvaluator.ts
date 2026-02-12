import {
    GameState,
    PlayerColor,
    Piece,
    Position,
    PieceType,
    BOARD_CONFIG,
    ONSLAUGHT_CONFIG,
    RPSLS_WINS,
    MOVEMENT_DIRECTIONS
} from '@rps/shared';
import { EvalWeights, BayesianState, GamePhase } from './types.js';

/**
 * Static board evaluation for leaf nodes in the search tree.
 * Also computes Shannon entropy-based information gain bonuses.
 *
 * Scores are calibrated to match the greedy heuristic's magnitude
 * (combat win ~40, king capture ~200, infiltration ~50).
 */
export class BoardEvaluator {

    /**
     * Evaluate the board position from the AI's perspective.
     * Returns a score where positive is good for AI, negative is bad.
     */
    public evaluate(
        gameState: GameState,
        aiColor: PlayerColor,
        weights: EvalWeights,
        bayesianState: BayesianState | undefined
    ): number {
        const config = (gameState.gameVariant === 'onslaught')
            ? ONSLAUGHT_CONFIG[gameState.gameMode]
            : BOARD_CONFIG[gameState.gameMode];
        const maxRow = config.rows - 1;
        const opponentColor: PlayerColor = aiColor === 'red' ? 'blue' : 'red';
        const aiPlayer = gameState.players[aiColor];
        const opponentPlayer = gameState.players[opponentColor];

        if (!aiPlayer || !opponentPlayer) return 0;

        if (gameState.gameVariant === 'onslaught') {
            return this.evaluateOnslaught(gameState, aiColor, weights, bayesianState, config);
        }

        // --- Terminal State Check ---
        const ownKing = aiPlayer.pieces.find(p => p.type === 'king');
        const opponentKing = opponentPlayer.pieces.find(p => p.type === 'king');

        if (!ownKing) return -10000; // AI lost
        if (!opponentKing) return 10000; // AI won

        let score = 0;

        // --- Material advantage ---
        const aiPieceCount = aiPlayer.pieces.filter(p => p.type !== 'king' && p.type !== 'pit').length;
        const opPieceCount = opponentPlayer.pieces.filter(p => p.type !== 'king' && p.type !== 'pit').length;
        score += (aiPieceCount - opPieceCount) * weights.pieceAdvantage;

        // --- Type Composition Advantage ---
        // Count AI's combat piece types
        const aiTypeCounts: Record<string, number> = {};
        for (const p of aiPlayer.pieces) {
            if (p.type === 'king' || p.type === 'pit') continue;
            aiTypeCounts[p.type] = (aiTypeCounts[p.type] || 0) + 1;
        }

        // Estimate opponent's remaining types from Bayesian beliefs or raw counts
        const opTypeCounts: Record<string, number> = {};
        if (bayesianState) {
            // Use Bayesian beliefs to estimate opponent type distribution
            for (const [, tracked] of bayesianState.trackedPieces) {
                if (tracked.isDead) continue;
                if (tracked.isRevealed && tracked.knownType) {
                    if (tracked.knownType !== 'king' && tracked.knownType !== 'pit') {
                        opTypeCounts[tracked.knownType] = (opTypeCounts[tracked.knownType] || 0) + 1;
                    }
                } else {
                    // Distribute probability across types
                    for (const [type, prob] of Object.entries(tracked.beliefs)) {
                        if (type !== 'king' && type !== 'pit') {
                            opTypeCounts[type] = (opTypeCounts[type] || 0) + prob;
                        }
                    }
                }
            }
        } else {
            // Fallback: count opponent's visible combat pieces
            for (const p of opponentPlayer.pieces) {
                if (p.type === 'king' || p.type === 'pit') continue;
                opTypeCounts[p.type] = (opTypeCounts[p.type] || 0) + 1;
            }
        }

        // Calculate coverage bonus and vulnerability penalty
        let compositionScore = 0;
        const combatTypes = Object.keys(RPSLS_WINS);

        for (const aiType of combatTypes) {
            const aiCount = aiTypeCounts[aiType] || 0;
            if (aiCount === 0) continue;

            const victims = RPSLS_WINS[aiType] || [];

            // Coverage bonus: does the opponent have types we can beat?
            let victimPresence = 0;
            for (const victim of victims) {
                victimPresence += opTypeCounts[victim] || 0;
            }
            compositionScore += aiCount * victimPresence * 0.5; // bonus per counter matchup

            // Vulnerability penalty: does the opponent have types that beat us?
            for (const opType of combatTypes) {
                const opCount = opTypeCounts[opType] || 0;
                if (opCount === 0) continue;
                const opVictims = RPSLS_WINS[opType] || [];
                if (opVictims.includes(aiType)) {
                    compositionScore -= aiCount * opCount * 0.3; // penalty per exposed matchup
                }
            }
        }

        score += compositionScore * weights.compositionAdvantage;

        // --- Per-piece evaluation for AI pieces ---

        for (const piece of aiPlayer.pieces) {
            if (piece.type === 'king' || piece.type === 'pit') continue;

            // Forward progression (FIXED: correct for both colors)
            // Red attacks toward higher rows, blue attacks toward lower rows
            const forwardProgress = aiColor === 'red'
                ? piece.position.row           // red: row 5 = deepest forward
                : maxRow - piece.position.row;  // blue: row 0 = deepest forward
            score += forwardProgress * weights.forwardProgress;

            // Infiltration bonus (correct for both colors)
            const isRed = aiColor === 'red';
            const isInEnemyHalf = isRed ? piece.position.row >= 3 : piece.position.row <= 2;
            if (isInEnemyHalf) {
                score += weights.infiltration;
                const isInEnemyBase = isRed ? piece.position.row >= 4 : piece.position.row <= 1;
                if (isInEnemyBase) {
                    score += weights.infiltration * 1.5;
                }
            }

            // Center control
            const centerCol = (config.cols - 1) / 2;
            const distFromCenterCol = Math.abs(piece.position.col - centerCol);
            score += Math.max(0, 3 - distFromCenterCol) * weights.centerControl;

            // King protection (proximity to own king)
            if (ownKing) {
                const distToOwnKing = Math.abs(piece.position.row - ownKing.position.row) +
                    Math.abs(piece.position.col - ownKing.position.col);
                if (distToOwnKing <= 3) {
                    score += weights.kingProtection;
                }
            }

            // King proximity (approach known opponent king)
            if (bayesianState?.knownKingPosition) {
                const kingPos = bayesianState.knownKingPosition;
                const distToOpKing = Math.abs(piece.position.row - kingPos.row) +
                    Math.abs(piece.position.col - kingPos.col);
                // Direct score: closer = better (max at dist 0 = adjacen)
                score += Math.max(0, (config.rows + config.cols) - distToOpKing) * weights.kingProximity;
            }

            // Threat assessment: being adjacent to enemy pieces
            for (const op of opponentPlayer.pieces) {
                const dist = Math.abs(op.position.row - piece.position.row) +
                    Math.abs(op.position.col - piece.position.col);
                if (dist === 1) {
                    const threatScore = this.assessThreat(piece, op, bayesianState);
                    score -= threatScore * weights.threatPenalty;
                }
            }
        }

        // --- King Exposure Penalty ---
        // Check if the AI's King has open vertical approach lanes with no friendly piece blocking
        if (ownKing) {
            const kingRow = ownKing.position.row;
            const kingCol = ownKing.position.col;
            // Direction enemy approaches from: Red King is in low rows, enemy comes from high rows
            // Blue King is in high rows, enemy comes from low rows
            const enemyDir = aiColor === 'red' ? 1 : -1;

            // Check columns: King's column and adjacent columns (±1)
            for (let colOffset = -1; colOffset <= 1; colOffset++) {
                const checkCol = kingCol + colOffset;
                if (checkCol < 0 || checkCol >= config.cols) continue;

                // Walk from King toward the enemy side and check if any friendly piece blocks the lane
                let blocked = false;
                let row = kingRow + enemyDir;
                while (row >= 0 && row < config.rows) {
                    const cellPiece = gameState.board[row][checkCol].piece;
                    if (cellPiece && cellPiece.owner === aiColor && cellPiece.type !== 'king') {
                        blocked = true;
                        break;
                    }
                    row += enemyDir;
                }

                if (!blocked) {
                    // Open lane toward King — penalty (center column is worse)
                    const centerPenalty = colOffset === 0 ? 1.5 : 1.0;
                    score -= weights.kingExposure * centerPenalty;
                }
            }
        }

        // --- Probe Detection ---
        // Penalize opponent pieces advancing toward AI's back row near King's column
        if (ownKing) {
            const kingCol = ownKing.position.col;
            // The AI's back row: Red's King sits in low rows (0-1), Blue's in high rows (4-5)
            const backRow = aiColor === 'red' ? 0 : maxRow;

            for (const op of opponentPlayer.pieces) {
                if (op.type === 'king' || op.type === 'pit') continue;

                // Is this piece near the King's column? (within ±1)
                const colDist = Math.abs(op.position.col - kingCol);
                if (colDist > 2) continue;

                // How close is it to the AI's back row?
                const distToBackRow = Math.abs(op.position.row - backRow);
                // Only penalize pieces that have advanced past midfield toward our side
                const midRow = Math.floor(config.rows / 2);
                const isPastMidfield = aiColor === 'red'
                    ? op.position.row < midRow
                    : op.position.row > midRow;

                if (isPastMidfield) {
                    // Closer to back row = higher penalty, closer column = higher penalty
                    const proximityFactor = Math.max(0, config.rows - distToBackRow) / config.rows;
                    const colFactor = colDist <= 1 ? 1.0 : 0.5;
                    score -= weights.probeDetection * proximityFactor * colFactor;
                }
            }
        }

        // --- Expanded King Safety (radius 2) ---
        let kingThreatCount = 0;
        let kingSafetyPenalty = 0;
        if (ownKing) {
            for (const op of opponentPlayer.pieces) {
                const dist = Math.abs(op.position.row - ownKing.position.row) +
                    Math.abs(op.position.col - ownKing.position.col);
                if (dist === 1) {
                    kingSafetyPenalty += 70; // heavy penalty for adjacent enemy
                    kingThreatCount++;
                } else if (dist === 2) {
                    kingSafetyPenalty += 25; // early warning for nearby enemy
                    kingThreatCount++;
                }
            }

            // Interpose bonus: reward friendly pieces between King and threats
            if (kingThreatCount > 0) {
                for (const piece of aiPlayer.pieces) {
                    if (piece.type === 'king' || piece.type === 'pit') continue;

                    // Check if this piece is on the Manhattan path between King and any nearby threat
                    for (const op of opponentPlayer.pieces) {
                        const distToKing = Math.abs(op.position.row - ownKing.position.row) +
                            Math.abs(op.position.col - ownKing.position.col);
                        if (distToKing > 2) continue;

                        // Is our piece between the King and this threat?
                        const pieceToKing = Math.abs(piece.position.row - ownKing.position.row) +
                            Math.abs(piece.position.col - ownKing.position.col);
                        const pieceToThreat = Math.abs(piece.position.row - op.position.row) +
                            Math.abs(piece.position.col - op.position.col);

                        // A piece is "interposing" if it's on the path (distances add up)
                        // and it's closer to King than the threat is
                        if (pieceToKing + pieceToThreat <= distToKing + 1 && pieceToKing < distToKing) {
                            score += weights.kingProtection * 0.5;
                        }
                    }
                }
            }

            // Dynamic danger multiplier: scale king safety penalty when threats are close
            if (kingThreatCount > 0) {
                kingSafetyPenalty *= weights.kingDangerMultiplier;
            }

            score -= kingSafetyPenalty;
        }

        return score;
    }

    private evaluateOnslaught(
        gameState: GameState,
        aiColor: PlayerColor,
        weights: EvalWeights,
        bayesianState: BayesianState | undefined,
        config: { rows: number; cols: number }
    ): number {
        const opponentColor: PlayerColor = aiColor === 'red' ? 'blue' : 'red';
        const aiPlayer = gameState.players[aiColor];
        const opponentPlayer = gameState.players[opponentColor];
        if (!aiPlayer || !opponentPlayer) return 0;

        const aiPieces = aiPlayer.pieces;
        const opPieces = opponentPlayer.pieces;

        // Terminal States: Elimination
        if (aiPieces.length === 0) return -10000;
        if (opPieces.length === 0) return 10000;

        // Terminal States: Showdown (1v1)
        if (aiPieces.length === 1 && opPieces.length === 1) {
            const myPiece = aiPieces[0];
            const opPiece = opPieces[0];
            const knownOpType = this.getKnownOrRevealedType(opPiece, bayesianState);

            if (knownOpType) {
                // Known outcome
                if (RPSLS_WINS[myPiece.type]?.includes(knownOpType)) return 10000; // I win
                if (RPSLS_WINS[knownOpType]?.includes(myPiece.type)) return -10000; // I lose
                return 0; // Tie - leads to Tie Breaker (neutral for now, or slight penalty?)
            } else {
                // Unknown - calculate expected win probability
                // This is effectively evaluateCombat but globally important
                const beliefs = bayesianState?.trackedPieces.get(opPiece.id)?.beliefs;
                if (beliefs) {
                    let winProb = 0;
                    let lossProb = 0;
                    for (const [type, prob] of Object.entries(beliefs)) {
                        if (RPSLS_WINS[myPiece.type]?.includes(type as PieceType)) winProb += prob;
                        else if (RPSLS_WINS[type as PieceType]?.includes(myPiece.type)) lossProb += prob;
                    }
                    if (winProb > 0.8) return 9000;
                    if (lossProb > 0.8) return -9000;
                }
            }
        }

        let score = 0;

        // 1. Material Advantage (Primary Driver)
        // High weight since elimination is the goal - heavily incentivize kills
        score += (aiPieces.length - opPieces.length) * (weights.pieceAdvantage * 4.0);

        // 2. Positional Factors
        const maxRow = config.rows - 1;

        for (const piece of aiPieces) {
            // Forward Progress - aggressive advance
            const forwardProgress = aiColor === 'red'
                ? piece.position.row
                : maxRow - piece.position.row;
            score += forwardProgress * (weights.forwardProgress * 2.5);

            // Center Control
            const centerCol = (config.cols - 1) / 2;
            const distFromCenterCol = Math.abs(piece.position.col - centerCol);
            score += Math.max(0, 2 - distFromCenterCol) * weights.centerControl;

            // Infiltration (Enemy Half) - strong reward for invading
            const isRed = aiColor === 'red';
            const isInEnemyHalf = isRed ? piece.position.row >= (config.rows / 2) : piece.position.row < (config.rows / 2);
            if (isInEnemyHalf) {
                score += weights.infiltration * 3.0;
            }

            // Threats - reduce fear significantly to encourage risks
            for (const op of opPieces) {
                const dist = Math.abs(op.position.row - piece.position.row) +
                    Math.abs(op.position.col - piece.position.col);
                if (dist === 1) {
                    const threatScore = this.assessThreat(piece, op, bayesianState);
                    score -= threatScore * (weights.threatPenalty * 0.4);
                }
            }
        }

        return score;
    }

    /**
     * Compute expected combat value for an attacker attacking a defender.
     * Uses Bayesian beliefs when defender type is unknown.
     * Returns a score in the same magnitude as the greedy heuristic.
     */
    public evaluateCombat(
        attacker: Piece,
        defender: Piece,
        bayesianState: BayesianState | undefined,
        _weights: EvalWeights
    ): number {
        const knownType = this.getKnownOrRevealedType(defender, bayesianState);

        if (knownType) {
            return this.scoreCombatKnown(attacker.type, knownType);
        }

        // Unknown defender: expected value over Bayesian beliefs
        const beliefs = bayesianState?.trackedPieces.get(defender.id)?.beliefs;
        if (!beliefs) {
            return 8; // unknown: slight positive bias (matches greedy)
        }

        let expectedValue = 0;
        for (const [type, prob] of Object.entries(beliefs)) {
            if (prob <= 0) continue;
            expectedValue += prob * this.scoreCombatKnown(attacker.type, type as PieceType);
        }

        return expectedValue;
    }

    /**
     * Compute information gain for attacking a specific opponent piece.
     * Based on Shannon entropy of the piece's belief distribution.
     * Returns small values (0-5) to avoid overriding combat/positional scores.
     */
    public computeInformationGain(
        _attackerType: PieceType,
        defenderPieceId: string,
        bayesianState: BayesianState | undefined,
        phase: GamePhase
    ): number {
        if (!bayesianState) return 0;

        const tracked = bayesianState.trackedPieces.get(defenderPieceId);
        if (!tracked || tracked.isRevealed) return 0;

        // Shannon entropy: H = -sum(p * log2(p))
        let entropy = 0;
        for (const prob of Object.values(tracked.beliefs)) {
            if (prob > 0 && prob < 1) {
                entropy -= prob * Math.log2(prob);
            }
        }

        const kingProb = tracked.beliefs['king'] ?? 0;
        const pitProb = tracked.beliefs['pit'] ?? 0;

        // Scale: small bonus, capped to avoid dominating other scores
        let gain = entropy * 0.5;
        gain += kingProb * 3;
        gain -= pitProb * 2;

        // Phase scaling: less info-gain emphasis as game progresses
        const phaseMultiplier = phase === 'opening' ? 1.0 : phase === 'midgame' ? 0.6 : 0.2;
        gain *= phaseMultiplier;

        return Math.max(0, Math.min(gain, 5));
    }

    /**
     * Get valid moves for a piece (used in search).
     */
    public getValidMoves(
        piece: Piece,
        ownerColor: PlayerColor,
        gameState: GameState
    ): Position[] {
        if (piece.type === 'king' || piece.type === 'pit') return [];



        const config = (gameState.gameVariant === 'onslaught')
            ? ONSLAUGHT_CONFIG[gameState.gameMode]
            : BOARD_CONFIG[gameState.gameMode];
        const moves: Position[] = [];

        for (const dir of MOVEMENT_DIRECTIONS) {
            const newRow = piece.position.row + dir.row;
            const newCol = piece.position.col + dir.col;
            if (newRow < 0 || newRow >= config.rows || newCol < 0 || newCol >= config.cols) continue;

            const targetCell = gameState.board[newRow][newCol];
            if (!targetCell.piece || targetCell.piece.owner !== ownerColor) {
                moves.push({ row: newRow, col: newCol });
            }
        }

        return moves;
    }

    // ----------------------------------------------------------------
    // Private helpers
    // ----------------------------------------------------------------

    public getKnownOrRevealedType(piece: Piece, bayesianState: BayesianState | undefined): PieceType | null {
        if (bayesianState) {
            const tracked = bayesianState.trackedPieces.get(piece.id);
            if (tracked?.knownType) return tracked.knownType;
        }
        if (piece.isRevealed) return piece.type;
        return null;
    }

    /**
     * Score a known combat matchup.
     * Magnitudes match the greedy heuristic for consistency.
     */
    private scoreCombatKnown(attackerType: PieceType, defenderType: PieceType): number {
        if (defenderType === 'king') return 200;   // capturing king = huge reward
        if (defenderType === 'pit') return -200;    // walking into pit = disaster

        if (attackerType === defenderType) return 5; // tie: slight positive (we chose to fight)

        const wins = RPSLS_WINS[attackerType];
        if (wins && wins.includes(defenderType)) return 40;  // win

        return -30; // loss
    }

    /**
     * Assess how threatening an adjacent enemy piece is.
     * Returns a normalized threat level (0-1 scale, used with threatPenalty weight).
     */
    private assessThreat(
        ourPiece: Piece,
        enemyPiece: Piece,
        bayesianState: BayesianState | undefined
    ): number {
        const knownType = this.getKnownOrRevealedType(enemyPiece, bayesianState);

        if (knownType) {
            const theirWins = RPSLS_WINS[knownType];
            if (theirWins && theirWins.includes(ourPiece.type)) {
                return 1.0; // they beat us
            }
            if (knownType === ourPiece.type) {
                return 0.1; // tie
            }
            return -0.05; // we beat them (opportunity)
        }

        // Unknown enemy: use Bayesian beliefs
        if (bayesianState) {
            const beliefs = bayesianState.trackedPieces.get(enemyPiece.id)?.beliefs;
            if (beliefs) {
                let threat = 0;
                for (const [type, prob] of Object.entries(beliefs)) {
                    if (prob <= 0) continue;
                    const theirWins = RPSLS_WINS[type];
                    if (theirWins && theirWins.includes(ourPiece.type)) {
                        threat += prob;
                    }
                }
                return threat * 0.3; // scaled down: unknown threats shouldn't paralyze
            }
        }

        return 0.1; // mild caution for completely unknown
    }
}
