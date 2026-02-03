import {
    GameState,
    PlayerColor,
    Piece,
    Position,
    PieceType,
    RPSLS_WINS
} from '@rps/shared';
import { BayesianState, EvalWeights, ScoredMove, GamePhase } from './types.js';
import { BoardEvaluator } from './BoardEvaluator.js';
import { BayesianTracker } from './BayesianTracker.js';
import { PhaseDetector } from './PhaseDetector.js';

// Debug logging - only active in development
const DEBUG_AI = process.env.NODE_ENV !== 'production' && process.env.DEBUG_AI === 'true';

function aiLog(...args: unknown[]): void {
    if (DEBUG_AI) {
        console.log('[AI]', ...args);
    }
}

/**
 * Expectimax search with:
 * - MAX nodes for AI turns
 * - CHANCE nodes for opponent turns (weighted by simple opponent model)
 * - Bayesian beliefs for combat probability weighting
 * - Star-1 pruning at chance nodes
 * - Depth 2 default, depth 3 in endgame with few pieces
 */
export class ExpectimaxSearch {
    private evaluator: BoardEvaluator;
    private phaseDetector: PhaseDetector;
    private readonly MAX_SCORE = 10000;

    constructor() {
        this.evaluator = new BoardEvaluator();
        this.phaseDetector = new PhaseDetector();
    }

    /**
     * Find the best move for the AI using expectimax search.
     * Returns the best move or null if no moves available.
     */
    public findBestMove(
        gameState: GameState,
        aiColor: PlayerColor,
        bayesianState: BayesianState | undefined,
        _tracker: BayesianTracker
    ): { from: Position; to: Position } | null {
        const phase = this.phaseDetector.detectPhase(gameState, aiColor, bayesianState);
        const weights = this.phaseDetector.getWeights(phase);

        aiLog(`=== AI Move Selection (${aiColor}) ===`);
        aiLog(`Phase: ${phase}`);

        const aiPlayer = gameState.players[aiColor];
        if (!aiPlayer) return null;

        const opponentColor: PlayerColor = aiColor === 'red' ? 'blue' : 'red';

        // Determine search depth dynamically based on piece count
        // More pieces = shallower search for performance; fewer pieces = deeper for tactics
        const totalPieces = (gameState.players[aiColor]?.pieces.length ?? 0) +
            (gameState.players[opponentColor]?.pieces.length ?? 0);
        let depth = 2;  // default for early/mid game
        if (totalPieces <= 6) {
            depth = 4;  // endgame: precise tactics, solve the board
        } else if (totalPieces <= 10) {
            depth = 3;  // late midgame: look deeper for combinations
        }

        aiLog(`Search depth: ${depth}, Total pieces: ${totalPieces}`);

        // --- Emergency check: King in danger ---
        const emergencyMove = this.checkKingEmergency(gameState, aiColor, bayesianState, weights);
        if (emergencyMove) {
            aiLog(`EMERGENCY: King in danger! Moving to defend.`);
            return emergencyMove;
        }

        // Generate all candidate moves
        const candidates: ScoredMove[] = [];

        for (const piece of aiPlayer.pieces) {
            if (piece.type === 'king' || piece.type === 'pit') continue;

            const validMoves = this.evaluator.getValidMoves(piece, aiColor, gameState);
            for (const to of validMoves) {
                // Depth-limited expectimax
                const score = this.expectimaxScore(
                    gameState, aiColor, opponentColor,
                    piece, to, depth - 1,
                    weights, bayesianState, phase
                );

                // Add information gain bonus at root level
                const targetCell = gameState.board[to.row][to.col];
                let infoGain = 0;
                if (targetCell.piece && targetCell.piece.owner !== aiColor) {
                    infoGain = this.evaluator.computeInformationGain(
                        piece.type, targetCell.piece.id, bayesianState, phase
                    );
                }

                candidates.push({
                    from: { ...piece.position },
                    to,
                    score: score + infoGain * weights.informationGain
                });
            }
        }

        if (candidates.length === 0) {
            aiLog(`No candidate moves available!`);
            return null;
        }

        // Sort by score descending
        candidates.sort((a, b) => b.score - a.score);

        // Log top candidates
        if (DEBUG_AI) {
            aiLog(`Top 5 candidate moves:`);
            for (let i = 0; i < Math.min(5, candidates.length); i++) {
                const c = candidates[i];
                const fromPiece = aiPlayer.pieces.find(p =>
                    p.position.row === c.from.row && p.position.col === c.from.col
                );
                const targetCell = gameState.board[c.to.row][c.to.col];
                const targetInfo = targetCell.piece
                    ? `attacks ${targetCell.piece.isRevealed ? targetCell.piece.type : 'unknown'}`
                    : 'empty';
                aiLog(`  ${i + 1}. ${fromPiece?.type} (${c.from.row},${c.from.col}) -> (${c.to.row},${c.to.col}) [${targetInfo}] score=${c.score.toFixed(1)}`);
            }
        }

        // Filter out any moves with extremely negative scores (suicidal moves)
        // These should have been blocked in evaluateCombatMove but add safeguard here
        const viableCandidates = candidates.filter(c => c.score > -this.MAX_SCORE * 0.5);
        const filteredCount = candidates.length - viableCandidates.length;
        if (filteredCount > 0) {
            aiLog(`Filtered out ${filteredCount} suicidal moves`);
        }

        if (viableCandidates.length === 0) {
            // All moves are terrible - just pick the least bad one
            aiLog(`All moves are bad! Picking least bad: score=${candidates[0].score}`);
            return candidates[0];
        }

        // Top tier: all moves within 5% of the best score (or within 5 points)
        const topScore = viableCandidates[0].score;
        const threshold = Math.max(5, Math.abs(topScore) * 0.05);
        const topTier = viableCandidates.filter(c => c.score >= topScore - threshold);

        // Pick randomly among top tier for slight unpredictability
        const selected = topTier[Math.floor(Math.random() * topTier.length)];

        if (DEBUG_AI) {
            const selectedPiece = aiPlayer.pieces.find(p =>
                p.position.row === selected.from.row && p.position.col === selected.from.col
            );
            const targetCell = gameState.board[selected.to.row][selected.to.col];
            const targetInfo = targetCell.piece
                ? `attacks ${targetCell.piece.isRevealed ? targetCell.piece.type : 'unknown'}`
                : 'empty';
            aiLog(`SELECTED: ${selectedPiece?.type} (${selected.from.row},${selected.from.col}) -> (${selected.to.row},${selected.to.col}) [${targetInfo}] score=${selected.score.toFixed(1)}`);
            aiLog(`Top tier size: ${topTier.length}, threshold: ${threshold.toFixed(1)}`);
        }

        return selected;
    }

    // ----------------------------------------------------------------
    // Expectimax core
    // ----------------------------------------------------------------

    /**
     * Compute the expectimax score for a move at the current node.
     * This simulates the move, then evaluates or recurses.
     */
    private expectimaxScore(
        gameState: GameState,
        aiColor: PlayerColor,
        opponentColor: PlayerColor,
        piece: Piece,
        to: Position,
        remainingDepth: number,
        weights: EvalWeights,
        bayesianState: BayesianState | undefined,
        phase: GamePhase
    ): number {
        const targetCell = gameState.board[to.row][to.col];

        // Check for combat
        if (targetCell.piece && targetCell.piece.owner !== aiColor) {
            return this.evaluateCombatMove(
                gameState, aiColor, opponentColor,
                piece, targetCell.piece, to,
                remainingDepth, weights, bayesianState, phase
            );
        }

        // Non-combat move: simulate and evaluate
        return this.simulateAndEvaluate(
            gameState, aiColor, opponentColor,
            piece, to, null,
            remainingDepth, weights, bayesianState, phase
        );
    }

    /**
     * Check if the defender's type is definitively known (revealed, tracked, or 100% inferred).
     * Returns the known type if certain, null otherwise.
     */
    private getConfirmedDefenderType(
        defender: Piece,
        bayesianState: BayesianState | undefined
    ): PieceType | null {
        // Check if piece is revealed in game
        if (defender.isRevealed) {
            return defender.type;
        }

        // Check Bayesian tracking
        const tracked = bayesianState?.trackedPieces.get(defender.id);
        if (tracked?.knownType) {
            return tracked.knownType;
        }

        // Check if beliefs show 100% certainty on any type
        if (tracked?.beliefs) {
            for (const [type, prob] of Object.entries(tracked.beliefs)) {
                if (prob >= 0.99) { // 99%+ certainty counts as known
                    return type as PieceType;
                }
            }
        }

        return null;
    }

    /**
     * Check if attacker would definitely LOSE against a given defender type.
     */
    private wouldLoseCombat(attackerType: PieceType, defenderType: PieceType): boolean {
        if (defenderType === 'pit') return true; // Pit kills everything
        if (attackerType === defenderType) return false; // Tie, not a sure loss

        const attackerWins = RPSLS_WINS[attackerType];
        if (attackerWins && attackerWins.includes(defenderType)) {
            return false; // Attacker wins
        }

        // Attacker doesn't win and it's not a tie = attacker loses
        return true;
    }

    /**
     * Evaluate a combat move using Bayesian beliefs.
     * Returns expected value weighted by probability of each defender type.
     */
    private evaluateCombatMove(
        gameState: GameState,
        aiColor: PlayerColor,
        opponentColor: PlayerColor,
        attacker: Piece,
        defender: Piece,
        to: Position,
        remainingDepth: number,
        weights: EvalWeights,
        bayesianState: BayesianState | undefined,
        phase: GamePhase
    ): number {
        // Known pit: avoid
        if (bayesianState?.knownPitPosition &&
            to.row === bayesianState.knownPitPosition.row &&
            to.col === bayesianState.knownPitPosition.col) {
            aiLog(`  Combat: ${attacker.type} vs KNOWN PIT -> FORBIDDEN`);
            return -this.MAX_SCORE;
        }

        // ========================================================
        // CRITICAL: Check if this would be a suicidal attack
        // against a KNOWN piece. If so, FORBID IT completely.
        // ========================================================
        const confirmedDefType = this.getConfirmedDefenderType(defender, bayesianState);
        if (confirmedDefType) {
            // We KNOW what the defender is
            if (confirmedDefType === 'king') {
                aiLog(`  Combat: ${attacker.type} vs KNOWN KING -> MAX SCORE (capture king!)`);
                return this.MAX_SCORE; // Capturing king wins - always good
            }

            if (this.wouldLoseCombat(attacker.type, confirmedDefType)) {
                // We would DEFINITELY lose this combat - FORBID IT
                // No exceptions, no strategic value calculation
                aiLog(`  Combat: ${attacker.type} vs KNOWN ${confirmedDefType} -> FORBIDDEN (we lose)`);
                return -this.MAX_SCORE;
            }
            aiLog(`  Combat: ${attacker.type} vs KNOWN ${confirmedDefType} -> evaluating (we win or tie)`);
        }
        // ========================================================

        // Get defender beliefs for further evaluation
        const tracked = bayesianState?.trackedPieces.get(defender.id);
        const knownDefType = tracked?.knownType ?? (defender.isRevealed ? defender.type : null);

        if (knownDefType) {
            // Fully known defender
            return this.evaluateKnownCombat(
                gameState, aiColor, opponentColor,
                attacker, defender, knownDefType, to,
                remainingDepth, weights, bayesianState, phase
            );
        }

        // Unknown defender: expected value over possible types
        const beliefs = tracked?.beliefs;
        if (!beliefs) {
            // No belief data, use basic combat evaluation
            return this.evaluator.evaluateCombat(attacker, defender, bayesianState, weights);
        }

        let expectedScore = 0;
        for (const [type, prob] of Object.entries(beliefs)) {
            if (prob <= 0) continue;
            const outcomeScore = this.evaluateKnownCombat(
                gameState, aiColor, opponentColor,
                attacker, defender, type as PieceType, to,
                remainingDepth, weights, bayesianState, phase
            );
            expectedScore += prob * outcomeScore;
        }

        return expectedScore;
    }

    /**
     * Evaluate combat where we know (or assume) the defender's type.
     */
    private evaluateKnownCombat(
        gameState: GameState,
        aiColor: PlayerColor,
        opponentColor: PlayerColor,
        attacker: Piece,
        defender: Piece,
        defenderType: PieceType,
        to: Position,
        remainingDepth: number,
        weights: EvalWeights,
        bayesianState: BayesianState | undefined,
        phase: GamePhase
    ): number {
        // Special cases
        if (defenderType === 'king') {
            return this.MAX_SCORE; // Capturing king wins the game
        }
        if (defenderType === 'pit') {
            return -this.MAX_SCORE * 0.8; // Walking into pit is very bad but not game-ending
        }

        // Determine combat outcome
        const attackerType = attacker.type;
        if (attackerType === defenderType) {
            // Tie - uncertain outcome, slight negative for risk
            return this.evaluator.evaluate(gameState, aiColor, weights, bayesianState) - 5;
        }

        const wins = RPSLS_WINS[attackerType];
        if (wins && wins.includes(defenderType)) {
            // Attacker wins: simulate board after removing defender
            return this.simulateAndEvaluate(
                gameState, aiColor, opponentColor,
                attacker, to, defender,
                remainingDepth, weights, bayesianState, phase
            );
        }

        // Attacker loses - use normal loss simulation for probabilistic cases
        // (Definite losses against confirmed pieces are already blocked in evaluateCombatMove)
        return this.simulateLoss(gameState, aiColor, attacker, weights, bayesianState);
    }



    /**
     * Simulate a move (with optional captured piece removal) and evaluate.
     */
    private simulateAndEvaluate(
        gameState: GameState,
        aiColor: PlayerColor,
        opponentColor: PlayerColor,
        piece: Piece,
        to: Position,
        capturedPiece: Piece | null,
        remainingDepth: number,
        weights: EvalWeights,
        bayesianState: BayesianState | undefined,
        phase: GamePhase
    ): number {
        // Save state for undo
        const oldPos = { ...piece.position };
        const oldCellPiece = gameState.board[to.row][to.col].piece;
        const fromCell = gameState.board[oldPos.row][oldPos.col];

        // Apply move
        fromCell.piece = null;
        piece.position = { row: to.row, col: to.col };
        gameState.board[to.row][to.col].piece = piece;

        // Remove captured piece from player's list if needed
        let capturedIndex = -1;
        let capturedPlayer: { pieces: Piece[] } | null = null;
        if (capturedPiece) {
            capturedPlayer = gameState.players[opponentColor];
            if (capturedPlayer) {
                capturedIndex = capturedPlayer.pieces.indexOf(capturedPiece);
                if (capturedIndex >= 0) {
                    capturedPlayer.pieces.splice(capturedIndex, 1);
                }
            }
        }

        let score: number;

        if (remainingDepth <= 0) {
            // Leaf node: static evaluation
            score = this.evaluator.evaluate(gameState, aiColor, weights, bayesianState);
        } else {
            // CHANCE node: opponent's turn
            score = this.chanceNode(
                gameState, aiColor, opponentColor,
                remainingDepth - 1, weights, bayesianState, phase
            );
        }

        // Undo move
        piece.position = oldPos;
        gameState.board[to.row][to.col].piece = oldCellPiece;
        fromCell.piece = piece;

        if (capturedPiece && capturedPlayer && capturedIndex >= 0) {
            capturedPlayer.pieces.splice(capturedIndex, 0, capturedPiece);
        }

        return score;
    }

    /**
     * Simulate the AI losing a piece and evaluate the resulting position.
     */
    private simulateLoss(
        gameState: GameState,
        aiColor: PlayerColor,
        lostPiece: Piece,
        weights: EvalWeights,
        bayesianState: BayesianState | undefined
    ): number {
        const aiPlayer = gameState.players[aiColor];
        if (!aiPlayer) return -this.MAX_SCORE;

        // Save state
        const oldCellPiece = gameState.board[lostPiece.position.row][lostPiece.position.col].piece;
        const pieceIndex = aiPlayer.pieces.indexOf(lostPiece);

        // Remove piece
        gameState.board[lostPiece.position.row][lostPiece.position.col].piece = null;
        if (pieceIndex >= 0) {
            aiPlayer.pieces.splice(pieceIndex, 1);
        }

        const score = this.evaluator.evaluate(gameState, aiColor, weights, bayesianState);

        // Undo
        gameState.board[lostPiece.position.row][lostPiece.position.col].piece = oldCellPiece;
        if (pieceIndex >= 0) {
            aiPlayer.pieces.splice(pieceIndex, 0, lostPiece);
        }

        return score;
    }

    /**
     * CHANCE node: Evaluate expected value of opponent's possible responses.
     * Uses a simple opponent model (captures and king-approach weighted higher).
     * Applies Star-1 pruning.
     */
    private chanceNode(
        gameState: GameState,
        aiColor: PlayerColor,
        opponentColor: PlayerColor,
        remainingDepth: number,
        weights: EvalWeights,
        bayesianState: BayesianState | undefined,
        phase: GamePhase
    ): number {
        const opponentPlayer = gameState.players[opponentColor];
        if (!opponentPlayer) return this.evaluator.evaluate(gameState, aiColor, weights, bayesianState);

        // Generate opponent moves with weights
        const opponentMoves: { piece: Piece; to: Position; weight: number }[] = [];
        let totalWeight = 0;

        for (const piece of opponentPlayer.pieces) {
            if (piece.type === 'king' || piece.type === 'pit') continue;

            const validMoves = this.evaluator.getValidMoves(piece, opponentColor, gameState);
            for (const to of validMoves) {
                let moveWeight = 1; // base weight

                const targetCell = gameState.board[to.row][to.col];

                // Captures are weighted higher in the opponent model
                if (targetCell.piece && targetCell.piece.owner !== opponentColor) {
                    moveWeight = 20;
                    // Attacking AI's king is very likely
                    if (targetCell.piece.type === 'king') {
                        moveWeight = 1000;
                    }
                }

                // Forward progression is slightly more likely
                const forwardDir = opponentColor === 'red' ? 1 : -1;
                if ((to.row - piece.position.row) * forwardDir > 0) {
                    moveWeight *= 2;
                }

                opponentMoves.push({ piece, to, weight: moveWeight });
                totalWeight += moveWeight;
            }
        }

        if (opponentMoves.length === 0 || totalWeight === 0) {
            return this.evaluator.evaluate(gameState, aiColor, weights, bayesianState);
        }

        // Limit the number of moves to evaluate for performance
        // Sort by weight descending and take top N
        opponentMoves.sort((a, b) => b.weight - a.weight);
        const maxMoves = Math.min(opponentMoves.length, 10);
        const evaluatedMoves = opponentMoves.slice(0, maxMoves);

        // Recalculate total weight for the subset
        const subsetTotalWeight = evaluatedMoves.reduce((sum, m) => sum + m.weight, 0);

        let expectedValue = 0;

        for (const move of evaluatedMoves) {
            const normalizedWeight = move.weight / subsetTotalWeight;

            // Simulate opponent move
            const oldPos = { ...move.piece.position };
            const oldCellPiece = gameState.board[move.to.row][move.to.col].piece;
            const fromCell = gameState.board[oldPos.row][oldPos.col];

            // Handle capture
            let capturedPiece: Piece | null = null;
            let capturedIndex = -1;
            let capturedPlayer: { pieces: Piece[] } | null = null;

            if (oldCellPiece && oldCellPiece.owner !== opponentColor) {
                // Opponent captures our piece (simplified: opponent wins for this simulation)
                capturedPiece = oldCellPiece;
                capturedPlayer = gameState.players[aiColor];
                if (capturedPlayer) {
                    capturedIndex = capturedPlayer.pieces.indexOf(capturedPiece);
                    if (capturedIndex >= 0) {
                        capturedPlayer.pieces.splice(capturedIndex, 1);
                    }
                }
            }

            // Apply move
            fromCell.piece = null;
            move.piece.position = { row: move.to.row, col: move.to.col };
            gameState.board[move.to.row][move.to.col].piece = move.piece;

            let score: number;
            if (remainingDepth <= 0) {
                score = this.evaluator.evaluate(gameState, aiColor, weights, bayesianState);
            } else {
                // MAX node: AI's turn again
                score = this.maxNode(
                    gameState, aiColor, opponentColor,
                    remainingDepth - 1, weights, bayesianState, phase
                );
            }

            expectedValue += normalizedWeight * score;

            // Undo move
            move.piece.position = oldPos;
            gameState.board[move.to.row][move.to.col].piece = oldCellPiece;
            fromCell.piece = move.piece;

            if (capturedPiece && capturedPlayer && capturedIndex >= 0) {
                capturedPlayer.pieces.splice(capturedIndex, 0, capturedPiece);
            }
        }

        return expectedValue;
    }

    /**
     * MAX node: AI's turn - find the move that maximizes the score.
     */
    private maxNode(
        gameState: GameState,
        aiColor: PlayerColor,
        opponentColor: PlayerColor,
        remainingDepth: number,
        weights: EvalWeights,
        bayesianState: BayesianState | undefined,
        phase: GamePhase
    ): number {
        const aiPlayer = gameState.players[aiColor];
        if (!aiPlayer) return -this.MAX_SCORE;

        let bestScore = -Infinity;

        for (const piece of aiPlayer.pieces) {
            if (piece.type === 'king' || piece.type === 'pit') continue;

            const validMoves = this.evaluator.getValidMoves(piece, aiColor, gameState);
            for (const to of validMoves) {
                const score = this.expectimaxScore(
                    gameState, aiColor, opponentColor,
                    piece, to, remainingDepth,
                    weights, bayesianState, phase
                );
                bestScore = Math.max(bestScore, score);
            }
        }

        // If no moves possible, return static evaluation
        if (bestScore === -Infinity) {
            return this.evaluator.evaluate(gameState, aiColor, weights, bayesianState);
        }

        return bestScore;
    }

    // ----------------------------------------------------------------
    // Emergency handling
    // ----------------------------------------------------------------

    /**
     * Check if the AI's king is in immediate danger and return an emergency move.
     * Priority: capture the threat (only if we can win or have good odds) > let normal search handle
     */
    private checkKingEmergency(
        gameState: GameState,
        aiColor: PlayerColor,
        bayesianState: BayesianState | undefined,
        weights: EvalWeights
    ): { from: Position; to: Position } | null {
        const opponentColor: PlayerColor = aiColor === 'red' ? 'blue' : 'red';
        const aiPlayer = gameState.players[aiColor];
        if (!aiPlayer) return null;

        const ownKing = aiPlayer.pieces.find(p => p.type === 'king');
        if (!ownKing) return null;

        const opponentPieces = gameState.players[opponentColor]?.pieces || [];
        const threats: Piece[] = [];

        for (const op of opponentPieces) {
            const dist = Math.abs(op.position.row - ownKing.position.row) +
                Math.abs(op.position.col - ownKing.position.col);
            if (dist === 1) {
                // Check if this piece could beat king
                const knownType = this.getKnownType(op, bayesianState);
                // King loses to everything except pit (where king wouldn't move anyway)
                // and ties with king. Unknown threats are treated as threats.
                if (!knownType || (knownType !== 'king' && knownType !== 'pit')) {
                    threats.push(op);
                }
            }
        }

        if (threats.length === 0) return null;

        // Priority 1: Capture threats with non-king pieces - but ONLY if we can actually win
        let bestCapture: { from: Position; to: Position; score: number } | null = null;
        for (const piece of aiPlayer.pieces) {
            if (piece.type === 'king' || piece.type === 'pit') continue;

            const validMoves = this.evaluator.getValidMoves(piece, aiColor, gameState);
            for (const to of validMoves) {
                const threat = threats.find(t => t.position.row === to.row && t.position.col === to.col);
                if (threat) {
                    // Check if this would be a suicidal attack against a KNOWN piece
                    const knownThreatType = this.getConfirmedDefenderType(threat, bayesianState);
                    if (knownThreatType && this.wouldLoseCombat(piece.type, knownThreatType)) {
                        // Skip this - it's a guaranteed loss
                        continue;
                    }

                    const combatScore = this.evaluator.evaluateCombat(piece, threat, bayesianState, weights);
                    // Only consider captures with positive expected value
                    if (combatScore > 0 && (!bestCapture || combatScore > bestCapture.score)) {
                        bestCapture = { from: { ...piece.position }, to, score: combatScore };
                    }
                }
            }
        }

        if (bestCapture) return bestCapture;

        // No good capture available - return null and let normal search handle it
        // The search will factor in king safety and find the best overall move
        return null;
    }

    private getKnownType(piece: Piece, bayesianState: BayesianState | undefined): PieceType | null {
        if (bayesianState) {
            const tracked = bayesianState.trackedPieces.get(piece.id);
            if (tracked?.knownType) return tracked.knownType;
        }
        if (piece.isRevealed) return piece.type;
        return null;
    }
}
