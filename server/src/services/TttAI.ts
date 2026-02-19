import type { TttCell, TttMark, TttDifficulty } from '@rps/shared';

/**
 * Tic Tac Toe AI with three difficulty levels.
 * - Easy: random moves
 * - Medium: minimax depth-3 with 30% suboptimal chance
 * - Hard: full minimax + alpha-beta pruning (never loses)
 */
export class TttAI {

    public selectMove(board: TttCell[], mark: TttMark, difficulty: TttDifficulty): number {
        switch (difficulty) {
            case 'easy':
                return this.randomMove(board);
            case 'medium':
                return this.mediumMove(board, mark);
            case 'hard':
                return this.bestMove(board, mark);
        }
    }

    // ---------------------------------------------------------------
    // Easy: random empty cell
    // ---------------------------------------------------------------

    private randomMove(board: TttCell[]): number {
        const empty = board.map((c, i) => c === null ? i : -1).filter(i => i >= 0);
        return empty[Math.floor(Math.random() * empty.length)];
    }

    // ---------------------------------------------------------------
    // Medium: minimax at depth 3 with 30% suboptimal chance
    // ---------------------------------------------------------------

    private mediumMove(board: TttCell[], mark: TttMark): number {
        // 30% chance → pick a random move
        if (Math.random() < 0.3) {
            return this.randomMove(board);
        }
        // Otherwise use depth-limited minimax
        return this.minimaxMove(board, mark, 3);
    }

    // ---------------------------------------------------------------
    // Hard: full minimax with alpha-beta (optimal, never loses)
    // ---------------------------------------------------------------

    private bestMove(board: TttCell[], mark: TttMark): number {
        return this.minimaxMove(board, mark, Infinity);
    }

    // ---------------------------------------------------------------
    // Minimax engine
    // ---------------------------------------------------------------

    private minimaxMove(board: TttCell[], aiMark: TttMark, maxDepth: number): number {
        const opponent: TttMark = aiMark === 'X' ? 'O' : 'X';
        let bestScore = -Infinity;
        let bestMoves: number[] = [];

        for (let i = 0; i < 9; i++) {
            if (board[i] !== null) continue;
            board[i] = aiMark;
            const score = this.minimax(board, 0, false, aiMark, opponent, maxDepth, -Infinity, Infinity);
            board[i] = null;

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [i];
            } else if (score === bestScore) {
                bestMoves.push(i);
            }
        }

        // Among best moves, pick randomly for variety
        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    private minimax(
        board: TttCell[],
        depth: number,
        isMaximizing: boolean,
        aiMark: TttMark,
        opponent: TttMark,
        maxDepth: number,
        alpha: number,
        beta: number
    ): number {
        // Terminal checks
        if (this.hasWon(board, aiMark)) return 10 - depth;
        if (this.hasWon(board, opponent)) return depth - 10;
        if (board.every(c => c !== null) || depth >= maxDepth) return 0;

        if (isMaximizing) {
            let best = -Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] !== null) continue;
                board[i] = aiMark;
                best = Math.max(best, this.minimax(board, depth + 1, false, aiMark, opponent, maxDepth, alpha, beta));
                board[i] = null;
                alpha = Math.max(alpha, best);
                if (beta <= alpha) break;
            }
            return best;
        } else {
            let best = Infinity;
            for (let i = 0; i < 9; i++) {
                if (board[i] !== null) continue;
                board[i] = opponent;
                best = Math.min(best, this.minimax(board, depth + 1, true, aiMark, opponent, maxDepth, alpha, beta));
                board[i] = null;
                beta = Math.min(beta, best);
                if (beta <= alpha) break;
            }
            return best;
        }
    }

    private static readonly WIN_LINES: number[][] = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
    ];

    private hasWon(board: TttCell[], mark: TttMark): boolean {
        return TttAI.WIN_LINES.some(line => line.every(i => board[i] === mark));
    }
}
