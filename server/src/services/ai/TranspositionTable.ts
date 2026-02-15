import { GameState } from '@rps/shared';

/**
 * Transposition table entry.
 */
interface TTEntry {
    hash: number;
    checksum: number; // Secondary hash for collision verification
    depth: number;
    score: number;
    nodeType: 'exact' | 'max' | 'chance';
}

/**
 * Zobrist hashing-based transposition table for caching evaluated positions.
 * Uses XOR of pre-generated random keys per (row, col, pieceType, owner) to hash boards.
 * Fixed-size with replacement policy (prefer deeper evaluations).
 */
export class TranspositionTable {
    private table: Map<number, TTEntry>;
    private zobristKeys: number[][][]; // [row][col][pieceIndex] -> random key
    private zobristChecksumKeys: number[][][]; // Secondary keys for checksum
    private readonly maxSize: number;
    private readonly rows: number;
    private readonly cols: number;

    // Map piece types + owner to a unique index for Zobrist key lookup
    // 7 piece types × 2 owners = 14 indices
    private static readonly PIECE_TYPE_INDEX: Record<string, number> = {
        'king': 0, 'pit': 1, 'rock': 2, 'paper': 3,
        'scissors': 4, 'lizard': 5, 'spock': 6
    };

    constructor(rows: number, cols: number, maxSize: number = 50000) {
        this.rows = rows;
        this.cols = cols;
        this.maxSize = maxSize;
        this.table = new Map();

        // Pre-generate Zobrist keys: [row][col][pieceIndex (type*2 + owner)]
        // 14 possible piece+owner combos per cell
        this.zobristKeys = [];
        this.zobristChecksumKeys = [];

        for (let r = 0; r < rows; r++) {
            this.zobristKeys[r] = [];
            this.zobristChecksumKeys[r] = [];
            for (let c = 0; c < cols; c++) {
                this.zobristKeys[r][c] = [];
                this.zobristChecksumKeys[r][c] = [];
                for (let p = 0; p < 14; p++) {
                    // Generate pseudo-random 32-bit key using a simple LCG
                    // We use 32-bit to stay within JS safe integer for XOR
                    this.zobristKeys[r][c][p] = this.randomInt32();
                    this.zobristChecksumKeys[r][c][p] = this.randomInt32();
                }
            }
        }
    }

    /**
     * Compute Zobrist hash and checksum for the current board state.
     */
    public computeHash(gameState: GameState): { hash: number; checksum: number } {
        let h = 0;
        let c = 0;

        for (let r = 0; r < this.rows && r < gameState.board.length; r++) {
            for (let cCol = 0; cCol < this.cols && cCol < gameState.board[r].length; cCol++) {
                const piece = gameState.board[r][cCol].piece;
                if (piece) {
                    const typeIndex = TranspositionTable.PIECE_TYPE_INDEX[piece.type] ?? 0;
                    const ownerOffset = piece.owner === 'red' ? 0 : 7;
                    const pieceIndex = typeIndex + ownerOffset;
                    h ^= this.zobristKeys[r][cCol][pieceIndex];
                    c ^= this.zobristChecksumKeys[r][cCol][pieceIndex];
                }
            }
        }

        // Include current turn in hash
        if (gameState.currentTurn) {
            const turnKey = gameState.currentTurn === 'red' ? 0x12345678 : 0x87654321;
            const turnChecksum = gameState.currentTurn === 'red' ? 0xABCDEF01 : 0x10FEDCBA;
            h ^= turnKey;
            c ^= turnChecksum;
        }

        return { hash: h, checksum: c };
    }

    /**
     * Legacy hash method for compatibility (wraps computeHash).
     */
    public hash(gameState: GameState): number {
        return this.computeHash(gameState).hash;
    }

    /**
     * Look up a cached position. Returns the entry if found at sufficient depth.
     * Validates against checksum to avoid collisions.
     */
    public get(hash: number, depth: number, checksum?: number): TTEntry | null {
        const entry = this.table.get(hash);
        if (entry && entry.hash === hash && entry.depth >= depth) {
            // If checksum provided, verify it matches
            if (checksum !== undefined && entry.checksum !== checksum) {
                return null; // Collision detected
            }
            return entry;
        }
        return null;
    }

    /**
     * Store a position evaluation in the table.
     * Replaces existing entries if the new evaluation is at a deeper depth.
     */
    public set(hash: number, checksum: number, depth: number, score: number, nodeType: 'exact' | 'max' | 'chance'): void {
        const existing = this.table.get(hash);

        // Replace if: entry doesn't exist, or new evaluation is deeper
        if (!existing || depth >= existing.depth) {
            // Evict if at capacity (simple: delete oldest via iterator)
            if (!existing && this.table.size >= this.maxSize) {
                const firstKey = this.table.keys().next().value;
                if (firstKey !== undefined) {
                    this.table.delete(firstKey);
                }
            }

            this.table.set(hash, { hash, checksum, depth, score, nodeType });
        }
    }

    /**
     * Clear all cached positions. Called at the start of each findBestMove().
     */
    public clear(): void {
        this.table.clear();
    }

    /**
     * Get the current number of cached positions.
     */
    public get size(): number {
        return this.table.size;
    }

    /**
     * Generate a pseudo-random 32-bit integer for Zobrist keys.
     */
    private randomInt32(): number {
        // Use Math.random for simplicity — keys are generated once at construction
        return (Math.random() * 0x100000000) >>> 0;
    }
}

// Singleton accessor: create TT instances per board configuration
const ttInstances = new Map<string, TranspositionTable>();

export function getTranspositionTable(rows: number, cols: number): TranspositionTable {
    const key = `${rows}x${cols}`;
    let tt = ttInstances.get(key);
    if (!tt) {
        tt = new TranspositionTable(rows, cols);
        ttInstances.set(key, tt);
    }
    return tt;
}
