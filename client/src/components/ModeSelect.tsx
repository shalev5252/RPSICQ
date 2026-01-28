import React from 'react';
import { useTranslation } from 'react-i18next';
import type { GameMode } from '@rps/shared';
import './ModeSelect.css';

interface ModeSelectProps {
    selectedMode: GameMode;
    onSelectMode: (mode: GameMode) => void;
    disabled?: boolean;
}

export const ModeSelect: React.FC<ModeSelectProps> = ({
    selectedMode,
    onSelectMode,
    disabled = false
}) => {
    const { t } = useTranslation();

    return (
        <div className="mode-select">
            <h3 className="mode-select__title">{t('matchmaking.select_mode')}</h3>
            <div className="mode-select__options">
                <button
                    className={`mode-select__option ${selectedMode === 'classic' ? 'mode-select__option--selected' : ''}`}
                    onClick={() => onSelectMode('classic')}
                    disabled={disabled}
                >
                    <div className="mode-select__icon">⚔️</div>
                    <div className="mode-select__info">
                        <div className="mode-select__name">{t('matchmaking.mode_classic')}</div>
                        <div className="mode-select__desc">{t('matchmaking.mode_classic_desc')}</div>
                        <div className="mode-select__meta">{t('matchmaking.mode_classic_meta')}</div>
                    </div>
                </button>

                <button
                    className={`mode-select__option ${selectedMode === 'rpsls' ? 'mode-select__option--selected' : ''}`}
                    onClick={() => onSelectMode('rpsls')}
                    disabled={disabled}
                >
                    <div className="mode-select__icon">🖖</div>
                    <div className="mode-select__info">
                        <div className="mode-select__name">{t('matchmaking.mode_rpsls')}</div>
                        <div className="mode-select__desc">{t('matchmaking.mode_rpsls_desc')}</div>
                        <div className="mode-select__meta">{t('matchmaking.mode_rpsls_meta')}</div>
                    </div>
                </button>
            </div>
        </div>
    );
};
