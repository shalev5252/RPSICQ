import React from 'react';
import type { PlayerCellView, PlayerColor, PieceType } from '@rps/shared';
import { BOARD_ROWS, BOARD_COLS, RED_SETUP_ROWS, BLUE_SETUP_ROWS } from '@rps/shared';
import { Cell } from './Cell';
import './Board.css';

interface BoardProps {
    board: PlayerCellView[][];
    myColor: PlayerColor;
    validDropRows: number[];
    onCellDrop?: (row: number, col: number) => void;
    onPieceDrag?: (pieceType: PieceType) => void;
    onPieceDragEnd?: () => void;
    draggablePieceTypes?: PieceType[];
}

export const Board: React.FC<BoardProps> = ({
    board,
    myColor,
    validDropRows,
    onCellDrop,
    onPieceDrag,
    onPieceDragEnd,
    draggablePieceTypes = [],
}) => {
    // Transform board so each player's rows appear at the bottom
    // Red rows are 0-1, Blue rows are 4-5
    // Without flip: row 0 at top, row 5 at bottom
    // Red needs flip so rows 0-1 appear at bottom
    // Blue doesn't need flip since rows 4-5 are already near bottom
    const shouldFlip = myColor === 'red';

    const getDisplayBoard = (): PlayerCellView[][] => {
        if (!board || board.length === 0) {
            // Return empty board structure
            return Array(BOARD_ROWS).fill(null).map((_, row) =>
                Array(BOARD_COLS).fill(null).map((_, col) => ({
                    row,
                    col,
                    piece: null,
                }))
            );
        }

        if (shouldFlip) {
            // Reverse row order for red player
            return [...board].reverse();
        }
        return board;
    };

    const displayBoard = getDisplayBoard();

    const isValidDropTarget = (actualRow: number): boolean => {
        return validDropRows.includes(actualRow);
    };

    const getMyRows = (): number[] => {
        return myColor === 'red' ? RED_SETUP_ROWS : BLUE_SETUP_ROWS;
    };

    const isMyRow = (actualRow: number): boolean => {
        return getMyRows().includes(actualRow);
    };

    return (
        <div className="board">
            {displayBoard.map((row, displayRowIndex) => {
                // Calculate actual row index (accounting for flip)
                const actualRowIndex = shouldFlip
                    ? BOARD_ROWS - 1 - displayRowIndex
                    : displayRowIndex;

                return (
                    <div
                        key={displayRowIndex}
                        className={`board__row ${isMyRow(actualRowIndex) ? 'board__row--mine' : ''}`}
                    >
                        {row.map((cell, colIndex) => (
                            <Cell
                                key={`${actualRowIndex}-${colIndex}`}
                                row={actualRowIndex}
                                col={colIndex}
                                piece={cell.piece}
                                isValidDropTarget={isValidDropTarget(actualRowIndex)}
                                isHighlighted={isMyRow(actualRowIndex)}
                                myColor={myColor}
                                onDrop={onCellDrop}
                                onDragOver={(e) => e.preventDefault()}
                                onPieceDrag={onPieceDrag}
                                onPieceDragEnd={onPieceDragEnd}
                                draggablePieceTypes={draggablePieceTypes}
                            />
                        ))}
                    </div>
                );
            })}
        </div>
    );
};
