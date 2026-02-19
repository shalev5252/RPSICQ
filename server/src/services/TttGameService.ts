import { v4 as uuidv4 } from 'uuid';
import type { TttCell, TttMark, TttGameState, TttDifficulty, PlayerColor } from '@rps/shared';

// Winning line indices (row-major: index = row*3 + col)
const WIN_LINES: number[][] = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],  // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8],  // cols
    [0, 4, 8], [2, 4, 6],              // diagonals
];

export interface TttSession {
    state: TttGameState;
    sockets: { red: string; blue: string | null };  // null blue = AI
    aiDifficulty: TttDifficulty | null;
    rematchRequests: { red: boolean; blue: boolean };
}

export class TttGameService {
    private sessions: Map<string, TttSession> = new Map();
    private socketToSession: Map<string, string> = new Map();

    // ---------------------------------------------------------------
    // Session lifecycle
    // ---------------------------------------------------------------

    public createSession(
        sessionId: string,
        socket1Id: string,
        socket1Color: PlayerColor,
        socket2Id: string,
        _socket2Color: PlayerColor,
    ): TttSession {
        // Randomly assign X/O based on color
        const redMark: TttMark = Math.random() < 0.5 ? 'X' : 'O';
        const blueMark: TttMark = redMark === 'X' ? 'O' : 'X';

        const state: TttGameState = {
            sessionId,
            board: Array(9).fill(null),
            currentTurn: 'X',  // X always goes first
            winner: null,
            winningLine: null,
            playerMarks: { red: redMark, blue: blueMark },
        };

        const session: TttSession = {
            state,
            sockets: { red: socket1Color === 'red' ? socket1Id : socket2Id, blue: socket1Color === 'blue' ? socket1Id : socket2Id },
            aiDifficulty: null,
            rematchRequests: { red: false, blue: false },
        };

        this.sessions.set(sessionId, session);
        this.socketToSession.set(session.sockets.red, sessionId);
        if (session.sockets.blue) this.socketToSession.set(session.sockets.blue, sessionId);

        return session;
    }

    public createSingleplayerSession(socketId: string, difficulty: TttDifficulty): TttSession {
        const sessionId = uuidv4();
        // Human is always red / X (goes first)
        const state: TttGameState = {
            sessionId,
            board: Array(9).fill(null),
            currentTurn: 'X',
            winner: null,
            winningLine: null,
            playerMarks: { red: 'X', blue: 'O' },
        };

        const session: TttSession = {
            state,
            sockets: { red: socketId, blue: null },
            aiDifficulty: difficulty,
            rematchRequests: { red: false, blue: false },
        };

        this.sessions.set(sessionId, session);
        this.socketToSession.set(socketId, sessionId);

        return session;
    }

    public getSession(sessionId: string): TttSession | undefined {
        return this.sessions.get(sessionId);
    }

    public getSessionBySocket(socketId: string): TttSession | undefined {
        const sessionId = this.socketToSession.get(socketId);
        if (!sessionId) return undefined;
        return this.sessions.get(sessionId);
    }

    public getPlayerColor(socketId: string): PlayerColor | null {
        const session = this.getSessionBySocket(socketId);
        if (!session) return null;
        if (session.sockets.red === socketId) return 'red';
        if (session.sockets.blue === socketId) return 'blue';
        return null;
    }

    public deleteSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        this.socketToSession.delete(session.sockets.red);
        if (session.sockets.blue) this.socketToSession.delete(session.sockets.blue);
        this.sessions.delete(sessionId);
    }

    // ---------------------------------------------------------------
    // Move handling
    // ---------------------------------------------------------------

    public makeMove(
        sessionId: string,
        socketId: string,
        cellIndex: number
    ): { success: boolean; error?: string } {
        const session = this.sessions.get(sessionId);
        if (!session) return { success: false, error: 'Session not found' };

        const { state } = session;
        if (state.winner !== null) return { success: false, error: 'Game is over' };
        if (cellIndex < 0 || cellIndex > 8) return { success: false, error: 'Invalid cell' };
        if (state.board[cellIndex] !== null) return { success: false, error: 'Cell occupied' };

        // Verify it's this player's turn
        const color = this.getPlayerColor(socketId);
        if (!color) return { success: false, error: 'Player not in session' };
        const playerMark = state.playerMarks[color];
        if (playerMark !== state.currentTurn) return { success: false, error: 'Not your turn' };

        // Place the mark
        state.board[cellIndex] = playerMark;

        // Check for win
        const winLine = this.checkWin(state.board, playerMark);
        if (winLine) {
            state.winner = playerMark;
            state.winningLine = winLine;
            return { success: true };
        }

        // Check for draw
        if (state.board.every(c => c !== null)) {
            state.winner = 'draw';
            return { success: true };
        }

        // Switch turn
        state.currentTurn = state.currentTurn === 'X' ? 'O' : 'X';
        return { success: true };
    }

    /**
     * Make a move as AI (for singleplayer mode).
     * The AI's mark is always 'O' (blue).
     */
    public makeAIMove(sessionId: string, cellIndex: number): { success: boolean; error?: string } {
        const session = this.sessions.get(sessionId);
        if (!session || !session.aiDifficulty) return { success: false, error: 'Not an AI session' };

        const { state } = session;
        if (state.winner !== null) return { success: false, error: 'Game is over' };
        if (state.currentTurn !== state.playerMarks.blue) return { success: false, error: 'Not AI turn' };
        if (cellIndex < 0 || cellIndex > 8 || state.board[cellIndex] !== null) {
            return { success: false, error: 'Invalid cell' };
        }

        state.board[cellIndex] = state.playerMarks.blue;

        const winLine = this.checkWin(state.board, state.playerMarks.blue);
        if (winLine) {
            state.winner = state.playerMarks.blue;
            state.winningLine = winLine;
            return { success: true };
        }

        if (state.board.every(c => c !== null)) {
            state.winner = 'draw';
            return { success: true };
        }

        state.currentTurn = state.currentTurn === 'X' ? 'O' : 'X';
        return { success: true };
    }

    // ---------------------------------------------------------------
    // Win detection
    // ---------------------------------------------------------------

    private checkWin(board: TttCell[], mark: TttMark): number[] | null {
        for (const line of WIN_LINES) {
            if (line.every(i => board[i] === mark)) {
                return line;
            }
        }
        return null;
    }

    // ---------------------------------------------------------------
    // Rematch
    // ---------------------------------------------------------------

    public requestRematch(sessionId: string, socketId: string): {
        bothReady: boolean;
        newSession?: TttSession;
    } {
        const session = this.sessions.get(sessionId);
        if (!session) return { bothReady: false };

        const color = this.getPlayerColor(socketId);
        if (!color) return { bothReady: false };

        session.rematchRequests[color] = true;

        // For AI games, auto-accept
        if (session.aiDifficulty !== null) {
            return { bothReady: true, newSession: this.startRematch(session) };
        }

        if (session.rematchRequests.red && session.rematchRequests.blue) {
            return { bothReady: true, newSession: this.startRematch(session) };
        }

        return { bothReady: false };
    }

    private startRematch(oldSession: TttSession): TttSession {
        const oldState = oldSession.state;
        const sessionId = oldState.sessionId;

        // Alternate starting marks: previous O player now gets X
        const newRedMark: TttMark = oldState.playerMarks.red === 'X' ? 'O' : 'X';
        const newBlueMark: TttMark = newRedMark === 'X' ? 'O' : 'X';

        const newState: TttGameState = {
            sessionId,
            board: Array(9).fill(null),
            currentTurn: 'X',
            winner: null,
            winningLine: null,
            playerMarks: { red: newRedMark, blue: newBlueMark },
        };

        oldSession.state = newState;
        oldSession.rematchRequests = { red: false, blue: false };

        return oldSession;
    }

    // ---------------------------------------------------------------
    // Cleanup on disconnect
    // ---------------------------------------------------------------

    public handleDisconnect(socketId: string): { sessionId: string; opponentSocketId: string | null } | null {
        const session = this.getSessionBySocket(socketId);
        if (!session) return null;

        const sessionId = session.state.sessionId;
        const color = this.getPlayerColor(socketId);
        const opponentSocketId = color === 'red' ? session.sockets.blue : session.sockets.red;

        this.deleteSession(sessionId);
        return { sessionId, opponentSocketId };
    }
}
