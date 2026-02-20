import {
    GameState,
    GameMode,
    PlayerColor,
    Position,
    PieceType,
    CombatElement,
    BOARD_CONFIG,
    ONSLAUGHT_CONFIG,
    RpsGameMode,
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

// Debug logging - only active in development
const DEBUG_AI = process.env.NODE_ENV !== 'production' && process.env.DEBUG_AI === 'true';

function aiLog(...args: unknown[]): void {
    if (DEBUG_AI) {
        console.log('[AI]', ...args);
    }
}

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

        const gameMode = gameState.gameMode;
        // Verify it's a valid RPS mode (Third Eye etc don't use Bayesian tracker)
        if (gameMode !== 'classic' && gameMode !== 'rpsls') {
            return;
        }

        const tracker = new BayesianTracker();
        tracker.initialize(sessionId, aiColor, gameMode, gameState);
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
        const config = BOARD_CONFIG[gameMode as RpsGameMode];
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

    /**
     * Check if a move would be suicidal (attacking a revealed piece that beats us).
     * Returns true if the move should be avoided.
     */
    private isSuicidalMove(
        piece: { type: PieceType },
        to: Position,
        aiColor: PlayerColor,
        gameState: GameState,
        bayesianState: ReturnType<BayesianTracker['getState']>
    ): boolean {
        const targetCell = gameState.board[to.row][to.col];
        if (!targetCell.piece || targetCell.piece.owner === aiColor) {
            return false; // Not attacking anything
        }

        const defender = targetCell.piece;

        // Check if we know the defender's type
        let knownDefenderType: PieceType | null = null;

        // Check if piece is revealed in game state
        if (defender.isRevealed) {
            knownDefenderType = defender.type;
        }

        // Check Bayesian tracking
        if (!knownDefenderType && bayesianState) {
            const tracked = bayesianState.trackedPieces.get(defender.id);
            if (tracked?.knownType) {
                knownDefenderType = tracked.knownType;
            } else if (tracked?.beliefs) {
                // Check for 99%+ certainty
                for (const [type, prob] of Object.entries(tracked.beliefs)) {
                    if (prob >= 0.99) {
                        knownDefenderType = type as PieceType;
                        break;
                    }
                }
            }
        }

        if (!knownDefenderType) {
            return false; // Unknown piece, not definitively suicidal
        }

        // Attacking king is always good
        if (knownDefenderType === 'king') {
            return false;
        }

        // Attacking pit is always bad
        if (knownDefenderType === 'pit') {
            return true;
        }

        // Same type = tie, not suicidal
        if (piece.type === knownDefenderType) {
            return false;
        }

        // Check if our piece beats the defender
        const ourWins = RPSLS_WINS[piece.type];
        if (ourWins && ourWins.includes(knownDefenderType)) {
            return false; // We win
        }

        // We don't win and it's not a tie = we lose = suicidal
        aiLog(`  Suicidal move detected: ${piece.type} vs revealed ${knownDefenderType}`);
        return true;
    }

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
        // But NEVER pick a suicidal move (attacking revealed pieces that beat us)
        if (Math.random() < AI_SUBOPTIMAL_CHANCE) {
            aiLog(`Suboptimal path triggered (${(AI_SUBOPTIMAL_CHANCE * 100).toFixed(0)}% chance)`);
            const player = gameState.players[aiColor];
            if (player) {
                const config = (gameState.gameVariant === 'onslaught')
                    ? ONSLAUGHT_CONFIG[gameState.gameMode as RpsGameMode]
                    : BOARD_CONFIG[gameState.gameMode as RpsGameMode];

                // Collect ALL valid non-suicidal moves
                const allSafeMoves: { from: Position; to: Position }[] = [];
                const movablePieces = player.pieces.filter(p => p.type !== 'king' && p.type !== 'pit');

                for (const piece of movablePieces) {
                    const validMoves = this.getValidMovesForPiece(piece, aiColor, gameState, config);
                    for (const to of validMoves) {
                        if (!this.isSuicidalMove(piece, to, aiColor, gameState, bayesianState)) {
                            allSafeMoves.push({ from: { ...piece.position }, to });
                        }
                    }
                }

                if (allSafeMoves.length > 0) {
                    // Pick a random safe move
                    const randomMove = allSafeMoves[Math.floor(Math.random() * allSafeMoves.length)];
                    aiLog(`Picked random safe move from ${allSafeMoves.length} options`);
                    return randomMove;
                }
                aiLog(`No safe moves available for suboptimal path, using best move`);
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

        const config = (gameState.gameVariant === 'onslaught')
            ? ONSLAUGHT_CONFIG[gameState.gameMode as RpsGameMode]
            : BOARD_CONFIG[gameState.gameMode as RpsGameMode];
        const bayesianState = this.trackers.get(gameState.sessionId)?.getState(gameState.sessionId);

        // Collect all valid non-suicidal moves
        const allSafeMoves: { from: Position; to: Position }[] = [];
        const movablePieces = player.pieces.filter(p => p.type !== 'king' && p.type !== 'pit');

        for (const piece of movablePieces) {
            const validMoves = this.getValidMovesForPiece(piece, aiColor, gameState, config);
            for (const to of validMoves) {
                if (!this.isSuicidalMove(piece, to, aiColor, gameState, bayesianState)) {
                    allSafeMoves.push({ from: { ...piece.position }, to });
                }
            }
        }

        if (allSafeMoves.length > 0) {
            return allSafeMoves[Math.floor(Math.random() * allSafeMoves.length)];
        }

        // If all moves are suicidal (unlikely), pick any valid move as last resort
        for (const piece of movablePieces) {
            const validMoves = this.getValidMovesForPiece(piece, aiColor, gameState, config);
            if (validMoves.length > 0) {
                return { from: { ...piece.position }, to: validMoves[0] };
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
