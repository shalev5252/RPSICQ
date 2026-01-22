import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, JoinQueuePayload, PlaceKingPitPayload, MakeMovePayload, CombatChoicePayload } from '@rps/shared';

export function setupSocketHandlers(io: Server): void {
    io.on('connection', (socket: Socket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        socket.on(SOCKET_EVENTS.JOIN_QUEUE, (_payload: JoinQueuePayload) => {
            console.log(`🎮 Player ${socket.id} joining queue`);
        });

        socket.on(SOCKET_EVENTS.LEAVE_QUEUE, () => {
            console.log(`🚪 Player ${socket.id} leaving queue`);
        });

        socket.on(SOCKET_EVENTS.PLACE_KING_PIT, (_payload: PlaceKingPitPayload) => {
            console.log(`👑 Player ${socket.id} placing King and Pit`);
        });

        socket.on(SOCKET_EVENTS.CONFIRM_SETUP, () => {
            console.log(`✔️ Player ${socket.id} confirmed setup`);
        });

        socket.on(SOCKET_EVENTS.RANDOMIZE_PIECES, () => {
            console.log(`🎲 Player ${socket.id} randomizing pieces`);
        });

        socket.on(SOCKET_EVENTS.MAKE_MOVE, (_payload: MakeMovePayload) => {
            console.log(`♟️ Player ${socket.id} making move`);
        });

        socket.on(SOCKET_EVENTS.COMBAT_CHOICE, (_payload: CombatChoicePayload) => {
            console.log(`⚔️ Player ${socket.id} made combat choice`);
        });

        socket.on(SOCKET_EVENTS.REQUEST_REMATCH, () => {
            console.log(`🔄 Player ${socket.id} requesting rematch`);
        });

        socket.on('disconnect', (reason: string) => {
            console.log(`❌ Client disconnected: ${socket.id} (${reason})`);
        });
    });
}
