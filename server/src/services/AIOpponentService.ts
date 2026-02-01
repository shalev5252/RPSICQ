import {
    GameState,
    GameMode,
    PlayerColor,
    Position,
    PieceType,
    CombatElement,
    BOARD_CONFIG,
    RPSLS_WINS,
    MOVEMENT_DIRECTIONS,
    AI_DELAY_MIN_MS,
    AI_DELAY_MAX_MS,
    AI_SUBOPTIMAL_CHANCE,
    RED_SETUP_ROWS,
    BLUE_SETUP_ROWS
} from '@rps/shared';
import { BayesianTracker } from './ai/BayesianTracker.js';
import { ExpectimaxSearch } from './ai/ExpectimaxSearch.js';
import { TiePatternTracker } from './ai/TiePatternTracker.js';

export class AIOpponentService {
    private trackers: Map<string, BayesianTracker> = new Map();
    private search: ExpectimaxSearch;
    private sessionColors: Map<string, PlayerColor> = new Map();
    private tiePatternTracker: TiePatternTracker = new TiePatternTracker();

    constructor() {
        this.search = new ExpectimaxSearch();
    }

    // ----------------------------------------------------------------
    // Session lifecycle
    // ----------------------------------------------------------------

    public initSession(sessionId: string, aiColor: PlayerColor): void {
        this.sessionColors.set(sessionId, aiColor);
        // Initialize tie pattern tracker for this session
        this.tiePatternTracker.initSession(sessionId);
        // Bayesian tracker is initialized later via initializeTracking when game starts
    }

    public clearSession(sessionId: string): void {
        this.trackers.delete(sessionId);
        this.sessionColors.delete(sessionId);
        this.tiePatternTracker.clearSession(sessionId);
    }

    // ----------------------------------------------------------------
    // Bayesian tracking initialization & updates
    // ----------------------------------------------------------------

    /**
     * Initialize Bayesian tracking when the game transitions to the playing phase.
     * Must be called after both players' pieces are set up.
     */
    public initializeTracking(sessionId: string, gameState: GameState): void {
        const aiColor = this.sessionColors.get(sessionId);
        if (!aiColor) return;

        const tracker = new BayesianTracker();
        tracker.initialize(sessionId, aiColor, gameState.gameMode, gameState);
        this.trackers.set(sessionId, tracker);
    }

    /**
     * Record that the human opponent moved a piece (non-combat).
     * Moving pieces cannot be king or pit.
     */
    public recordOpponentMovement(sessionId: string, pieceId: string, newPosition: Position): void {
        const tracker = this.trackers.get(sessionId);
        if (!tracker) return;
        tracker.recordMovement(sessionId, pieceId, newPosition);
    }

    /**
     * Record that an opponent piece was destroyed in combat.
     */
    public recordOpponentDeath(sessionId: string, pieceId: string, knownType: PieceType): void {
        const tracker = this.trackers.get(sessionId);
        if (!tracker) return;
        tracker.recordDeath(sessionId, pieceId, knownType);
    }

    // ----------------------------------------------------------------
    // 2.2  Setup: King/Pit placement + piece randomization
    // ----------------------------------------------------------------

    public generateSetup(gameMode: GameMode, aiColor: PlayerColor): {
        kingPosition: Position;
        pitPosition: Position;
    } {
        const config = BOARD_CONFIG[gameMode];
        const setupRows = aiColor === 'red' ? RED_SETUP_ROWS : BLUE_SETUP_ROWS;
        // Back row = row farthest from the opponent
        const backRow = aiColor === 'red' ? setupRows[0] : setupRows[setupRows.length - 1];
        const frontRow = aiColor === 'red' ? setupRows[setupRows.length - 1] : setupRows[0];
        const cols = config.cols;

        // King: back row, avoid edges, prefer center
        const kingCol = this.pickCenterAvoidingEdges(cols);
        const kingPosition: Position = { row: backRow, col: kingCol };

        // Pit: front row, near King column to block approach paths
        // Offset by +/-1 from King col for variety, stay on front row
        const pitColOffset = Math.random() < 0.5 ? -1 : 1;
        let pitCol = kingCol + pitColOffset;
        if (pitCol < 0) pitCol = kingCol + 1;
        if (pitCol >= cols) pitCol = kingCol - 1;
        const pitPosition: Position = { row: frontRow, col: pitCol };

        return { kingPosition, pitPosition };
    }

    private pickCenterAvoidingEdges(cols: number): number {
        // Pick from inner columns (avoid col 0 and col max)
        const min = 1;
        const max = cols - 2;
        return min + Math.floor(Math.random() * (max - min + 1));
    }

    // ----------------------------------------------------------------
    // 2.3  Move selection (now using Expectimax)
    // ----------------------------------------------------------------

    public selectMove(
        gameState: GameState,
        aiColor: PlayerColor
    ): { from: Position; to: Position } | null {
        const tracker = this.trackers.get(gameState.sessionId);
        const bayesianState = tracker?.getState(gameState.sessionId);

        if (!tracker) {
            // Tracker not initialized yet, fall back to random move
            return this.selectRandomMove(gameState, aiColor);
        }

        // Use expectimax search for move selection
        const bestMove = this.search.findBestMove(
            gameState, aiColor, bayesianState, tracker
        );

        if (!bestMove) return null;

        // Controlled imperfection: small chance of picking a suboptimal move
        if (Math.random() < AI_SUBOPTIMAL_CHANCE) {
            // Fall back to a random valid move from a random piece
            const player = gameState.players[aiColor];
            if (player) {
                const movablePieces = player.pieces.filter(p => p.type !== 'king' && p.type !== 'pit');
                if (movablePieces.length > 0) {
                    const randomPiece = movablePieces[Math.floor(Math.random() * movablePieces.length)];
                    const config = BOARD_CONFIG[gameState.gameMode];
                    const validMoves = this.getValidMovesForPiece(randomPiece, aiColor, gameState, config);
                    if (validMoves.length > 0) {
                        const randomTo = validMoves[Math.floor(Math.random() * validMoves.length)];
                        return { from: { ...randomPiece.position }, to: randomTo };
                    }
                }
            }
        }

        return bestMove;
    }

    private selectRandomMove(
        gameState: GameState,
        aiColor: PlayerColor
    ): { from: Position; to: Position } | null {
        const player = gameState.players[aiColor];
        if (!player) return null;

        const config = BOARD_CONFIG[gameState.gameMode];
        const movablePieces = player.pieces.filter(p => p.type !== 'king' && p.type !== 'pit');
        // Shuffle for randomness
        for (let i = movablePieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [movablePieces[i], movablePieces[j]] = [movablePieces[j], movablePieces[i]];
        }
        for (const piece of movablePieces) {
            const validMoves = this.getValidMovesForPiece(piece, aiColor, gameState, config);
            if (validMoves.length > 0) {
                const to = validMoves[Math.floor(Math.random() * validMoves.length)];
                return { from: { ...piece.position }, to };
            }
        }
        return null;
    }

    private getValidMovesForPiece(
        piece: { position: Position; type: PieceType },
        aiColor: PlayerColor,
        gameState: GameState,
        config: { rows: number; cols: number }
    ): Position[] {
        const moves: Position[] = [];
        const { row, col } = piece.position;
        for (const dir of MOVEMENT_DIRECTIONS) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;
            if (newRow < 0 || newRow >= config.rows || newCol < 0 || newCol >= config.cols) continue;

            const targetCell = gameState.board[newRow][newCol];
            if (!targetCell.piece || targetCell.piece.owner !== aiColor) {
                moves.push({ row: newRow, col: newCol });
            }
        }

        return moves;
    }

    // ----------------------------------------------------------------
    // 2.4  Tie-breaker choice
    // ----------------------------------------------------------------

    public selectTieBreakerChoice(
        sessionId: string,
        gameMode: GameMode,
        knownOpponentType?: CombatElement
    ): CombatElement {
        const isRpsls = gameMode === 'rpsls';
        const elements: CombatElement[] = isRpsls
            ? ['rock', 'paper', 'scissors', 'lizard', 'spock']
            : ['rock', 'paper', 'scissors'];

        // Use pattern-based prediction first
        const patternChoice = this.tiePatternTracker.predictAndCounter(sessionId, isRpsls);
        if (patternChoice) {
            return patternChoice;
        }

        // Fallback: if we know opponent's piece type, counter it
        if (knownOpponentType) {
            const counters = elements.filter(e => {
                const wins = RPSLS_WINS[e];
                return wins && wins.includes(knownOpponentType);
            });
            if (counters.length > 0) {
                return counters[Math.floor(Math.random() * counters.length)];
            }
        }

        // Random choice if no info
        return elements[Math.floor(Math.random() * elements.length)];
    }

    /**
     * Notify tracker that a new tie-breaker is starting.
     */
    public startTieBreaker(sessionId: string): void {
        this.tiePatternTracker.startNewTie(sessionId);
    }

    /**
     * Record the opponent's choice in the current tie (for pattern learning).
     */
    public recordOpponentTieChoice(sessionId: string, choice: CombatElement): void {
        this.tiePatternTracker.recordOpponentChoice(sessionId, choice);
    }

    // ----------------------------------------------------------------
    // 2.5  Combat outcome recording (delegates to Bayesian tracker)
    // ----------------------------------------------------------------

    public recordCombatOutcome(
        sessionId: string,
        opponentPieceId: string,
        revealedType: PieceType | null,
        position?: Position
    ): void {
        const tracker = this.trackers.get(sessionId);
        if (!tracker || !revealedType) return;

        tracker.recordReveal(sessionId, opponentPieceId, revealedType, position);
    }

    public updateKnownKingPosition(sessionId: string, position: Position | null): void {
        const tracker = this.trackers.get(sessionId);
        if (!tracker) return;
        tracker.updateKnownKingPosition(sessionId, position);
    }

    // ----------------------------------------------------------------
    // 2.6  Delay wrapper
    // ----------------------------------------------------------------

    public scheduleAction<T>(action: () => T): Promise<T> {
        const delay = AI_DELAY_MIN_MS + Math.random() * (AI_DELAY_MAX_MS - AI_DELAY_MIN_MS);
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(action());
            }, delay);
        });
    }
}
