import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/gameStore';
import type { GameType } from '@rps/shared';
import './GamePortal.css';

interface GameCardInfo {
    id: GameType | 'ttt-ultimate';
    icon: string;
    titleKey: string;
    descKey: string;
    comingSoon?: boolean;
}

const GAMES: GameCardInfo[] = [
    {
        id: 'rps',
        icon: '⚔️',
        titleKey: 'portal.rps.title',
        descKey: 'portal.rps.desc',
    },
    {
        id: 'ttt',
        icon: '❌⭕',
        titleKey: 'portal.ttt.title',
        descKey: 'portal.ttt.desc',
    },
    {
        id: 'ttt-ultimate',
        icon: '🧩',
        titleKey: 'portal.ttt_ultimate.title',
        descKey: 'portal.ttt_ultimate.desc',
        comingSoon: true,
    },
    {
        id: 'third-eye',
        icon: '🔮',
        titleKey: 'portal.third_eye.title',
        descKey: 'portal.third_eye.desc',
    },
];

export const GamePortal: React.FC = () => {
    const { t } = useTranslation();
    const setActiveGame = useGameStore(state => state.setActiveGame);

    const handleSelect = (game: GameCardInfo) => {
        if (game.comingSoon) return;
        if (game.id === 'ttt-ultimate') return;
        setActiveGame(game.id as GameType);
    };

    return (
        <div className="portal-container">
            <h2 className="portal-title">{t('portal.title')}</h2>
            <p className="portal-subtitle">{t('portal.subtitle')}</p>

            <div className="portal-grid">
                {GAMES.map(game => (
                    <button
                        key={game.id}
                        className={`portal-card ${game.comingSoon ? 'portal-card--disabled' : ''}`}
                        onClick={() => handleSelect(game)}
                        disabled={game.comingSoon}
                    >
                        <span className="portal-card__icon">{game.icon}</span>
                        <h3 className="portal-card__title">{t(game.titleKey)}</h3>
                        <p className="portal-card__desc">{t(game.descKey)}</p>
                        {game.comingSoon && (
                            <span className="portal-card__badge">{t('portal.coming_soon')}</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
};
