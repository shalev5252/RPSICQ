import React, { useEffect } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { SOCKET_EVENTS } from '@rps/shared';
import { ThirdEyeGameScreen } from './ThirdEyeGameScreen';

/**
 * Third Eye is multiplayer-only, so the flow is simple:
 * 1. Join matchmaking queue
 * 2. Show game screen (which handles waiting)
 */
export const ThirdEyeFlow: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { socket } = useSocket();

    useEffect(() => {
        if (!socket) return;

        socket.emit(SOCKET_EVENTS.JOIN_QUEUE, {
            playerId: socket.id,
            gameMode: 'third-eye',
        });

        return () => {
            socket.emit(SOCKET_EVENTS.LEAVE_QUEUE);
        };
    }, [socket]);

    return <ThirdEyeGameScreen onBack={onBack} />;
};
