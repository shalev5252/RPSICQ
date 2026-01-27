import React from 'react';
import type { PieceType, PlayerColor, GameMode } from '@rps/shared';
import { BOARD_CONFIG } from '@rps/shared';
import { Piece, PIECE_ICONS } from './Piece';
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
    gameMode?: GameMode;
}

export const PieceTray: React.FC<PieceTrayProps> = ({
    myColor,
    kingPlaced,
    pitPlaced,
    onDragStart,
    onDragEnd,
    selectedPiece = null,
    onPieceClick,
    gameMode = 'classic',
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

    const config = BOARD_CONFIG[gameMode];

    // Helper to format piece name
    const formatName = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

    // List of pawn types to show counts for
    const pawnTypes = Object.entries(config.pieces).filter(([type]) => type !== 'king' && type !== 'pit');

    if (kingPlaced && pitPlaced) {
        // Show only composition summary when done placing
        return (
            <div className="piece-tray piece-tray--completed">
                <h3 className="piece-tray__title">Army Ready</h3>
                <div className="piece-tray__composition">
                    <p className="piece-tray__subtitle">Auto-deployed units:</p>
                    <div className="piece-tray__counts">
                        {pawnTypes.filter(([_, count]) => count > 0).map(([type, count]) => (
                            <div key={type} className="piece-tray__count-item">
                                <span className="piece-tray__count-icon">{PIECE_ICONS[type as PieceType]}</span>
                                <span className="piece-tray__count-text">x {count} {formatName(type)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
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

            <div className="piece-tray__composition">
                <p className="piece-tray__subtitle">Auto-deployed units:</p>
                <div className="piece-tray__counts">
                    {pawnTypes.filter(([_, count]) => count > 0).map(([type, count]) => (
                        <div key={type} className="piece-tray__count-item">
                            <span className="piece-tray__count-icon">{PIECE_ICONS[type as PieceType]}</span>
                            <span className="piece-tray__count-text">x {count}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
