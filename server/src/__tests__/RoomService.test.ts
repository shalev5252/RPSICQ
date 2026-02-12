import { describe, it, expect, beforeEach } from 'vitest';
import { RoomService } from '../services/RoomService.js';
import { GameService } from '../services/GameService.js';
import { Server } from 'socket.io';

/** Create a minimal mock of the socket.io Server */
function createMockIO(): Server {
    const connectedSockets = new Map<string, any>();
    return {
        sockets: { sockets: connectedSockets },
    } as unknown as Server;
}

describe('RoomService', () => {
    let rs: RoomService;
    let gs: GameService;
    let io: Server;

    beforeEach(() => {
        gs = new GameService();
        io = createMockIO();
        rs = new RoomService(io, gs);
    });

    it('creates a room and returns a code', () => {
        const result = rs.createRoom('p1', 'classic', 'standard');
        expect(result.success).toBe(true);
        expect(result.roomCode).toBeDefined();
        expect(result.roomCode!.length).toBe(7);
    });

    it('joining a room by another player succeeds', () => {
        const createResult = rs.createRoom('p1', 'classic', 'standard');
        const joinResult = rs.joinRoom('p2', createResult.roomCode!);

        expect(joinResult.success).toBe(true);
        expect(joinResult.hostSocketId).toBe('p1');
        expect(joinResult.gameMode).toBe('classic');
    });

    it('creator cannot join their own room', () => {
        const createResult = rs.createRoom('p1', 'classic', 'standard');
        const joinResult = rs.joinRoom('p1', createResult.roomCode!);

        expect(joinResult.success).toBe(false);
        expect(joinResult.errorCode).toBe('CANNOT_JOIN_OWN_ROOM');
    });

    it('joining invalid room code fails', () => {
        const result = rs.joinRoom('p1', 'INVALID');
        expect(result.success).toBe(false);
        expect(result.errorCode).toBe('ROOM_NOT_FOUND');
    });

    it('cancel room removes it', () => {
        const createResult = rs.createRoom('p1', 'classic', 'standard');
        const cancelled = rs.cancelRoom('p1');
        expect(cancelled).toBe(true);

        // Now joining should fail
        const joinResult = rs.joinRoom('p2', createResult.roomCode!);
        expect(joinResult.success).toBe(false);
    });

    it('prevents creating multiple rooms', () => {
        rs.createRoom('p1', 'classic', 'standard');
        const result = rs.createRoom('p1', 'rpsls', 'standard');
        expect(result.success).toBe(false);
        expect(result.error).toContain('already have');
    });
});
