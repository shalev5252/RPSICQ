import React, { useEffect, useState } from 'react';
import './TurnSkippedModal.css';

interface TurnSkippedModalProps {
    onComplete: () => void;
}

export const TurnSkippedModal: React.FC<TurnSkippedModalProps> = ({ onComplete }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(false);
            onComplete();
        }, 2000); // Show for 2 seconds

        return () => clearTimeout(timer);
    }, [onComplete]);

    if (!visible) return null;

    return (
        <div className="turn-skipped-modal">
            <div className="turn-skipped-modal__overlay" />
            <div className="turn-skipped-modal__card">
                <div className="turn-skipped-modal__icon">⏭️</div>
                <div className="turn-skipped-modal__title">
                    Can't Move
                </div>
                <div className="turn-skipped-modal__subtitle">
                    Passes turn to opponent
                </div>
            </div>
        </div>
    );
};
