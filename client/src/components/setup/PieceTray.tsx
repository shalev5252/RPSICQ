import React from 'react';
import type { PieceType, PlayerColor } from '@rps/shared';
import { Piece } from './Piece';
import './PieceTray.css';

interface PieceTrayProps {
    myColor: PlayerColor;
    kingPlaced: boolean;
    pitPlaced: boolean;
    onDragStart: (pieceType: PieceType) => void;
    onDragEnd: () => void;
    // New props for tap-to-place
    selectedPiece?: PieceType | null;
    onPieceClick?: (pieceType: PieceType) => void;
}

export const PieceTray: React.FC<PieceTrayProps> = ({
    myColor,
    kingPlaced,
    pitPlaced,
    onDragStart,
    onDragEnd,
    selectedPiece = null,
    onPieceClick,
}) => {
    const handleDragStart = (pieceType: PieceType) => (e: React.DragEvent) => {
        e.dataTransfer.setData('pieceType', pieceType);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(pieceType);
        // Also select on drag start for hybrid support
        if (onPieceClick) onPieceClick(pieceType);
    };

    const handleClick = (pieceType: PieceType) => {
        if (onPieceClick) {
            onPieceClick(pieceType);
        }
    };

    if (kingPlaced && pitPlaced) {
        return null;
    }

    return (
        <div className="piece-tray">
            <h3 className="piece-tray__title">Place Your Pieces</h3>
            <p className="piece-tray__subtitle">Drag the King and Pit to your rows</p>
            <div className="piece-tray__pieces">
                {!kingPlaced && (
                    <div
                        className={`piece-tray__item ${selectedPiece === 'king' ? 'piece-tray__item--selected' : ''}`}
                        draggable
                        onDragStart={handleDragStart('king')}
                        onDragEnd={onDragEnd}
                        onClick={() => handleClick('king')}
                    >
                        <Piece type="king" owner={myColor} size="large" />
                        <span className="piece-tray__label">King</span>
                    </div>
                )}
                {!pitPlaced && (
                    <div
                        className={`piece-tray__item ${selectedPiece === 'pit' ? 'piece-tray__item--selected' : ''}`}
                        draggable
                        onDragStart={handleDragStart('pit')}
                        onDragEnd={onDragEnd}
                        onClick={() => handleClick('pit')}
                    >
                        <Piece type="pit" owner={myColor} size="large" />
                        <span className="piece-tray__label">Pit</span>
                    </div>
                )}
            </div>
        </div>
    );
};
