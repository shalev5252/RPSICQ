import { Socket, Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { PlayerRole, SOCKET_EVENTS, GameMode, GameVariant } from '@rps/shared';
import { GameService } from './GameService.js';

// Queue key combines mode and variant
type QueueKey = `${GameMode}` | `${GameMode}-${GameVariant}`;

interface QueueEntry {
    socketId: string;
    userId: string;
    joinedAt: number;
    gameVariant: GameVariant;
}

export class MatchmakingService {
    private queues: Map<QueueKey, QueueEntry[]> = new Map();
    private io: Server;
    private gameService: GameService;

    constructor(io: Server, gameService: GameService) {
        this.io = io;
        this.gameService = gameService;
        // Initialize queues for all mode+variant combinations
        this.queues.set('classic', []);
        this.queues.set('rpsls', []);
        this.queues.set('classic-clearday', []);
        this.queues.set('rpsls-clearday', []);
        this.queues.set('classic-onslaught', []);
        this.queues.set('rpsls-onslaught', []);
        // New game queues (no variants)
        this.queues.set('ttt-classic', []);
        this.queues.set('third-eye', []);
    }

    private getQueueKey(gameMode: GameMode, gameVariant: GameVariant): QueueKey {
        return gameVariant === 'standard' ? gameMode : `${gameMode}-${gameVariant}`;
    }

    /**
     * Adds a player to the matchmaking queue
     */
    public addToQueue(socketId: string, gameMode: GameMode = 'classic', gameVariant: GameVariant = 'standard'): void {
        const queueKey = this.getQueueKey(gameMode, gameVariant);
        const queue = this.queues.get(queueKey);
        if (!queue) return;

        // Prevent duplicate entries across all queues
        for (const q of this.queues.values()) {
            if (q.some(entry => entry.socketId === socketId)) {
                return;
            }
        }

        console.log(`📥 Added player ${socketId} to ${queueKey} matchmaking queue`);
        queue.push({
            socketId,
            userId: socketId,
            joinedAt: Date.now(),
            gameVariant
        });

        // Try to find a match immediately in this specific queue
        this.tryMatch(gameMode, gameVariant);
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
    public tryMatch(gameMode: GameMode, gameVariant: GameVariant = 'standard'): void {
        const queueKey = this.getQueueKey(gameMode, gameVariant);
        const queue = this.queues.get(queueKey);
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
            this.tryMatch(gameMode, gameVariant);
            return;
        }

        // Get the second player
        const player2Entry = queue.shift();
        if (!player2Entry) {
            // Put player 1 back at HEAD of queue if no second player found
            queue.unshift(player1Entry);
            return;
        }

        // Lazy validation: Check if player 2 is still connected
        const socket2 = this.io.sockets.sockets.get(player2Entry.socketId);
        if (!socket2 || !socket2.connected) {
            console.log(`⚠️ Player ${player2Entry.socketId} disconnected while in queue (zombie cleanup)`);
            // Put player 1 back at HEAD (priority) and retry
            queue.unshift(player1Entry);
            this.tryMatch(gameMode, gameVariant);
            return;
        }

        // --- MATCH FOUND ---
        this.createMatch(socket1, socket2, gameMode, gameVariant);
    }

    private createMatch(socket1: Socket, socket2: Socket, gameMode: GameMode, gameVariant: GameVariant): void {
        const sessionId = uuidv4();

        // Randomly assign roles
        const isRedFirst = Math.random() < 0.5;
        const p1Role: PlayerRole = isRedFirst ? 'red' : 'blue';
        const p2Role: PlayerRole = isRedFirst ? 'blue' : 'red';

        const variantSuffix = gameVariant !== 'standard' ? ` [${gameVariant}]` : '';
        console.log(`⚔️ Match found! Session: ${sessionId} | ${socket1.id} (${p1Role}) vs ${socket2.id} (${p2Role}) [Mode: ${gameMode}${variantSuffix}]`);

        // Route to the correct game service based on game mode
        if (gameMode === 'ttt-classic') {
            // TODO: Create TTT session via TttGameService (task 4)
            console.log(`🎮 TTT match created: ${sessionId}`);
            socket1.join(sessionId);
            socket2.join(sessionId);
            socket1.emit(SOCKET_EVENTS.GAME_FOUND, { sessionId, color: p1Role });
            socket2.emit(SOCKET_EVENTS.GAME_FOUND, { sessionId, color: p2Role });
            return;
        }

        if (gameMode === 'third-eye') {
            // TODO: Create Third Eye session via ThirdEyeGameService (task 7)
            console.log(`🔮 Third Eye match created: ${sessionId}`);
            socket1.join(sessionId);
            socket2.join(sessionId);
            socket1.emit(SOCKET_EVENTS.GAME_FOUND, { sessionId, color: p1Role });
            socket2.emit(SOCKET_EVENTS.GAME_FOUND, { sessionId, color: p2Role });
            return;
        }

        // RPS Battle (existing flow)
        // Create and store the session
        this.gameService.createSession(sessionId, socket1.id, p1Role, socket2.id, p2Role, gameMode, gameVariant);

        // Join both to a socket.io room
        socket1.join(sessionId);
        socket2.join(sessionId);

        // Notify players
        socket1.emit(SOCKET_EVENTS.GAME_FOUND, {
            sessionId,
            color: p1Role
        });
        const p1Setup = this.gameService.getPlayerSetupView(socket1.id);
        if (p1Setup) {
            socket1.emit(SOCKET_EVENTS.SETUP_STATE, p1Setup);
        }

        socket2.emit(SOCKET_EVENTS.GAME_FOUND, {
            sessionId,
            color: p2Role
        });
        const p2Setup = this.gameService.getPlayerSetupView(socket2.id);
        if (p2Setup) {
            socket2.emit(SOCKET_EVENTS.SETUP_STATE, p2Setup);
        }
    }
}
