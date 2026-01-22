import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socket as socketInstance } from '../socket'; // Import singleton
import { useGameStore } from '../store/gameStore';
import { SOCKET_EVENTS } from '@rps/shared';


export function useSocket() {
    const socketRef = useRef<Socket>(socketInstance); // Use singleton
    const [isConnected, setIsConnected] = useState(socketInstance.connected);
    const playerIdRef = useRef<string>(crypto.randomUUID());
    const setConnectionStatus = useGameStore((state) => state.setConnectionStatus);

    useEffect(() => {
        const socket = socketRef.current;

        // Force connection if not connected (optional, but good if autoConnect is false or was disconnected)
        if (!socket.connected) {
            socket.connect();
        }

        const onConnect = () => {
            console.log('✅ Connected to server:', socket.id);
            setIsConnected(true);
            setConnectionStatus('connected');
        };

        const onDisconnect = (reason: any) => {
            console.log('❌ Disconnected from server:', reason);
            setIsConnected(false);
            setConnectionStatus('disconnected');
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);

        // Sync state immediately if socket is already connected (handles race condition on mount)
        if (socket.connected) {
            setIsConnected(true);
            setConnectionStatus('connected');
        }

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
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error');
            socket.off(SOCKET_EVENTS.GAME_FOUND);
            socket.off(SOCKET_EVENTS.GAME_START);
            socket.off(SOCKET_EVENTS.GAME_STATE);
            socket.off(SOCKET_EVENTS.ERROR);
            // Do NOT disconnect base socket on unmount of hook, usually
        };
    }, [setConnectionStatus]);

    const joinQueue = () => {
        socketRef.current?.emit(SOCKET_EVENTS.JOIN_QUEUE, {
            playerId: playerIdRef.current,
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
