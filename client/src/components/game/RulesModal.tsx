import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GameMode, PieceType, RPSLS_WINS } from '@rps/shared';
import { PIECE_ICONS } from '../setup/Piece';
import './RulesModal.css';

interface RulesModalProps {
    isOpen: boolean;
    onClose: () => void;
    gameMode: GameMode;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose, gameMode }) => {
    const [selectedType, setSelectedType] = useState<PieceType | null>(null);
    const { t } = useTranslation();

    if (!isOpen) return null;

    // Ordered pieces for circular layout
    const pieces: PieceType[] = gameMode === 'classic'
        ? ['rock', 'paper', 'scissors']
        : ['rock', 'paper', 'scissors', 'spock', 'lizard']; // Order matters for pentagon visual

    // Check if type A beats type B
    const beats = (a: PieceType, b: PieceType) => {
        if (gameMode === 'classic') {
            if (a === 'rock') return b === 'scissors';
            if (a === 'paper') return b === 'rock';
            if (a === 'scissors') return b === 'paper';
            return false;
        }
        // RPSLS
        return RPSLS_WINS[a]?.includes(b);
    };

    const getRelationClass = (type: PieceType) => {
        if (!selectedType) return '';
        if (selectedType === type) return 'rules-modal__item--selected';
        if (beats(selectedType, type)) return 'rules-modal__item--prey'; // Selected beats this
        if (beats(type, selectedType)) return 'rules-modal__item--predator'; // This beats selected
        return 'rules-modal__item--neutral';
    };

    return (
        <div className="rules-modal">
            <div className="rules-modal__overlay" onClick={onClose} />
            <div className="rules-modal__card">
                <button className="rules-modal__close" onClick={onClose}>×</button>
                <div className="rules-modal__header">
                    <h2 className="rules-modal__title">{t('game.rules.title')}</h2>
                    <p className="rules-modal__subtitle">
                        {gameMode === 'classic' ? t('game.rules.subtitle_classic') : t('game.rules.subtitle_rpsls')}
                    </p>
                    <p className="rules-modal__instruction">
                        {t('game.rules.instruction')}
                    </p>
                </div>

                <div className={`rules-modal__diagram rules-modal__diagram--${gameMode}`}>
                    {pieces.map((type, index) => (
                        <div
                            key={type}
                            className={`rules-modal__item ${getRelationClass(type)}`}
                            style={{ '--i': index, '--total': pieces.length } as React.CSSProperties}
                            onClick={() => setSelectedType(type === selectedType ? null : type)}
                        >
                            <span className="rules-modal__icon">{PIECE_ICONS[type]}</span>
                            <span className="rules-modal__label">{t(`pieces.${type}`)}</span>
                        </div>
                    ))}

                    {/* Center Info Text */}
                    <div className="rules-modal__center-info">
                        {selectedType ? (
                            <>
                                <div className="rules-modal__center-icon">{PIECE_ICONS[selectedType]}</div>
                                <div className="rules-modal__center-name">{t(`pieces.${selectedType}`)}</div>
                            </>
                        ) : (
                            <div className="rules-modal__center-placeholder">?</div>
                        )}
                    </div>
                </div>

                <div className="rules-modal__legend">
                    <div className="rules-modal__legend-item">
                        <span className="dot dot--green"></span> {t('game.rules.beats')}
                    </div>
                    <div className="rules-modal__legend-item">
                        <span className="dot dot--red"></span> {t('game.rules.beaten_by')}
                    </div>
                </div>
            </div>
        </div>
    );
};
