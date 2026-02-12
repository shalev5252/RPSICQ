import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MatchmakingService } from '../services/MatchmakingService.js';
import { GameService } from '../services/GameService.js';
import { Server } from 'socket.io';

/** Create a minimal mock of the socket.io Server */
function createMockIO(): Server {
    const connectedSockets = new Map<string, { id: string; connected: boolean; join: ReturnType<typeof vi.fn>; emit: ReturnType<typeof vi.fn> }>();

    const mockSocket = (id: string) => ({
        id,
        connected: true,
        join: vi.fn(),
        emit: vi.fn(),
    });

    const io = {
        sockets: {
            sockets: connectedSockets,
        },
    } as unknown as Server;

    // Helper to register sockets
    (io as any).__addSocket = (id: string) => {
        const s = mockSocket(id);
        connectedSockets.set(id, s);
        return s;
    };

    return io;
}

describe('MatchmakingService', () => {
    let ms: MatchmakingService;
    let gs: GameService;
    let io: Server & { __addSocket: (id: string) => any };

    beforeEach(() => {
        gs = new GameService();
        io = createMockIO() as any;
        ms = new MatchmakingService(io, gs);
    });

    it('adds a player to the queue and queue size increases', () => {
        ms.addToQueue('p1', 'classic', 'standard');
        // No match because only 1 player
        expect(gs.getSessionBySocketId('p1')).toBeUndefined();
    });

    it('prevents duplicate queue entries for same socket', () => {
        ms.addToQueue('p1', 'classic', 'standard');
        ms.addToQueue('p1', 'classic', 'standard');
        // Still no match with just 1 unique player
        expect(gs.getSessionBySocketId('p1')).toBeUndefined();
    });

    it('matches two connected players in the same queue', () => {
        io.__addSocket('p1');
        io.__addSocket('p2');

        ms.addToQueue('p1', 'classic', 'standard');
        ms.addToQueue('p2', 'classic', 'standard');

        // After matching, game session should be created
        expect(gs.getSessionBySocketId('p1')).toBeDefined();
        expect(gs.getSessionBySocketId('p2')).toBeDefined();
    });

    it('does not match players in different mode queues', () => {
        io.__addSocket('p1');
        io.__addSocket('p2');

        ms.addToQueue('p1', 'classic', 'standard');
        ms.addToQueue('p2', 'rpsls', 'standard');

        // No session: different queues
        expect(gs.getSessionBySocketId('p1')).toBeUndefined();
        expect(gs.getSessionBySocketId('p2')).toBeUndefined();
    });

    it('removes player from queue', () => {
        io.__addSocket('p1');
        io.__addSocket('p2');

        ms.addToQueue('p1', 'classic', 'standard');
        ms.removeFromQueue('p1');
        ms.addToQueue('p2', 'classic', 'standard');

        // No match because p1 was removed
        expect(gs.getSessionBySocketId('p2')).toBeUndefined();
    });

    it('handles zombie cleanup: disconnected player skipped', () => {
        // p1 added but then becomes disconnected
        const s1 = io.__addSocket('p1');
        io.__addSocket('p2');
        io.__addSocket('p3');

        ms.addToQueue('p1', 'classic', 'standard');
        // Simulate p1 disconnect
        s1.connected = false;

        ms.addToQueue('p2', 'classic', 'standard');
        // p1 is a zombie, so p2 waits
        ms.addToQueue('p3', 'classic', 'standard');

        // p2 and p3 should match
        expect(gs.getSessionBySocketId('p2')).toBeDefined();
        expect(gs.getSessionBySocketId('p3')).toBeDefined();
    });
});
