import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { createServer, Server as HttpServer } from 'http';
import { Server as IOServer } from 'socket.io';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';
import { setupSocketHandlers } from '../../socket/handlers.js';
import { SOCKET_EVENTS, RED_SETUP_ROWS, BLUE_SETUP_ROWS } from '@rps/shared';

/**
 * Socket.IO integration tests: spin up a real server, connect two clients,
 * and validate the full event flow for multiplayer games.
 */

let httpServer: HttpServer;
let ioServer: IOServer;
let port: number;

function createClient(playerId?: string): ClientSocket {
    return ioClient(`http://localhost:${port}`, {
        transports: ['websocket'],
        forceNew: true,
        auth: playerId ? { playerId } : undefined,
    });
}

/** Wait for a specific event from a socket, with timeout */
function waitFor<T = any>(socket: ClientSocket, event: string, timeoutMs = 5000): Promise<T> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`Timeout waiting for "${event}"`)), timeoutMs);
        socket.once(event, (data: T) => {
            clearTimeout(timer);
            resolve(data);
        });
    });
}

/** Wait for socket connection */
function waitForConnect(socket: ClientSocket): Promise<void> {
    return new Promise((resolve, reject) => {
        if (socket.connected) return resolve();
        const timer = setTimeout(() => reject(new Error('Connection timeout')), 5000);
        socket.on('connect', () => { clearTimeout(timer); resolve(); });
    });
}

beforeAll(async () => {
    httpServer = createServer();
    ioServer = new IOServer(httpServer, {
        cors: { origin: '*' },
        transports: ['websocket'],
    });
    setupSocketHandlers(ioServer);

    await new Promise<void>((resolve) => {
        httpServer.listen(0, () => {
            const addr = httpServer.address();
            port = typeof addr === 'object' && addr ? addr.port : 0;
            resolve();
        });
    });
});

afterAll(() => {
    ioServer.close();
    httpServer.close();
});

describe('Socket.IO Integration', () => {
    let p1: ClientSocket;
    let p2: ClientSocket;

    afterEach(() => {
        p1?.disconnect();
        p2?.disconnect();
    });

    it('full multiplayer flow: queue → match → setup → play', async () => {
        p1 = createClient('int-player-1');
        p2 = createClient('int-player-2');

        await Promise.all([waitForConnect(p1), waitForConnect(p2)]);

        // Both join queue
        const gameFoundP1 = waitFor(p1, SOCKET_EVENTS.GAME_FOUND);
        const gameFoundP2 = waitFor(p2, SOCKET_EVENTS.GAME_FOUND);

        p1.emit(SOCKET_EVENTS.JOIN_QUEUE, { gameMode: 'classic', gameVariant: 'standard' });
        p2.emit(SOCKET_EVENTS.JOIN_QUEUE, { gameMode: 'classic', gameVariant: 'standard' });

        const [gf1, gf2] = await Promise.all([gameFoundP1, gameFoundP2]);
        expect(gf1.sessionId).toBeDefined();
        expect(gf2.sessionId).toBeDefined();
        expect(gf1.sessionId).toBe(gf2.sessionId);

        // Both should have colors
        expect(gf1.color).toMatch(/^(red|blue)$/);
        expect(gf2.color).toMatch(/^(red|blue)$/);
        expect(gf1.color).not.toBe(gf2.color);

        // Determine which socket is red and which is blue
        const [red, blue] = gf1.color === 'red' ? [p1, p2] : [p2, p1];

        // Setup: place king and pit
        const setupRed = waitFor(red, SOCKET_EVENTS.SETUP_STATE);
        red.emit(SOCKET_EVENTS.PLACE_KING_PIT, {
            kingPosition: { row: RED_SETUP_ROWS[0], col: 0 },
            pitPosition: { row: RED_SETUP_ROWS[0], col: 1 },
        });
        await setupRed;

        const setupBlue = waitFor(blue, SOCKET_EVENTS.SETUP_STATE);
        blue.emit(SOCKET_EVENTS.PLACE_KING_PIT, {
            kingPosition: { row: BLUE_SETUP_ROWS[0], col: 0 },
            pitPosition: { row: BLUE_SETUP_ROWS[0], col: 1 },
        });
        await setupBlue;

        // Randomize
        const randRed = waitFor(red, SOCKET_EVENTS.SETUP_STATE);
        red.emit(SOCKET_EVENTS.RANDOMIZE_PIECES);
        await randRed;

        const randBlue = waitFor(blue, SOCKET_EVENTS.SETUP_STATE);
        blue.emit(SOCKET_EVENTS.RANDOMIZE_PIECES);
        await randBlue;

        // Confirm setup — both
        const confirmP1 = waitFor(red, SOCKET_EVENTS.SETUP_STATE);
        red.emit(SOCKET_EVENTS.CONFIRM_SETUP);
        await confirmP1;

        // When blue confirms, game should start
        const gameStartRed = waitFor(red, SOCKET_EVENTS.GAME_START);
        const gameStartBlue = waitFor(blue, SOCKET_EVENTS.GAME_START);
        blue.emit(SOCKET_EVENTS.CONFIRM_SETUP);

        const [gsRed, gsBlue] = await Promise.all([gameStartRed, gameStartBlue]);
        expect(gsRed).toBeDefined();
        expect(gsBlue).toBeDefined();
    }, 15000);

    it('forfeit flow: forfeit → game_over', async () => {
        p1 = createClient('forf-player-1');
        p2 = createClient('forf-player-2');

        await Promise.all([waitForConnect(p1), waitForConnect(p2)]);

        const gameFoundP1 = waitFor(p1, SOCKET_EVENTS.GAME_FOUND);
        const gameFoundP2 = waitFor(p2, SOCKET_EVENTS.GAME_FOUND);

        p1.emit(SOCKET_EVENTS.JOIN_QUEUE, { gameMode: 'classic', gameVariant: 'standard' });
        p2.emit(SOCKET_EVENTS.JOIN_QUEUE, { gameMode: 'classic', gameVariant: 'standard' });

        await Promise.all([gameFoundP1, gameFoundP2]);

        // p1 forfeits
        const gameOverP1 = waitFor(p1, SOCKET_EVENTS.GAME_OVER);
        const gameOverP2 = waitFor(p2, SOCKET_EVENTS.GAME_OVER);

        p1.emit(SOCKET_EVENTS.FORFEIT_GAME);

        const [go1, go2] = await Promise.all([gameOverP1, gameOverP2]);
        expect(go1.reason).toBe('forfeit');
        expect(go2.reason).toBe('forfeit');
    }, 10000);

    it('room flow: create → join → game found', async () => {
        p1 = createClient('room-player-1');
        p2 = createClient('room-player-2');

        await Promise.all([waitForConnect(p1), waitForConnect(p2)]);

        // Create room
        const roomCreated = waitFor(p1, SOCKET_EVENTS.ROOM_CREATED);
        p1.emit(SOCKET_EVENTS.CREATE_ROOM, { gameMode: 'classic', gameVariant: 'standard' });
        const roomData = await roomCreated;
        expect(roomData.roomCode).toBeDefined();

        // Join room
        const gameFoundP1 = waitFor(p1, SOCKET_EVENTS.GAME_FOUND);
        const gameFoundP2 = waitFor(p2, SOCKET_EVENTS.GAME_FOUND);
        p2.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode: roomData.roomCode });

        const [gf1, gf2] = await Promise.all([gameFoundP1, gameFoundP2]);
        expect(gf1.sessionId).toBe(gf2.sessionId);
    }, 10000);
});
