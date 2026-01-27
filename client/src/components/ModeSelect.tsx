import React from 'react';
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
    return (
        <div className="mode-select">
            <h3 className="mode-select__title">Select Game Mode</h3>
            <div className="mode-select__options">
                <button
                    className={`mode-select__option ${selectedMode === 'classic' ? 'mode-select__option--selected' : ''}`}
                    onClick={() => onSelectMode('classic')}
                    disabled={disabled}
                >
                    <div className="mode-select__icon">⚔️</div>
                    <div className="mode-select__info">
                        <div className="mode-select__name">Classic</div>
                        <div className="mode-select__desc">Standard RPS rules with King & Pit</div>
                        <div className="mode-select__meta">6x7 Board • 14 Pieces</div>
                    </div>
                </button>

                <button
                    className={`mode-select__option ${selectedMode === 'rpsls' ? 'mode-select__option--selected' : ''}`}
                    onClick={() => onSelectMode('rpsls')}
                    disabled={disabled}
                >
                    <div className="mode-select__icon">🖖</div>
                    <div className="mode-select__info">
                        <div className="mode-select__name">RPSLS</div>
                        <div className="mode-select__desc">Extended rules with Lizard & Spock</div>
                        <div className="mode-select__meta">6x6 Board • 12 Pieces</div>
                    </div>
                </button>
            </div>
        </div>
    );
};
