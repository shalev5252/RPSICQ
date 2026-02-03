import { useCallback } from 'react';
import { socket } from '../socket';
import { useGameStore } from '../store/gameStore';
import { SOCKET_EVENTS, GameMode, GameVariant } from '@rps/shared';

export const useMatchmaking = () => {
    const isSearching = useGameStore((state) => state.isSearching);
    const setIsSearching = useGameStore((state) => state.setIsSearching);

    const joinQueue = useCallback((gameMode: GameMode = 'classic', gameVariant: GameVariant = 'standard') => {
        setIsSearching(true);
        socket.emit(SOCKET_EVENTS.JOIN_QUEUE, { gameMode, gameVariant });
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


