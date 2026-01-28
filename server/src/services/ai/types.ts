import { Position, PieceType, PlayerColor, GameMode } from '@rps/shared';

/** Probability distribution over piece types for a single unknown opponent piece */
export type PieceBeliefs = Record<string, number>; // PieceType -> probability

/** State tracked per opponent piece */
export interface TrackedPiece {
    pieceId: string;
    beliefs: PieceBeliefs;       // P(type) for each possible type
    isRevealed: boolean;         // fully known
    knownType: PieceType | null; // set once revealed
    isDead: boolean;             // removed from play
    hasMoved: boolean;           // has been observed moving (eliminates king/pit)
    position: Position | null;   // last known position (null if dead)
}

/** Full Bayesian state for one game session */
export interface BayesianState {
    sessionId: string;
    aiColor: PlayerColor;
    gameMode: GameMode;
    trackedPieces: Map<string, TrackedPiece>;   // pieceId -> tracked piece
    remainingCounts: Record<string, number>;     // type -> how many unaccounted for
    totalPieces: Record<string, number>;         // type -> total in composition
    knownKingPosition: Position | null;
    knownPitPosition: Position | null;
}

/** Game phase for weight selection */
export type GamePhase = 'opening' | 'midgame' | 'endgame';

/** Weights for board evaluation, varies by game phase */
export interface EvalWeights {
    forwardProgress: number;
    centerControl: number;
    kingProximity: number;       // bonus for being near opponent king
    kingProtection: number;      // bonus for protecting own king
    pieceAdvantage: number;      // material advantage weight
    infiltration: number;        // bonus for being in enemy territory
    informationGain: number;     // bonus for moves that reveal info
    combatReward: number;        // expected value weight for combat encounters
    threatPenalty: number;       // penalty for being adjacent to enemies
}

/** Configuration for expectimax search */
export interface SearchConfig {
    defaultDepth: number;
    maxDepth: number;
    branchingThreshold: number;  // below this many pieces, increase depth
    timebudgetMs: number;
}

/** Lightweight board representation for search */
export interface BoardSnapshot {
    pieces: SnapshotPiece[];
    rows: number;
    cols: number;
}

export interface SnapshotPiece {
    id: string;
    owner: PlayerColor;
    type: PieceType;
    position: Position;
    isRevealed: boolean;
    beliefs: PieceBeliefs | null; // null for AI's own pieces (fully known)
}

/** A candidate move with its evaluated score */
export interface ScoredMove {
    from: Position;
    to: Position;
    score: number;
}

/** Combat type string (what the opponent could be) */
export type CombatType = PieceType;

/** The set of combat piece types (excludes king/pit for standard RPS resolution) */
export const COMBAT_PIECE_TYPES: PieceType[] = ['rock', 'paper', 'scissors', 'lizard', 'spock'];
export const ALL_PIECE_TYPES: PieceType[] = ['king', 'pit', 'rock', 'paper', 'scissors', 'lizard', 'spock'];
