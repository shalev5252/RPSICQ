import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socket as socketInstance } from '../socket'; // Import singleton
import { useGameStore } from '../store/gameStore';
import {
    SOCKET_EVENTS,
    GameFoundPayload,
    GameStartPayload,
    ErrorPayload,
    SetupStatePayload,
} from '@rps/shared';


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

        const onDisconnect = (reason: string) => {
            console.log('❌ Disconnected from server:', reason);
            setIsConnected(false);
            setConnectionStatus('disconnected');
        };

        const onConnectError = (error: Error) => {
            console.error('🔴 Connection error:', error.message);
            setConnectionStatus('disconnected');
        };

        const onGameFound = (payload: GameFoundPayload) => {
            console.log('🎮 Game found:', payload);
        };

        const onGameStart = (payload: GameStartPayload) => {
            console.log('🚀 Game started:', payload);
            // Transition to playing phase
            useGameStore.getState().setGamePhase('playing');
            // Set initial game state
            const myColor = useGameStore.getState().myColor;
            if (payload.gameState && myColor) {
                useGameStore.getState().setGameState({
                    board: payload.gameState.board as any, // Server sends full board, client will filter
                    currentTurn: payload.gameState.currentTurn,
                    phase: payload.gameState.phase,
                    isMyTurn: payload.gameState.currentTurn === myColor
                });
            }
        };

        const onGameState = (payload: { board: any; currentTurn: any; phase: string; isMyTurn: boolean }) => {
            console.log('📊 Game state update:', payload);
            // Update game state in store
            useGameStore.getState().setGameState(payload);
            // Always update game phase to stay in sync with server
            useGameStore.getState().setGamePhase(payload.phase as 'waiting' | 'setup' | 'playing' | 'tie_breaker' | 'finished');
        };

        const onError = (payload: ErrorPayload) => {
            console.error('❌ Server error:', payload);
        };

        const onGameOver = (payload: { winner: any; reason: string }) => {
            console.log('🏁 Game Over:', payload);
            useGameStore.getState().setGamePhase('finished');
            useGameStore.getState().setGameState({
                board: useGameStore.getState().gameState?.board || [],
                currentTurn: null,
                phase: 'finished',
                isMyTurn: false,
                winner: payload.winner
            });
        };

        const onRematchRequested = () => {
            console.log('🔄 Opponent requested rematch');
            useGameStore.getState().setRematchState({ opponentRequested: true });
        };

        const onRematchAccepted = (payload: { setupState: SetupStatePayload }) => {
            console.log('🔄 Rematch accepted, resetting game');
            // Reset for rematch and update setup state
            useGameStore.getState().resetForRematch();
            if (payload.setupState) {
                useGameStore.getState().setSetupState({
                    board: payload.setupState.board,
                    hasPlacedKingPit: payload.setupState.hasPlacedKingPit,
                    hasShuffled: payload.setupState.hasShuffled,
                    isReady: payload.setupState.isReady,
                    opponentReady: payload.setupState.opponentReady,
                });
            }
        };

        const onTieBreakerRetry = () => {
            console.log('🔄 Tie-breaker tied again, retrying');
            useGameStore.getState().incrementTieBreakerRetry();
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);
        socket.on(SOCKET_EVENTS.GAME_FOUND, onGameFound);
        socket.on(SOCKET_EVENTS.GAME_START, onGameStart);
        socket.on(SOCKET_EVENTS.GAME_STATE, onGameState);
        socket.on(SOCKET_EVENTS.GAME_OVER, onGameOver);
        socket.on(SOCKET_EVENTS.REMATCH_REQUESTED, onRematchRequested);
        socket.on(SOCKET_EVENTS.REMATCH_ACCEPTED, onRematchAccepted);
        socket.on(SOCKET_EVENTS.TIE_BREAKER_RETRY, onTieBreakerRetry);
        socket.on(SOCKET_EVENTS.ERROR, onError);

        // Sync state immediately if socket is already connected (handles race condition on mount)
        if (socket.connected) {
            setIsConnected(true);
            setConnectionStatus('connected');
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            socket.off(SOCKET_EVENTS.GAME_FOUND, onGameFound);
            socket.off(SOCKET_EVENTS.GAME_START, onGameStart);
            socket.off(SOCKET_EVENTS.GAME_STATE, onGameState);
            socket.off(SOCKET_EVENTS.GAME_OVER, onGameOver);
            socket.off(SOCKET_EVENTS.REMATCH_REQUESTED, onRematchRequested);
            socket.off(SOCKET_EVENTS.REMATCH_ACCEPTED, onRematchAccepted);
            socket.off(SOCKET_EVENTS.TIE_BREAKER_RETRY, onTieBreakerRetry);
            socket.off(SOCKET_EVENTS.ERROR, onError);
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
