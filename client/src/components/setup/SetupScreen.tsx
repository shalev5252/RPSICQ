import React, { useState, useCallback, useMemo } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../store/gameStore';
import type { PieceType, Position, PlayerCellView, PlayerPieceView } from '@rps/shared';
import { SOCKET_EVENTS, RED_SETUP_ROWS, BLUE_SETUP_ROWS, BOARD_ROWS, BOARD_COLS } from '@rps/shared';
import { Board } from './Board';
import { PieceTray } from './PieceTray';
import './SetupScreen.css';

export const SetupScreen: React.FC = () => {
    const { socket } = useSocket();
    const myColor = useGameStore((state) => state.myColor);
    const setupState = useGameStore((state) => state.setupState);
    const setKingPosition = useGameStore((state) => state.setKingPosition);
    const setPitPosition = useGameStore((state) => state.setPitPosition);

    const [draggingPiece, setDraggingPiece] = useState<PieceType | null>(null);

    const validDropRows = myColor === 'red' ? RED_SETUP_ROWS : BLUE_SETUP_ROWS;

    const kingPlaced = setupState.kingPosition !== null;
    const pitPlaced = setupState.pitPosition !== null;
    const canReposition = !setupState.hasShuffled;

    // Merge local king/pit positions with server board to show pieces immediately
    const displayBoard = useMemo((): PlayerCellView[][] => {
        // Start with empty board or server board
        const baseBoard: PlayerCellView[][] = setupState.board.length > 0
            ? setupState.board.map(row => row.map(cell => ({ ...cell, piece: cell.piece ? { ...cell.piece } : null })))
            : Array(BOARD_ROWS).fill(null).map((_, row) =>
                Array(BOARD_COLS).fill(null).map((_, col) => ({
                    row,
                    col,
                    piece: null,
                }))
            );

        // If we haven't shuffled yet, overlay local king/pit positions
        if (!setupState.hasShuffled && myColor) {
            // Clear any existing king/pit from our color (to handle repositioning)
            for (const row of baseBoard) {
                for (const cell of row) {
                    if (cell.piece?.owner === myColor && (cell.piece.type === 'king' || cell.piece.type === 'pit')) {
                        cell.piece = null;
                    }
                }
            }

            // Add king at local position
            if (setupState.kingPosition) {
                const { row, col } = setupState.kingPosition;
                const kingPiece: PlayerPieceView = {
                    id: 'local-king',
                    owner: myColor,
                    type: 'king',
                    position: setupState.kingPosition,
                    isRevealed: false,
                    hasHalo: false,
                };
                baseBoard[row][col].piece = kingPiece;
            }

            // Add pit at local position
            if (setupState.pitPosition) {
                const { row, col } = setupState.pitPosition;
                const pitPiece: PlayerPieceView = {
                    id: 'local-pit',
                    owner: myColor,
                    type: 'pit',
                    position: setupState.pitPosition,
                    isRevealed: false,
                    hasHalo: false,
                };
                baseBoard[row][col].piece = pitPiece;
            }
        }

        return baseBoard;
    }, [setupState.board, setupState.kingPosition, setupState.pitPosition, setupState.hasShuffled, myColor]);

    const handleDragStart = useCallback((pieceType: PieceType) => {
        setDraggingPiece(pieceType);
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggingPiece(null);
    }, []);

    const handleCellDrop = useCallback((row: number, col: number) => {
        if (!draggingPiece || !socket || !myColor) return;

        const newPosition: Position = { row, col };

        if (draggingPiece === 'king') {
            if (setupState.pitPosition?.row === row && setupState.pitPosition?.col === col) {
                return;
            }
            setKingPosition(newPosition);
        } else if (draggingPiece === 'pit') {
            if (setupState.kingPosition?.row === row && setupState.kingPosition?.col === col) {
                return;
            }
            setPitPosition(newPosition);
        }

        setDraggingPiece(null);

        const kingPos = draggingPiece === 'king' ? newPosition : setupState.kingPosition;
        const pitPos = draggingPiece === 'pit' ? newPosition : setupState.pitPosition;

        if (kingPos && pitPos) {
            socket.emit(SOCKET_EVENTS.PLACE_KING_PIT, {
                kingPosition: kingPos,
                pitPosition: pitPos,
            });
        }
    }, [draggingPiece, socket, myColor, setupState.kingPosition, setupState.pitPosition, setKingPosition, setPitPosition]);

    const handlePieceDragFromBoard = useCallback((pieceType: PieceType) => {
        if (!canReposition) return;
        handleDragStart(pieceType);
    }, [canReposition, handleDragStart]);

    const handleShuffle = useCallback(() => {
        if (!socket) return;
        socket.emit(SOCKET_EVENTS.RANDOMIZE_PIECES);
    }, [socket]);

    const handleConfirm = useCallback(() => {
        if (!socket) return;
        socket.emit(SOCKET_EVENTS.CONFIRM_SETUP);
    }, [socket]);

    if (!myColor) {
        return <div className="setup-screen">Loading...</div>;
    }

    const canShuffle = kingPlaced && pitPlaced;
    const canConfirm = setupState.hasShuffled && !setupState.isReady;

    return (
        <div className="setup-screen">
            <div className="setup-screen__header">
                <h2 className="setup-screen__title">Setup Your Army</h2>
                <div className={`setup-screen__color setup-screen__color--${myColor}`}>
                    You are {myColor.toUpperCase()}
                </div>
            </div>

            <div className="setup-screen__content">
                <div className="setup-screen__tray">
                    <PieceTray
                        myColor={myColor}
                        kingPlaced={kingPlaced}
                        pitPlaced={pitPlaced}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    />
                </div>

                <div className="setup-screen__board-container">
                    <div className="setup-screen__board-label setup-screen__board-label--opponent">
                        Enemy Territory
                    </div>
                    <Board
                        board={displayBoard}
                        myColor={myColor}
                        validDropRows={draggingPiece ? validDropRows : []}
                        onCellDrop={handleCellDrop}
                        onPieceDrag={canReposition ? handlePieceDragFromBoard : undefined}
                        onPieceDragEnd={handleDragEnd}
                        draggablePieceTypes={canReposition ? ['king', 'pit'] : []}
                    />
                    <div className="setup-screen__board-label setup-screen__board-label--mine">
                        Your Territory
                    </div>
                </div>

                <div className="setup-screen__controls">
                    <button
                        className="setup-screen__btn setup-screen__btn--shuffle"
                        onClick={handleShuffle}
                        disabled={!canShuffle}
                    >
                        Shuffle Army
                    </button>
                    <button
                        className={`setup-screen__btn ${setupState.isReady ? 'setup-screen__btn--waiting' : 'setup-screen__btn--confirm'}`}
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                    >
                        {setupState.isReady ? 'Waiting...' : "Let's Start!"}
                    </button>

                    {setupState.opponentReady && (
                        <div className="setup-screen__opponent-ready">
                            Opponent is ready!
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
