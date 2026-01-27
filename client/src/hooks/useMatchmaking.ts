import { useCallback } from 'react';
import { socket } from '../socket';
import { useGameStore } from '../store/gameStore';
import { SOCKET_EVENTS, GameMode } from '@rps/shared';

export const useMatchmaking = () => {
    const isSearching = useGameStore((state) => state.isSearching);
    const setIsSearching = useGameStore((state) => state.setIsSearching);

    const joinQueue = useCallback((gameMode: GameMode = 'classic') => {
        setIsSearching(true);
        socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { gameMode });
    }, [setIsSearching]);

    const leaveQueue = useCallback(() => {
        setIsSearching(false);
        socket.emit(SOCKET_EVENTS.LEAVE_QUEUE);
    }, [setIsSearching]);

    return {
        isSearching,
        joinQueue,
        leaveQueue
    };
};


