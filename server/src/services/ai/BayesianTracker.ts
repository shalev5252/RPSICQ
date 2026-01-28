import {
    PieceType,
    PlayerColor,
    Position,
    GameState,
    GameMode,
    BOARD_CONFIG
} from '@rps/shared';
import { BayesianState, TrackedPiece, PieceBeliefs } from './types.js';

/**
 * Maintains P(type) distributions for each unknown opponent piece.
 * Updates on: combat reveals, piece deaths, movement observations.
 * Propagates constraints via process of elimination.
 */
export class BayesianTracker {
    private states: Map<string, BayesianState> = new Map();

    /**
     * Initialize tracking for a new game session.
     * Called when the game transitions to the playing phase.
     */
    public initialize(sessionId: string, aiColor: PlayerColor, gameMode: GameMode, gameState: GameState): void {
        const config = BOARD_CONFIG[gameMode];
        const opponentColor: PlayerColor = aiColor === 'red' ? 'blue' : 'red';
        const opponentPlayer = gameState.players[opponentColor];
        if (!opponentPlayer) return;

        // Build total piece composition (excluding king/pit which are always 1 each)
        const totalPieces: Record<string, number> = {
            king: config.pieces.king,
            pit: config.pieces.pit,
            rock: config.pieces.rock,
            paper: config.pieces.paper,
            scissors: config.pieces.scissors,
            lizard: config.pieces.lizard || 0,
            spock: config.pieces.spock || 0
        };

        // Filter out types with 0 count
        const activePieceTypes = Object.entries(totalPieces)
            .filter(([, count]) => count > 0)
            .map(([type]) => type);

        const totalCount = Object.values(totalPieces).reduce((a, b) => a + b, 0);

        // Remaining counts start equal to total (nothing revealed yet)
        const remainingCounts: Record<string, number> = { ...totalPieces };

        // Create uniform prior for each opponent piece
        const trackedPieces = new Map<string, TrackedPiece>();
        for (const piece of opponentPlayer.pieces) {
            const beliefs: PieceBeliefs = {};
            for (const type of activePieceTypes) {
                beliefs[type] = totalPieces[type] / totalCount;
            }

            trackedPieces.set(piece.id, {
                pieceId: piece.id,
                beliefs,
                isRevealed: piece.isRevealed,
                knownType: piece.isRevealed ? piece.type : null,
                isDead: false,
                hasMoved: false,
                position: { ...piece.position }
            });

            // If piece was already revealed (e.g., from a previous round), update
            if (piece.isRevealed) {
                this.applyReveal(trackedPieces, remainingCounts, piece.id, piece.type);
            }
        }

        this.states.set(sessionId, {
            sessionId,
            aiColor,
            gameMode,
            trackedPieces,
            remainingCounts,
            totalPieces,
            knownKingPosition: null,
            knownPitPosition: null
        });

        this.propagateConstraints(sessionId);
    }

    public getState(sessionId: string): BayesianState | undefined {
        return this.states.get(sessionId);
    }

    public clearState(sessionId: string): void {
        this.states.delete(sessionId);
    }

    /**
     * Record that an opponent piece was observed moving.
     * Moving pieces cannot be king or pit (they are immovable).
     */
    public recordMovement(sessionId: string, pieceId: string, newPosition: Position): void {
        const state = this.states.get(sessionId);
        if (!state) return;

        const tracked = state.trackedPieces.get(pieceId);
        if (!tracked || tracked.isRevealed || tracked.isDead) return;

        tracked.hasMoved = true;
        tracked.position = { ...newPosition };

        // Zero out king and pit probabilities
        if (tracked.beliefs['king'] !== undefined) {
            tracked.beliefs['king'] = 0;
        }
        if (tracked.beliefs['pit'] !== undefined) {
            tracked.beliefs['pit'] = 0;
        }

        this.renormalize(tracked.beliefs);
        this.propagateConstraints(sessionId);
    }

    /**
     * Record that an opponent piece was revealed via combat.
     * Sets P(type)=1.0 for the revealed type and propagates.
     */
    public recordReveal(sessionId: string, pieceId: string, revealedType: PieceType, position?: Position): void {
        const state = this.states.get(sessionId);
        if (!state) return;

        const tracked = state.trackedPieces.get(pieceId);
        if (!tracked) return;

        // Track special positions
        if (revealedType === 'king' && position) {
            state.knownKingPosition = { ...position };
        }
        if (revealedType === 'pit' && position) {
            state.knownPitPosition = { ...position };
        }

        if (tracked.isRevealed) {
            // Already revealed, just update position
            if (position) tracked.position = { ...position };
            return;
        }

        this.applyReveal(state.trackedPieces, state.remainingCounts, pieceId, revealedType);
        if (position) tracked.position = { ...position };

        this.propagateConstraints(sessionId);
    }

    /**
     * Record that an opponent piece has been destroyed.
     * Removes it from the pool and updates remaining counts.
     */
    public recordDeath(sessionId: string, pieceId: string, knownType: PieceType): void {
        const state = this.states.get(sessionId);
        if (!state) return;

        const tracked = state.trackedPieces.get(pieceId);
        if (!tracked) return;

        tracked.isDead = true;
        tracked.position = null;

        // If this piece wasn't already revealed, we now know its type
        if (!tracked.isRevealed) {
            this.applyReveal(state.trackedPieces, state.remainingCounts, pieceId, knownType);
        }

        // Decrement remaining count for this type
        if (state.remainingCounts[knownType] !== undefined && state.remainingCounts[knownType] > 0) {
            state.remainingCounts[knownType]--;
        }

        this.propagateConstraints(sessionId);
    }

    /**
     * Update the known king position (e.g., if king moves after being revealed).
     */
    public updateKnownKingPosition(sessionId: string, position: Position | null): void {
        const state = this.states.get(sessionId);
        if (state) {
            state.knownKingPosition = position ? { ...position } : null;
        }
    }

    /**
     * Get the beliefs for a specific opponent piece.
     */
    public getBeliefs(sessionId: string, pieceId: string): PieceBeliefs | null {
        const state = this.states.get(sessionId);
        if (!state) return null;

        const tracked = state.trackedPieces.get(pieceId);
        if (!tracked) return null;

        return { ...tracked.beliefs };
    }

    /**
     * Get the known type of a piece (if revealed), or null.
     */
    public getKnownType(sessionId: string, pieceId: string): PieceType | null {
        const state = this.states.get(sessionId);
        if (!state) return null;

        const tracked = state.trackedPieces.get(pieceId);
        if (!tracked) return null;

        return tracked.knownType;
    }

    /**
     * Get the probability that a piece is a specific type.
     */
    public getProbability(sessionId: string, pieceId: string, type: PieceType): number {
        const state = this.states.get(sessionId);
        if (!state) return 0;

        const tracked = state.trackedPieces.get(pieceId);
        if (!tracked) return 0;

        return tracked.beliefs[type] ?? 0;
    }

    // ----------------------------------------------------------------
    // Internal helpers
    // ----------------------------------------------------------------

    private applyReveal(
        trackedPieces: Map<string, TrackedPiece>,
        remainingCounts: Record<string, number>,
        pieceId: string,
        revealedType: PieceType
    ): void {
        const tracked = trackedPieces.get(pieceId);
        if (!tracked) return;

        tracked.isRevealed = true;
        tracked.knownType = revealedType;

        // Set beliefs to 1.0 for the revealed type, 0 for everything else
        for (const type of Object.keys(tracked.beliefs)) {
            tracked.beliefs[type] = type === revealedType ? 1.0 : 0;
        }
    }

    /**
     * Renormalize a beliefs distribution so probabilities sum to 1.
     * If all probabilities are 0, distributes uniformly among originally non-zero.
     */
    private renormalize(beliefs: PieceBeliefs): void {
        const total = Object.values(beliefs).reduce((a, b) => a + b, 0);
        if (total <= 0) {
            // Edge case: all probabilities zeroed out. This shouldn't happen
            // in normal play, but guard against it.
            const nonZeroKeys = Object.keys(beliefs);
            if (nonZeroKeys.length > 0) {
                const uniform = 1.0 / nonZeroKeys.length;
                for (const key of nonZeroKeys) {
                    beliefs[key] = uniform;
                }
            }
            return;
        }

        for (const key of Object.keys(beliefs)) {
            beliefs[key] /= total;
        }
    }

    /**
     * Process of elimination:
     * - If all N pieces of type X are accounted for (revealed/dead), set P(X)=0 for all unknowns
     * - If only one unknown could be type X, force-assign it
     */
    private propagateConstraints(sessionId: string): void {
        const state = this.states.get(sessionId);
        if (!state) return;

        let changed = true;
        let iterations = 0;
        const maxIterations = 20; // safety limit

        while (changed && iterations < maxIterations) {
            changed = false;
            iterations++;

            // Count how many of each type are accounted for (revealed + dead with known type)
            const accountedFor: Record<string, number> = {};
            for (const type of Object.keys(state.totalPieces)) {
                accountedFor[type] = 0;
            }

            for (const tracked of state.trackedPieces.values()) {
                if (tracked.isRevealed && tracked.knownType) {
                    accountedFor[tracked.knownType] = (accountedFor[tracked.knownType] || 0) + 1;
                }
            }

            // For each type, check if all instances are accounted for
            for (const [type, total] of Object.entries(state.totalPieces)) {
                if (total === 0) continue;

                const accounted = accountedFor[type] || 0;
                if (accounted >= total) {
                    // All pieces of this type are accounted for
                    // Zero out P(type) for all unknown pieces
                    for (const tracked of state.trackedPieces.values()) {
                        if (!tracked.isRevealed && !tracked.isDead && tracked.beliefs[type] > 0) {
                            tracked.beliefs[type] = 0;
                            this.renormalize(tracked.beliefs);
                            changed = true;
                        }
                    }
                }
            }

            // Check if only one unknown piece could be a given type
            for (const [type, total] of Object.entries(state.totalPieces)) {
                if (total === 0) continue;

                const accounted = accountedFor[type] || 0;
                const remaining = total - accounted;
                if (remaining <= 0) continue;

                // Find unknowns that have non-zero probability for this type
                const candidates: TrackedPiece[] = [];
                for (const tracked of state.trackedPieces.values()) {
                    if (!tracked.isRevealed && !tracked.isDead && (tracked.beliefs[type] ?? 0) > 0) {
                        candidates.push(tracked);
                    }
                }

                // If the number of candidates equals the remaining count, force-assign
                if (candidates.length === remaining && remaining > 0) {
                    for (const candidate of candidates) {
                        if (!candidate.isRevealed) {
                            this.applyReveal(state.trackedPieces, state.remainingCounts, candidate.pieceId, type as PieceType);
                            changed = true;
                        }
                    }
                }
            }
        }
    }
}
