import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../store/gameStore';
import type { PieceType, Position, PlayerPieceView } from '@rps/shared';
import { SOCKET_EVENTS, BOARD_ROWS, BOARD_COLS, MOVEMENT_DIRECTIONS } from '@rps/shared';
import { Board } from '../setup/Board';
import { TieBreakerModal } from './TieBreakerModal';
import { TurnSkippedModal } from './TurnSkippedModal';
import { RulesModal } from './RulesModal';
import './GameScreen.css';

export const GameScreen: React.FC = () => {
    const { socket } = useSocket();
    const myColor = useGameStore((state) => state.myColor);
    const gameState = useGameStore((state) => state.gameState);
    const gameMode = useGameStore((state) => state.gameMode);
    const [selectedPiece, setSelectedPiece] = useState<{ id: string; position: Position } | null>(null);
    const [validMoves, setValidMoves] = useState<Position[]>([]);
    const [showRules, setShowRules] = useState(false);
    // Click-to-move state for double-click detection
    const [lastClickTime, setLastClickTime] = useState<number>(0);
    const [lastClickedCell, setLastClickedCell] = useState<Position | null>(null);

    const isMyTurn = gameState?.currentTurn === myColor;
    const board = gameState?.board ?? [];
    const isTieBreaker = gameState?.phase === 'tie_breaker';
    const combatPosition = gameState?.combatPosition ?? null;
    const combatPieceType = gameState?.combatPieceType ?? null;
    const showTurnSkipped = useGameStore((state) => state.showTurnSkipped);
    const setShowTurnSkipped = useGameStore((state) => state.setShowTurnSkipped);
    const opponentReconnecting = useGameStore((state) => state.opponentReconnecting);

    // Calculate valid moves for a piece
    const calculateValidMoves = useCallback((piece: PlayerPieceView): Position[] => {
        if (!piece || piece.owner !== myColor) return [];
        if (piece.type === 'king' || piece.type === 'pit' || piece.type === 'hidden') return [];

        const moves: Position[] = [];
        const { row, col } = piece.position;

        for (const dir of MOVEMENT_DIRECTIONS) {
            const newRow = row + dir.row;
            const newCol = col + dir.col;

            if (newRow < 0 || newRow >= BOARD_ROWS || newCol < 0 || newCol >= BOARD_COLS) {
                continue;
            }

            const targetCell = board[newRow]?.[newCol];
            if (!targetCell) continue;

            // Can move to empty or enemy cell
            if (!targetCell.piece || targetCell.piece.owner !== myColor) {
                moves.push({ row: newRow, col: newCol });
            }
        }

        return moves;
    }, [board, myColor]);

    const handlePieceDrag = useCallback((pieceType: PieceType, pieceRow: number, pieceCol: number) => {
        if (!isMyTurn) return;

        // Find the piece at the specific position
        const cell = board[pieceRow]?.[pieceCol];
        if (cell?.piece?.owner === myColor && cell.piece.type === pieceType) {
            const moves = calculateValidMoves(cell.piece);
            setSelectedPiece({ id: cell.piece.id, position: { row: pieceRow, col: pieceCol } });
            setValidMoves(moves);
        }
    }, [isMyTurn, board, myColor, calculateValidMoves]);

    const handleCellDrop = useCallback((row: number, col: number) => {
        if (!socket || !selectedPiece || !isMyTurn) return;

        const from = selectedPiece.position;
        const to = { row, col };

        // Dropped on same cell - cancel
        if (from.row === to.row && from.col === to.col) {
            setSelectedPiece(null);
            setValidMoves([]);
            setLastClickTime(0);
            setLastClickedCell(null);
            return;
        }

        // Check if valid move
        const isValid = validMoves.some(m => m.row === to.row && m.col === to.col);
        if (!isValid) {
            setSelectedPiece(null);
            setValidMoves([]);
            setLastClickTime(0);
            setLastClickedCell(null);
            return;
        }

        // Emit move
        socket.emit(SOCKET_EVENTS.MAKE_MOVE, { from, to });

        setSelectedPiece(null);
        setValidMoves([]);
        setLastClickTime(0);
        setLastClickedCell(null);
    }, [socket, selectedPiece, isMyTurn, validMoves]);

    // Helper to clear all selection state
    const clearSelection = useCallback(() => {
        setSelectedPiece(null);
        setValidMoves([]);
        setLastClickTime(0);
        setLastClickedCell(null);
    }, []);

    // Helper to check if a piece is movable
    const isMovablePiece = useCallback((piece: PlayerPieceView): boolean => {
        return piece.owner === myColor &&
            piece.type !== 'king' &&
            piece.type !== 'pit' &&
            piece.type !== 'hidden';
    }, [myColor]);

    // Handle cell click for click-to-move feature
    const handleCellClick = useCallback((row: number, col: number) => {
        if (!isMyTurn || !socket) return;

        const now = Date.now();
        const cell = board[row]?.[col];

        // Check for valid move cell
        const isValidMoveCell = validMoves.some(m => m.row === row && m.col === col);
        const isSameCell = lastClickedCell?.row === row && lastClickedCell?.col === col;
        const isDoubleClick = isSameCell && (now - lastClickTime < 400);

        // Mobile detection: single click moves on small screens (no drag available)
        const isMobile = window.innerWidth <= 767;

        // Execute move on: double-click (desktop) OR single click on valid move (mobile)
        if (isValidMoveCell && selectedPiece && (isDoubleClick || isMobile)) {
            const from = selectedPiece.position;
            const to = { row, col };
            socket.emit(SOCKET_EVENTS.MAKE_MOVE, { from, to });
            clearSelection();
            return;
        }

        // Update click tracking for next potential double-click
        setLastClickTime(now);
        setLastClickedCell({ row, col });

        // Check if clicking on own movable piece
        if (cell?.piece && isMovablePiece(cell.piece)) {
            // Toggle selection if clicking same piece
            if (selectedPiece?.id === cell.piece.id) {
                clearSelection();
            } else {
                // Select new piece
                const moves = calculateValidMoves(cell.piece);
                setSelectedPiece({ id: cell.piece.id, position: { row, col } });
                setValidMoves(moves);
            }
        } else if (!isValidMoveCell) {
            // Clicked on invalid cell (not a valid move) - clear selection
            clearSelection();
        }
        // If clicking on valid move cell, don't clear - wait for potential double-click
    }, [isMyTurn, socket, board, validMoves, lastClickedCell, lastClickTime, selectedPiece, calculateValidMoves, clearSelection, isMovablePiece]);

    const handleDragEnd = useCallback(() => {
        clearSelection();
    }, [clearSelection]);

    // validMoves already contains exact Position[]

    // Get draggable piece types (movable pieces during player's turn)
    const draggablePieceTypes: PieceType[] = isMyTurn
        ? ['rock', 'paper', 'scissors', 'lizard', 'spock']
        : [];

    const { t } = useTranslation();

    if (!myColor) {
        return <div className="game-screen">{t('setup.loading')}</div>;
    }

    return (
        <div className="game-screen">
            <div className="game-screen__header">
                <button
                    className="game-screen__rules-btn"
                    onClick={() => setShowRules(true)}
                    title={t('game.rules_title')}
                >
                    ℹ️
                </button>
                <div className={`game-screen__turn-indicator ${isMyTurn ? 'game-screen__turn-indicator--my-turn' : 'game-screen__turn-indicator--opponent-turn'}`}>
                    {isMyTurn ? t('game.your_turn') : t('game.opponent_turn')}
                </div>
                <div className={`game-screen__color game-screen__color--${myColor}`}>
                    {t('setup.you_are', { color: t(`colors.${myColor}`) })}
                </div>
            </div>

            {opponentReconnecting && (
                <div className="game-screen__reconnecting-banner">
                    <div className="game-screen__reconnecting-spinner"></div>
                    {t('game.opponent_reconnecting')}
                </div>
            )}

            <div className="game-screen__board-container">
                <Board
                    board={board}
                    myColor={myColor}
                    validDropCells={validMoves}
                    onCellDrop={handleCellDrop}
                    onPieceDrag={isMyTurn ? handlePieceDrag : undefined}
                    onPieceDragEnd={handleDragEnd}
                    draggablePieceTypes={draggablePieceTypes}
                    onCellClick={isMyTurn ? handleCellClick : undefined}
                    selectedPiecePosition={selectedPiece?.position ?? null}
                    combatPosition={combatPosition}
                    combatPieceType={combatPieceType}
                />
            </div>

            {isTieBreaker && <TieBreakerModal />}
            {showTurnSkipped && (
                <TurnSkippedModal onComplete={() => setShowTurnSkipped(false)} />
            )}

            <RulesModal
                isOpen={showRules}
                onClose={() => setShowRules(false)}
                gameMode={gameMode}
            />
        </div>
    );
};
