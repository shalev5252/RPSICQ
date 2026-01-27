import {
    GameState,
    GameMode,
    PlayerColor,
    Piece,
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

// What the AI knows about a specific opponent piece
interface PieceInference {
    pieceId: string;
    knownType: PieceType | null;       // null = still hidden
    eliminatedTypes: Set<string>;      // types this piece definitely is NOT
}

// Per-session AI memory
interface AISessionState {
    sessionId: string;
    aiColor: PlayerColor;
    opponentInferences: Map<string, PieceInference>; // pieceId -> inference
    knownPitPosition: Position | null;
    knownKingPosition: Position | null;
}

export class AIOpponentService {
    private sessionStates: Map<string, AISessionState> = new Map();

    // ----------------------------------------------------------------
    // Session lifecycle
    // ----------------------------------------------------------------

    public initSession(sessionId: string, aiColor: PlayerColor): void {
        this.sessionStates.set(sessionId, {
            sessionId,
            aiColor,
            opponentInferences: new Map(),
            knownPitPosition: null,
            knownKingPosition: null
        });
    }

    public clearSession(sessionId: string): void {
        this.sessionStates.delete(sessionId);
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
        // Offset by ±1 from King col for variety, stay on front row
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
    // 2.3  Move selection
    // ----------------------------------------------------------------

    public selectMove(
        gameState: GameState,
        aiColor: PlayerColor
    ): { from: Position; to: Position } | null {
        const state = this.sessionStates.get(gameState.sessionId);
        const config = BOARD_CONFIG[gameState.gameMode];
        const player = gameState.players[aiColor];
        if (!player) return null;

        const opponentColor: PlayerColor = aiColor === 'red' ? 'blue' : 'red';

        // Gather all candidate moves
        const candidates: { from: Position; to: Position; score: number }[] = [];

        for (const piece of player.pieces) {
            if (piece.type === 'king' || piece.type === 'pit') continue;

            const validMoves = this.getValidMovesForPiece(piece, aiColor, gameState, config);
            for (const to of validMoves) {
                const score = this.scoreMoveCandidate(
                    piece, to, gameState, aiColor, opponentColor, config, state ?? null
                );
                candidates.push({ from: piece.position, to, score });
            }
        }

        if (candidates.length === 0) return null;

        // Sort descending by score
        candidates.sort((a, b) => b.score - a.score);

        // Controlled imperfection: sometimes pick a non-top move
        if (candidates.length > 1 && Math.random() < AI_SUBOPTIMAL_CHANCE) {
            // Pick from the top half but not the best
            const pool = candidates.slice(1, Math.max(2, Math.ceil(candidates.length / 2)));
            return pool[Math.floor(Math.random() * pool.length)];
        }

        // Small random jitter among top-scoring moves (within 5 points) to avoid predictability
        const topScore = candidates[0].score;
        const topTier = candidates.filter(c => c.score >= topScore - 5);
        return topTier[Math.floor(Math.random() * topTier.length)];
    }

    private getValidMovesForPiece(
        piece: Piece,
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
            // Can move to empty cell or cell with enemy piece
            if (!targetCell.piece || targetCell.piece.owner !== aiColor) {
                moves.push({ row: newRow, col: newCol });
            }
        }

        return moves;
    }

    private scoreMoveCandidate(
        piece: Piece,
        to: Position,
        gameState: GameState,
        aiColor: PlayerColor,
        opponentColor: PlayerColor,
        config: { rows: number; cols: number },
        sessionState: AISessionState | null
    ): number {
        let score = 0;
        const targetCell = gameState.board[to.row][to.col];
        const _opponent = gameState.players[opponentColor];
        const ownPlayer = gameState.players[aiColor];

        // --- Pit avoidance (strongest signal) ---
        if (sessionState?.knownPitPosition) {
            const pit = sessionState.knownPitPosition;
            if (to.row === pit.row && to.col === pit.col) {
                return -1000; // never move into known Pit
            }
        }

        // --- King capture opportunity (highest priority) ---
        if (sessionState?.knownKingPosition) {
            const king = sessionState.knownKingPosition;
            const distToKing = Math.abs(to.row - king.row) + Math.abs(to.col - king.col);
            if (distToKing === 0) {
                return 500; // directly capturing known King
            }
            // Proximity bonus: closer to opponent King is better
            score += Math.max(0, (config.rows + config.cols) - distToKing) * 3;
        }

        // --- Combat risk assessment ---
        if (targetCell.piece && targetCell.piece.owner !== aiColor) {
            const defender = targetCell.piece;
            const combatScore = this.estimateCombatScore(piece, defender, sessionState);
            score += combatScore;
        }

        // --- Forward progression ---
        // Moving toward the opponent's side is generally good
        const forwardDirection = aiColor === 'red' ? 1 : -1;
        const forwardProgress = to.row * forwardDirection;
        score += forwardProgress * 2;

        // --- Board center control ---
        const centerCol = (config.cols - 1) / 2;
        const centerRow = (config.rows - 1) / 2;
        const distFromCenter = Math.abs(to.col - centerCol) + Math.abs(to.row - centerRow);
        score += Math.max(0, 5 - distFromCenter);

        // --- Own King protection ---
        if (ownPlayer) {
            const ownKing = ownPlayer.pieces.find(p => p.type === 'king');
            if (ownKing) {
                const distFromOwnKing = Math.abs(to.row - ownKing.position.row) + Math.abs(to.col - ownKing.position.col);
                // Staying reasonably close to own King is good (within 3 cells)
                if (distFromOwnKing <= 3) {
                    score += 3;
                }
            }
        }

        return score;
    }

    private estimateCombatScore(
        attacker: Piece,
        defender: Piece,
        sessionState: AISessionState | null
    ): number {
        // If we know the defender's type
        const inference = sessionState?.opponentInferences.get(defender.id);
        const knownType = inference?.knownType ?? (defender.isRevealed ? defender.type : null);

        if (knownType) {
            if (knownType === 'king') return 200;    // capture King = huge reward
            if (knownType === 'pit') return -200;     // walk into Pit = disaster

            // Check if we beat this type
            const wins = RPSLS_WINS[attacker.type];
            if (wins && wins.includes(knownType)) return 40;  // likely win
            // Check if we lose
            const theirWins = RPSLS_WINS[knownType];
            if (theirWins && theirWins.includes(attacker.type)) return -30; // likely loss
            // Tie
            return 5;
        }

        // Unknown piece: estimate based on probability
        // Attacking unknown pieces is risky but sometimes necessary
        // Slight positive bias to encourage aggression (otherwise AI would be too passive)
        return 8;
    }

    // ----------------------------------------------------------------
    // 2.4  Tie-breaker choice
    // ----------------------------------------------------------------

    public selectTieBreakerChoice(
        gameMode: GameMode,
        knownOpponentType?: CombatElement
    ): CombatElement {
        const elements: CombatElement[] = gameMode === 'rpsls'
            ? ['rock', 'paper', 'scissors', 'lizard', 'spock']
            : ['rock', 'paper', 'scissors'];

        if (knownOpponentType) {
            // Pick something that beats the opponent's last known choice
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

    // ----------------------------------------------------------------
    // 2.5  Piece inference tracking
    // ----------------------------------------------------------------

    public recordCombatOutcome(
        sessionId: string,
        opponentPieceId: string,
        revealedType: PieceType | null,
        position?: Position
    ): void {
        const state = this.sessionStates.get(sessionId);
        if (!state) return;

        if (revealedType) {
            // Update known type
            let inference = state.opponentInferences.get(opponentPieceId);
            if (!inference) {
                inference = { pieceId: opponentPieceId, knownType: null, eliminatedTypes: new Set() };
                state.opponentInferences.set(opponentPieceId, inference);
            }
            inference.knownType = revealedType;

            // Track special positions
            if (revealedType === 'pit' && position) {
                state.knownPitPosition = position;
            }
            if (revealedType === 'king' && position) {
                state.knownKingPosition = position;
            }
        }
    }

    public updateKnownKingPosition(sessionId: string, position: Position | null): void {
        const state = this.sessionStates.get(sessionId);
        if (state) {
            state.knownKingPosition = position;
        }
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
