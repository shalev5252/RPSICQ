import { Socket, Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { PlayerRole, SOCKET_EVENTS, GameMode } from '@rps/shared';
import { GameService } from './GameService.js';

interface QueueEntry {
    socketId: string;
    userId: string; // For future user auth usage, currently just socketId
    joinedAt: number;
}

export class MatchmakingService {
    private queues: Map<GameMode, QueueEntry[]> = new Map();
    private io: Server;
    private gameService: GameService;

    constructor(io: Server, gameService: GameService) {
        this.io = io;
        this.gameService = gameService;
        this.queues.set('classic', []);
        this.queues.set('rpsls', []);
    }

    /**
     * Adds a player to the matchmaking queue
     */
    public addToQueue(socketId: string, gameMode: GameMode = 'classic'): void {
        const queue = this.queues.get(gameMode);
        if (!queue) return;

        // Prevent duplicate entries across all queues
        for (const q of this.queues.values()) {
            if (q.some(entry => entry.socketId === socketId)) {
                return;
            }
        }

        console.log(`📥 Added player ${socketId} to ${gameMode} matchmaking queue`);
        queue.push({
            socketId,
            userId: socketId,
            joinedAt: Date.now()
        });

        // Try to find a match immediately in this specific queue
        this.tryMatch(gameMode);
    }

    /**
     * Removes a player from the matchmaking queue
     */
    public removeFromQueue(socketId: string): void {
        for (const [mode, queue] of this.queues.entries()) {
            const index = queue.findIndex(entry => entry.socketId === socketId);
            if (index !== -1) {
                console.log(`📤 Removed player ${socketId} from ${mode} matchmaking queue`);
                queue.splice(index, 1);
                return; // Player can only be in one queue
            }
        }
    }

    /**
     * Attempts to pair 2 players from the queue
     * Logic is synchronous to avoid race conditions
     */
    public tryMatch(gameMode: GameMode): void {
        const queue = this.queues.get(gameMode);
        if (!queue) return;

        // Need at least 2 players
        if (queue.length < 2) {
            return;
        }

        // Get the first player
        const player1Entry = queue.shift();
        if (!player1Entry) return;

        // Lazy validation: Check if player 1 is still connected
        const socket1 = this.io.sockets.sockets.get(player1Entry.socketId);
        if (!socket1 || !socket1.connected) {
            console.log(`⚠️ Player ${player1Entry.socketId} disconnected while in queue (zombie cleanup)`);
            // Recursive call to try next match since we just removed a zombie
            this.tryMatch(gameMode);
            return;
        }

        // Get the second player
        const player2Entry = queue.shift();
        if (!player2Entry) {
            // Put player 1 back at HEAD of queue if no second player found (shouldn't happen with length check but good for safety)
            queue.unshift(player1Entry);
            return;
        }

        // Lazy validation: Check if player 2 is still connected
        const socket2 = this.io.sockets.sockets.get(player2Entry.socketId);
        if (!socket2 || !socket2.connected) {
            console.log(`⚠️ Player ${player2Entry.socketId} disconnected while in queue (zombie cleanup)`);
            // Put player 1 back at HEAD (priority) and retry
            queue.unshift(player1Entry);
            this.tryMatch(gameMode);
            return;
        }

        // --- MATCH FOUND ---
        this.createMatch(socket1, socket2, gameMode);
    }

    private createMatch(socket1: Socket, socket2: Socket, gameMode: GameMode): void {
        const sessionId = uuidv4();

        // Randomly assign roles
        const isRedFirst = Math.random() < 0.5;
        const p1Role: PlayerRole = isRedFirst ? 'red' : 'blue';
        const p2Role: PlayerRole = isRedFirst ? 'blue' : 'red';

        console.log(`⚔️ Match found! Session: ${sessionId} | ${socket1.id} (${p1Role}) vs ${socket2.id} (${p2Role}) [Mode: ${gameMode}]`);

        // Create and store the session
        this.gameService.createSession(sessionId, socket1.id, p1Role, socket2.id, p2Role, gameMode);

        // Join both to a socket.io room
        socket1.join(sessionId);
        socket2.join(sessionId);

        // Notify players
        socket1.emit(SOCKET_EVENTS.GAME_FOUND, {
            sessionId,
            color: p1Role
        });

        socket2.emit(SOCKET_EVENTS.GAME_FOUND, {
            sessionId,
            color: p2Role
        });
    }
}
