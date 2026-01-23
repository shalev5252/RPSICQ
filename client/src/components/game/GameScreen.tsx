import React, { useState, useCallback } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../store/gameStore';
import type { PieceType, Position, PlayerPieceView } from '@rps/shared';
import { SOCKET_EVENTS, BOARD_ROWS, BOARD_COLS, MOVEMENT_DIRECTIONS } from '@rps/shared';
import { Board } from '../setup/Board';
import { TieBreakerModal } from './TieBreakerModal';
import './GameScreen.css';

export const GameScreen: React.FC = () => {
    const { socket } = useSocket();
    const myColor = useGameStore((state) => state.myColor);
    const gameState = useGameStore((state) => state.gameState);
    const [selectedPiece, setSelectedPiece] = useState<{ id: string; position: Position } | null>(null);
    const [validMoves, setValidMoves] = useState<Position[]>([]);

    const isMyTurn = gameState?.currentTurn === myColor;
    const board = gameState?.board ?? [];
    const isTieBreaker = gameState?.phase === 'tie_breaker';

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
            return;
        }

        // Check if valid move
        const isValid = validMoves.some(m => m.row === to.row && m.col === to.col);
        if (!isValid) {
            setSelectedPiece(null);
            setValidMoves([]);
            return;
        }

        // Emit move
        socket.emit(SOCKET_EVENTS.MAKE_MOVE, { from, to });

        setSelectedPiece(null);
        setValidMoves([]);
    }, [socket, selectedPiece, isMyTurn, validMoves]);

    const handleDragEnd = useCallback(() => {
        setSelectedPiece(null);
        setValidMoves([]);
    }, []);

    // validMoves already contains exact Position[]

    // Get draggable piece types (movable pieces during player's turn)
    const draggablePieceTypes: PieceType[] = isMyTurn
        ? ['rock', 'paper', 'scissors']
        : [];

    if (!myColor) {
        return <div className="game-screen">Loading...</div>;
    }

    return (
        <div className="game-screen">
            <div className="game-screen__header">
                <div className={`game-screen__turn-indicator ${isMyTurn ? 'game-screen__turn-indicator--my-turn' : 'game-screen__turn-indicator--opponent-turn'}`}>
                    {isMyTurn ? "🎯 Your Turn!" : "⏳ Opponent's Turn"}
                </div>
                <div className={`game-screen__color game-screen__color--${myColor}`}>
                    You are {myColor.toUpperCase()}
                </div>
            </div>

            <div className="game-screen__board-container">
                <Board
                    board={board}
                    myColor={myColor}
                    validDropCells={validMoves}
                    onCellDrop={handleCellDrop}
                    onPieceDrag={isMyTurn ? handlePieceDrag : undefined}
                    onPieceDragEnd={handleDragEnd}
                    draggablePieceTypes={draggablePieceTypes}
                />
            </div>

            {isTieBreaker && <TieBreakerModal />}
        </div>
    );
};
