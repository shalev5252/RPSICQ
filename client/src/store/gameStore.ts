import { create } from 'zustand';
import type { PlayerColor, GamePhase, PlayerGameView, PlayerCellView, Position } from '@rps/shared';

interface SetupState {
    board: PlayerCellView[][];
    hasPlacedKingPit: boolean;
    hasShuffled: boolean;
    isReady: boolean;
    opponentReady: boolean;
    kingPosition: Position | null;
    pitPosition: Position | null;
}

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
    isSearching: boolean;
    setIsSearching: (isSearching: boolean) => void;
    // Setup state
    setupState: SetupState;
    setSetupState: (state: Partial<SetupState>) => void;
    setKingPosition: (position: Position | null) => void;
    setPitPosition: (position: Position | null) => void;
    // Game state for playing phase
    gameState: {
        board: PlayerCellView[][];
        currentTurn: PlayerColor | null;
        phase: string;
        isMyTurn: boolean;
    } | null;
    setGameState: (state: { board: PlayerCellView[][]; currentTurn: PlayerColor | null; phase: string; isMyTurn: boolean } | null) => void;
    reset: () => void;
}

const initialSetupState: SetupState = {
    board: [],
    hasPlacedKingPit: false,
    hasShuffled: false,
    isReady: false,
    opponentReady: false,
    kingPosition: null,
    pitPosition: null,
};

const initialState = {
    connectionStatus: 'connecting' as const,
    playerId: null,
    myColor: null,
    sessionId: null,
    gamePhase: 'waiting' as GamePhase,
    gameView: null,
    isSearching: false,
    setupState: initialSetupState,
    gameState: null,
};

export const useGameStore = create<GameStore>((set) => ({
    ...initialState,
    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setPlayerInfo: (playerId, color) => set({ playerId, myColor: color }),
    setSessionId: (sessionId) => set({ sessionId }),
    setGamePhase: (phase) => set({ gamePhase: phase }),
    setGameView: (view) => set({ gameView: view }),
    setIsSearching: (isSearching) => set({ isSearching }),
    setSetupState: (state) => set((prev) => ({
        setupState: { ...prev.setupState, ...state }
    })),
    setKingPosition: (position) => set((prev) => ({
        setupState: { ...prev.setupState, kingPosition: position }
    })),
    setPitPosition: (position) => set((prev) => ({
        setupState: { ...prev.setupState, pitPosition: position }
    })),
    setGameState: (gameState) => set({ gameState }),
    reset: () => set(initialState),
}));
