import {
    GameState,
    PlayerColor,
    PlayerState,
    Cell,
    Piece,
    Position,
    PieceType,
    PlayerCellView,
    PlayerPieceView,
    SetupStatePayload,
    BOARD_ROWS,
    BOARD_COLS,
    RED_SETUP_ROWS,
    BLUE_SETUP_ROWS,
    PIECES_PER_PLAYER
} from '@rps/shared';
import { v4 as uuidv4 } from 'uuid';

interface SetupState {
    hasPlacedKingPit: boolean;
    hasShuffled: boolean;
}

export class GameService {
    private sessions: Map<string, GameState> = new Map();
    private playerSessionMap: Map<string, string> = new Map(); // socketId -> sessionId
    private setupStates: Map<string, SetupState> = new Map(); // socketId -> SetupState

    public createSession(id: string, player1Id: string, player1Color: PlayerColor, player2Id: string, player2Color: PlayerColor): GameState {
        const initialBoard: Cell[][] = Array(BOARD_ROWS).fill(null).map((_, row) =>
            Array(BOARD_COLS).fill(null).map((_, col) => ({
                row,
                col,
                piece: null
            }))
        );

        const player1: PlayerState = {
            id: player1Id,
            socketId: player1Id,
            color: player1Color,
            isReady: false,
            pieces: []
        };

        const player2: PlayerState = {
            id: player2Id,
            socketId: player2Id,
            color: player2Color,
            isReady: false,
            pieces: []
        };

        const gameState: GameState = {
            sessionId: id,
            phase: 'setup',
            currentTurn: null,
            board: initialBoard,
            players: {
                red: player1Color === 'red' ? player1 : player2,
                blue: player1Color === 'blue' ? player1 : player2
            },
            turnStartTime: null,
            combatState: null,
            winner: null
        };

        this.sessions.set(id, gameState);
        this.playerSessionMap.set(player1Id, id);
        this.playerSessionMap.set(player2Id, id);

        // Initialize setup states
        this.setupStates.set(player1Id, { hasPlacedKingPit: false, hasShuffled: false });
        this.setupStates.set(player2Id, { hasPlacedKingPit: false, hasShuffled: false });

        console.log(`📝 Session ${id} created and stored.`);
        return gameState;
    }

    public getSession(sessionId: string): GameState | undefined {
        return this.sessions.get(sessionId);
    }

    public getSessionBySocketId(socketId: string): GameState | undefined {
        const sessionId = this.playerSessionMap.get(socketId);
        if (!sessionId) return undefined;
        return this.sessions.get(sessionId);
    }

    public getPlayerColor(socketId: string): PlayerColor | null {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return null;
        if (session.players.red?.socketId === socketId) return 'red';
        if (session.players.blue?.socketId === socketId) return 'blue';
        return null;
    }

    private getSetupRows(color: PlayerColor): number[] {
        return color === 'red' ? RED_SETUP_ROWS : BLUE_SETUP_ROWS;
    }

    private isValidSetupPosition(position: Position, color: PlayerColor): boolean {
        const validRows = this.getSetupRows(color);
        return validRows.includes(position.row) &&
               position.col >= 0 &&
               position.col < BOARD_COLS;
    }

    public placeKingPit(
        socketId: string,
        kingPosition: Position,
        pitPosition: Position
    ): { success: boolean; error?: string } {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return { success: false, error: 'Session not found' };

        const color = this.getPlayerColor(socketId);
        if (!color) return { success: false, error: 'Player not found' };

        const player = session.players[color];
        if (!player) return { success: false, error: 'Player state not found' };

        if (session.phase !== 'setup') {
            return { success: false, error: 'Not in setup phase' };
        }

        // Validate positions are in player's rows
        if (!this.isValidSetupPosition(kingPosition, color)) {
            return { success: false, error: 'King position not in your rows' };
        }
        if (!this.isValidSetupPosition(pitPosition, color)) {
            return { success: false, error: 'Pit position not in your rows' };
        }

        // Validate positions are different
        if (kingPosition.row === pitPosition.row && kingPosition.col === pitPosition.col) {
            return { success: false, error: 'King and Pit must be on different cells' };
        }

        // Remove any existing King/Pit pieces from this player
        player.pieces = player.pieces.filter(p => p.type !== 'king' && p.type !== 'pit');

        // Clear old positions on board
        for (const row of session.board) {
            for (const cell of row) {
                if (cell.piece?.owner === color && (cell.piece.type === 'king' || cell.piece.type === 'pit')) {
                    cell.piece = null;
                }
            }
        }

        // Create King piece
        const king: Piece = {
            id: uuidv4(),
            owner: color,
            type: 'king',
            position: kingPosition,
            isRevealed: false,
            hasHalo: false
        };

        // Create Pit piece
        const pit: Piece = {
            id: uuidv4(),
            owner: color,
            type: 'pit',
            position: pitPosition,
            isRevealed: false,
            hasHalo: false
        };

        // Add pieces to player
        player.pieces.push(king, pit);

        // Place on board
        session.board[kingPosition.row][kingPosition.col].piece = king;
        session.board[pitPosition.row][pitPosition.col].piece = pit;

        // Update setup state
        const setupState = this.setupStates.get(socketId);
        if (setupState) {
            setupState.hasPlacedKingPit = true;
        }

        console.log(`👑 Player ${socketId} (${color}) placed King at (${kingPosition.row},${kingPosition.col}) and Pit at (${pitPosition.row},${pitPosition.col})`);
        return { success: true };
    }

    public randomizePieces(socketId: string): { success: boolean; error?: string } {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return { success: false, error: 'Session not found' };

        const color = this.getPlayerColor(socketId);
        if (!color) return { success: false, error: 'Player not found' };

        const player = session.players[color];
        if (!player) return { success: false, error: 'Player state not found' };

        const setupState = this.setupStates.get(socketId);
        if (!setupState?.hasPlacedKingPit) {
            return { success: false, error: 'Must place King and Pit first' };
        }

        // Get all cells in player's setup rows
        const validRows = this.getSetupRows(color);
        const emptyCells: Position[] = [];

        for (const rowIndex of validRows) {
            for (let col = 0; col < BOARD_COLS; col++) {
                const cell = session.board[rowIndex][col];
                // Cell is empty or has RPS piece (which we'll replace)
                if (!cell.piece || (cell.piece.owner === color && !['king', 'pit'].includes(cell.piece.type))) {
                    emptyCells.push({ row: rowIndex, col });
                }
            }
        }

        // Remove existing RPS pieces from player and board
        player.pieces = player.pieces.filter(p => p.type === 'king' || p.type === 'pit');
        for (const pos of emptyCells) {
            session.board[pos.row][pos.col].piece = null;
        }

        // Create RPS pieces
        const rpsPieces: PieceType[] = [];
        for (let i = 0; i < PIECES_PER_PLAYER.rock; i++) rpsPieces.push('rock');
        for (let i = 0; i < PIECES_PER_PLAYER.paper; i++) rpsPieces.push('paper');
        for (let i = 0; i < PIECES_PER_PLAYER.scissors; i++) rpsPieces.push('scissors');

        // Shuffle pieces (Fisher-Yates)
        for (let i = rpsPieces.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [rpsPieces[i], rpsPieces[j]] = [rpsPieces[j], rpsPieces[i]];
        }

        // Place pieces in empty cells
        for (let i = 0; i < rpsPieces.length && i < emptyCells.length; i++) {
            const piece: Piece = {
                id: uuidv4(),
                owner: color,
                type: rpsPieces[i],
                position: emptyCells[i],
                isRevealed: false,
                hasHalo: false
            };
            player.pieces.push(piece);
            session.board[emptyCells[i].row][emptyCells[i].col].piece = piece;
        }

        // Update setup state
        if (setupState) {
            setupState.hasShuffled = true;
        }

        console.log(`🎲 Player ${socketId} (${color}) shuffled RPS pieces`);
        return { success: true };
    }

    public confirmSetup(socketId: string): { success: boolean; bothReady: boolean; error?: string } {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return { success: false, bothReady: false, error: 'Session not found' };

        const color = this.getPlayerColor(socketId);
        if (!color) return { success: false, bothReady: false, error: 'Player not found' };

        const player = session.players[color];
        if (!player) return { success: false, bothReady: false, error: 'Player state not found' };

        const setupState = this.setupStates.get(socketId);
        if (!setupState?.hasShuffled) {
            return { success: false, bothReady: false, error: 'Must shuffle pieces first' };
        }

        // Mark player as ready
        player.isReady = true;

        // Check if both players are ready
        const redReady = session.players.red?.isReady ?? false;
        const blueReady = session.players.blue?.isReady ?? false;
        const bothReady = redReady && blueReady;

        if (bothReady) {
            // Transition to playing phase
            session.phase = 'playing';
            // Randomly select starting player
            session.currentTurn = Math.random() < 0.5 ? 'red' : 'blue';
            session.turnStartTime = Date.now();
        }

        console.log(`✔️ Player ${socketId} (${color}) confirmed setup. Both ready: ${bothReady}`);
        return { success: true, bothReady };
    }

    public getPlayerSetupView(socketId: string): SetupStatePayload | null {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return null;

        const color = this.getPlayerColor(socketId);
        if (!color) return null;

        const setupState = this.setupStates.get(socketId);
        if (!setupState) return null;

        const player = session.players[color];
        const opponent = session.players[color === 'red' ? 'blue' : 'red'];

        // Build board view with fog of war
        const boardView: PlayerCellView[][] = session.board.map(row =>
            row.map(cell => {
                let pieceView: PlayerPieceView | null = null;

                if (cell.piece) {
                    const isOwnPiece = cell.piece.owner === color;
                    pieceView = {
                        id: cell.piece.id,
                        owner: cell.piece.owner,
                        type: isOwnPiece || cell.piece.isRevealed ? cell.piece.type : 'hidden',
                        position: cell.piece.position,
                        isRevealed: cell.piece.isRevealed,
                        hasHalo: cell.piece.hasHalo
                    };
                }

                return {
                    row: cell.row,
                    col: cell.col,
                    piece: pieceView
                };
            })
        );

        return {
            board: boardView,
            hasPlacedKingPit: setupState.hasPlacedKingPit,
            hasShuffled: setupState.hasShuffled,
            isReady: player?.isReady ?? false,
            opponentReady: opponent?.isReady ?? false
        };
    }

    public getOpponentSocketId(socketId: string): string | null {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return null;

        const color = this.getPlayerColor(socketId);
        if (!color) return null;

        const opponent = session.players[color === 'red' ? 'blue' : 'red'];
        return opponent?.socketId ?? null;
    }

    public removeSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            // Clean up player mappings and setup states
            if (session.players.red) {
                this.playerSessionMap.delete(session.players.red.socketId);
                this.setupStates.delete(session.players.red.socketId);
            }
            if (session.players.blue) {
                this.playerSessionMap.delete(session.players.blue.socketId);
                this.setupStates.delete(session.players.blue.socketId);
            }

            this.sessions.delete(sessionId);
        }
    }

    public handleDisconnect(socketId: string): { sessionId: string, opponentId: string | undefined } | null {
        const sessionId = this.playerSessionMap.get(socketId);
        if (!sessionId) return null;

        const session = this.sessions.get(sessionId);
        if (!session) return null;

        // Find opponent
        const opponent = session.players.red?.socketId === socketId ? session.players.blue : session.players.red;
        const opponentId = opponent?.socketId;

        // End session
        console.log(`🛑 Game aborted due to disconnect: ${sessionId}`);
        this.removeSession(sessionId);

        return { sessionId, opponentId };
    }
}
