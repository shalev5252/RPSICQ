import React from 'react';
import type { PieceType, PlayerColor } from '@rps/shared';
import './Piece.css';

interface PieceProps {
    type: PieceType | 'hidden';
    owner: PlayerColor;
    hasHalo?: boolean;
    isDragging?: boolean;
    size?: 'small' | 'medium' | 'large';
}

const PIECE_ICONS: Record<PieceType | 'hidden', string> = {
    king: '\u{1F451}',
    pit: '\u{1F573}\u{FE0F}',
    rock: '\u{1FAA8}',
    paper: '\u{1F4C4}',
    scissors: '\u{2702}\u{FE0F}',
    hidden: '?',
};

export const Piece: React.FC<PieceProps> = ({
    type,
    owner,
    hasHalo = false,
    isDragging = false,
    size = 'medium',
}) => {
    const icon = PIECE_ICONS[type];

    return (
        <div
            className={`piece piece--${owner} piece--${size} ${hasHalo ? 'piece--halo' : ''} ${isDragging ? 'piece--dragging' : ''}`}
        >
            <span className="piece__icon">{icon}</span>
        </div>
    );
};
