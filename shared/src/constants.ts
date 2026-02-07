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

export const BOARD_CONFIG = {
    classic: {
        rows: 6,
        cols: 7,
        pieces: {
            king: 1,
            pit: 1,
            rock: 4,
            paper: 4,
            scissors: 4,
            lizard: 0,
            spock: 0
        }
    },
    rpsls: {
        rows: 6,
        cols: 6,
        pieces: {
            king: 1,
            pit: 1,
            rock: 2,
            paper: 2,
            scissors: 2,
            lizard: 2,
            spock: 2
        }
    }
} as const;

export const ONSLAUGHT_CONFIG = {
    classic: {
        rows: 6,
        cols: 3,
        pieces: {
            king: 0,
            pit: 0,
            rock: 2,
            paper: 2,
            scissors: 2,
            lizard: 0,
            spock: 0
        }
    },
    rpsls: {
        rows: 6,
        cols: 5,
        pieces: {
            king: 0,
            pit: 0,
            rock: 2,
            paper: 2,
            scissors: 2,
            lizard: 2,
            spock: 2
        }
    }
} as const;

export const ONSLAUGHT_END_PIECE_COUNT = 2;

export const RPSLS_WINS: Record<string, string[]> = {
    rock: ['scissors', 'lizard'],
    paper: ['rock', 'spock'],
    scissors: ['paper', 'lizard'],
    lizard: ['spock', 'paper'],
    spock: ['scissors', 'rock']
};

// AI Opponent Configuration
export const AI_ID_PREFIX = 'ai-';
export const AI_SOCKET_PREFIX = 'ai-socket-';
export const AI_DELAY_MIN_MS = 500;
export const AI_DELAY_MAX_MS = 2000;
export const AI_SUBOPTIMAL_CHANCE = 0.05; // 5% chance of picking a non-optimal move

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
    START_SINGLEPLAYER: 'start_singleplayer',
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
    TIE_BREAKER_REVEAL: 'tie_breaker_reveal',
    COMBAT_RESULT: 'combat_result',
    TURN_TIMER: 'turn_timer',
    TURN_SKIPPED: 'turn_skipped',
    GAME_OVER: 'game_over',
    OPPONENT_DISCONNECTED: 'opponent_disconnected',
    OPPONENT_RECONNECTING: 'opponent_reconnecting',
    OPPONENT_RECONNECTED: 'opponent_reconnected',
    SESSION_RESTORED: 'session_restored',
    LEAVE_SESSION: 'leave_session',
    CREATE_ROOM: 'create_room',
    JOIN_ROOM: 'join_room',
    CANCEL_ROOM: 'cancel_room',
    ROOM_CREATED: 'room_created',
    ROOM_ERROR: 'room_error',
    ROOM_EXPIRED: 'room_expired',
    SEND_EMOTE: 'send_emote',
    EMOTE_RECEIVED: 'emote_received',
    FORFEIT_GAME: 'forfeit_game',
    OFFER_DRAW: 'offer_draw',
    DRAW_OFFERED: 'draw_offered',
    RESPOND_DRAW: 'respond_draw',
    DRAW_DECLINED: 'draw_declined',
    ERROR: 'error',
} as const;
