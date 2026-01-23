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
}

export const PieceTray: React.FC<PieceTrayProps> = ({
    myColor,
    kingPlaced,
    pitPlaced,
    onDragStart,
    onDragEnd,
}) => {
    const handleDragStart = (pieceType: PieceType) => (e: React.DragEvent) => {
        e.dataTransfer.setData('pieceType', pieceType);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(pieceType);
    };

    return (
        <div className="piece-tray">
            <h3 className="piece-tray__title">Place Your Pieces</h3>
            <p className="piece-tray__subtitle">Drag the King and Pit to your rows</p>
            <div className="piece-tray__pieces">
                {!kingPlaced && (
                    <div
                        className="piece-tray__item"
                        draggable
                        onDragStart={handleDragStart('king')}
                        onDragEnd={onDragEnd}
                    >
                        <Piece type="king" owner={myColor} size="large" />
                        <span className="piece-tray__label">King</span>
                    </div>
                )}
                {!pitPlaced && (
                    <div
                        className="piece-tray__item"
                        draggable
                        onDragStart={handleDragStart('pit')}
                        onDragEnd={onDragEnd}
                    >
                        <Piece type="pit" owner={myColor} size="large" />
                        <span className="piece-tray__label">Pit</span>
                    </div>
                )}
                {kingPlaced && pitPlaced && (
                    <div className="piece-tray__complete">
                        All pieces placed! Now shuffle your army.
                    </div>
                )}
            </div>
        </div>
    );
};
