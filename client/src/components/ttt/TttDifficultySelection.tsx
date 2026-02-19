import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TttDifficulty } from '@rps/shared';
import './TttDifficultySelection.css';

interface TttDifficultySelectionProps {
    onSelect: (difficulty: TttDifficulty) => void;
    onBack: () => void;
}

export const TttDifficultySelection: React.FC<TttDifficultySelectionProps> = ({ onSelect, onBack }) => {
    const { t } = useTranslation();

    const difficulties: { key: TttDifficulty; icon: string; color: string }[] = [
        { key: 'easy', icon: '😊', color: '#4ade80' },
        { key: 'medium', icon: '🤔', color: '#facc15' },
        { key: 'hard', icon: '🔥', color: '#f87171' },
    ];

    return (
        <div className="ttt-difficulty">
            <h2 className="ttt-difficulty__title">{t('ttt.select_difficulty', 'Select Difficulty')}</h2>

            <div className="ttt-difficulty__cards">
                {difficulties.map(({ key, icon, color }) => (
                    <button
                        key={key}
                        className="ttt-difficulty-card"
                        style={{ '--accent': color } as React.CSSProperties}
                        onClick={() => onSelect(key)}
                    >
                        <span className="ttt-difficulty-card__icon">{icon}</span>
                        <span className="ttt-difficulty-card__label">{t(`ttt.difficulty_${key}`, key)}</span>
                    </button>
                ))}
            </div>

            <button className="ttt-difficulty__back" onClick={onBack}>
                ← {t('common.back', 'Back')}
            </button>
        </div>
    );
};
