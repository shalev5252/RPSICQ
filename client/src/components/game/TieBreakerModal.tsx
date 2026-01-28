import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../store/gameStore';
import { SOCKET_EVENTS, CombatElement } from '@rps/shared';
import './TieBreakerModal.css';

export const TieBreakerModal: React.FC = () => {
    const { socket } = useSocket();
    const { t } = useTranslation();
    const [selectedChoice, setSelectedChoice] = useState<CombatElement | null>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [showingTieAgain, setShowingTieAgain] = useState(false);
    const retryCount = useGameStore((state) => state.tieBreakerState.retryCount);
    const gameMode = useGameStore((state) => state.gameMode);

    // Show "tie again" message when retryCount changes, then reset
    useEffect(() => {
        if (retryCount > 0) {
            setShowingTieAgain(true);
            const timer = setTimeout(() => {
                setShowingTieAgain(false);
                setSelectedChoice(null);
                setHasSubmitted(false);
            }, 2000); // Show for 2 seconds
            return () => clearTimeout(timer);
        }
    }, [retryCount]);

    const handleSelect = (choice: CombatElement) => {
        if (hasSubmitted || showingTieAgain) return;
        setSelectedChoice(choice);
    };

    const handleConfirm = () => {
        if (!selectedChoice || !socket || hasSubmitted || showingTieAgain) return;

        socket.emit(SOCKET_EVENTS.COMBAT_CHOICE, { element: selectedChoice });
        setHasSubmitted(true);
    };

    return (
        <div className="tie-breaker-modal">
            <div className="tie-breaker-modal__overlay" />
            <div className="tie-breaker-modal__card">
                <div className="tie-breaker-modal__title">
                    {t('game.tie_breaker.title')}
                </div>

                <div className="tie-breaker-modal__subtitle">
                    {t('game.tie_breaker.subtitle')}
                </div>

                {showingTieAgain ? (
                    <div className="tie-breaker-modal__tie-again">
                        <div className="tie-breaker-modal__tie-again-icon">🔄</div>
                        <div className="tie-breaker-modal__tie-again-text">
                            {t('game.tie_breaker.tie_again')}
                        </div>
                        <div className="tie-breaker-modal__tie-again-subtext">
                            {t('game.tie_breaker.choose_again')}
                        </div>
                    </div>
                ) : !hasSubmitted ? (
                    <>
                        <div className="tie-breaker-modal__choices">
                            <button
                                className={`tie-breaker-modal__choice ${selectedChoice === 'rock' ? 'tie-breaker-modal__choice--selected' : ''}`}
                                onClick={() => handleSelect('rock')}
                            >
                                <span className="tie-breaker-modal__icon">🪨</span>
                                <span className="tie-breaker-modal__label">{t('pieces.rock')}</span>
                            </button>

                            <button
                                className={`tie-breaker-modal__choice ${selectedChoice === 'paper' ? 'tie-breaker-modal__choice--selected' : ''}`}
                                onClick={() => handleSelect('paper')}
                            >
                                <span className="tie-breaker-modal__icon">📄</span>
                                <span className="tie-breaker-modal__label">{t('pieces.paper')}</span>
                            </button>

                            <button
                                className={`tie-breaker-modal__choice ${selectedChoice === 'scissors' ? 'tie-breaker-modal__choice--selected' : ''}`}
                                onClick={() => handleSelect('scissors')}
                            >
                                <span className="tie-breaker-modal__icon">✂️</span>
                                <span className="tie-breaker-modal__label">{t('pieces.scissors')}</span>
                            </button>

                            {gameMode === 'rpsls' && (
                                <>
                                    <button
                                        className={`tie-breaker-modal__choice ${selectedChoice === 'lizard' ? 'tie-breaker-modal__choice--selected' : ''}`}
                                        onClick={() => handleSelect('lizard')}
                                    >
                                        <span className="tie-breaker-modal__icon">🦎</span>
                                        <span className="tie-breaker-modal__label">{t('pieces.lizard')}</span>
                                    </button>

                                    <button
                                        className={`tie-breaker-modal__choice ${selectedChoice === 'spock' ? 'tie-breaker-modal__choice--selected' : ''}`}
                                        onClick={() => handleSelect('spock')}
                                    >
                                        <span className="tie-breaker-modal__icon">🖖</span>
                                        <span className="tie-breaker-modal__label">{t('pieces.spock')}</span>
                                    </button>
                                </>
                            )}
                        </div>

                        <button
                            className="tie-breaker-modal__confirm"
                            onClick={handleConfirm}
                            disabled={!selectedChoice}
                        >
                            {t('game.tie_breaker.confirm')}
                        </button>
                    </>
                ) : (
                    <div className="tie-breaker-modal__waiting">
                        <div className="tie-breaker-modal__spinner"></div>
                        <div className="tie-breaker-modal__waiting-text">
                            {t('game.tie_breaker.waiting')}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
