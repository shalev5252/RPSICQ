import { Socket, Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { PlayerRole, SOCKET_EVENTS } from '@rps/shared';
import { GameService } from './GameService.js';

interface QueueEntry {
    socketId: string;
    userId: string; // For future user auth usage, currently just socketId
    joinedAt: number;
}

export class MatchmakingService {
    private queue: QueueEntry[] = [];
    private io: Server;
    private gameService: GameService;

    constructor(io: Server, gameService: GameService) {
        this.io = io;
        this.gameService = gameService;
    }

    /**
     * Adds a player to the matchmaking queue
     */
    public addToQueue(socketId: string): void {
        // Prevent duplicate entries
        if (this.queue.some(entry => entry.socketId === socketId)) {
            return;
        }

        console.log(`📥 Added player ${socketId} to matchmaking queue`);
        this.queue.push({
            socketId,
            userId: socketId,
            joinedAt: Date.now()
        });

        // Try to find a match immediately
        this.tryMatch();
    }

    /**
     * Removes a player from the matchmaking queue
     */
    public removeFromQueue(socketId: string): void {
        const index = this.queue.findIndex(entry => entry.socketId === socketId);
        if (index !== -1) {
            console.log(`📤 Removed player ${socketId} from matchmaking queue`);
            this.queue.splice(index, 1);
        }
    }

    /**
     * Attempts to pair 2 players from the queue
     * Logic is synchronous to avoid race conditions
     */
    public tryMatch(): void {
        // Need at least 2 players
        if (this.queue.length < 2) {
            return;
        }

        // Get the first player
        const player1Entry = this.queue.shift();
        if (!player1Entry) return;

        // Lazy validation: Check if player 1 is still connected
        const socket1 = this.io.sockets.sockets.get(player1Entry.socketId);
        if (!socket1 || !socket1.connected) {
            console.log(`⚠️ Player ${player1Entry.socketId} disconnected while in queue (zombie cleanup)`);
            // Recursive call to try next match since we just removed a zombie
            return this.tryMatch();
        }

        // Get the second player
        const player2Entry = this.queue.shift();
        if (!player2Entry) {
            // Put player 1 back at HEAD of queue if no second player found (shouldn't happen with length check but good for safety)
            this.queue.unshift(player1Entry);
            return;
        }

        // Lazy validation: Check if player 2 is still connected
        const socket2 = this.io.sockets.sockets.get(player2Entry.socketId);
        if (!socket2 || !socket2.connected) {
            console.log(`⚠️ Player ${player2Entry.socketId} disconnected while in queue (zombie cleanup)`);
            // Put player 1 back at HEAD (priority) and retry
            this.queue.unshift(player1Entry);
            return this.tryMatch();
        }

        // --- MATCH FOUND ---
        this.createMatch(socket1, socket2);
    }

    private createMatch(socket1: Socket, socket2: Socket): void {
        const sessionId = uuidv4();

        // Randomly assign roles
        const isRedFirst = Math.random() < 0.5;
        const p1Role: PlayerRole = isRedFirst ? 'red' : 'blue';
        const p2Role: PlayerRole = isRedFirst ? 'blue' : 'red';

        console.log(`⚔️ Match found! Session: ${sessionId} | ${socket1.id} (${p1Role}) vs ${socket2.id} (${p2Role})`);

        // Create and store the session
        this.gameService.createSession(sessionId, socket1.id, p1Role, socket2.id, p2Role);

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
