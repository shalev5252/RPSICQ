import { create } from 'zustand';
import type { PlayerColor, GamePhase, PlayerGameView } from '@rps/shared';

interface GameStore {
    connectionStatus: 'connecting' | 'connected' | 'disconnected';
    setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected') => void;
    playerId: string | null;
    myColor: PlayerColor | null;
    setPlayerInfo: (playerId: string, color: PlayerColor) => void;
    sessionId: string | null;
    gamePhase: GamePhase;
    gameView: PlayerGameView | null;
    setSessionId: (sessionId: string) => void;
    setGamePhase: (phase: GamePhase) => void;
    setGameView: (view: PlayerGameView) => void;
    reset: () => void;
}

const initialState = {
    connectionStatus: 'connecting' as const,
    playerId: null,
    myColor: null,
    sessionId: null,
    gamePhase: 'waiting' as GamePhase,
    gameView: null,
};

export const useGameStore = create<GameStore>((set) => ({
    ...initialState,
    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setPlayerInfo: (playerId, color) => set({ playerId, myColor: color }),
    setSessionId: (sessionId) => set({ sessionId }),
    setGamePhase: (phase) => set({ gamePhase: phase }),
    setGameView: (view) => set({ gameView: view }),
    reset: () => set(initialState),
}));
