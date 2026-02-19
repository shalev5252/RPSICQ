import { create } from 'zustand';
import type { PlayerColor, GamePhase, PlayerGameView, PlayerCellView, Position, GameMode, GameVariant, OpponentType, PieceType, CombatElement, EmoteId, GameType } from '@rps/shared';

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

interface TieBreakerReveal {
    playerChoice: CombatElement;
    opponentChoice: CombatElement;
}

interface TieBreakerState {
    retryCount: number;
    reveal: TieBreakerReveal | null;
    lastReveal: TieBreakerReveal | null;
    showingResult: boolean;
    uniqueId: number;
}

interface GameStore {
    connectionStatus: 'connecting' | 'connected' | 'disconnected';
    setConnectionStatus: (status: 'connecting' | 'connected' | 'disconnected') => void;
    // Portal state
    activeGame: GameType | null;
    setActiveGame: (game: GameType | null) => void;
    resetToPortal: () => void;
    playerId: string | null;
    myColor: PlayerColor | null;
    setPlayerInfo: (playerId: string, color: PlayerColor) => void;
    gameMode: GameMode;
    setGameMode: (mode: GameMode) => void;
    gameVariant: GameVariant;
    setGameVariant: (variant: GameVariant) => void;
    opponentType: OpponentType;
    setOpponentType: (type: OpponentType) => void;
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
        winReason?: 'king_captured' | 'timeout' | 'disconnect' | 'draw' | 'forfeit' | 'elimination' | 'draw_offer';
        combatPosition?: Position;
        combatPieceType?: PieceType;
        combatAttackerPosition?: Position;
    } | null;
    setGameState: (state: { board: PlayerCellView[][]; currentTurn: PlayerColor | null; phase: string; isMyTurn: boolean; winner?: PlayerColor | null; winReason?: 'king_captured' | 'timeout' | 'disconnect' | 'draw' | 'forfeit' | 'elimination' | 'draw_offer'; combatPosition?: Position; combatPieceType?: PieceType; combatAttackerPosition?: Position } | null) => void;
    // Rematch state
    rematchState: RematchState;
    setRematchState: (state: Partial<RematchState>) => void;
    resetForRematch: () => void;
    resetForMatchmaking: () => void;
    // Tie-breaker state
    tieBreakerState: TieBreakerState;
    incrementTieBreakerRetry: () => void;
    resetTieBreakerState: () => void;
    setTieBreakerReveal: (reveal: TieBreakerReveal | null) => void;
    setTieBreakerLastReveal: (lastReveal: TieBreakerReveal | null) => void;
    setTieBreakerShowingResult: (showing: boolean) => void;
    // Turn skipped state
    showTurnSkipped: boolean;
    setShowTurnSkipped: (show: boolean) => void;
    // Opponent reconnecting state
    opponentReconnecting: boolean;
    setOpponentReconnecting: (reconnecting: boolean) => void;
    // Room state
    roomCode: string | null;
    setRoomCode: (code: string | null) => void;
    roomError: string | null;
    setRoomError: (error: string | null) => void;
    isCreatingRoom: boolean;
    setIsCreatingRoom: (creating: boolean) => void;
    isJoiningRoom: boolean;
    setIsJoiningRoom: (joining: boolean) => void;
    pvpMode: 'random' | 'friend';
    setPvpMode: (mode: 'random' | 'friend') => void;
    // Emote state
    receivedEmote: { emoteId: EmoteId; from: PlayerColor } | null;
    setReceivedEmote: (emote: { emoteId: EmoteId; from: PlayerColor } | null) => void;
    emoteCooldown: boolean;
    setEmoteCooldown: (cooldown: boolean) => void;
    // Draw offer state
    pendingDrawOffer: PlayerColor | null;  // Who sent the draw offer (opponent's color)
    setPendingDrawOffer: (from: PlayerColor | null) => void;
    hasOfferedDrawThisTurn: boolean;
    setHasOfferedDrawThisTurn: (offered: boolean) => void;
    drawDeclined: boolean;  // Notification that opponent declined
    setDrawDeclined: (declined: boolean) => void;
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

const initialTieBreakerState: TieBreakerState = {
    retryCount: 0,
    reveal: null,
    lastReveal: null,
    showingResult: false,
    uniqueId: 0,
};

const initialState = {
    connectionStatus: 'connecting' as const,
    activeGame: null as GameType | null,
    playerId: null,
    myColor: null,
    gameMode: 'classic' as GameMode,
    gameVariant: 'standard' as GameVariant,
    opponentType: 'human' as OpponentType,
    sessionId: null,
    gamePhase: 'waiting' as GamePhase,
    gameView: null,
    isSearching: false,
    setupState: initialSetupState,
    gameState: null,
    rematchState: initialRematchState,
    tieBreakerState: initialTieBreakerState,
    showTurnSkipped: false,
    opponentReconnecting: false,
    roomCode: null,
    roomError: null,
    isCreatingRoom: false,
    isJoiningRoom: false,
    pvpMode: 'random' as 'random' | 'friend',
    receivedEmote: null,
    emoteCooldown: false,
    pendingDrawOffer: null,
    hasOfferedDrawThisTurn: false,
    drawDeclined: false,
};

export const useGameStore = create<GameStore>((set) => ({
    ...initialState,
    setConnectionStatus: (status) => set({ connectionStatus: status }),
    setActiveGame: (game) => set({ activeGame: game }),
    resetToPortal: () => set({
        activeGame: null,
        gamePhase: 'waiting' as GamePhase,
        sessionId: null,
        isSearching: false,
        gameState: null,
        setupState: initialSetupState,
        rematchState: initialRematchState,
        tieBreakerState: initialTieBreakerState,
    }),
    setPlayerInfo: (playerId, color) => set({ playerId, myColor: color }),
    setGameMode: (mode) => set({ gameMode: mode }),
    setGameVariant: (variant) => set({ gameVariant: variant }),
    setOpponentType: (type) => set({ opponentType: type }),
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
        tieBreakerState: initialTieBreakerState,
        receivedEmote: null,
        emoteCooldown: false,
        // Keep sessionId, playerId, and myColor
    }),
    resetForMatchmaking: () => set({
        gamePhase: 'waiting' as GamePhase,
        setupState: initialSetupState,
        gameState: null,
        rematchState: initialRematchState,
        tieBreakerState: initialTieBreakerState,
        showTurnSkipped: false,
        opponentReconnecting: false,
        receivedEmote: null,
        emoteCooldown: false,
        // Keep sessionId, playerId, myColor, gameMode, opponentType
    }),
    incrementTieBreakerRetry: () => set((prev) => ({
        tieBreakerState: { ...prev.tieBreakerState, retryCount: prev.tieBreakerState.retryCount + 1 }
    })),
    resetTieBreakerState: () => set({
        tieBreakerState: {
            ...initialTieBreakerState,
            uniqueId: Date.now()
        }
    }),
    setTieBreakerReveal: (reveal) => set((prev) => ({
        tieBreakerState: { ...prev.tieBreakerState, reveal }
    })),
    setTieBreakerLastReveal: (lastReveal) => set((prev) => ({
        tieBreakerState: { ...prev.tieBreakerState, lastReveal }
    })),
    setTieBreakerShowingResult: (showingResult) => set((prev) => ({
        tieBreakerState: { ...prev.tieBreakerState, showingResult }
    })),
    setShowTurnSkipped: (show) => set({ showTurnSkipped: show }),
    setOpponentReconnecting: (reconnecting) => set({ opponentReconnecting: reconnecting }),
    setRoomCode: (code) => set({ roomCode: code }),
    setRoomError: (error) => set({ roomError: error }),
    setIsCreatingRoom: (creating) => set({ isCreatingRoom: creating }),
    setIsJoiningRoom: (joining) => set({ isJoiningRoom: joining }),
    setPvpMode: (mode) => set({ pvpMode: mode }),
    setReceivedEmote: (emote) => set({ receivedEmote: emote }),
    setEmoteCooldown: (cooldown) => set({ emoteCooldown: cooldown }),
    setPendingDrawOffer: (from) => set({ pendingDrawOffer: from }),
    setHasOfferedDrawThisTurn: (offered) => set({ hasOfferedDrawThisTurn: offered }),
    setDrawDeclined: (declined) => set({ drawDeclined: declined }),
    reset: () => set(initialState),
}));
