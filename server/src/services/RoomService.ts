import { Server } from 'socket.io';
import { GameMode, SOCKET_EVENTS } from '@rps/shared';
import { GameService } from './GameService.js';

interface RoomEntry {
    code: string;
    hostSocketId: string;
    gameMode: GameMode;
    createdAt: number;
    expiryTimer: ReturnType<typeof setTimeout>;
}

const ROOM_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

export class RoomService {
    private rooms: Map<string, RoomEntry> = new Map(); // code → RoomEntry
    private hostToRoom: Map<string, string> = new Map(); // socketId → code
    private io: Server;
    private gameService: GameService;

    constructor(io: Server, gameService: GameService) {
        this.io = io;
        this.gameService = gameService;
    }

    /**
     * Generate a unique 7-digit room code.
     */
    private generateCode(): string {
        const MAX_ATTEMPTS = 100;
        for (let i = 0; i < MAX_ATTEMPTS; i++) {
            const code = String(Math.floor(Math.random() * 10_000_000)).padStart(7, '0');
            if (!this.rooms.has(code)) {
                return code;
            }
        }
        throw new Error('Failed to generate unique room code');
    }

    /**
     * Create a private room. Returns the room code.
     */
    public createRoom(hostSocketId: string, gameMode: GameMode): { success: boolean; roomCode?: string; error?: string } {
        // Prevent creating multiple rooms
        if (this.hostToRoom.has(hostSocketId)) {
            return { success: false, error: 'You already have an active room' };
        }

        try {
            const code = this.generateCode();
            const expiryTimer = setTimeout(() => {
                this.expireRoom(code);
            }, ROOM_EXPIRY_MS);

            const entry: RoomEntry = {
                code,
                hostSocketId,
                gameMode,
                createdAt: Date.now(),
                expiryTimer,
            };

            this.rooms.set(code, entry);
            this.hostToRoom.set(hostSocketId, code);

            console.log(`🏠 Room created: ${code} by ${hostSocketId} (mode: ${gameMode})`);
            return { success: true, roomCode: code };
        } catch {
            return { success: false, error: 'Failed to create room' };
        }
    }

    /**
     * Join an existing room. Returns pairing info on success.
     */
    public joinRoom(joinerSocketId: string, code: string): {
        success: boolean;
        error?: string;
        errorCode?: string;
        hostSocketId?: string;
        gameMode?: GameMode;
    } {
        const room = this.rooms.get(code);

        if (!room) {
            return { success: false, error: 'Room not found', errorCode: 'ROOM_NOT_FOUND' };
        }

        if (room.hostSocketId === joinerSocketId) {
            return { success: false, error: 'Cannot join your own room', errorCode: 'CANNOT_JOIN_OWN_ROOM' };
        }

        // Match found — clean up the room
        const { hostSocketId, gameMode } = room;
        this.removeRoom(code);

        console.log(`🤝 Room ${code} joined by ${joinerSocketId} — pairing with ${hostSocketId}`);
        return { success: true, hostSocketId, gameMode };
    }

    /**
     * Cancel a room created by the given socket.
     */
    public cancelRoom(socketId: string): boolean {
        const code = this.hostToRoom.get(socketId);
        if (!code) return false;
        this.removeRoom(code);
        console.log(`❌ Room ${code} cancelled by ${socketId}`);
        return true;
    }

    /**
     * Clean up any rooms associated with a disconnecting socket.
     */
    public removePlayerRooms(socketId: string): void {
        const code = this.hostToRoom.get(socketId);
        if (code) {
            this.removeRoom(code);
            console.log(`🧹 Room ${code} cleaned up on disconnect of ${socketId}`);
        }
    }

    private expireRoom(code: string): void {
        const room = this.rooms.get(code);
        if (!room) return;

        console.log(`⏰ Room ${code} expired`);

        // Notify the host if still connected
        const hostSocket = this.io.sockets.sockets.get(room.hostSocketId);
        if (hostSocket?.connected) {
            hostSocket.emit(SOCKET_EVENTS.ROOM_EXPIRED);
        }

        this.removeRoom(code);
    }

    private removeRoom(code: string): void {
        const room = this.rooms.get(code);
        if (!room) return;

        clearTimeout(room.expiryTimer);
        this.hostToRoom.delete(room.hostSocketId);
        this.rooms.delete(code);
    }
}
