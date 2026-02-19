/**
 * AI Win Rate Simulation
 *
 * Tests the new Expectimax+Bayesian AI against:
 *   1. Random opponent
 *   2. Greedy heuristic opponent (old AI logic)
 *
 * Run with: npx tsx server/src/simulate.ts [numGames]
 */

import { GameService } from './services/GameService.js';
import {
    BOARD_CONFIG,
    GameMode,
    RpsGameMode,
    GameState,
    PlayerColor,
    Piece,
    Position,
    RPSLS_WINS
} from '@rps/shared';

// ================================================================
// Types
// ================================================================

type OpponentStrategy = 'random' | 'greedy';

interface SimulationResult {
    totalGames: number;
    aiWins: number;
    humanWins: number;
    draws: number;
    errors: number;
    avgTurns: number;
}

// ================================================================
// Greedy heuristic opponent (mirrors the OLD AIOpponentService logic)
// ================================================================

function greedySelectMove(
    gameState: GameState,
    color: PlayerColor,
    socketId: string,
    gameService: GameService
): { from: Position; to: Position } | null {
    const config = BOARD_CONFIG[gameState.gameMode as RpsGameMode];
    const player = gameState.players[color];
    if (!player) return null;

    const opponentColor: PlayerColor = color === 'red' ? 'blue' : 'red';
    const opponentPieces = gameState.players[opponentColor]?.pieces || [];

    // Emergency check: king threats
    const ownKing = player.pieces.find(p => p.type === 'king');
    const threatsToKing: Piece[] = [];
    if (ownKing) {
        for (const op of opponentPieces) {
            const dist = Math.abs(op.position.row - ownKing.position.row) +
                Math.abs(op.position.col - ownKing.position.col);
            if (dist === 1) {
                const opType = op.isRevealed ? op.type : null;
                if (!opType || (opType !== 'king' && opType !== 'pit')) {
                    threatsToKing.push(op);
                }
            }
        }
    }

    const candidates: { from: Position; to: Position; score: number }[] = [];

    for (const piece of player.pieces) {
        if (piece.type === 'king' || piece.type === 'pit') continue;

        const validMoves = gameService.getValidMoves(socketId, piece.id);
        for (const to of validMoves) {
            const score = greedyScoreMove(
                piece, to, gameState, color, opponentColor, config,
                threatsToKing, opponentPieces, ownKing
            );
            candidates.push({ from: { ...piece.position }, to, score });
        }
    }

    if (candidates.length === 0) return null;

    candidates.sort((a, b) => b.score - a.score);

    // Same imperfection as old AI: 5% chance pick non-best
    if (candidates.length > 1 && Math.random() < 0.05) {
        const pool = candidates.slice(1, Math.max(2, Math.ceil(candidates.length / 2)));
        return pool[Math.floor(Math.random() * pool.length)];
    }

    const topScore = candidates[0].score;
    const topTier = candidates.filter(c => c.score >= topScore - 5);
    return topTier[Math.floor(Math.random() * topTier.length)];
}

function greedyScoreMove(
    piece: Piece,
    to: Position,
    gameState: GameState,
    color: PlayerColor,
    opponentColor: PlayerColor,
    config: { rows: number; cols: number },
    threatsToKing: Piece[],
    opponentPieces: Piece[],
    ownKing: Piece | undefined
): number {
    let score = 0;
    const targetCell = gameState.board[to.row][to.col];
    let isMovingToSafety = true;

    // Emergency: capture threat
    if (threatsToKing.length > 0 && piece.type !== 'king') {
        const capturesThreat = threatsToKing.some(t =>
            t.position.row === to.row && t.position.col === to.col
        );
        if (capturesThreat) score += 2000;
    }

    // Combat risk
    if (targetCell.piece && targetCell.piece.owner !== color) {
        const defender = targetCell.piece;
        const knownType = defender.isRevealed ? defender.type : null;
        if (knownType) {
            if (knownType === 'king') score += 200;
            else if (knownType === 'pit') return -1000;
            else {
                const wins = RPSLS_WINS[piece.type];
                if (wins && wins.includes(knownType)) score += 40;
                else {
                    const theirWins = RPSLS_WINS[knownType];
                    if (theirWins && theirWins.includes(piece.type)) score -= 30;
                    else score += 5;
                }
            }
        } else {
            score += 8; // unknown: slight positive bias
        }
    }

    // Forward progression
    const forwardDirection = color === 'red' ? 1 : -1;
    const forwardProgress = to.row * forwardDirection;
    score += Math.abs(forwardProgress) * 8;

    // Infiltration
    const isRed = color === 'red';
    const isInEnemyHalf = isRed ? to.row >= 3 : to.row <= 2;
    if (isInEnemyHalf) {
        score += 20;
        const isInEnemyBase = isRed ? to.row >= 4 : to.row <= 1;
        if (isInEnemyBase) score += 30;
    }

    // Center control
    const centerCol = (config.cols - 1) / 2;
    const centerRow = (config.rows - 1) / 2;
    const distFromCenter = Math.abs(to.col - centerCol) + Math.abs(to.row - centerRow);
    score += Math.max(0, 5 - distFromCenter);

    // King protection
    if (ownKing) {
        const distFromOwnKing = Math.abs(to.row - ownKing.position.row) +
            Math.abs(to.col - ownKing.position.col);
        if (distFromOwnKing <= 3) score += 3;
    }

    // Threat assessment
    for (const op of opponentPieces) {
        if (op.type === 'king' || op.type === 'pit') continue;
        const dist = Math.abs(op.position.row - to.row) + Math.abs(op.position.col - to.col);
        if (dist === 1) {
            const opType = op.isRevealed ? op.type : null;
            let threatLevel = 0;
            if (opType) {
                const theirWins = RPSLS_WINS[opType];
                if (theirWins && theirWins.includes(piece.type)) {
                    threatLevel = piece.type === 'king' ? 1000 : 300;
                } else if (opType === piece.type) {
                    threatLevel = 20;
                } else {
                    threatLevel = -10;
                }
            } else {
                threatLevel = piece.type === 'king' ? 500 : 10;
            }
            if (threatLevel >= 100) isMovingToSafety = false;
            score -= threatLevel;
        }
    }

    // Emergency king escape
    if (threatsToKing.length > 0 && piece.type === 'king' && isMovingToSafety) {
        score += 2000;
    }

    return score;
}

// ================================================================
// Game simulation
// ================================================================

function simulateGame(
    gameMode: GameMode,
    opponentStrategy: OpponentStrategy,
    maxTurns: number = 200
): { winner: 'ai' | 'human' | 'draw' | 'error'; turns: number } {
    const gameService = new GameService();

    const humanSocketId = 'sim-human-socket';
    const humanPlayerId = 'sim-human-player';
    const session = gameService.createSingleplayerSession(humanSocketId, humanPlayerId, gameMode);
    const sessionId = session.sessionId;

    const config = BOARD_CONFIG[gameMode as RpsGameMode];
    const humanSetupRows = [0, 1];

    // Human setup: strategic king placement (back row center, pit front row)
    const kingRow = humanSetupRows[0]; // back row
    const kingCol = 1 + Math.floor(Math.random() * (config.cols - 2));
    const pitRow = humanSetupRows[1]; // front row
    const pitOffset = Math.random() < 0.5 ? -1 : 1;
    let pitCol = Math.min(Math.max(0, kingCol + pitOffset), config.cols - 1);
    if (pitRow === kingRow && pitCol === kingCol) {
        pitCol = (pitCol + 1) % config.cols;
    }

    const placeResult = gameService.placeKingPit(
        humanSocketId,
        { row: kingRow, col: kingCol },
        { row: pitRow, col: pitCol }
    );
    if (!placeResult.success) return { winner: 'error', turns: 0 };

    const shuffleResult = gameService.randomizePieces(humanSocketId);
    if (!shuffleResult.success) return { winner: 'error', turns: 0 };

    const aiSetupResult = gameService.performAISetup(sessionId);
    if (!aiSetupResult.success) return { winner: 'error', turns: 0 };

    const confirmResult = gameService.confirmSetup(humanSocketId);
    if (!confirmResult.success || !confirmResult.bothReady) return { winner: 'error', turns: 0 };

    const currentSession = gameService.getSession(sessionId);
    if (!currentSession) return { winner: 'error', turns: 0 };
    gameService.aiService.initializeTracking(sessionId, currentSession);

    let turns = 0;

    while (turns < maxTurns) {
        const sess = gameService.getSession(sessionId);
        if (!sess || sess.phase === 'finished') break;
        if (sess.phase !== 'playing') break;

        const currentTurn = sess.currentTurn;
        if (!currentTurn) break;

        const aiColor = gameService.getAIColor(sessionId);
        const aiSocketId = gameService.getAISocketId(sessionId);
        if (!aiColor || !aiSocketId) break;

        if (currentTurn === aiColor) {
            // New AI's turn (Expectimax)
            const move = gameService.aiService.selectMove(sess, aiColor);
            if (!move) {
                gameService.skipTurn(aiSocketId);
                if (gameService.checkDraw(sessionId)) { gameService.setDraw(sessionId); break; }
                turns++;
                continue;
            }
            const moveResult = gameService.makeMove(aiSocketId, move.from, move.to);
            if (!moveResult.success) { gameService.skipTurn(aiSocketId); turns++; continue; }

            const afterSess = gameService.getSession(sessionId);
            if (afterSess?.phase === 'tie_breaker') {
                resolveTieBreaker(gameService, sessionId, humanSocketId, aiSocketId);
            }
        } else {
            // Opponent's turn
            if (!gameService.hasMovablePieces(humanSocketId)) {
                gameService.skipTurn(humanSocketId);
                if (gameService.checkDraw(sessionId)) { gameService.setDraw(sessionId); break; }
                turns++;
                continue;
            }

            let moved = false;
            if (opponentStrategy === 'greedy') {
                const greedyMove = greedySelectMove(sess, currentTurn, humanSocketId, gameService);
                if (greedyMove) {
                    const result = gameService.makeMove(humanSocketId, greedyMove.from, greedyMove.to);
                    moved = result.success;
                }
            } else {
                moved = makeRandomMove(gameService, sess, humanSocketId, currentTurn);
            }

            if (!moved) { gameService.skipTurn(humanSocketId); turns++; continue; }

            const afterSess = gameService.getSession(sessionId);
            if (afterSess?.phase === 'tie_breaker') {
                resolveTieBreaker(gameService, sessionId, humanSocketId, aiSocketId!);
            }
        }

        const postSess = gameService.getSession(sessionId);
        if (postSess?.phase === 'playing' && gameService.checkDraw(sessionId)) {
            gameService.setDraw(sessionId);
            break;
        }

        turns++;
    }

    const finalSess = gameService.getSession(sessionId);
    if (!finalSess) return { winner: 'error', turns };

    if (finalSess.phase === 'finished') {
        if (finalSess.winner === null || finalSess.winReason === 'draw') {
            return { winner: 'draw', turns };
        }
        const aiColor = gameService.getAIColor(sessionId);
        return { winner: finalSess.winner === aiColor ? 'ai' : 'human', turns };
    }

    return { winner: 'draw', turns };
}

function makeRandomMove(
    gameService: GameService,
    session: GameState,
    socketId: string,
    color: PlayerColor
): boolean {
    const player = session.players[color];
    if (!player) return false;

    const movablePieces = player.pieces.filter(p => p.type !== 'king' && p.type !== 'pit');
    for (let i = movablePieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [movablePieces[i], movablePieces[j]] = [movablePieces[j], movablePieces[i]];
    }

    for (const piece of movablePieces) {
        const validMoves = gameService.getValidMoves(socketId, piece.id);
        if (validMoves.length > 0) {
            const to = validMoves[Math.floor(Math.random() * validMoves.length)];
            return gameService.makeMove(socketId, piece.position, to).success;
        }
    }
    return false;
}

function resolveTieBreaker(
    gameService: GameService,
    sessionId: string,
    humanSocketId: string,
    aiSocketId: string
): void {
    let attempts = 0;
    while (attempts < 20) {
        const sess = gameService.getSession(sessionId);
        if (!sess || sess.phase !== 'tie_breaker') break;

        const elements = sess.gameMode === 'rpsls'
            ? ['rock', 'paper', 'scissors', 'lizard', 'spock'] as const
            : ['rock', 'paper', 'scissors'] as const;
        const humanChoice = elements[Math.floor(Math.random() * elements.length)];
        gameService.submitTieBreakerChoice(humanSocketId, humanChoice);

        const aiResult = gameService.performAITieBreakerChoice(sessionId);
        if (aiResult.success && aiResult.choice) {
            const result = gameService.submitTieBreakerChoice(aiSocketId, aiResult.choice);
            if (result.bothChosen && !result.isTieAgain) break;
        }
        attempts++;
    }
}

// ================================================================
// Runner
// ================================================================

function runSimulation(
    numGames: number,
    gameMode: GameMode,
    strategy: OpponentStrategy
): SimulationResult {
    let aiWins = 0, humanWins = 0, draws = 0, errors = 0, totalTurns = 0;

    for (let i = 0; i < numGames; i++) {
        const result = simulateGame(gameMode, strategy);
        switch (result.winner) {
            case 'ai': aiWins++; break;
            case 'human': humanWins++; break;
            case 'draw': draws++; break;
            case 'error': errors++; break;
        }
        totalTurns += result.turns;
        if ((i + 1) % 10 === 0) process.stdout.write(`  ${i + 1}/${numGames}\r`);
    }
    return { totalGames: numGames, aiWins, humanWins, draws, errors, avgTurns: totalTurns / numGames };
}

function printResults(label: string, r: SimulationResult): void {
    const w = ((r.aiWins / r.totalGames) * 100).toFixed(1);
    const l = ((r.humanWins / r.totalGames) * 100).toFixed(1);
    const d = ((r.draws / r.totalGames) * 100).toFixed(1);
    originalLog(`\n=== ${label} ===`);
    originalLog(`Games:      ${r.totalGames}`);
    originalLog(`AI wins:    ${r.aiWins} (${w}%)`);
    originalLog(`Opp wins:   ${r.humanWins} (${l}%)`);
    originalLog(`Draws:      ${r.draws} (${d}%)`);
    originalLog(`Errors:     ${r.errors}`);
    originalLog(`Avg turns:  ${r.avgTurns.toFixed(1)}`);
}

// ================================================================
// Main
// ================================================================

const NUM_GAMES = parseInt(process.argv[2] || '100', 10);

const originalLog = console.log;
const originalError = console.error;
console.log = () => { };
console.error = () => { };

originalLog(`\n  AI Win Rate Simulation (${NUM_GAMES} games per matchup)\n`);
originalLog('  Expectimax+Bayesian AI (blue) vs opponent (red)\n');

// --- vs Random ---
originalLog('Running: Classic vs Random...');
const cr = runSimulation(NUM_GAMES, 'classic', 'random');
printResults('Classic vs Random', cr);

originalLog('\nRunning: RPSLS vs Random...');
const rr = runSimulation(NUM_GAMES, 'rpsls', 'random');
printResults('RPSLS vs Random', rr);

// --- vs Greedy ---
originalLog('\nRunning: Classic vs Greedy...');
const cg = runSimulation(NUM_GAMES, 'classic', 'greedy');
printResults('Classic vs Greedy', cg);

originalLog('\nRunning: RPSLS vs Greedy...');
const rg = runSimulation(NUM_GAMES, 'rpsls', 'greedy');
printResults('RPSLS vs Greedy', rg);

// Summary
originalLog('\n========================================');
originalLog('  SUMMARY');
originalLog('========================================');
originalLog(`  vs Random (classic):  ${((cr.aiWins / cr.totalGames) * 100).toFixed(0)}% win`);
originalLog(`  vs Random (rpsls):    ${((rr.aiWins / rr.totalGames) * 100).toFixed(0)}% win`);
originalLog(`  vs Greedy (classic):  ${((cg.aiWins / cg.totalGames) * 100).toFixed(0)}% win`);
originalLog(`  vs Greedy (rpsls):    ${((rg.aiWins / rg.totalGames) * 100).toFixed(0)}% win`);
originalLog('========================================\n');

console.log = originalLog;
console.error = originalError;
