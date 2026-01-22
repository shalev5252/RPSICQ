import { GameState, GamePhase, PlayerColor, PlayerState, Cell, BOARD_ROWS, BOARD_COLS, Piece } from '@rps/shared';

export class GameService {
    private sessions: Map<string, GameState> = new Map();
    private playerSessionMap: Map<string, string> = new Map(); // socketId -> sessionId

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
            socketId: player1Id, // Using socketId as playerId for now
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
            currentTurn: null, // No turn during setup
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

        console.log(`📝 Session ${id} created and stored.`);
        return gameState;
    }

    public getSession(sessionId: string): GameState | undefined {
        return this.sessions.get(sessionId);
    }

    public removeSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (session) {
            // Clean up player mappings
            if (session.players.red) this.playerSessionMap.delete(session.players.red.socketId);
            if (session.players.blue) this.playerSessionMap.delete(session.players.blue.socketId);

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
