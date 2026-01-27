import { useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import { SOCKET_EVENTS, GameFoundPayload, SetupStatePayload, GameStartPayload } from '@rps/shared';

/**
 * Hook to handle global game session events and state transitions
 */
export const useGameSession = (socket: Socket) => {
    const setSessionId = useGameStore((state) => state.setSessionId);
    const setPlayerInfo = useGameStore((state) => state.setPlayerInfo);
    const setGamePhase = useGameStore((state) => state.setGamePhase);
    const setIsSearching = useGameStore((state) => state.setIsSearching);
    const setSetupState = useGameStore((state) => state.setSetupState);
    const reset = useGameStore((state) => state.reset);

    useEffect(() => {
        const onGameFound = (payload: GameFoundPayload) => {
            console.log('Game found!', payload);
            // Match found -> Stop searching, enter game setup
            setIsSearching(false);
            setSessionId(payload.sessionId);
            setPlayerInfo(socket.id || 'unknown', payload.color);
            setGamePhase('setup');
        };

        const onSetupState = (payload: SetupStatePayload) => {
            console.log('Setup state received:', payload);
            setSetupState({
                board: payload.board,
                hasPlacedKingPit: payload.hasPlacedKingPit,
                hasShuffled: payload.hasShuffled,
                isReady: payload.isReady,
                opponentReady: payload.opponentReady,
            });
        };

        const onOpponentReady = () => {
            console.log('Opponent is ready!');
            setSetupState({ opponentReady: true });
        };

        const onGameStart = (payload: GameStartPayload) => {
            console.log('Game starting!', payload);
            setGamePhase('playing');
            // TODO: Set full game state when playing phase is implemented
        };

        const onOpponentDisconnected = () => {
            console.log('Opponent disconnected, re-queuing...');
            // Reset setup state
            reset();
            // Go back to waiting, start searching automatically
            setGamePhase('waiting');
            setIsSearching(true);

            // Re-join queue automatically
            socket.emit(SOCKET_EVENTS.JOIN_QUEUE, {
                playerId: crypto.randomUUID(),
            });
        };

        socket.on(SOCKET_EVENTS.GAME_FOUND, onGameFound);
        socket.on(SOCKET_EVENTS.SETUP_STATE, onSetupState);
        socket.on(SOCKET_EVENTS.OPPONENT_READY, onOpponentReady);
        socket.on(SOCKET_EVENTS.GAME_START, onGameStart);
        socket.on(SOCKET_EVENTS.OPPONENT_DISCONNECTED, onOpponentDisconnected);

        return () => {
            socket.off(SOCKET_EVENTS.GAME_FOUND, onGameFound);
            socket.off(SOCKET_EVENTS.SETUP_STATE, onSetupState);
            socket.off(SOCKET_EVENTS.OPPONENT_READY, onOpponentReady);
            socket.off(SOCKET_EVENTS.GAME_START, onGameStart);
            socket.off(SOCKET_EVENTS.OPPONENT_DISCONNECTED, onOpponentDisconnected);
        };
    }, [socket, setSessionId, setPlayerInfo, setGamePhase, setIsSearching, setSetupState, reset]);
};
