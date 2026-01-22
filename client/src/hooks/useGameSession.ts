import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import { SOCKET_EVENTS, GameFoundPayload } from '@rps/shared';

/**
 * Hook to handle global game session events and state transitions
 */
export const useGameSession = (socket: Socket) => {
    const setSessionId = useGameStore((state) => state.setSessionId);
    const setPlayerInfo = useGameStore((state) => state.setPlayerInfo);
    const setGamePhase = useGameStore((state) => state.setGamePhase);
    const setIsSearching = useGameStore((state) => state.setIsSearching);

    useEffect(() => {
        const onGameFound = (payload: GameFoundPayload) => {
            console.log('Game found!', payload);
            // Match found -> Stop searching, enter game setup
            setIsSearching(false);
            setSessionId(payload.sessionId);
            setPlayerInfo(socket.id || 'unknown', payload.color);
            setGamePhase('setup');
        };

        const onOpponentDisconnected = () => {
            console.log('Opponent disconnected, re-queuing...');
            // Opponent gone -> Go back to waiting, start searching automatically
            setGamePhase('waiting');
            setIsSearching(true);
            setSessionId('');

            // Re-join queue automatically
            socket.emit(SOCKET_EVENTS.JOIN_QUEUE, {
                playerId: crypto.randomUUID(),
            });
        };

        socket.on(SOCKET_EVENTS.GAME_FOUND, onGameFound);
        socket.on(SOCKET_EVENTS.OPPONENT_DISCONNECTED, onOpponentDisconnected);

        return () => {
            socket.off(SOCKET_EVENTS.GAME_FOUND, onGameFound);
            socket.off(SOCKET_EVENTS.OPPONENT_DISCONNECTED, onOpponentDisconnected);
        };
    }, [socket, setSessionId, setPlayerInfo, setGamePhase, setIsSearching]);
};
