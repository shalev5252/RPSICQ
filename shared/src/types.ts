// ============================================================
// Game Types for RPS Battle
// ============================================================

export type PlayerColor = 'red' | 'blue';
export type PlayerRole = PlayerColor;
export type GameMode = 'classic' | 'rpsls' | 'ttt-classic' | 'third-eye';
export type RpsGameMode = 'classic' | 'rpsls';  // Subset used by RPS board configs
export type GameVariant = 'standard' | 'clearday' | 'onslaught';
export type PieceType = 'king' | 'pit' | 'rock' | 'paper' | 'scissors' | 'lizard' | 'spock';
export type CombatElement = 'rock' | 'paper' | 'scissors' | 'lizard' | 'spock';
export type OpponentType = 'human' | 'ai';
export type GamePhase = 'waiting' | 'setup' | 'playing' | 'combat' | 'finished' | 'tie_breaker';

export interface Position {
    row: number;
    col: number;
}

export interface Piece {
    id: string;
    owner: PlayerColor;
    type: PieceType;
    position: Position;
    isRevealed: boolean;
    hasHalo: boolean;
}

export interface Cell {
    row: number;
    col: number;
    piece: Piece | null;
}

export interface PlayerState {
    id: string;
    socketId: string;
    color: PlayerColor;
    isReady: boolean;
    pieces: Piece[];
}

export interface CombatState {
    attackerId: string;
    defenderId: string;
    attackerChoice?: CombatElement;
    defenderChoice?: CombatElement;
    isTie: boolean;
}

export interface GameState {
    sessionId: string;
    gameMode: GameMode;
    gameVariant: GameVariant;
    opponentType: OpponentType;
    phase: GamePhase;
    currentTurn: PlayerColor | null;
    board: Cell[][];
    players: {
        red: PlayerState | null;
        blue: PlayerState | null;
    };
    turnStartTime: number | null;
    combatState: CombatState | null;
    winner: PlayerColor | null;
    winReason?: 'king_captured' | 'timeout' | 'disconnect' | 'draw' | 'forfeit' | 'elimination' | 'draw_offer';
    rematchRequests?: {
        red: boolean;
        blue: boolean;
    };
    aiReady?: boolean;
    pendingDrawOffer?: PlayerColor;  // Who sent the pending draw offer
    drawOffersMadeThisTurn?: {       // Track if player has offered draw this turn
        red: boolean;
        blue: boolean;
    };
}

// Socket Event Payloads
export interface JoinQueuePayload {
    playerId: string;
    gameMode: GameMode;
    gameVariant?: GameVariant;
}

export interface StartSingleplayerPayload {
    playerId: string;
    gameMode: GameMode;
    gameVariant?: GameVariant;
}

export interface PlaceKingPitPayload {
    kingPosition: Position;
    pitPosition: Position;
}

export interface MakeMovePayload {
    from: Position;
    to: Position;
}

export interface CombatChoicePayload {
    element: CombatElement;
}

export interface GameFoundPayload {
    sessionId: string;
    color: PlayerColor;
}

export interface GameStartPayload {
    startingPlayer: PlayerColor;
    gameState: GameState;
}

export interface GameStateUpdatePayload {
    gameState: GameState;
}

export interface CombatResultPayload {
    winnerId: string;
    loserId: string;
    attackerRevealed: boolean;
    defenderRevealed: boolean;
}

export interface GameOverPayload {
    winner: PlayerColor | null;
    reason: 'king_captured' | 'timeout' | 'disconnect' | 'draw' | 'forfeit' | 'elimination' | 'draw_offer';
}

export interface ErrorPayload {
    code: string;
    message: string;
}

export interface SetupStatePayload {
    board: PlayerCellView[][];
    hasPlacedKingPit: boolean;
    hasShuffled: boolean;
    isReady: boolean;
    opponentReady: boolean;
}

// Room payloads
export interface CreateRoomPayload {
    gameMode: GameMode;
    gameVariant?: GameVariant;
}

export interface JoinRoomPayload {
    roomCode: string;
}

export interface RoomCreatedPayload {
    roomCode: string;
    gameMode: GameMode;
}

export interface RoomErrorPayload {
    code: 'ROOM_NOT_FOUND' | 'ROOM_EXPIRED' | 'CANNOT_JOIN_OWN_ROOM' | 'ROOM_CREATE_FAILED';
    message: string;
}

// Player view types
export interface PlayerGameView extends Omit<GameState, 'board'> {
    board: PlayerCellView[][];
}

export interface PlayerCellView {
    row: number;
    col: number;
    piece: PlayerPieceView | null;
}

export interface PlayerPieceView {
    id: string;
    owner: PlayerColor;
    type: PieceType | 'hidden';
    position: Position;
    isRevealed: boolean;
    hasHalo: boolean;
}

// Emote types
export type EmoteId = 'thumbs_up' | 'clap' | 'laugh' | 'think' | 'fire' | 'sad' | 'vomit' | 'poop' | 'explosion' | 'smile' | 'tired' | 'devil' | 'pray' | 'angel';

export interface SendEmotePayload {
    emoteId: EmoteId;
}

export interface EmoteReceivedPayload {
    emoteId: EmoteId;
    from: PlayerColor;
}

// Draw offer types
export interface DrawOfferPayload {
    from: PlayerColor;
}

export interface DrawResponsePayload {
    accepted: boolean;
}

// ============================================================
// Game Type — identifies which game is active
// ============================================================

export type GameType = 'rps' | 'ttt' | 'third-eye';

// ============================================================
// Tic Tac Toe Types
// ============================================================

export type TttMark = 'X' | 'O';
export type TttCell = TttMark | null;
export type TttDifficulty = 'easy' | 'medium' | 'hard';

export interface TttGameState {
    sessionId: string;
    board: TttCell[];          // 9 cells, row-major (index = row*3 + col)
    currentTurn: TttMark;
    winner: TttMark | 'draw' | null;
    winningLine: number[] | null;  // indices of the winning 3 cells
    playerMarks: {
        red: TttMark;
        blue: TttMark;
    };
}

export interface TttMovePayload {
    cellIndex: number;  // 0-8
}

export interface TttGameOverPayload {
    winner: TttMark | 'draw';
    winningLine: number[] | null;
    board: TttCell[];
}

export interface TttStartPayload {
    sessionId: string;
    mark: TttMark;
    board: TttCell[];
    currentTurn: TttMark;
}

// Single-player TTT
export interface TttStartSingleplayerPayload {
    playerId: string;
    difficulty: TttDifficulty;
}

// ============================================================
// The Third Eye Types
// ============================================================

export interface ThirdEyeRoundState {
    roundNumber: number;
    rangeMin: number;
    rangeMax: number;
    timeRemainingMs: number;
    hasSubmitted: boolean;
}

export interface ThirdEyeScores {
    red: number;
    blue: number;
}

export interface ThirdEyeRoundStartPayload {
    roundNumber: number;
    rangeMin: number;
    rangeMax: number;
    timerDurationMs: number;  // 20000
}

export interface ThirdEyePickPayload {
    number: number;
}

export interface ThirdEyeRoundResultPayload {
    luckyNumber: number;
    picks: {
        red: number | null;   // null = timed out
        blue: number | null;
    };
    distances: {
        red: number | null;
        blue: number | null;
    };
    roundWinner: PlayerColor | 'tie';
    scores: ThirdEyeScores;
}

export interface ThirdEyeGameOverPayload {
    winner: PlayerColor;
    finalScores: ThirdEyeScores;
}

export interface ThirdEyeTimerPayload {
    timeRemainingMs: number;
}
