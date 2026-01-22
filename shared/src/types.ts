// ============================================================
// Game Types for RPS Battle
// ============================================================

export type PlayerColor = 'red' | 'blue';
export type PlayerRole = PlayerColor;
export type PieceType = 'king' | 'pit' | 'rock' | 'paper' | 'scissors';
export type CombatElement = 'rock' | 'paper' | 'scissors';
export type GamePhase = 'waiting' | 'setup' | 'playing' | 'combat' | 'finished';

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
    winReason?: 'king_captured' | 'timeout' | 'disconnect' | 'draw';
}

// Socket Event Payloads
export interface JoinQueuePayload {
    playerId: string;
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
    reason: 'king_captured' | 'timeout' | 'disconnect' | 'draw';
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
