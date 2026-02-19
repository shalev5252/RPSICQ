import { describe, it, expect, beforeEach } from 'vitest';
import { TttGameService } from '../services/TttGameService.js';

describe('TttGameService', () => {
    let svc: TttGameService;

    beforeEach(() => {
        svc = new TttGameService();
    });

    /** Helper: create a standard multiplayer session */
    function createSession(id = 's1') {
        return svc.createSession(id, 'sock-r', 'red', 'sock-b', 'blue');
    }

    /** Get the underlying game state */
    function state(id = 's1') {
        return svc.getSession(id)!.state;
    }

    /** Get which socket plays the given mark */
    function socketForMark(id: string, mark: 'X' | 'O'): string {
        const s = state(id);
        if (s.playerMarks.red === mark) return 'sock-r';
        return 'sock-b';
    }

    describe('createSession', () => {
        it('creates a session with empty board and X starting', () => {
            createSession();
            const s = state();
            expect(s.sessionId).toBe('s1');
            expect(s.board).toEqual(Array(9).fill(null));
            expect(s.currentTurn).toBe('X');
            expect(s.winner).toBeNull();
        });

        it('assigns one player X and the other O', () => {
            createSession();
            const s = state();
            const marks = new Set([s.playerMarks.red, s.playerMarks.blue]);
            expect(marks).toEqual(new Set(['X', 'O']));
        });
    });

    describe('makeMove', () => {
        it('places mark on valid empty cell and switches turn', () => {
            createSession();
            const xSocket = socketForMark('s1', 'X');
            const result = svc.makeMove('s1', xSocket, 4);
            expect(result.success).toBe(true);

            const s = state();
            expect(s.board[4]).toBe('X');
            expect(s.currentTurn).toBe('O');
        });

        it('rejects move on occupied cell', () => {
            createSession();
            const xSocket = socketForMark('s1', 'X');
            const oSocket = socketForMark('s1', 'O');
            svc.makeMove('s1', xSocket, 4);
            const result = svc.makeMove('s1', oSocket, 4);
            expect(result.success).toBe(false);
        });

        it('rejects move when not your turn', () => {
            createSession();
            const oSocket = socketForMark('s1', 'O');
            const result = svc.makeMove('s1', oSocket, 0);
            expect(result.success).toBe(false);
        });

        it('rejects out-of-range cell', () => {
            createSession();
            const xSocket = socketForMark('s1', 'X');
            const result = svc.makeMove('s1', xSocket, 9);
            expect(result.success).toBe(false);
        });
    });

    describe('win detection', () => {
        /** Play alternating moves: X at xMoves[0], O at oMoves[0], etc. */
        function playMoves(id: string, xMoves: number[], oMoves: number[]) {
            const xSocket = socketForMark(id, 'X');
            const oSocket = socketForMark(id, 'O');
            for (let i = 0; i < xMoves.length; i++) {
                svc.makeMove(id, xSocket, xMoves[i]);
                if (i < oMoves.length) {
                    svc.makeMove(id, oSocket, oMoves[i]);
                }
            }
        }

        it('detects horizontal win (top row)', () => {
            createSession();
            playMoves('s1', [0, 1, 2], [3, 4]);
            const s = state();
            expect(s.winner).toBe('X');
            expect(s.winningLine).toEqual([0, 1, 2]);
        });

        it('detects vertical win (left column)', () => {
            createSession();
            playMoves('s1', [0, 3, 6], [1, 4]);
            const s = state();
            expect(s.winner).toBe('X');
            expect(s.winningLine).toEqual([0, 3, 6]);
        });

        it('detects diagonal win', () => {
            createSession();
            playMoves('s1', [0, 4, 8], [1, 2]);
            const s = state();
            expect(s.winner).toBe('X');
            expect(s.winningLine).toEqual([0, 4, 8]);
        });

        it('detects O win', () => {
            createSession();
            // O wins middle row: 3, 4, 5
            playMoves('s1', [0, 6, 8], [3, 4, 5]);
            const s = state();
            expect(s.winner).toBe('O');
            expect(s.winningLine).toEqual([3, 4, 5]);
        });
    });

    describe('draw detection', () => {
        it('detects draw when board is full with no winner', () => {
            createSession();
            const xSocket = socketForMark('s1', 'X');
            const oSocket = socketForMark('s1', 'O');
            // Board: X O X / X X O / O X O  (draw)
            // Moves: X=0, O=1, X=2, O=5, X=3, O=6, X=4, O=8, X=7
            const xMoves = [0, 2, 3, 4, 7];
            const oMoves = [1, 5, 6, 8];
            for (let i = 0; i < xMoves.length; i++) {
                svc.makeMove('s1', xSocket, xMoves[i]);
                if (i < oMoves.length) {
                    svc.makeMove('s1', oSocket, oMoves[i]);
                }
            }
            const s = state();
            expect(s.winner).toBe('draw');
            expect(s.board.every(c => c !== null)).toBe(true);
        });
    });

    describe('rematch', () => {
        it('both requests create a new session', () => {
            createSession();
            const xSocket = socketForMark('s1', 'X');
            const oSocket = socketForMark('s1', 'O');
            // Play to a quick win
            const xMoves = [0, 1, 2];
            const oMoves = [3, 4];
            for (let i = 0; i < xMoves.length; i++) {
                svc.makeMove('s1', xSocket, xMoves[i]);
                if (i < oMoves.length) svc.makeMove('s1', oSocket, oMoves[i]);
            }

            svc.requestRematch('s1', 'sock-r');
            const result = svc.requestRematch('s1', 'sock-b');
            expect(result.bothReady).toBe(true);
            expect(result.newSession).toBeDefined();

            // New session has a clean board
            expect(result.newSession!.state.board).toEqual(Array(9).fill(null));
            expect(result.newSession!.state.winner).toBeNull();
        });
    });
});
