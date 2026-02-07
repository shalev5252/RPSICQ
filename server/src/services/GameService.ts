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
    RED_SETUP_ROWS,
    BLUE_SETUP_ROWS,
    MOVEMENT_DIRECTIONS,
    GameMode,
    GameVariant,
    CombatElement,
    BOARD_CONFIG,
    ONSLAUGHT_CONFIG,
    RPSLS_WINS,
    AI_ID_PREFIX,
    AI_SOCKET_PREFIX
} from '@rps/shared';
import { v4 as uuidv4 } from 'uuid';
import { AIOpponentService } from './AIOpponentService.js';

interface SetupState {
    hasPlacedKingPit: boolean;
    hasShuffled: boolean;
}

export class GameService {
    private sessions: Map<string, GameState> = new Map();
    private playerSessionMap: Map<string, string> = new Map(); // socketId -> sessionId
    private setupStates: Map<string, SetupState> = new Map(); // socketId -> SetupState
    private playerIdToSocketId: Map<string, string> = new Map(); // playerId -> socketId
    private socketIdToPlayerId: Map<string, string> = new Map(); // socketId -> playerId
    private disconnectTimers: Map<string, NodeJS.Timeout> = new Map(); // playerId -> timeout
    private readonly RECONNECT_GRACE_PERIOD = 30000; // 30 seconds
    public readonly aiService = new AIOpponentService();

    public isAIPlayer(socketId: string): boolean {
        return socketId.startsWith(AI_SOCKET_PREFIX);
    }

    public isAISession(sessionId: string): boolean {
        const session = this.sessions.get(sessionId);
        return session?.opponentType === 'ai';
    }

    public getAISocketId(sessionId: string): string | null {
        const session = this.sessions.get(sessionId);
        if (!session || session.opponentType !== 'ai') return null;
        const red = session.players.red;
        const blue = session.players.blue;
        if (red && this.isAIPlayer(red.socketId)) return red.socketId;
        if (blue && this.isAIPlayer(blue.socketId)) return blue.socketId;
        return null;
    }

    public getAIColor(sessionId: string): PlayerColor | null {
        const session = this.sessions.get(sessionId);
        if (!session || session.opponentType !== 'ai') return null;
        if (session.players.red && this.isAIPlayer(session.players.red.socketId)) return 'red';
        if (session.players.blue && this.isAIPlayer(session.players.blue.socketId)) return 'blue';
        return null;
    }

    public createSession(id: string, player1Id: string, player1Color: PlayerColor, player2Id: string, player2Color: PlayerColor, gameMode: GameMode = 'classic', gameVariant: GameVariant = 'standard'): GameState {
        const config = gameVariant === 'onslaught' ? ONSLAUGHT_CONFIG[gameMode] : BOARD_CONFIG[gameMode];
        const initialBoard: Cell[][] = Array(config.rows).fill(null).map((_, row) =>
            Array(config.cols).fill(null).map((_, col) => ({
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
            gameMode,
            gameVariant,
            opponentType: 'human',
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

        if (gameVariant === 'onslaught') {
            this.initializeOnslaughtGame(gameState);
        }

        return gameState;
    }

    public createSingleplayerSession(
        humanSocketId: string,
        humanPlayerId: string,
        gameMode: GameMode = 'classic',
        gameVariant: GameVariant = 'standard'
    ): GameState {
        const sessionId = uuidv4();
        const config = gameVariant === 'onslaught' ? ONSLAUGHT_CONFIG[gameMode] : BOARD_CONFIG[gameMode];
        const initialBoard: Cell[][] = Array(config.rows).fill(null).map((_, row) =>
            Array(config.cols).fill(null).map((_, col) => ({
                row,
                col,
                piece: null
            }))
        );

        // Human is always red, AI is always blue
        const humanColor: PlayerColor = 'red';
        const aiColor: PlayerColor = 'blue';
        const aiPlayerId = `${AI_ID_PREFIX}${sessionId}`;
        const aiSocketId = `${AI_SOCKET_PREFIX}${sessionId}`;

        const humanPlayer: PlayerState = {
            id: humanPlayerId,
            socketId: humanSocketId,
            color: humanColor,
            isReady: false,
            pieces: []
        };

        const aiPlayer: PlayerState = {
            id: aiPlayerId,
            socketId: aiSocketId,
            color: aiColor,
            isReady: false,
            pieces: []
        };

        const gameState: GameState = {
            sessionId,
            gameMode,
            gameVariant,
            opponentType: 'ai',
            phase: 'setup',
            currentTurn: null,
            board: initialBoard,
            players: {
                red: humanPlayer,
                blue: aiPlayer
            },
            turnStartTime: null,
            combatState: null,
            winner: null
        };

        this.sessions.set(sessionId, gameState);
        this.playerSessionMap.set(humanSocketId, sessionId);
        this.playerSessionMap.set(aiSocketId, sessionId);

        // Initialize setup states for both
        this.setupStates.set(humanSocketId, { hasPlacedKingPit: false, hasShuffled: false });
        this.setupStates.set(aiSocketId, { hasPlacedKingPit: false, hasShuffled: false });

        // Initialize AI session tracking
        this.aiService.initSession(sessionId, aiColor);

        console.log(`🤖 Singleplayer session ${sessionId} created (human=${humanColor}, AI=${aiColor}, mode=${gameMode})`);

        if (gameVariant === 'onslaught') {
            this.initializeOnslaughtGame(gameState);
        }

        return gameState;
    }

    private initializeOnslaughtGame(session: GameState): void {
        const gameMode = session.gameMode;
        const config = ONSLAUGHT_CONFIG[gameMode]; // We know it's onslaught here

        // Setup for both players
        const players = [session.players.red, session.players.blue];

        for (const player of players) {
            if (!player) continue;

            // Generate pieces
            const rpsPieces: PieceType[] = [];
            const piecesConfig = config.pieces;

            for (let i = 0; i < piecesConfig.rock; i++) rpsPieces.push('rock');
            for (let i = 0; i < piecesConfig.paper; i++) rpsPieces.push('paper');
            for (let i = 0; i < piecesConfig.scissors; i++) rpsPieces.push('scissors');
            for (let i = 0; i < (piecesConfig.lizard || 0); i++) rpsPieces.push('lizard');
            for (let i = 0; i < (piecesConfig.spock || 0); i++) rpsPieces.push('spock');

            // Shuffle pieces
            for (let i = rpsPieces.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [rpsPieces[i], rpsPieces[j]] = [rpsPieces[j], rpsPieces[i]];
            }

            // Determine valid cells
            const validRows = this.getSetupRows(player.color);
            const emptyCells: Position[] = [];

            for (const rowIndex of validRows) {
                for (let col = 0; col < config.cols; col++) {
                    // Onslaught boards are small, we assume full rows are used or enough capacity
                    emptyCells.push({ row: rowIndex, col });
                }
            }

            // Fill
            for (let i = 0; i < rpsPieces.length && i < emptyCells.length; i++) {
                const piece: Piece = {
                    id: uuidv4(),
                    owner: player.color,
                    type: rpsPieces[i],
                    position: emptyCells[i],
                    isRevealed: true, // Onslaught = No Fog of War
                    hasHalo: false
                };
                player.pieces.push(piece);
                session.board[emptyCells[i].row][emptyCells[i].col].piece = piece;
            }

            // Update setup state
            const setupState = this.setupStates.get(player.socketId);
            if (setupState) {
                setupState.hasPlacedKingPit = true; // Skipped, but marked done
                setupState.hasShuffled = true;
            }
        }
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

    private isValidSetupPosition(position: Position, color: PlayerColor, gameMode: GameMode): boolean {
        const config = BOARD_CONFIG[gameMode];
        const validRows = this.getSetupRows(color);
        return validRows.includes(position.row) &&
            position.col >= 0 &&
            position.col < config.cols;
    }

    public placeKingPit(
        socketId: string,
        kingPosition: Position,
        pitPosition: Position
    ): { success: boolean; error?: string } {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return { success: false, error: 'Session not found' };

        const gameMode = session.gameMode;
        const color = this.getPlayerColor(socketId);
        if (!color) return { success: false, error: 'Player not found' };

        const player = session.players[color];
        if (!player) return { success: false, error: 'Player state not found' };

        if (session.phase !== 'setup') {
            return { success: false, error: 'Not in setup phase' };
        }
        if (session.gameVariant === 'onslaught') {
            return { success: false, error: 'Manual placement disabled in Onslaught mode' };
        }
        if (player.isReady) {
            return { success: false, error: 'Setup already confirmed' };
        }

        const setupState = this.setupStates.get(socketId);
        if (setupState?.hasShuffled) {
            return { success: false, error: 'Cannot reposition after shuffling' };
        }

        // Validate positions are in player's rows
        if (!this.isValidSetupPosition(kingPosition, color, gameMode)) {
            return { success: false, error: 'King position not in your rows' };
        }
        if (!this.isValidSetupPosition(pitPosition, color, gameMode)) {
            return { success: false, error: 'Pit position not in your rows' };
        }

        // Validate positions are different
        if (kingPosition.row === pitPosition.row && kingPosition.col === pitPosition.col) {
            return { success: false, error: 'King and Pit must be on different cells' };
        }

        // Clean up target cells: remove any existing piece owned by player at these positions
        // This prevents "ghost" pieces if we somehow overwrite a cell that had a piece
        const targets = [kingPosition, pitPosition];
        player.pieces = player.pieces.filter(p =>
            !targets.some(t => t.row === p.position.row && t.col === p.position.col)
        );

        for (const target of targets) {
            const cell = session.board[target.row][target.col];
            if (cell.piece?.owner === color) {
                cell.piece = null;
            }
        }

        // Remove any existing King/Pit pieces from this player (standard replacement)
        player.pieces = player.pieces.filter(p => p.type !== 'king' && p.type !== 'pit');

        // Clear old King/Pit positions on board
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
        if (setupState) {
            setupState.hasPlacedKingPit = true;
        }

        console.log(`👑 Player ${socketId} (${color}) placed King at (${kingPosition.row},${kingPosition.col}) and Pit at (${pitPosition.row},${pitPosition.col})`);
        return { success: true };
    }

    public randomizePieces(socketId: string): { success: boolean; error?: string } {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return { success: false, error: 'Session not found' };

        const gameMode = session.gameMode;
        const config = BOARD_CONFIG[gameMode];

        const color = this.getPlayerColor(socketId);
        if (!color) return { success: false, error: 'Player not found' };

        const player = session.players[color];
        if (!player) return { success: false, error: 'Player state not found' };

        if (player.isReady) {
            return { success: false, error: 'Cannot reshuffle when ready' };
        }

        // Use Onslaught config if applicable
        const effectiveConfig = session.gameVariant === 'onslaught'
            ? ONSLAUGHT_CONFIG[gameMode]
            : config;

        const setupState = this.setupStates.get(socketId);
        // For Onslaught, King/Pit are effectively "placed" (skipped), so we double check the flag which we set to true
        if (!setupState?.hasPlacedKingPit) {
            return { success: false, error: 'Must place King and Pit first' };
        }

        // Get all cells in player's setup rows
        const validRows = this.getSetupRows(color);
        const emptyCells: Position[] = [];

        // Use effective config dimensions
        for (const rowIndex of validRows) {
            for (let col = 0; col < effectiveConfig.cols; col++) {
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

        // Create RPS pieces based on game mode config
        const rpsPieces: PieceType[] = [];
        const piecesConfig = effectiveConfig.pieces;

        for (let i = 0; i < piecesConfig.rock; i++) rpsPieces.push('rock');
        for (let i = 0; i < piecesConfig.paper; i++) rpsPieces.push('paper');
        for (let i = 0; i < piecesConfig.scissors; i++) rpsPieces.push('scissors');
        for (let i = 0; i < (piecesConfig.lizard || 0); i++) rpsPieces.push('lizard');
        for (let i = 0; i < (piecesConfig.spock || 0); i++) rpsPieces.push('spock');

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
                isRevealed: session.gameVariant === 'onslaught' || session.gameVariant === 'clearday',
                hasHalo: false
            };
            player.pieces.push(piece);
            session.board[emptyCells[i].row][emptyCells[i].col].piece = piece;
        }

        // Update setup state
        if (setupState) {
            setupState.hasShuffled = true;
        }

        console.log(`🎲 Player ${socketId} (${color}) shuffled RPS pieces [Mode: ${gameMode}]`);
        return { success: true };
    }

    public confirmSetup(socketId: string): { success: boolean; bothReady: boolean; error?: string } {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return { success: false, bothReady: false, error: 'Session not found' };

        const color = this.getPlayerColor(socketId);
        if (!color) return { success: false, bothReady: false, error: 'Player not found' };

        const player = session.players[color];
        if (!player) return { success: false, bothReady: false, error: 'Player state not found' };

        // Validate phase
        if (session.phase !== 'setup') {
            return { success: false, bothReady: false, error: 'Game is not in setup phase' };
        }

        const setupState = this.setupStates.get(socketId);
        if (!setupState?.hasShuffled) {
            return { success: false, bothReady: false, error: 'Must shuffle pieces first' };
        }

        // Idempotency check: if already ready, just return status
        if (player.isReady) {
            const redReady = session.players.red?.isReady ?? false;
            const blueReady = session.players.blue?.isReady ?? false;
            return { success: true, bothReady: redReady && blueReady };
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

            // Clear Day: reveal all pieces at game start
            if (session.gameVariant === 'clearday') {
                this.revealAllPieces(session);
                console.log(`☀️ Clear Day mode: All pieces revealed for session ${session.sessionId}`);
            }
        }

        console.log(`✔️ Player ${socketId} (${color}) confirmed setup. Both ready: ${bothReady}`);
        return { success: true, bothReady };
    }

    /**
     * Reveal all pieces on the board. Used for Clear Day variant.
     */
    private revealAllPieces(session: GameState): void {
        for (const row of session.board) {
            for (const cell of row) {
                if (cell.piece) {
                    cell.piece.isRevealed = true;
                }
            }
        }
    }

    /**
     * Check for Onslaught win conditions (Elimination or Showdown).
     * Returns true if the game ended or transitioned to tie-breaker.
     */
    private handleOnslaughtCheck(session: GameState): boolean {
        const redCount = session.players.red?.pieces.length || 0;
        const blueCount = session.players.blue?.pieces.length || 0;

        if (redCount === 0) {
            session.phase = 'finished';
            session.winner = 'blue';
            session.winReason = 'elimination';
            console.log(`⚔️ Onslaught: Blue wins by elimination!`);
            return true;
        }
        if (blueCount === 0) {
            session.phase = 'finished';
            session.winner = 'red';
            session.winReason = 'elimination';
            console.log(`⚔️ Onslaught: Red wins by elimination!`);
            return true;
        }

        if (redCount === 1 && blueCount === 1) {
            // Showdown logic
            const redPiece = session.players.red!.pieces[0];
            const bluePiece = session.players.blue!.pieces[0];

            console.log(`⚔️ Onslaught Showdown: ${redPiece.type} (red) vs ${bluePiece.type} (blue)`);

            // Reuse resolveCombat logic for comparison
            const result = this.resolveCombat(redPiece, bluePiece, session.gameMode);

            if (result === 'attacker_wins') {
                session.phase = 'finished';
                session.winner = 'red';
                session.winReason = 'elimination';
                console.log(`⚔️ Onslaught Showdown: Red wins!`);
            } else if (result === 'defender_wins') {
                session.phase = 'finished';
                session.winner = 'blue';
                session.winReason = 'elimination';
                console.log(`⚔️ Onslaught Showdown: Blue wins!`);
            } else {
                // Tie - Trigger Tie Breaker
                session.phase = 'tie_breaker';
                session.combatState = {
                    attackerId: redPiece.id,
                    defenderId: bluePiece.id,
                    isTie: true
                };
                console.log(`⚔️ Onslaught Showdown: Tie! Entering Tie Breaker.`);
            }
            return true;
        }
        return false;
    }

    /**
     * Perform full AI setup: place King/Pit strategically, randomize pieces, confirm.
     * Called after the human player's setup is done in a singleplayer session.
     */
    public performAISetup(sessionId: string): { success: boolean; error?: string } {
        const session = this.sessions.get(sessionId);
        if (!session || session.opponentType !== 'ai') {
            return { success: false, error: 'Not an AI session' };
        }

        // Idempotency check: If AI is already ready, don't repeat setup
        if (session.aiReady) {
            return { success: true };
        }

        const aiColor = this.getAIColor(sessionId);
        if (!aiColor) return { success: false, error: 'AI color not found' };

        const aiSocketId = this.getAISocketId(sessionId);
        if (!aiSocketId) return { success: false, error: 'AI socket not found' };

        // In Onslaught, pieces are already placed by initializeOnslaughtGame
        if (session.gameVariant !== 'onslaught') {
            // Generate strategic placement
            const { kingPosition, pitPosition } = this.aiService.generateSetup(session.gameMode, aiColor);

            // Place King and Pit
            const placeResult = this.placeKingPit(aiSocketId, kingPosition, pitPosition);
            if (!placeResult.success) {
                return { success: false, error: `AI King/Pit placement failed: ${placeResult.error}` };
            }

            // Randomize pieces
            const randomizeResult = this.randomizePieces(aiSocketId);
            if (!randomizeResult.success) {
                return { success: false, error: `AI randomize failed: ${randomizeResult.error}` };
            }
        }

        // Confirm setup
        const confirmResult = this.confirmSetup(aiSocketId);
        if (!confirmResult.success) {
            return { success: false, error: `AI confirm failed: ${confirmResult.error}` };
        }

        session.aiReady = true;
        console.log(`🤖 AI setup complete for session ${sessionId}`);
        return { success: true };
    }

    /**
     * Have the AI submit a tie-breaker choice.
     * Returns the choice made so the handler can process it.
     */
    public performAITieBreakerChoice(sessionId: string): {
        success: boolean;
        choice?: CombatElement;
        error?: string;
    } {
        const session = this.sessions.get(sessionId);
        if (!session || session.opponentType !== 'ai') {
            return { success: false, error: 'Not an AI session' };
        }
        if (!session.combatState) {
            return { success: false, error: 'No active combat state' };
        }

        const aiSocketId = this.getAISocketId(sessionId);
        if (!aiSocketId) return { success: false, error: 'AI socket not found' };

        const aiColor = this.getAIColor(sessionId);
        if (!aiColor) return { success: false, error: 'AI color not found' };

        // Determine if AI is attacker or defender in this combat
        const aiPlayer = session.players[aiColor];
        if (!aiPlayer) return { success: false, error: 'AI player not found' };

        const isAttacker = aiPlayer.pieces.some(p => p.id === session.combatState!.attackerId);
        const isDefender = aiPlayer.pieces.some(p => p.id === session.combatState!.defenderId);
        if (!isAttacker && !isDefender) {
            return { success: false, error: 'AI not involved in this combat' };
        }

        // Get the opponent's choice if already submitted (for counter-strategy)
        const opponentChoice = isAttacker
            ? session.combatState.defenderChoice
            : session.combatState.attackerChoice;

        const choice = this.aiService.selectTieBreakerChoice(
            sessionId,
            session.gameMode,
            opponentChoice
        );

        return { success: true, choice };
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

        // Build board view - during setup, opponent pieces are completely hidden (not shown at all)
        const boardView: PlayerCellView[][] = session.board.map(row =>
            row.map(cell => {
                let pieceView: PlayerPieceView | null = null;

                if (cell.piece) {
                    const isOwnPiece = cell.piece.owner === color;
                    // During setup, only show player's own pieces
                    if (isOwnPiece) {
                        pieceView = {
                            id: cell.piece.id,
                            owner: cell.piece.owner,
                            type: cell.piece.type,
                            position: cell.piece.position,
                            isRevealed: cell.piece.isRevealed,
                            hasHalo: cell.piece.hasHalo
                        };
                    }
                    // Opponent pieces are NOT included at all during setup
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

    /**
     * Get valid moves for a piece. King and Pit cannot move.
     * Rock/Paper/Scissors/Lizard/Spock can move one step in 4 directions.
     */
    public getValidMoves(socketId: string, pieceId: string): Position[] {
        const session = this.getSessionBySocketId(socketId);
        if (!session || session.phase !== 'playing') return [];

        const gameMode = session.gameMode;
        const config = session.gameVariant === 'onslaught'
            ? ONSLAUGHT_CONFIG[gameMode]
            : BOARD_CONFIG[gameMode];
        const color = this.getPlayerColor(socketId);
        if (!color) return [];

        // Find the piece
        const player = session.players[color];
        const piece = player?.pieces.find(p => p.id === pieceId);
        if (!piece || piece.owner !== color) return [];

        // King and Pit cannot move
        if (piece.type === 'king' || piece.type === 'pit') {
            return [];
        }

        const validMoves: Position[] = [];
        const { row, col } = piece.position;

        for (const dir of MOVEMENT_DIRECTIONS) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;

            // Check bounds using dynamic mode config
            if (newRow < 0 || newRow >= config.rows || newCol < 0 || newCol >= config.cols) {
                continue;
            }

            const targetCell = session.board[newRow][newCol];

            // Can move to empty cell or cell with enemy piece
            if (!targetCell.piece || targetCell.piece.owner !== color) {
                validMoves.push({ row: newRow, col: newCol });
            }
        }

        return validMoves;
    }

    /**
     * Check if a player has any pieces that can make a valid move.
     * Returns false if player only has King/Pit (which cannot move).
     */
    public hasMovablePieces(socketId: string): boolean {
        const session = this.getSessionBySocketId(socketId);
        if (!session || session.phase !== 'playing') return false;

        const color = this.getPlayerColor(socketId);
        if (!color) return false;

        const player = session.players[color];
        if (!player) return false;

        // Check if player has any RPS pieces that can actually move
        const movablePieces = player.pieces.filter(p =>
            p.type !== 'king' && p.type !== 'pit'
        );

        // If no movable pieces (only King/Pit), then obviously false
        if (movablePieces.length === 0) return false;

        // CRITICAL FIX: Check if any of these pieces have at least one valid move
        // Previously we only checked if the player HAD pieces, not if they were blocked
        return movablePieces.some(p => {
            const validMoves = this.getValidMoves(socketId, p.id);
            return validMoves.length > 0;
        });
    }

    /**
     * Skip the current player's turn and switch to opponent.
     * Used when player has no movable pieces.
     */
    public skipTurn(socketId: string): { success: boolean; error?: string } {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return { success: false, error: 'Session not found' };

        if (session.phase !== 'playing') {
            return { success: false, error: 'Game is not in playing phase' };
        }

        const color = this.getPlayerColor(socketId);
        if (!color) return { success: false, error: 'Player not found' };

        if (session.currentTurn !== color) {
            return { success: false, error: 'Not your turn' };
        }

        // Switch turn
        session.currentTurn = color === 'red' ? 'blue' : 'red';
        session.turnStartTime = Date.now();
        this.resetDrawOffersForTurn(session.sessionId);

        console.log(`⏭️ ${color} turn skipped (no movable pieces)`);
        return { success: true };
    }

    /**
     * Check if both players have only immovable pieces (draw condition).
     */
    public checkDraw(sessionId: string): boolean {
        const session = this.sessions.get(sessionId);
        if (!session || session.phase !== 'playing') return false;

        const redPlayer = session.players.red;
        const bluePlayer = session.players.blue;

        if (!redPlayer || !bluePlayer) return false;

        const redHasMovable = redPlayer.pieces.some(p => p.type !== 'king' && p.type !== 'pit');
        const blueHasMovable = bluePlayer.pieces.some(p => p.type !== 'king' && p.type !== 'pit');

        return !redHasMovable && !blueHasMovable;
    }

    /**
     * End the game as a draw.
     */
    public setDraw(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.phase = 'finished';
        session.winner = null;
        session.winReason = 'draw';
        console.log(`🤝 Game ${sessionId} ended in a draw (no movable pieces)`);
    }

    /**
     * Offer a draw to the opponent.
     * Only the current player can offer a draw, and only once per turn.
     */
    public offerDraw(socketId: string): { success: boolean; error?: string; opponentSocketId?: string } {
        const session = this.getSessionBySocketId(socketId);
        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        // Only allowed in PvP games
        if (session.opponentType === 'ai') {
            return { success: false, error: 'Draw offers not available in singleplayer' };
        }

        // Only allowed during playing phase
        if (session.phase !== 'playing') {
            return { success: false, error: 'Draw offers only allowed during playing phase' };
        }

        const playerColor = this.getPlayerColor(socketId);
        if (!playerColor) {
            return { success: false, error: 'Player not found in session' };
        }

        // Only current player can offer draw
        if (session.currentTurn !== playerColor) {
            return { success: false, error: 'Only the current player can offer a draw' };
        }

        // Check if already offered this turn
        if (session.drawOffersMadeThisTurn?.[playerColor]) {
            return { success: false, error: 'Already offered draw this turn' };
        }

        // Check if there's already a pending offer
        if (session.pendingDrawOffer) {
            return { success: false, error: 'A draw offer is already pending' };
        }

        // Record the draw offer
        session.pendingDrawOffer = playerColor;
        if (!session.drawOffersMadeThisTurn) {
            session.drawOffersMadeThisTurn = { red: false, blue: false };
        }
        session.drawOffersMadeThisTurn[playerColor] = true;

        // Get opponent socket ID
        const opponentColor = playerColor === 'red' ? 'blue' : 'red';
        const opponentSocketId = session.players[opponentColor]?.socketId;

        console.log(`🤝 Player ${playerColor} offered draw in session ${session.sessionId}`);

        return { success: true, opponentSocketId };
    }

    /**
     * Respond to a pending draw offer.
     */
    public respondToDraw(socketId: string, accepted: boolean): {
        success: boolean;
        error?: string;
        session?: GameState;
        offererSocketId?: string;
    } {
        const session = this.getSessionBySocketId(socketId);
        if (!session) {
            return { success: false, error: 'Session not found' };
        }

        if (!session.pendingDrawOffer) {
            return { success: false, error: 'No pending draw offer' };
        }

        const playerColor = this.getPlayerColor(socketId);
        if (!playerColor) {
            return { success: false, error: 'Player not found in session' };
        }

        // Only the opponent of the offerer can respond
        if (session.pendingDrawOffer === playerColor) {
            return { success: false, error: 'Cannot respond to your own draw offer' };
        }

        const offererColor = session.pendingDrawOffer as 'red' | 'blue';
        const offererSocketId = session.players[offererColor]?.socketId;

        // Clear the pending offer
        session.pendingDrawOffer = undefined;

        if (accepted) {
            // End game as draw
            session.phase = 'finished';
            session.winner = null;
            session.winReason = 'draw_offer';
            console.log(`🤝 Game ${session.sessionId} ended in agreed draw`);
            return { success: true, session, offererSocketId };
        } else {
            // Draw declined - offerer cannot offer again until next turn
            console.log(`❌ Draw offer declined in session ${session.sessionId}`);
            return { success: true, session, offererSocketId };
        }
    }

    /**
     * Reset draw offer state when turn changes.
     */
    public resetDrawOffersForTurn(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        session.pendingDrawOffer = undefined;
        session.drawOffersMadeThisTurn = { red: false, blue: false };
    }

    /**
     * Resolve combat between two pieces.
     * Returns: 'attacker_wins', 'defender_wins', or 'tie'
     */
    /**
     * Resolve combat between two pieces.
     * Returns: 'attacker_wins', 'defender_wins', or 'tie'
     */
    private resolveCombat(attacker: Piece, defender: Piece, _gameMode: GameMode): 'attacker_wins' | 'defender_wins' | 'tie' {
        // Special case: Attacking the King always wins
        if (defender.type === 'king') {
            return 'attacker_wins';
        }

        // Special case: Pit defeats any attacker
        if (defender.type === 'pit') {
            return 'defender_wins';
        }

        // RPSLS Logic (which is also backward compatible with standard RPS if configured correctly, 
        // but we'll use the specific matrix)
        const attackerType = attacker.type;
        const defenderType = defender.type;

        // If types are same -> tie
        if (attackerType === defenderType) {
            return 'tie';
        }

        // Check if attacker defeats defender
        const defeats = RPSLS_WINS[attackerType];
        if (defeats && defeats.includes(defenderType)) {
            return 'attacker_wins';
        }

        // Otherwise defender wins (assuming valid types)
        return 'defender_wins';
    }

    /**
     * Execute a move. Returns success/error and whether combat occurred.
     */
    public makeMove(
        socketId: string,
        from: Position,
        to: Position
    ): { success: boolean; error?: string; combat?: boolean } {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return { success: false, error: 'Session not found' };

        if (session.phase !== 'playing') {
            return { success: false, error: 'Game is not in playing phase' };
        }

        const color = this.getPlayerColor(socketId);
        if (!color) return { success: false, error: 'Player not found' };

        // Validate it's this player's turn
        if (session.currentTurn !== color) {
            return { success: false, error: 'Not your turn' };
        }

        const player = session.players[color];
        if (!player) return { success: false, error: 'Player state not found' };

        // Find the piece at 'from' position
        const piece = player.pieces.find(
            p => p.position.row === from.row && p.position.col === from.col
        );
        if (!piece) {
            return { success: false, error: 'No piece at source position' };
        }

        // Validate piece can move (not King/Pit)
        if (piece.type === 'king' || piece.type === 'pit') {
            return { success: false, error: 'This piece cannot move' };
        }

        // Validate target is a valid move
        const validMoves = this.getValidMoves(socketId, piece.id);
        const isValidTarget = validMoves.some(m => m.row === to.row && m.col === to.col);
        if (!isValidTarget) {
            return { success: false, error: 'Invalid move target' };
        }

        const targetCell = session.board[to.row][to.col];

        // Check if combat will occur
        if (targetCell.piece && targetCell.piece.owner !== color) {
            const defender = targetCell.piece;
            const defenderOwner = defender.owner;

            console.log(`⚔️ Combat initiated: ${piece.type} (${color}) vs ${defender.type} (${defenderOwner})`);

            // Resolve combat
            const result = this.resolveCombat(piece, defender, session.gameMode);

            if (result === 'tie') {
                // Transition to tie_breaker phase
                session.phase = 'tie_breaker';
                session.combatState = {
                    attackerId: piece.id,
                    defenderId: defender.id,
                    attackerChoice: undefined,
                    defenderChoice: undefined,
                    isTie: true
                };
                // Notify AI pattern tracker that a new tie-breaker is starting
                if (session.opponentType === 'ai') {
                    this.aiService.startTieBreaker(session.sessionId);
                }
                console.log(`🤝 Combat tie! Entering tie breaker phase.`);
                return { success: true, combat: true };
            }

            // Determine winner and loser
            const winner = result === 'attacker_wins' ? piece : defender;
            const loser = result === 'attacker_wins' ? defender : piece;
            const winnerOwner = winner.owner;
            const loserOwner = loser.owner;

            console.log(`✅ Combat resolved: ${winner.type} (${winnerOwner}) defeats ${loser.type} (${loserOwner})`);

            // Check for King capture (game over)
            if (loser.type === 'king') {
                // Remove captured king from board and player's pieces
                const loserPlayer = session.players[loserOwner];
                if (loserPlayer) {
                    loserPlayer.pieces = loserPlayer.pieces.filter(p => p.id !== loser.id);
                }
                session.board[to.row][to.col].piece = null;

                // Move attacker to king's position
                session.board[from.row][from.col].piece = null;
                session.board[to.row][to.col].piece = piece;
                piece.position = { row: to.row, col: to.col };
                piece.isRevealed = true;
                piece.hasHalo = true;

                // Set game over state
                session.phase = 'finished';
                session.winner = winnerOwner;
                session.winReason = 'king_captured';
                console.log(`👑 ${winnerOwner} wins by capturing the King!`);
                return { success: true, combat: true };
            }

            // Remove loser from board
            const loserPlayer = session.players[loserOwner];
            if (loserPlayer) {
                loserPlayer.pieces = loserPlayer.pieces.filter(p => p.id !== loser.id);
            }

            // Update board: winner takes position
            if (result === 'attacker_wins') {
                // Attacker wins: move attacker to target
                session.board[from.row][from.col].piece = null;
                session.board[to.row][to.col].piece = piece;
                piece.position = { row: to.row, col: to.col };
            } else {
                // Defender wins: remove attacker, defender stays
                session.board[from.row][from.col].piece = null;
                const attackerPlayer = session.players[color];
                if (attackerPlayer) {
                    attackerPlayer.pieces = attackerPlayer.pieces.filter(p => p.id !== piece.id);
                }
            }

            // Reveal and add halo to winner
            winner.isRevealed = true;
            winner.hasHalo = true;

            if (session.gameVariant === 'onslaught') {
                if (this.handleOnslaughtCheck(session)) {
                    return { success: true, combat: true };
                }
            }

            // --- AI Inference Integration ---
            if (session.opponentType === 'ai') {
                const aiColor = this.getAIColor(session.sessionId);
                if (aiColor) {
                    if (winner.owner !== aiColor) {
                        this.aiService.recordCombatOutcome(session.sessionId, winner.id, winner.type, winner.position);
                    }
                    if (loser.owner !== aiColor) {
                        this.aiService.recordCombatOutcome(session.sessionId, loser.id, loser.type, loser.position);
                        this.aiService.recordOpponentDeath(session.sessionId, loser.id, loser.type);
                    }
                }
            }

            // Switch turn
            session.currentTurn = color === 'red' ? 'blue' : 'red';
            session.turnStartTime = Date.now();
            this.resetDrawOffersForTurn(session.sessionId);

            return { success: true, combat: true };
        }

        // Move to empty cell
        // Update board
        session.board[from.row][from.col].piece = null;
        session.board[to.row][to.col].piece = piece;

        // Update piece position
        piece.position = { row: to.row, col: to.col };

        // --- AI Movement Tracking ---
        if (session.opponentType === 'ai') {
            const aiColor = this.getAIColor(session.sessionId);
            if (aiColor && color !== aiColor) {
                this.aiService.recordOpponentMovement(session.sessionId, piece.id, to);
            }
        }

        // Switch turn
        session.currentTurn = color === 'red' ? 'blue' : 'red';
        session.turnStartTime = Date.now();
        this.resetDrawOffersForTurn(session.sessionId);

        console.log(`♟️ ${color} moved ${piece.type} from (${from.row},${from.col}) to (${to.row},${to.col})`);
        return { success: true, combat: false };
    }

    /**
     * Get a player's game view during playing phase.
     */
    public getPlayerGameView(socketId: string): {
        board: PlayerCellView[][];
        currentTurn: PlayerColor | null;
        phase: string;
        isMyTurn: boolean;
        gameMode: GameMode;
        combatPosition?: Position;
        combatPieceType?: PieceType;
        combatAttackerPosition?: Position;
    } | null {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return null;

        const color = this.getPlayerColor(socketId);
        if (!color) return null;

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

        // Include combat position during tie-breaker phase
        let combatPosition: Position | undefined;
        let combatPieceType: PieceType | undefined;
        let combatAttackerPosition: Position | undefined;
        if (session.phase === 'tie_breaker' && session.combatState) {
            const defender = session.players.red?.pieces.find(p => p.id === session.combatState!.defenderId) ||
                session.players.blue?.pieces.find(p => p.id === session.combatState!.defenderId);
            const attacker = session.players.red?.pieces.find(p => p.id === session.combatState!.attackerId) ||
                session.players.blue?.pieces.find(p => p.id === session.combatState!.attackerId);
            if (defender) {
                combatPosition = defender.position;
                combatPieceType = defender.type;
            }
            if (attacker) {
                combatAttackerPosition = attacker.position;
            }
        }

        return {
            board: boardView,
            currentTurn: session.currentTurn,
            phase: session.phase,
            isMyTurn: session.currentTurn === color,
            gameMode: session.gameMode,
            combatPosition,
            combatPieceType,
            combatAttackerPosition
        };
    }

    /**
     * Handle tie breaker choice submission.
     * When both players have chosen, re-resolve combat with new types.
     */
    public submitTieBreakerChoice(
        socketId: string,
        choice: CombatElement
    ): {
        success: boolean;
        error?: string;
        bothChosen?: boolean;
        isTieAgain?: boolean;
        attackerChoice?: CombatElement;
        defenderChoice?: CombatElement;
        attackerId?: string;
        defenderId?: string;
        attackerOwner?: PlayerColor;
        defenderOwner?: PlayerColor;
    } {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return { success: false, error: 'Session not found' };

        if (session.phase !== 'tie_breaker') {
            return { success: false, error: 'Not in tie breaker phase' };
        }

        if (!session.combatState) {
            return { success: false, error: 'No active combat state' };
        }

        const color = this.getPlayerColor(socketId);
        if (!color) return { success: false, error: 'Player not found' };

        const player = session.players[color];
        if (!player) return { success: false, error: 'Player state not found' };

        // Find which piece belongs to this player
        const attackerPiece = player.pieces.find(p => p.id === session.combatState!.attackerId);
        const defenderPiece = player.pieces.find(p => p.id === session.combatState!.defenderId);

        if (attackerPiece) {
            session.combatState.attackerChoice = choice;
        } else if (defenderPiece) {
            session.combatState.defenderChoice = choice;
        } else {
            return { success: false, error: 'Piece not found in your pieces' };
        }

        // Record human choice for AI pattern learning
        // Record human choice for AI pattern learning
        // Only record if we are in AI mode AND the current chooser is NOT the AI
        if (session.opponentType === 'ai' && !socketId.startsWith(AI_SOCKET_PREFIX)) {
            this.aiService.recordOpponentTieChoice(session.sessionId, choice);
        }

        // Check if both players have chosen
        const bothChosen = session.combatState.attackerChoice !== undefined &&
            session.combatState.defenderChoice !== undefined;

        if (bothChosen) {
            // Capture choices before resolution clears them
            const resolvedAttackerChoice = session.combatState.attackerChoice!;
            const resolvedDefenderChoice = session.combatState.defenderChoice!;
            const resolvedAttackerId = session.combatState.attackerId;
            const resolvedDefenderId = session.combatState.defenderId;

            // Update piece types permanently
            const attacker = session.players.red?.pieces.find(p => p.id === session.combatState!.attackerId) ||
                session.players.blue?.pieces.find(p => p.id === session.combatState!.attackerId);
            const defender = session.players.red?.pieces.find(p => p.id === session.combatState!.defenderId) ||
                session.players.blue?.pieces.find(p => p.id === session.combatState!.defenderId);

            if (!attacker || !defender) {
                return { success: false, error: 'Combat pieces not found' };
            }

            attacker.type = session.combatState.attackerChoice!;
            defender.type = session.combatState.defenderChoice!;

            // Capture owners
            const attackerOwner = attacker.owner;
            const defenderOwner = defender.owner;

            console.log(`🔄 Tie breaker resolved: ${attacker.type} vs ${defender.type}`);

            // Re-resolve combat with new types
            const result = this.resolveCombat(attacker, defender, session.gameMode);

            if (result === 'tie') {
                // Capture choices before resetting
                const atkChoice = session.combatState.attackerChoice!;
                const defChoice = session.combatState.defenderChoice!;
                const atkId = session.combatState.attackerId;
                const defId = session.combatState.defenderId;
                // Another tie! Reset choices for another round
                session.combatState.attackerChoice = undefined;
                session.combatState.defenderChoice = undefined;
                console.log(`🤝 Another tie! Continue tie breaker.`);
                return {
                    success: true,
                    bothChosen: false,
                    isTieAgain: true,
                    attackerChoice: atkChoice,
                    defenderChoice: defChoice,
                    attackerId: atkId,
                    defenderId: defId,
                    attackerOwner,
                    defenderOwner
                };
            }

            // Combat resolved
            const winner = result === 'attacker_wins' ? attacker : defender;
            const loser = result === 'attacker_wins' ? defender : attacker;
            const winnerOwner = winner.owner;
            const loserOwner = loser.owner;

            console.log(`✅ Final combat: ${winner.type} (${winnerOwner}) defeats ${loser.type} (${loserOwner})`);

            // Check for King capture
            if (loser.type === 'king') {
                // Remove captured king from board and player's pieces
                const loserPlayer = session.players[loserOwner];
                if (loserPlayer) {
                    loserPlayer.pieces = loserPlayer.pieces.filter(p => p.id !== loser.id);
                }
                // Remove king from board
                for (const row of session.board) {
                    for (const cell of row) {
                        if (cell.piece?.id === loser.id) {
                            cell.piece = null;
                        }
                    }
                }

                // Move attacker to king's position
                const defenderPos = defender.position;
                for (const row of session.board) {
                    for (const cell of row) {
                        if (cell.piece?.id === attacker.id) {
                            cell.piece = null;
                        }
                    }
                }
                session.board[defenderPos.row][defenderPos.col].piece = attacker;
                attacker.position = defenderPos;
                attacker.isRevealed = true;
                attacker.hasHalo = true;

                // Set game over state
                session.phase = 'finished';
                session.winner = winnerOwner;
                session.winReason = 'king_captured';
                session.combatState = null;
                console.log(`👑 ${winnerOwner} wins by capturing the King!`);
                return {
                    success: true,
                    bothChosen: true,
                    attackerChoice: resolvedAttackerChoice,
                    defenderChoice: resolvedDefenderChoice,
                    attackerId: resolvedAttackerId,
                    defenderId: resolvedDefenderId,
                    attackerOwner,
                    defenderOwner
                };
            }

            // Remove loser
            const loserPlayer = session.players[loserOwner];
            if (loserPlayer) {
                loserPlayer.pieces = loserPlayer.pieces.filter(p => p.id !== loser.id);
                // Remove from board
                for (const row of session.board) {
                    for (const cell of row) {
                        if (cell.piece?.id === loser.id) {
                            cell.piece = null;
                        }
                    }
                }
            }

            // Winner takes position if attacker won
            if (result === 'attacker_wins') {
                const defenderPos = defender.position;
                // Remove attacker from old position
                for (const row of session.board) {
                    for (const cell of row) {
                        if (cell.piece?.id === attacker.id) {
                            cell.piece = null;
                        }
                    }
                }
                // Place attacker at defender's position
                session.board[defenderPos.row][defenderPos.col].piece = attacker;
                attacker.position = defenderPos;
            }

            // Reveal and add halo to winner
            winner.isRevealed = true;
            winner.hasHalo = true;

            if (session.gameVariant === 'onslaught') {
                if (this.handleOnslaughtCheck(session)) {
                    session.combatState = null;
                    return {
                        success: true,
                        bothChosen: true,
                        attackerChoice: resolvedAttackerChoice,
                        defenderChoice: resolvedDefenderChoice,
                        attackerId: resolvedAttackerId,
                        defenderId: resolvedDefenderId,
                        attackerOwner,
                        defenderOwner
                    };
                }
            }

            // Return to playing phase
            session.phase = 'playing';
            session.combatState = null;

            // Switch turn
            session.currentTurn = session.currentTurn === 'red' ? 'blue' : 'red';
            session.turnStartTime = Date.now();

            return {
                success: true,
                bothChosen: true,
                attackerChoice: resolvedAttackerChoice,
                defenderChoice: resolvedDefenderChoice,
                attackerId: resolvedAttackerId,
                defenderId: resolvedDefenderId,
                attackerOwner,
                defenderOwner
            };
        }

        return { success: true, bothChosen: false };
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

            // Clean up AI session state
            if (session.opponentType === 'ai') {
                this.aiService.clearSession(sessionId);
            }

            this.sessions.delete(sessionId);
        }
    }

    /**
     * Handle a player explicitly leaving a session (e.g. clicking "Return Home" after game over).
     * Cleans up the leaving player's mappings. Removes the session entirely since the game is over.
     */
    public leaveSession(socketId: string): { sessionId: string } | null {
        const sessionId = this.playerSessionMap.get(socketId);
        if (!sessionId) return null;

        const session = this.sessions.get(sessionId);
        if (!session) return null;

        // Clean up leaving player's mappings
        this.playerSessionMap.delete(socketId);
        this.setupStates.delete(socketId);

        // Check if any other human players are still in this session
        const redSocket = session.players.red?.socketId;
        const blueSocket = session.players.blue?.socketId;

        const redActive = redSocket && this.playerSessionMap.has(redSocket);
        const blueActive = blueSocket && this.playerSessionMap.has(blueSocket);

        // Remove session only if:
        // 1. It's an AI session (leaving means game over)
        // 2. OR no human players remain
        if (session.opponentType === 'ai' || (!redActive && !blueActive)) {
            this.removeSession(sessionId);
        }

        return { sessionId };
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

    /**
     * Forfeit the game. The opponent automatically wins.
     */
    public forfeitGame(socketId: string): { success: boolean; session?: GameState; error?: string } {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return { success: false, error: 'Session not found' };

        // Can only forfeit during active game states
        if (session.phase !== 'setup' && session.phase !== 'playing' && session.phase !== 'combat' && session.phase !== 'tie_breaker') {
            return { success: false, error: 'Cannot forfeit in current phase' };
        }

        const color = this.getPlayerColor(socketId);
        if (!color) return { success: false, error: 'Player not found' };

        const opponentColor = color === 'red' ? 'blue' : 'red';

        session.phase = 'finished';
        session.winner = opponentColor;
        session.winReason = 'forfeit';

        console.log(`🏳️ Player ${socketId} (${color}) forfeited game ${session.sessionId}`);

        return { success: true, session };
    }

    /**
     * Request a rematch. Returns status indicating if both players have requested.
     */
    public requestRematch(socketId: string): {
        success: boolean;
        error?: string;
        bothRequested?: boolean;
        opponentSocketId?: string;
    } {
        const session = this.getSessionBySocketId(socketId);
        if (!session) return { success: false, error: 'Session not found' };

        if (session.phase !== 'finished') {
            return { success: false, error: 'Game is not finished' };
        }

        const color = this.getPlayerColor(socketId);
        if (!color) return { success: false, error: 'Player not found' };

        // Initialize rematchRequests if not present
        if (!session.rematchRequests) {
            session.rematchRequests = { red: false, blue: false };
        }

        // Mark this player's rematch request
        session.rematchRequests[color] = true;

        // In singleplayer, AI always accepts rematch
        if (session.opponentType === 'ai') {
            const aiColor = this.getAIColor(session.sessionId);
            if (aiColor) {
                session.rematchRequests[aiColor] = true;
            }
        }

        const opponent = session.players[color === 'red' ? 'blue' : 'red'];
        const opponentSocketId = opponent?.socketId;

        // Check if both players have requested rematch
        const bothRequested = session.rematchRequests.red && session.rematchRequests.blue;

        console.log(`🔄 Player ${socketId} (${color}) requested rematch. Both requested: ${bothRequested}`);

        return {
            success: true,
            bothRequested,
            opponentSocketId
        };
    }

    /**
     * Reset game state for rematch. Clears board, pieces, setup state, and transitions to setup phase.
     */
    public resetGameForRematch(sessionId: string): { success: boolean; error?: string } {
        const session = this.sessions.get(sessionId);
        if (!session) return { success: false, error: 'Session not found' };

        const config = session.gameVariant === 'onslaught'
            ? ONSLAUGHT_CONFIG[session.gameMode]
            : BOARD_CONFIG[session.gameMode];

        // Reset board to empty using mode-specific dimensions
        session.board = Array(config.rows).fill(null).map((_, row) =>
            Array(config.cols).fill(null).map((_, col) => ({
                row,
                col,
                piece: null
            }))
        );

        // Reset player states
        if (session.players.red) {
            session.players.red.pieces = [];
            session.players.red.isReady = false;
            this.setupStates.set(session.players.red.socketId, { hasPlacedKingPit: false, hasShuffled: false });
        }
        if (session.players.blue) {
            session.players.blue.pieces = [];
            session.players.blue.isReady = false;
            this.setupStates.set(session.players.blue.socketId, { hasPlacedKingPit: false, hasShuffled: false });
        }

        // For Onslaught, re-run initialization to place pieces and set flags
        if (session.gameVariant === 'onslaught') {
            this.initializeOnslaughtGame(session);
        }

        // Reset game state
        session.phase = 'setup';
        session.currentTurn = null;
        session.turnStartTime = null;
        session.combatState = null;
        session.winReason = undefined;
        session.rematchRequests = undefined;
        session.aiReady = false;

        // Reset draw offer state
        this.resetDrawOffersForTurn(sessionId);

        // Re-initialize AI session tracking for rematch
        if (session.opponentType === 'ai') {
            const aiColor = this.getAIColor(sessionId);
            if (aiColor) {
                this.aiService.clearSession(sessionId);
                this.aiService.initSession(sessionId, aiColor);
            }
        }

        console.log(`🔄 Session ${sessionId} reset for rematch`);
        return { success: true };
    }

    /**
     * Register a player ID to socket ID mapping.
     */
    public registerPlayer(playerId: string, socketId: string): void {
        this.playerIdToSocketId.set(playerId, socketId);
        this.socketIdToPlayerId.set(socketId, playerId);
        console.log(`🔗 Registered player ${playerId} with socket ${socketId}`);
    }

    /**
     * Get player ID from socket ID.
     */
    public getPlayerId(socketId: string): string | undefined {
        return this.socketIdToPlayerId.get(socketId);
    }

    /**
     * Check if a player has an active session they can reconnect to.
     */
    public getSessionByPlayerId(playerId: string): { session: GameState; color: PlayerColor } | null {
        const oldSocketId = this.playerIdToSocketId.get(playerId);
        if (!oldSocketId) return null;

        const sessionId = this.playerSessionMap.get(oldSocketId);
        if (!sessionId) return null;

        const session = this.sessions.get(sessionId);
        if (!session) return null;

        // Determine which color this player is
        if (session.players.red?.socketId === oldSocketId) {
            return { session, color: 'red' };
        }
        if (session.players.blue?.socketId === oldSocketId) {
            return { session, color: 'blue' };
        }

        return null;
    }

    /**
     * Handle temporary disconnect - start grace period instead of immediate session end.
     * Returns opponent socket ID if they should be notified.
     */
    public handleTemporaryDisconnect(socketId: string, onTimeout: () => void): string | null {
        // AI players never disconnect
        if (this.isAIPlayer(socketId)) return null;

        const playerId = this.socketIdToPlayerId.get(socketId);
        if (!playerId) return null;

        const sessionId = this.playerSessionMap.get(socketId);
        if (!sessionId) return null;

        const session = this.sessions.get(sessionId);
        if (!session) return null;

        // For singleplayer sessions, just end the session immediately (no grace period needed)
        if (session.opponentType === 'ai') {
            console.log(`🤖 Human disconnected from AI session ${sessionId}, removing session`);
            this.removeSession(sessionId);
            return null;
        }

        // Find opponent
        const opponent = session.players.red?.socketId === socketId ? session.players.blue : session.players.red;
        const opponentId = opponent?.socketId;

        console.log(`⏳ Starting 30s reconnection grace period for player ${playerId}`);

        // Start the grace period timer
        const timer = setTimeout(() => {
            console.log(`⌛ Grace period expired for player ${playerId}`);
            this.disconnectTimers.delete(playerId);
            onTimeout();
        }, this.RECONNECT_GRACE_PERIOD);

        this.disconnectTimers.set(playerId, timer);

        return opponentId ?? null;
    }

    /**
     * Handle player reconnection - cancel grace period and restore session.
     * Returns the restored session info if successful.
     */
    public handleReconnect(playerId: string, newSocketId: string): {
        success: boolean;
        session?: GameState;
        color?: PlayerColor;
        setupState?: SetupState;
    } {
        // Cancel any pending disconnect timer
        const timer = this.disconnectTimers.get(playerId);
        if (timer) {
            clearTimeout(timer);
            this.disconnectTimers.delete(playerId);
            console.log(`✅ Cancelled disconnect timer for player ${playerId}`);
        }

        // Find the old socket ID
        const oldSocketId = this.playerIdToSocketId.get(playerId);
        if (!oldSocketId) {
            return { success: false };
        }

        // Find the session
        const sessionId = this.playerSessionMap.get(oldSocketId);
        if (!sessionId) {
            return { success: false };
        }

        const session = this.sessions.get(sessionId);
        if (!session) {
            return { success: false };
        }

        // Determine which player this is and update their socket ID
        let color: PlayerColor | undefined;
        if (session.players.red?.socketId === oldSocketId) {
            session.players.red.socketId = newSocketId;
            color = 'red';
        } else if (session.players.blue?.socketId === oldSocketId) {
            session.players.blue.socketId = newSocketId;
            color = 'blue';
        } else {
            return { success: false };
        }

        // Update all mappings
        this.playerSessionMap.delete(oldSocketId);
        this.playerSessionMap.set(newSocketId, sessionId);

        const setupState = this.setupStates.get(oldSocketId);
        if (setupState) {
            this.setupStates.delete(oldSocketId);
            this.setupStates.set(newSocketId, setupState);
        }

        this.socketIdToPlayerId.delete(oldSocketId);
        this.socketIdToPlayerId.set(newSocketId, playerId);
        this.playerIdToSocketId.set(playerId, newSocketId);

        console.log(`🔄 Player ${playerId} reconnected with new socket ${newSocketId}`);

        return {
            success: true,
            session,
            color,
            setupState
        };
    }

    /**
     * Check if a player has a pending disconnect timer (is in grace period).
     */
    public isPlayerReconnecting(playerId: string): boolean {
        return this.disconnectTimers.has(playerId);
    }
}
