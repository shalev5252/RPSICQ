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

interface RematchState {
    hasRequested: boolean;
    opponentRequested: boolean;
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
        winner?: PlayerColor | null;
    } | null;
    setGameState: (state: { board: PlayerCellView[][]; currentTurn: PlayerColor | null; phase: string; isMyTurn: boolean; winner?: PlayerColor | null } | null) => void;
    // Rematch state
    rematchState: RematchState;
    setRematchState: (state: Partial<RematchState>) => void;
    resetForRematch: () => void;
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

const initialRematchState: RematchState = {
    hasRequested: false,
    opponentRequested: false,
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
    rematchState: initialRematchState,
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
    setRematchState: (state) => set((prev) => ({
        rematchState: { ...prev.rematchState, ...state }
    })),
    resetForRematch: () => set({
        gamePhase: 'setup' as GamePhase,
        setupState: initialSetupState,
        gameState: null,
        rematchState: initialRematchState,
        // Keep sessionId, playerId, and myColor
    }),
    reset: () => set(initialState),
}));
