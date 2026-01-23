import React from 'react';
import type { PlayerPieceView, PlayerColor, PieceType } from '@rps/shared';
import { Piece } from './Piece';
import './Cell.css';

interface CellProps {
    row: number;
    col: number;
    piece: PlayerPieceView | null;
    isValidDropTarget: boolean;
    isHighlighted: boolean;
    myColor: PlayerColor;
    onDrop?: (row: number, col: number) => void;
    onDragOver?: (e: React.DragEvent) => void;
    onPieceDrag?: (pieceType: PieceType) => void;
    onPieceDragEnd?: () => void;
    draggablePieceTypes?: PieceType[];
}

export const Cell: React.FC<CellProps> = ({
    row,
    col,
    piece,
    isValidDropTarget,
    isHighlighted,
    myColor,
    onDrop,
    onDragOver,
    onPieceDrag,
    onPieceDragEnd,
    draggablePieceTypes = [],
}) => {
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (onDrop && isValidDropTarget) {
            onDrop(row, col);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (onDragOver) {
            onDragOver(e);
        }
    };

    // Check if this piece can be dragged
    const isPieceDraggable = !!(piece &&
        piece.owner === myColor &&
        piece.type !== 'hidden' &&
        draggablePieceTypes.includes(piece.type as PieceType));

    const handlePieceDragStart = (e: React.DragEvent) => {
        if (!isPieceDraggable || !piece || piece.type === 'hidden') return;
        e.dataTransfer.setData('pieceType', piece.type);
        e.dataTransfer.effectAllowed = 'move';
        if (onPieceDrag) {
            onPieceDrag(piece.type as PieceType);
        }
    };

    const handlePieceDragEnd = () => {
        if (onPieceDragEnd) {
            onPieceDragEnd();
        }
    };

    return (
        <div
            className={`cell ${isValidDropTarget ? 'cell--valid-target' : ''} ${isHighlighted ? 'cell--highlighted' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            {piece && (
                <div
                    draggable={isPieceDraggable}
                    onDragStart={handlePieceDragStart}
                    onDragEnd={handlePieceDragEnd}
                    className={isPieceDraggable ? 'cell__piece--draggable' : ''}
                >
                    <Piece
                        type={piece.type}
                        owner={piece.owner}
                        hasHalo={piece.hasHalo}
                    />
                </div>
            )}
        </div>
    );
};
