// ============================================================
// Game Constants for RPS Battle
// ============================================================

export const BOARD_ROWS = 6;
export const BOARD_COLS = 7;

export const RED_SETUP_ROWS = [0, 1];
export const BLUE_SETUP_ROWS = [4, 5];

export const PIECES_PER_PLAYER = {
    king: 1,
    pit: 1,
    rock: 4,
    paper: 4,
    scissors: 4,
} as const;

export const TOTAL_PIECES_PER_PLAYER = 14;

export const TURN_TIME_MS = 2 * 60 * 1000;
export const TURN_TIME_SECONDS = 120;

export const MOVEMENT_DIRECTIONS = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
] as const;

export const COMBAT_OUTCOMES: Record<string, 'win' | 'lose' | 'tie'> = {
    'rock-scissors': 'win',
    'rock-paper': 'lose',
    'rock-rock': 'tie',
    'rock-pit': 'lose',
    'rock-king': 'win',
    'paper-rock': 'win',
    'paper-scissors': 'lose',
    'paper-paper': 'tie',
    'paper-pit': 'lose',
    'paper-king': 'win',
    'scissors-paper': 'win',
    'scissors-rock': 'lose',
    'scissors-scissors': 'tie',
    'scissors-pit': 'lose',
    'scissors-king': 'win',
} as const;

export const SOCKET_EVENTS = {
    JOIN_QUEUE: 'join_queue',
    LEAVE_QUEUE: 'leave_queue',
    PLACE_KING_PIT: 'place_king_pit',
    CONFIRM_SETUP: 'confirm_setup',
    RANDOMIZE_PIECES: 'randomize_pieces',
    MAKE_MOVE: 'make_move',
    COMBAT_CHOICE: 'combat_choice',
    REQUEST_REMATCH: 'request_rematch',
    REMATCH_REQUESTED: 'rematch_requested',
    REMATCH_ACCEPTED: 'rematch_accepted',
    GAME_FOUND: 'game_found',
    OPPONENT_READY: 'opponent_ready',
    GAME_START: 'game_start',
    GAME_STATE: 'game_state',
    SETUP_STATE: 'setup_state',
    COMBAT_START: 'combat_start',
    COMBAT_TIE: 'combat_tie',
    TIE_BREAKER_RETRY: 'tie_breaker_retry',
    COMBAT_RESULT: 'combat_result',
    TURN_TIMER: 'turn_timer',
    GAME_OVER: 'game_over',
    OPPONENT_DISCONNECTED: 'opponent_disconnected',
    ERROR: 'error',
} as const;
