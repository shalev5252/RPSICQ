import React, { useState } from 'react';
import { useSocket } from '../../hooks/useSocket';
import { SOCKET_EVENTS, CombatElement } from '@rps/shared';
import './TieBreakerModal.css';

export const TieBreakerModal: React.FC = () => {
    const { socket } = useSocket();
    const [selectedChoice, setSelectedChoice] = useState<CombatElement | null>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);

    const handleSelect = (choice: CombatElement) => {
        if (hasSubmitted) return;
        setSelectedChoice(choice);
    };

    const handleConfirm = () => {
        if (!selectedChoice || !socket || hasSubmitted) return;

        socket.emit(SOCKET_EVENTS.COMBAT_CHOICE, { element: selectedChoice });
        setHasSubmitted(true);
    };

    return (
        <div className="tie-breaker-modal">
            <div className="tie-breaker-modal__overlay" />
            <div className="tie-breaker-modal__card">
                <div className="tie-breaker-modal__title">
                    🤝 It's a Tie!
                </div>

                <div className="tie-breaker-modal__subtitle">
                    Choose a new element for your piece
                </div>

                {!hasSubmitted ? (
                    <>
                        <div className="tie-breaker-modal__choices">
                            <button
                                className={`tie-breaker-modal__choice ${selectedChoice === 'rock' ? 'tie-breaker-modal__choice--selected' : ''}`}
                                onClick={() => handleSelect('rock')}
                            >
                                <span className="tie-breaker-modal__icon">🪨</span>
                                <span className="tie-breaker-modal__label">Rock</span>
                            </button>

                            <button
                                className={`tie-breaker-modal__choice ${selectedChoice === 'paper' ? 'tie-breaker-modal__choice--selected' : ''}`}
                                onClick={() => handleSelect('paper')}
                            >
                                <span className="tie-breaker-modal__icon">📄</span>
                                <span className="tie-breaker-modal__label">Paper</span>
                            </button>

                            <button
                                className={`tie-breaker-modal__choice ${selectedChoice === 'scissors' ? 'tie-breaker-modal__choice--selected' : ''}`}
                                onClick={() => handleSelect('scissors')}
                            >
                                <span className="tie-breaker-modal__icon">✂️</span>
                                <span className="tie-breaker-modal__label">Scissors</span>
                            </button>
                        </div>

                        <button
                            className="tie-breaker-modal__confirm"
                            onClick={handleConfirm}
                            disabled={!selectedChoice}
                        >
                            Confirm Choice
                        </button>
                    </>
                ) : (
                    <div className="tie-breaker-modal__waiting">
                        <div className="tie-breaker-modal__spinner"></div>
                        <div className="tie-breaker-modal__waiting-text">
                            Waiting for opponent...
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
