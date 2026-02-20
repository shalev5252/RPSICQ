import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '@rps/shared';
import type { ThirdEyePickPayload } from '@rps/shared';
import { ThirdEyeGameService } from '../services/ThirdEyeGameService.js';

const thirdEyeService = new ThirdEyeGameService();
const ROUND_RESULT_DELAY_MS = 3_500; // Pause between rounds

export { thirdEyeService };

export function setupThirdEyeHandlers(io: Server, socket: Socket): void {

    // ----- Player picks a number -----
    socket.on(SOCKET_EVENTS.TE_PICK_NUMBER, (data: ThirdEyePickPayload) => {
        const session = thirdEyeService.getSessionBySocket(socket.id);
        if (!session) return;

        const num = data?.number;
        if (typeof num !== 'number') {
            socket.emit(SOCKET_EVENTS.ERROR, { code: 'INVALID_PICK', message: 'number required' });
            return;
        }

        const result = thirdEyeService.submitPick(session.sessionId, socket.id, num);
        if (!result.success) {
            socket.emit(SOCKET_EVENTS.ERROR, { code: 'INVALID_PICK', message: result.error || 'Invalid pick' });
            return;
        }

        // Confirm to the player that their pick was received
        socket.emit(SOCKET_EVENTS.TE_PICK_CONFIRMED, { number: num });

        // If both submitted, resolve immediately
        if (result.bothSubmitted) {
            resolveAndEmit(io, session.sessionId);
        }
    });

    // ----- Rematch -----
    socket.on(SOCKET_EVENTS.TE_REMATCH, () => {
        const session = thirdEyeService.getSessionBySocket(socket.id);
        if (!session) return;

        const result = thirdEyeService.requestRematch(session.sessionId, socket.id);

        if (result.bothReady) {
            // Start new match — emit first round to both
            io.to(session.sessionId).emit(SOCKET_EVENTS.TE_REMATCH_ACCEPTED);
            startRound(io, session.sessionId);
        } else {
            // Notify opponent
            const color = thirdEyeService.getPlayerColor(socket.id);
            const opponentSocketId = color === 'red' ? session.sockets.blue : session.sockets.red;
            if (opponentSocketId) {
                io.to(opponentSocketId).emit(SOCKET_EVENTS.TE_REMATCH_REQUESTED);
            }
        }
    });

    // ----- Disconnect -----
    socket.on('disconnect', () => {
        const result = thirdEyeService.handleDisconnect(socket.id);
        if (result && result.opponentSocketId) {
            io.to(result.opponentSocketId).emit(SOCKET_EVENTS.TE_GAME_OVER, {
                winner: 'disconnect',
                finalScores: { red: 0, blue: 0 },
            });
        }
    });
}

// ---------------------------------------------------------------
// Round lifecycle helpers
// ---------------------------------------------------------------

export function startRound(io: Server, sessionId: string): void {
    const roundData = thirdEyeService.startRound(sessionId);
    if (!roundData) return;

    // Emit round start to both players
    io.to(sessionId).emit(SOCKET_EVENTS.TE_ROUND_START, roundData);

    // Start the server-side timer
    thirdEyeService.startTimer(
        sessionId,
        // onTick
        (timeRemainingMs) => {
            io.to(sessionId).emit(SOCKET_EVENTS.TE_TIMER, { timeRemainingMs });
        },
        // onTimeout
        () => {
            resolveAndEmit(io, sessionId);
        },
    );
}

function resolveAndEmit(io: Server, sessionId: string): void {
    const result = thirdEyeService.resolveRound(sessionId);
    if (!result) return;

    // Emit round result
    io.to(sessionId).emit(SOCKET_EVENTS.TE_ROUND_RESULT, {
        luckyNumber: result.luckyNumber,
        picks: result.picks,
        distances: result.distances,
        roundWinner: result.roundWinner,
        scores: result.scores,
    });

    if (result.matchOver && result.matchWinner) {
        // Emit game over after a brief delay so players can see the last round result
        setTimeout(() => {
            io.to(sessionId).emit(SOCKET_EVENTS.TE_GAME_OVER, {
                winner: result.matchWinner,
                finalScores: result.scores,
            });
        }, ROUND_RESULT_DELAY_MS);
    } else {
        // Start next round after delay
        setTimeout(() => {
            startRound(io, sessionId);
        }, ROUND_RESULT_DELAY_MS);
    }
}
