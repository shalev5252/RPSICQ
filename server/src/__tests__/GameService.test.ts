import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameService } from '../services/GameService.js';
import {
    BOARD_CONFIG,
    RED_SETUP_ROWS,
    BLUE_SETUP_ROWS,
    RPSLS_WINS,
    PieceType,
} from '@rps/shared';

/**
 * Helper: set up a full session and do king/pit placement + randomize + confirm for both players.
 * Returns the session, plus socket IDs and player colors.
 */
function setupFullSession(
    gs: GameService,
    opts: { gameMode?: 'classic' | 'rpsls'; gameVariant?: 'standard' | 'onslaught' | 'clearday' } = {}
) {
    const mode = opts.gameMode ?? 'classic';
    const variant = opts.gameVariant ?? 'standard';

    const session = gs.createSession('test-session', 'p1', 'red', 'p2', 'blue', mode, variant);

    // Skip manual setup for onslaught (already initialized)
    if (variant !== 'onslaught') {
        // Red setup
        gs.placeKingPit('p1', { row: RED_SETUP_ROWS[0], col: 0 }, { row: RED_SETUP_ROWS[0], col: 1 });
        gs.randomizePieces('p1');

        // Blue setup
        gs.placeKingPit('p2', { row: BLUE_SETUP_ROWS[0], col: 0 }, { row: BLUE_SETUP_ROWS[0], col: 1 });
        gs.randomizePieces('p2');
    }

    return session;
}

/** Helper: confirm both players and transition to playing */
function confirmBoth(gs: GameService) {
    gs.confirmSetup('p1');
    gs.confirmSetup('p2');
}

describe('GameService', () => {
    let gs: GameService;

    beforeEach(() => {
        gs = new GameService();
    });

    // =====================================================================
    // 2.1 — createSession
    // =====================================================================
    describe('createSession', () => {
        it('creates a session with correct board dimensions for classic mode', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue', 'classic');
            const config = BOARD_CONFIG.classic;

            expect(session.sessionId).toBe('s1');
            expect(session.phase).toBe('setup');
            expect(session.board.length).toBe(config.rows);
            expect(session.board[0].length).toBe(config.cols);
            expect(session.players.red?.id).toBe('p1');
            expect(session.players.blue?.id).toBe('p2');
            expect(session.currentTurn).toBeNull();
        });

        it('creates a session for RPSLS mode with correct config', () => {
            const session = gs.createSession('s2', 'p1', 'red', 'p2', 'blue', 'rpsls');
            const config = BOARD_CONFIG.rpsls;

            expect(session.gameMode).toBe('rpsls');
            expect(session.board.length).toBe(config.rows);
            expect(session.board[0].length).toBe(config.cols);
        });

        it('assigns colors correctly when player1 is blue', () => {
            const session = gs.createSession('s3', 'p1', 'blue', 'p2', 'red');
            expect(session.players.blue?.id).toBe('p1');
            expect(session.players.red?.id).toBe('p2');
        });
    });

    // =====================================================================
    // 2.2 — placeKingPit
    // =====================================================================
    describe('placeKingPit', () => {
        it('places king and pit in valid positions', () => {
            gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            const result = gs.placeKingPit('p1', { row: RED_SETUP_ROWS[0], col: 0 }, { row: RED_SETUP_ROWS[0], col: 1 });

            expect(result.success).toBe(true);
            const session = gs.getSession('s1')!;
            const red = session.players.red!;
            expect(red.pieces.length).toBe(2);
            expect(red.pieces.find(p => p.type === 'king')).toBeDefined();
            expect(red.pieces.find(p => p.type === 'pit')).toBeDefined();
        });

        it('fails if same position for king and pit', () => {
            gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            const result = gs.placeKingPit('p1', { row: RED_SETUP_ROWS[0], col: 0 }, { row: RED_SETUP_ROWS[0], col: 0 });
            expect(result.success).toBe(false);
            expect(result.error).toContain('different cells');
        });

        it('fails if position is outside player setup rows', () => {
            gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            // Red player trying to place in blue's rows
            const result = gs.placeKingPit('p1', { row: BLUE_SETUP_ROWS[0], col: 0 }, { row: BLUE_SETUP_ROWS[0], col: 1 });
            expect(result.success).toBe(false);
            expect(result.error).toContain('not in your rows');
        });

        it('fails if not in setup phase', () => {
            const session = setupFullSession(gs);
            confirmBoth(gs);
            expect(session.phase).toBe('playing');

            const result = gs.placeKingPit('p1', { row: RED_SETUP_ROWS[0], col: 2 }, { row: RED_SETUP_ROWS[0], col: 3 });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Not in setup phase');
        });

        it('allows re-placement of king and pit before shuffle', () => {
            gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            gs.placeKingPit('p1', { row: RED_SETUP_ROWS[0], col: 0 }, { row: RED_SETUP_ROWS[0], col: 1 });
            const result = gs.placeKingPit('p1', { row: RED_SETUP_ROWS[0], col: 2 }, { row: RED_SETUP_ROWS[0], col: 3 });
            expect(result.success).toBe(true);

            const session = gs.getSession('s1')!;
            const king = session.players.red!.pieces.find(p => p.type === 'king')!;
            expect(king.position).toEqual({ row: RED_SETUP_ROWS[0], col: 2 });
        });
    });

    // =====================================================================
    // 2.3 — randomizePieces
    // =====================================================================
    describe('randomizePieces', () => {
        it('fills remaining cells with correct piece counts', () => {
            gs.createSession('s1', 'p1', 'red', 'p2', 'blue', 'classic');
            gs.placeKingPit('p1', { row: RED_SETUP_ROWS[0], col: 0 }, { row: RED_SETUP_ROWS[0], col: 1 });

            const result = gs.randomizePieces('p1');
            expect(result.success).toBe(true);

            const session = gs.getSession('s1')!;
            const config = BOARD_CONFIG.classic;
            const red = session.players.red!;

            // King + Pit + all RPS pieces
            const expectedTotal = 2 + config.pieces.rock + config.pieces.paper + config.pieces.scissors;
            expect(red.pieces.length).toBe(expectedTotal);
        });

        it('fails if king/pit not placed first', () => {
            gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            const result = gs.randomizePieces('p1');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Must place King and Pit first');
        });

        it('fills RPSLS pieces for RPSLS mode', () => {
            gs.createSession('s1', 'p1', 'red', 'p2', 'blue', 'rpsls');
            gs.placeKingPit('p1', { row: RED_SETUP_ROWS[0], col: 0 }, { row: RED_SETUP_ROWS[0], col: 1 });
            gs.randomizePieces('p1');

            const session = gs.getSession('s1')!;
            const red = session.players.red!;
            const config = BOARD_CONFIG.rpsls;
            const expectedTotal = 2 + config.pieces.rock + config.pieces.paper + config.pieces.scissors +
                (config.pieces.lizard || 0) + (config.pieces.spock || 0);
            expect(red.pieces.length).toBe(expectedTotal);
            expect(red.pieces.some(p => p.type === 'lizard')).toBe(true);
            expect(red.pieces.some(p => p.type === 'spock')).toBe(true);
        });
    });

    // =====================================================================
    // 2.4 — confirmSetup
    // =====================================================================
    describe('confirmSetup', () => {
        it('marks single player as ready without starting game', () => {
            setupFullSession(gs);
            const result = gs.confirmSetup('p1');

            expect(result.success).toBe(true);
            expect(result.bothReady).toBe(false);

            const session = gs.getSession('test-session')!;
            expect(session.phase).toBe('setup'); // still setup
        });

        it('transitions to playing when both confirm', () => {
            setupFullSession(gs);
            gs.confirmSetup('p1');
            const result = gs.confirmSetup('p2');

            expect(result.success).toBe(true);
            expect(result.bothReady).toBe(true);

            const session = gs.getSession('test-session')!;
            expect(session.phase).toBe('playing');
            expect(session.currentTurn).toMatch(/^(red|blue)$/);
            expect(session.turnStartTime).toBeDefined();
        });

        it('fails if pieces not shuffled', () => {
            gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            gs.placeKingPit('p1', { row: RED_SETUP_ROWS[0], col: 0 }, { row: RED_SETUP_ROWS[0], col: 1 });
            // skip randomize

            const result = gs.confirmSetup('p1');
            expect(result.success).toBe(false);
            expect(result.error).toContain('shuffle');
        });
    });

    // =====================================================================
    // 2.5 — resolveCombat: classic RPS matchups (via makeMove)
    // =====================================================================
    describe('combat resolution — classic RPS', () => {
        function setupCombatScenario(
            gs: GameService,
            attackerType: PieceType,
            defenderType: PieceType
        ) {
            // Create a playing session with controlled pieces
            const session = gs.createSession('combat-test', 'p1', 'red', 'p2', 'blue');

            // Manually set up a minimal board for combat
            session.phase = 'playing';
            session.currentTurn = 'red';
            session.turnStartTime = Date.now();

            // Place attacker (red) piece at (2,2)
            const attackerPiece = {
                id: 'attacker-1',
                owner: 'red' as const,
                type: attackerType,
                position: { row: 2, col: 2 },
                isRevealed: false,
                hasHalo: false,
            };
            session.players.red!.pieces = [attackerPiece];
            session.board[2][2].piece = attackerPiece;

            // Place defender (blue) piece adjacent at (2,3)
            const defenderPiece = {
                id: 'defender-1',
                owner: 'blue' as const,
                type: defenderType,
                position: { row: 2, col: 3 },
                isRevealed: false,
                hasHalo: false,
            };
            session.players.blue!.pieces = [defenderPiece];
            session.board[2][3].piece = defenderPiece;

            return session;
        }

        it('rock beats scissors', () => {
            setupCombatScenario(gs, 'rock', 'scissors');
            const result = gs.makeMove('p1', { row: 2, col: 2 }, { row: 2, col: 3 });
            expect(result.success).toBe(true);
            expect(result.combat).toBe(true);

            const session = gs.getSession('combat-test')!;
            // attacker (rock) wins → should be at (2,3)
            expect(session.board[2][3].piece?.type).toBe('rock');
            expect(session.board[2][3].piece?.owner).toBe('red');
            expect(session.players.blue!.pieces.length).toBe(0);
        });

        it('scissors beats paper', () => {
            setupCombatScenario(gs, 'scissors', 'paper');
            const result = gs.makeMove('p1', { row: 2, col: 2 }, { row: 2, col: 3 });
            expect(result.success).toBe(true);
            expect(session_winner(gs, 'combat-test')).toBeNull(); // game continues
            expect(gs.getSession('combat-test')!.board[2][3].piece?.type).toBe('scissors');
        });

        it('paper beats rock', () => {
            setupCombatScenario(gs, 'paper', 'rock');
            gs.makeMove('p1', { row: 2, col: 2 }, { row: 2, col: 3 });
            expect(gs.getSession('combat-test')!.board[2][3].piece?.type).toBe('paper');
        });

        it('defender wins when rock attacks paper', () => {
            setupCombatScenario(gs, 'rock', 'paper');
            gs.makeMove('p1', { row: 2, col: 2 }, { row: 2, col: 3 });

            const session = gs.getSession('combat-test')!;
            // Defender wins → attacker removed, defender stays
            expect(session.board[2][3].piece?.type).toBe('paper');
            expect(session.board[2][3].piece?.owner).toBe('blue');
            expect(session.board[2][2].piece).toBeNull();
            expect(session.players.red!.pieces.length).toBe(0);
        });

        it('same type triggers tie_breaker phase', () => {
            setupCombatScenario(gs, 'rock', 'rock');
            const result = gs.makeMove('p1', { row: 2, col: 2 }, { row: 2, col: 3 });

            expect(result.success).toBe(true);
            expect(result.combat).toBe(true);

            const session = gs.getSession('combat-test')!;
            expect(session.phase).toBe('tie_breaker');
            expect(session.combatState).toBeDefined();
            expect(session.combatState!.isTie).toBe(true);
        });
    });

    // =====================================================================
    // 2.6 — resolveCombat: RPSLS matchups
    // =====================================================================
    describe('combat resolution — RPSLS', () => {
        it('RPSLS_WINS is complete and correct', () => {
            // Verify every attacker-defender pair is covered
            const pieceTypes: PieceType[] = ['rock', 'paper', 'scissors', 'lizard', 'spock'];

            for (const attacker of pieceTypes) {
                const defeats = RPSLS_WINS[attacker];
                expect(defeats).toBeDefined();
                expect(defeats.length).toBe(2); // each type beats exactly 2 others

                // Verify no self-defeats
                expect(defeats).not.toContain(attacker);

                // Each defeated type should NOT also defeat the attacker
                for (const loser of defeats) {
                    const loserDefeats = RPSLS_WINS[loser];
                    expect(loserDefeats).not.toContain(attacker);
                }
            }
        });
    });

    // =====================================================================
    // 2.7 — getValidMoves
    // =====================================================================
    describe('getValidMoves', () => {
        it('king and pit return no valid moves', () => {
            setupFullSession(gs);
            confirmBoth(gs);

            const session = gs.getSession('test-session')!;
            const red = session.players.red!;
            const king = red.pieces.find(p => p.type === 'king')!;
            const pit = red.pieces.find(p => p.type === 'pit')!;

            expect(gs.getValidMoves('p1', king.id)).toEqual([]);
            expect(gs.getValidMoves('p1', pit.id)).toEqual([]);
        });

        it('mobile piece moves 1 step in 4 directions', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'playing';
            session.currentTurn = 'red';

            // Place a rock at center (3,3) with no neighbors
            const rock = {
                id: 'rock-1',
                owner: 'red' as const,
                type: 'rock' as const,
                position: { row: 3, col: 3 },
                isRevealed: false,
                hasHalo: false,
            };
            session.players.red!.pieces = [rock];
            session.board[3][3].piece = rock;

            const moves = gs.getValidMoves('p1', 'rock-1');
            expect(moves.length).toBe(4);
            expect(moves).toContainEqual({ row: 2, col: 3 }); // up
            expect(moves).toContainEqual({ row: 4, col: 3 }); // down
            expect(moves).toContainEqual({ row: 3, col: 2 }); // left
            expect(moves).toContainEqual({ row: 3, col: 4 }); // right
        });

        it('blocks moves onto own pieces', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'playing';
            session.currentTurn = 'red';

            const rock = {
                id: 'rock-1', owner: 'red' as const, type: 'rock' as const,
                position: { row: 3, col: 3 }, isRevealed: false, hasHalo: false,
            };
            const rock2 = {
                id: 'rock-2', owner: 'red' as const, type: 'rock' as const,
                position: { row: 3, col: 4 }, isRevealed: false, hasHalo: false,
            };
            session.players.red!.pieces = [rock, rock2];
            session.board[3][3].piece = rock;
            session.board[3][4].piece = rock2;

            const moves = gs.getValidMoves('p1', 'rock-1');
            expect(moves).not.toContainEqual({ row: 3, col: 4 });
        });

        it('respects board boundaries', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'playing';
            session.currentTurn = 'red';

            // Place at corner (0,0)
            const rock = {
                id: 'rock-1', owner: 'red' as const, type: 'rock' as const,
                position: { row: 0, col: 0 }, isRevealed: false, hasHalo: false,
            };
            session.players.red!.pieces = [rock];
            session.board[0][0].piece = rock;

            const moves = gs.getValidMoves('p1', 'rock-1');
            expect(moves.length).toBe(2); // only down and right
            expect(moves).toContainEqual({ row: 1, col: 0 });
            expect(moves).toContainEqual({ row: 0, col: 1 });
        });
    });

    // =====================================================================
    // 2.8 — makeMove: successful move to empty cell + turn switch
    // =====================================================================
    describe('makeMove', () => {
        it('moves to empty cell and switches turn', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'playing';
            session.currentTurn = 'red';
            session.turnStartTime = Date.now();

            const rock = {
                id: 'rock-1', owner: 'red' as const, type: 'rock' as const,
                position: { row: 3, col: 3 }, isRevealed: false, hasHalo: false,
            };
            session.players.red!.pieces = [rock];
            session.board[3][3].piece = rock;

            const result = gs.makeMove('p1', { row: 3, col: 3 }, { row: 3, col: 4 });
            expect(result.success).toBe(true);
            expect(result.combat).toBe(false);
            expect(session.board[3][3].piece).toBeNull();
            expect(session.board[3][4].piece?.id).toBe('rock-1');
            expect(session.currentTurn).toBe('blue');
        });

        it('fails when not player turn', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'playing';
            session.currentTurn = 'blue'; // not red's turn

            const rock = {
                id: 'rock-1', owner: 'red' as const, type: 'rock' as const,
                position: { row: 3, col: 3 }, isRevealed: false, hasHalo: false,
            };
            session.players.red!.pieces = [rock];
            session.board[3][3].piece = rock;

            const result = gs.makeMove('p1', { row: 3, col: 3 }, { row: 3, col: 4 });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Not your turn');
        });

        it('fails when trying to move king', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'playing';
            session.currentTurn = 'red';

            const king = {
                id: 'king-1', owner: 'red' as const, type: 'king' as const,
                position: { row: 3, col: 3 }, isRevealed: false, hasHalo: false,
            };
            session.players.red!.pieces = [king];
            session.board[3][3].piece = king;

            const result = gs.makeMove('p1', { row: 3, col: 3 }, { row: 3, col: 4 });
            expect(result.success).toBe(false);
            expect(result.error).toContain('cannot move');
        });
    });

    // =====================================================================
    // 2.9 — king capture / pit specials
    // =====================================================================
    describe('king capture & pit mechanics', () => {
        it('capturing king ends game with attacker as winner', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'playing';
            session.currentTurn = 'red';
            session.turnStartTime = Date.now();

            const rock = {
                id: 'rock-1', owner: 'red' as const, type: 'rock' as const,
                position: { row: 2, col: 2 }, isRevealed: false, hasHalo: false,
            };
            const king = {
                id: 'king-b', owner: 'blue' as const, type: 'king' as const,
                position: { row: 2, col: 3 }, isRevealed: false, hasHalo: false,
            };
            session.players.red!.pieces = [rock];
            session.players.blue!.pieces = [king];
            session.board[2][2].piece = rock;
            session.board[2][3].piece = king;

            const result = gs.makeMove('p1', { row: 2, col: 2 }, { row: 2, col: 3 });
            expect(result.success).toBe(true);
            expect(session.phase).toBe('finished');
            expect(session.winner).toBe('red');
            expect(session.winReason).toBe('king_captured');
        });

        it('pit defeats any attacker', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'playing';
            session.currentTurn = 'red';
            session.turnStartTime = Date.now();

            const rock = {
                id: 'rock-1', owner: 'red' as const, type: 'rock' as const,
                position: { row: 2, col: 2 }, isRevealed: false, hasHalo: false,
            };
            const pit = {
                id: 'pit-b', owner: 'blue' as const, type: 'pit' as const,
                position: { row: 2, col: 3 }, isRevealed: false, hasHalo: false,
            };
            session.players.red!.pieces = [rock];
            session.players.blue!.pieces = [pit];
            session.board[2][2].piece = rock;
            session.board[2][3].piece = pit;

            gs.makeMove('p1', { row: 2, col: 2 }, { row: 2, col: 3 });

            // Defender (pit) wins
            expect(session.board[2][3].piece?.type).toBe('pit');
            expect(session.board[2][2].piece).toBeNull();
            expect(session.players.red!.pieces.length).toBe(0);
        });
    });

    // =====================================================================
    // 2.10 — hasMovablePieces / skipTurn
    // =====================================================================
    describe('hasMovablePieces / skipTurn', () => {
        it('returns false when only king and pit remain', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'playing';
            session.currentTurn = 'red';

            const king = {
                id: 'king-1', owner: 'red' as const, type: 'king' as const,
                position: { row: 0, col: 0 }, isRevealed: false, hasHalo: false,
            };
            const pit = {
                id: 'pit-1', owner: 'red' as const, type: 'pit' as const,
                position: { row: 0, col: 1 }, isRevealed: false, hasHalo: false,
            };
            session.players.red!.pieces = [king, pit];
            session.board[0][0].piece = king;
            session.board[0][1].piece = pit;

            expect(gs.hasMovablePieces('p1')).toBe(false);
        });

        it('skipTurn switches turn to opponent', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'playing';
            session.currentTurn = 'red';

            const result = gs.skipTurn('p1');
            expect(result.success).toBe(true);
            expect(session.currentTurn).toBe('blue');
        });
    });

    // =====================================================================
    // 2.11 — checkDraw / setDraw
    // =====================================================================
    describe('checkDraw / setDraw', () => {
        it('detects draw when both players have only king/pit', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'playing';

            session.players.red!.pieces = [
                { id: 'k', owner: 'red', type: 'king', position: { row: 0, col: 0 }, isRevealed: false, hasHalo: false },
            ];
            session.players.blue!.pieces = [
                { id: 'k', owner: 'blue', type: 'king', position: { row: 5, col: 0 }, isRevealed: false, hasHalo: false },
            ];

            expect(gs.checkDraw('s1')).toBe(true);
        });

        it('returns false when at least one player has movable pieces', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'playing';

            session.players.red!.pieces = [
                { id: 'r', owner: 'red', type: 'rock', position: { row: 3, col: 3 }, isRevealed: false, hasHalo: false },
            ];
            session.players.blue!.pieces = [
                { id: 'k', owner: 'blue', type: 'king', position: { row: 5, col: 0 }, isRevealed: false, hasHalo: false },
            ];

            expect(gs.checkDraw('s1')).toBe(false);
        });

        it('setDraw ends game with no winner', () => {
            gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            gs.setDraw('s1');

            const session = gs.getSession('s1')!;
            expect(session.phase).toBe('finished');
            expect(session.winner).toBeNull();
            expect(session.winReason).toBe('draw');
        });
    });

    // =====================================================================
    // 2.12 — forfeitGame
    // =====================================================================
    describe('forfeitGame', () => {
        it('ends game with opponent as winner', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'playing';

            const result = gs.forfeitGame('p1');
            expect(result.success).toBe(true);
            expect(result.session!.phase).toBe('finished');
            expect(result.session!.winner).toBe('blue');
            expect(result.session!.winReason).toBe('forfeit');
        });

        it('can forfeit during setup', () => {
            gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            const result = gs.forfeitGame('p1');
            expect(result.success).toBe(true);
            expect(result.session!.winner).toBe('blue');
        });

        it('fails if game already finished', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'finished';

            const result = gs.forfeitGame('p1');
            expect(result.success).toBe(false);
        });
    });

    // =====================================================================
    // 2.13 — offerDraw / respondToDraw
    // =====================================================================
    describe('drawOffer', () => {
        function createPlayingSession() {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'playing';
            session.currentTurn = 'red';
            session.opponentType = 'human';
            return session;
        }

        it('current player can offer draw', () => {
            createPlayingSession();
            const result = gs.offerDraw('p1');
            expect(result.success).toBe(true);
            expect(result.opponentSocketId).toBe('p2');
        });

        it('non-current player cannot offer draw', () => {
            createPlayingSession();
            const result = gs.offerDraw('p2'); // blue, but it's red's turn
            expect(result.success).toBe(false);
            expect(result.error).toContain('current player');
        });

        it('cannot offer draw twice in same turn', () => {
            createPlayingSession();
            gs.offerDraw('p1');
            // Decline first
            gs.respondToDraw('p2', false);
            // Try again same turn
            const result = gs.offerDraw('p1');
            expect(result.success).toBe(false);
            expect(result.error).toContain('Already offered');
        });

        it('accepting draw ends game', () => {
            createPlayingSession();
            gs.offerDraw('p1');
            const result = gs.respondToDraw('p2', true);

            expect(result.success).toBe(true);
            expect(result.session!.phase).toBe('finished');
            expect(result.session!.winner).toBeNull();
            expect(result.session!.winReason).toBe('draw_offer');
        });

        it('declining draw continues game', () => {
            const session = createPlayingSession();
            gs.offerDraw('p1');
            const result = gs.respondToDraw('p2', false);

            expect(result.success).toBe(true);
            expect(session.phase).toBe('playing');
        });
    });

    // =====================================================================
    // 2.14 — rematch
    // =====================================================================
    describe('rematch', () => {
        it('single request does not trigger rematch', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'finished';

            const result = gs.requestRematch('p1');
            expect(result.success).toBe(true);
            expect(result.bothRequested).toBe(false);
        });

        it('both requests trigger rematch', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'finished';

            gs.requestRematch('p1');
            const result = gs.requestRematch('p2');
            expect(result.success).toBe(true);
            expect(result.bothRequested).toBe(true);
        });

        it('resetGameForRematch clears board and resets to setup', () => {
            const session = gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            session.phase = 'finished';
            session.winner = 'red';
            session.winReason = 'king_captured';

            const result = gs.resetGameForRematch('s1');
            expect(result.success).toBe(true);

            const updated = gs.getSession('s1')!;
            expect(updated.phase).toBe('setup');
            expect(updated.currentTurn).toBeNull();
            expect(updated.players.red!.pieces.length).toBe(0);
            expect(updated.players.blue!.pieces.length).toBe(0);
            expect(updated.players.red!.isReady).toBe(false);
        });
    });

    // =====================================================================
    // 2.15 — disconnect / reconnect
    // =====================================================================
    describe('disconnect / reconnect', () => {
        it('handleDisconnect removes session and returns opponent', () => {
            gs.createSession('s1', 'p1', 'red', 'p2', 'blue');

            const result = gs.handleDisconnect('p1');
            expect(result).not.toBeNull();
            expect(result!.opponentId).toBe('p2');
            expect(gs.getSession('s1')).toBeUndefined();
        });

        it('handleTemporaryDisconnect starts grace period', () => {
            gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            gs.registerPlayer('player-1', 'p1');

            const onTimeout = vi.fn();
            const opponentId = gs.handleTemporaryDisconnect('p1', onTimeout);

            expect(opponentId).toBe('p2');
            expect(gs.isPlayerReconnecting('player-1')).toBe(true);

            // Clean up timer
            gs.handleReconnect('player-1', 'p1-new');
        });

        it('handleReconnect restores session with new socket', () => {
            gs.createSession('s1', 'p1', 'red', 'p2', 'blue');
            gs.registerPlayer('player-1', 'p1');
            gs.handleTemporaryDisconnect('p1', () => { });

            const result = gs.handleReconnect('player-1', 'p1-new');
            expect(result.success).toBe(true);
            expect(result.color).toBe('red');
            expect(result.session?.players.red?.socketId).toBe('p1-new');
            expect(gs.isPlayerReconnecting('player-1')).toBe(false);
        });
    });
});

// Helper
function session_winner(gs: GameService, id: string) {
    return gs.getSession(id)?.winner ?? null;
}
