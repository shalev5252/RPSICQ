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
    onPieceDrag?: (pieceType: PieceType, row: number, col: number) => void;
    onPieceDragEnd?: () => void;
    draggablePieceTypes?: PieceType[];
    // Click-to-move props
    onClick?: (row: number, col: number) => void;
    isSelected?: boolean;
}

export const Cell: React.FC<CellProps> = ({
    row,
    col,
    piece,
    isValidDropTarget,
    myColor,
    onDrop,
    onDragOver,
    onPieceDrag,
    onPieceDragEnd,
    draggablePieceTypes = [],
    onClick,
}) => {
    // Track mouseDown time for short-click vs long-press detection
    const mouseDownTimeRef = React.useRef<number>(0);
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
        e.dataTransfer.setData('pieceRow', String(row));
        e.dataTransfer.setData('pieceCol', String(col));
        e.dataTransfer.effectAllowed = 'move';
        // Reset mouseDown time so click won't fire after drag
        mouseDownTimeRef.current = 0;
        if (onPieceDrag) {
            onPieceDrag(piece.type as PieceType, row, col);
        }
    };

    const handlePieceDragEnd = () => {
        if (onPieceDragEnd) {
            onPieceDragEnd();
        }
    };

    // Short-click detection handlers
    const handleMouseDown = () => {
        mouseDownTimeRef.current = Date.now();
    };

    const handleMouseUp = () => {
        if (!onClick) return;

        const mouseDownTime = mouseDownTimeRef.current;
        if (mouseDownTime === 0) return; // Was reset by drag

        const clickDuration = Date.now() - mouseDownTime;
        // Short click: less than 300ms
        if (clickDuration < 300) {
            onClick(row, col);
        }
        mouseDownTimeRef.current = 0;
    };

    const cellClassName = [
        'cell',
        isValidDropTarget ? 'cell--valid-target cell--valid-move' : '',
    ].filter(Boolean).join(' ');

    return (
        <div
            className={cellClassName}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            {piece && (
                piece.type === 'hidden' ? (
                    <div
                        draggable={isPieceDraggable}
                        onDragStart={handlePieceDragStart}
                        onDragEnd={handlePieceDragEnd}
                        className={`cell__piece--hidden ${isPieceDraggable ? 'cell__piece--draggable' : ''}`}
                        style={{
                            width: '80%',
                            height: '80%',
                            borderRadius: '50%',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            border: '2px dashed rgba(255, 255, 255, 0.2)',
                            boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)',
                        }}
                    />
                ) : (
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
                )
            )}
        </div>
    );
};
