import React from 'react';
import { useTranslation } from 'react-i18next';
import './TttModeSelection.css';

interface TttModeSelectionProps {
    onPlayOnline: () => void;
    onPlayAI: () => void;
}

export const TttModeSelection: React.FC<TttModeSelectionProps> = ({ onPlayOnline, onPlayAI }) => {
    const { t } = useTranslation();

    return (
        <div className="ttt-mode-selection">
            <h2 className="ttt-mode-selection__title">{t('ttt.title', 'Tic Tac Toe')}</h2>
            <p className="ttt-mode-selection__subtitle">{t('ttt.choose_mode', 'Choose your game mode')}</p>

            <div className="ttt-mode-selection__cards">
                <button className="ttt-mode-card" onClick={onPlayOnline}>
                    <span className="ttt-mode-card__icon">🌐</span>
                    <span className="ttt-mode-card__label">{t('ttt.play_online', 'Play Online')}</span>
                    <span className="ttt-mode-card__desc">{t('ttt.play_online_desc', 'Challenge a random opponent')}</span>
                </button>

                <button className="ttt-mode-card" onClick={onPlayAI}>
                    <span className="ttt-mode-card__icon">🤖</span>
                    <span className="ttt-mode-card__label">{t('ttt.play_vs_computer', 'Play vs Computer')}</span>
                    <span className="ttt-mode-card__desc">{t('ttt.play_vs_computer_desc', 'Test your skills against AI')}</span>
                </button>

                <button className="ttt-mode-card ttt-mode-card--disabled" disabled>
                    <span className="ttt-mode-card__icon">🏆</span>
                    <span className="ttt-mode-card__label">{t('ttt.ultimate', 'Ultimate')}</span>
                    <span className="ttt-mode-card__badge">{t('portal.coming_soon', 'Coming Soon')}</span>
                </button>
            </div>
        </div>
    );
};
