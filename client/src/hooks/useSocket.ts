import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import { SOCKET_EVENTS } from '@rps/shared';

const SERVER_URL = 'http://localhost:3001';

export function useSocket() {
    const socketRef = useRef<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const setConnectionStatus = useGameStore((state) => state.setConnectionStatus);

    useEffect(() => {
        const socket = io(SERVER_URL, {
            transports: ['websocket', 'polling'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('✅ Connected to server:', socket.id);
            setIsConnected(true);
            setConnectionStatus('connected');
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from server:', reason);
            setIsConnected(false);
            setConnectionStatus('disconnected');
        });

        socket.on('connect_error', (error) => {
            console.error('🔴 Connection error:', error.message);
            setConnectionStatus('disconnected');
        });

        socket.on(SOCKET_EVENTS.GAME_FOUND, (payload: any) => {
            console.log('🎮 Game found:', payload);
        });

        socket.on(SOCKET_EVENTS.GAME_START, (payload: any) => {
            console.log('🚀 Game started:', payload);
        });

        socket.on(SOCKET_EVENTS.GAME_STATE, (payload: any) => {
            console.log('📊 Game state update:', payload);
        });

        socket.on(SOCKET_EVENTS.ERROR, (payload: any) => {
            console.error('❌ Server error:', payload);
        });

        return () => {
            socket.disconnect();
        };
    }, [setConnectionStatus]);

    const joinQueue = () => {
        socketRef.current?.emit(SOCKET_EVENTS.JOIN_QUEUE, {
            playerId: crypto.randomUUID(),
        });
    };

    const leaveQueue = () => {
        socketRef.current?.emit(SOCKET_EVENTS.LEAVE_QUEUE);
    };

    return {
        socket: socketRef.current,
        isConnected,
        joinQueue,
        leaveQueue,
    };
}
