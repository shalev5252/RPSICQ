import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@rps/shared';
import type { TttMovePayload, TttStartSingleplayerPayload, TttDifficulty } from '@rps/shared';
import { TttGameService } from '../services/TttGameService.js';
import { TttAI } from '../services/TttAI.js';

// Shared service instances (one per server)
const tttService = new TttGameService();
const tttAI = new TttAI();

const AI_DELAY_MS = 600; // Visual delay for AI moves

export { tttService };

export function setupTttHandlers(io: Server, socket: Socket): void {

    // ----- Singleplayer: start game vs AI -----
    socket.on(SOCKET_EVENTS.TTT_START_SINGLEPLAYER, (data: TttStartSingleplayerPayload) => {
        const difficulty = data?.difficulty as TttDifficulty;
        if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
            socket.emit(SOCKET_EVENTS.ERROR, { code: 'INVALID_DIFFICULTY', message: 'Invalid difficulty' });
            return;
        }

        // Clean up any existing TTT session for this socket
        const existing = tttService.getSessionBySocket(socket.id);
        if (existing) tttService.deleteSession(existing.state.sessionId);

        const session = tttService.createSingleplayerSession(socket.id, difficulty);
        const { state } = session;

        socket.emit(SOCKET_EVENTS.TTT_GAME_START, {
            sessionId: state.sessionId,
            mark: state.playerMarks.red,   // Human is always red
            board: state.board,
            currentTurn: state.currentTurn,
        });

        console.log(`🎮 TTT singleplayer started: ${state.sessionId} (${difficulty})`);
    });

    // ----- Place a mark -----
    socket.on(SOCKET_EVENTS.TTT_MOVE, (data: TttMovePayload) => {
        const session = tttService.getSessionBySocket(socket.id);
        if (!session) {
            socket.emit(SOCKET_EVENTS.ERROR, { code: 'NO_SESSION', message: 'No TTT session found' });
            return;
        }

        const cellIndex = data?.cellIndex;
        if (typeof cellIndex !== 'number') {
            socket.emit(SOCKET_EVENTS.ERROR, { code: 'INVALID_MOVE', message: 'cellIndex required' });
            return;
        }

        const result = tttService.makeMove(session.state.sessionId, socket.id, cellIndex);
        if (!result.success) {
            socket.emit(SOCKET_EVENTS.ERROR, { code: 'INVALID_MOVE', message: result.error || 'Invalid move' });
            return;
        }

        const { state } = session;

        // Broadcast state to all players in session
        if (state.winner !== null) {
            // Game over
            const payload = {
                winner: state.winner,
                winningLine: state.winningLine,
                board: state.board,
            };
            if (session.sockets.blue) {
                io.to(session.state.sessionId).emit(SOCKET_EVENTS.TTT_GAME_OVER, payload);
            } else {
                socket.emit(SOCKET_EVENTS.TTT_GAME_OVER, payload);
            }
        } else {
            // Emit updated state
            const statePayload = {
                board: state.board,
                currentTurn: state.currentTurn,
            };
            if (session.sockets.blue) {
                io.to(session.state.sessionId).emit(SOCKET_EVENTS.TTT_STATE, statePayload);
            } else {
                socket.emit(SOCKET_EVENTS.TTT_STATE, statePayload);
            }

            // If singleplayer and it's AI's turn, schedule AI move
            if (session.aiDifficulty && state.currentTurn === state.playerMarks.blue) {
                scheduleAIMove(session, socket);
            }
        }
    });

    // ----- Rematch -----
    socket.on(SOCKET_EVENTS.TTT_REMATCH, () => {
        const session = tttService.getSessionBySocket(socket.id);
        if (!session) return;

        const result = tttService.requestRematch(session.state.sessionId, socket.id);

        if (result.bothReady && result.newSession) {
            const { state } = result.newSession;
            const startPayload = {
                sessionId: state.sessionId,
                board: state.board,
                currentTurn: state.currentTurn,
            };

            if (session.sockets.blue) {
                // Multiplayer: send each player their mark
                const redSocket = io.sockets.sockets.get(session.sockets.red);
                const blueSocket = io.sockets.sockets.get(session.sockets.blue);
                redSocket?.emit(SOCKET_EVENTS.TTT_GAME_START, {
                    ...startPayload,
                    mark: state.playerMarks.red,
                });
                blueSocket?.emit(SOCKET_EVENTS.TTT_GAME_START, {
                    ...startPayload,
                    mark: state.playerMarks.blue,
                });
            } else {
                // Singleplayer
                socket.emit(SOCKET_EVENTS.TTT_GAME_START, {
                    ...startPayload,
                    mark: state.playerMarks.red,
                });

                // If AI goes first in new game, schedule move
                if (state.currentTurn === state.playerMarks.blue && session.aiDifficulty) {
                    scheduleAIMove(session, socket);
                }
            }
        } else {
            // Notify the other player that rematch was requested
            const color = tttService.getPlayerColor(socket.id);
            const opponentSocketId = color === 'red' ? session.sockets.blue : session.sockets.red;
            if (opponentSocketId) {
                io.to(opponentSocketId).emit(SOCKET_EVENTS.TTT_REMATCH_REQUESTED);
            }
        }
    });

    // ----- Disconnect cleanup -----
    socket.on('disconnect', () => {
        const result = tttService.handleDisconnect(socket.id);
        if (result && result.opponentSocketId) {
            io.to(result.opponentSocketId).emit(SOCKET_EVENTS.TTT_GAME_OVER, {
                winner: 'disconnect',
                winningLine: null,
                board: [],
            });
        }
    });
}

// ---------------------------------------------------------------
// AI move scheduling
// ---------------------------------------------------------------

function scheduleAIMove(session: ReturnType<TttGameService['getSession']> & {}, humanSocket: Socket): void {
    if (!session.aiDifficulty) return;

    const { state } = session;
    const aiMark = state.playerMarks.blue;

    setTimeout(() => {
        // Verify session still exists and it's still AI's turn
        const current = tttService.getSession(state.sessionId);
        if (!current || current.state.winner !== null || current.state.currentTurn !== aiMark) return;

        const cellIndex = tttAI.selectMove([...current.state.board], aiMark, session.aiDifficulty!);
        const result = tttService.makeAIMove(state.sessionId, cellIndex);
        if (!result.success) return;

        if (current.state.winner !== null) {
            humanSocket.emit(SOCKET_EVENTS.TTT_GAME_OVER, {
                winner: current.state.winner,
                winningLine: current.state.winningLine,
                board: current.state.board,
            });
        } else {
            humanSocket.emit(SOCKET_EVENTS.TTT_STATE, {
                board: current.state.board,
                currentTurn: current.state.currentTurn,
            });
        }
    }, AI_DELAY_MS);
}
