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
    PIECES_PER_PLAYER,
    MOVEMENT_DIRECTIONS
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
        if (player.isReady) {
            return { success: false, error: 'Setup already confirmed' };
        }

        const setupState = this.setupStates.get(socketId);
        if (setupState?.hasShuffled) {
            return { success: false, error: 'Cannot reposition after shuffling' };
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

        const color = this.getPlayerColor(socketId);
        if (!color) return { success: false, error: 'Player not found' };

        const player = session.players[color];
        if (!player) return { success: false, error: 'Player state not found' };

        if (player.isReady) {
            return { success: false, error: 'Cannot reshuffle when ready' };
        }

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

    /**
     * Get valid moves for a piece. King and Pit cannot move.
     * Rock/Paper/Scissors can move one step in 4 directions.
     */
    public getValidMoves(socketId: string, pieceId: string): Position[] {
        const session = this.getSessionBySocketId(socketId);
        if (!session || session.phase !== 'playing') return [];

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

            // Check bounds
            if (newRow < 0 || newRow >= BOARD_ROWS || newCol < 0 || newCol >= BOARD_COLS) {
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
     * Resolve combat between two pieces.
     * Returns: 'attacker_wins', 'defender_wins', or 'tie'
     */
    private resolveCombat(attacker: Piece, defender: Piece): 'attacker_wins' | 'defender_wins' | 'tie' {
        // Special case: Attacking the King always wins
        if (defender.type === 'king') {
            return 'attacker_wins';
        }

        // Special case: Pit defeats any attacker
        if (defender.type === 'pit') {
            return 'defender_wins';
        }

        // Standard RPS logic
        if (attacker.type === 'rock') {
            if (defender.type === 'scissors') return 'attacker_wins';
            if (defender.type === 'paper') return 'defender_wins';
            if (defender.type === 'rock') return 'tie';
        }

        if (attacker.type === 'paper') {
            if (defender.type === 'rock') return 'attacker_wins';
            if (defender.type === 'scissors') return 'defender_wins';
            if (defender.type === 'paper') return 'tie';
        }

        if (attacker.type === 'scissors') {
            if (defender.type === 'paper') return 'attacker_wins';
            if (defender.type === 'rock') return 'defender_wins';
            if (defender.type === 'scissors') return 'tie';
        }

        // King/Pit as attackers (should not happen, but handle gracefully)
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
            const result = this.resolveCombat(piece, defender);

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

            // Switch turn
            session.currentTurn = color === 'red' ? 'blue' : 'red';
            session.turnStartTime = Date.now();

            return { success: true, combat: true };
        }

        // Move to empty cell
        // Update board
        session.board[from.row][from.col].piece = null;
        session.board[to.row][to.col].piece = piece;

        // Update piece position
        piece.position = { row: to.row, col: to.col };

        // Switch turn
        session.currentTurn = color === 'red' ? 'blue' : 'red';
        session.turnStartTime = Date.now();

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

        return {
            board: boardView,
            currentTurn: session.currentTurn,
            phase: session.phase,
            isMyTurn: session.currentTurn === color
        };
    }

    /**
     * Handle tie breaker choice submission.
     * When both players have chosen, re-resolve combat with new types.
     */
    public submitTieBreakerChoice(
        socketId: string,
        choice: 'rock' | 'paper' | 'scissors'
    ): { success: boolean; error?: string; bothChosen?: boolean; isTieAgain?: boolean } {
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

        // Check if both players have chosen
        const bothChosen = session.combatState.attackerChoice !== undefined &&
            session.combatState.defenderChoice !== undefined;

        if (bothChosen) {
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

            console.log(`🔄 Tie breaker resolved: ${attacker.type} vs ${defender.type}`);

            // Re-resolve combat with new types
            const result = this.resolveCombat(attacker, defender);

            if (result === 'tie') {
                // Another tie! Reset choices for another round
                session.combatState.attackerChoice = undefined;
                session.combatState.defenderChoice = undefined;
                console.log(`🤝 Another tie! Continue tie breaker.`);
                return { success: true, bothChosen: false, isTieAgain: true };
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
                return { success: true, bothChosen: true };
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

            // Return to playing phase
            session.phase = 'playing';
            session.combatState = null;

            // Switch turn
            session.currentTurn = session.currentTurn === 'red' ? 'blue' : 'red';
            session.turnStartTime = Date.now();
        }

        return { success: true, bothChosen };
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

        // Reset board to empty
        session.board = Array(BOARD_ROWS).fill(null).map((_, row) =>
            Array(BOARD_COLS).fill(null).map((_, col) => ({
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

        // Reset game state
        session.phase = 'setup';
        session.currentTurn = null;
        session.turnStartTime = null;
        session.combatState = null;
        session.winner = null;
        session.winReason = undefined;
        session.rematchRequests = undefined;

        console.log(`🔄 Session ${sessionId} reset for rematch`);
        return { success: true };
    }
}
