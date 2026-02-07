import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import './DrawOfferModal.css';

interface DrawOfferModalProps {
    onAccept: () => void;
    onDecline: () => void;
}

export const DrawOfferModal: React.FC<DrawOfferModalProps> = ({ onAccept, onDecline }) => {
    const { t } = useTranslation();
    const pendingDrawOffer = useGameStore((state) => state.pendingDrawOffer);

    if (!pendingDrawOffer) return null;

    return (
        <div className="draw-offer-modal">
            <div className="draw-offer-modal__overlay" />
            <div className="draw-offer-modal__card">
                <div className="draw-offer-modal__icon">🤝</div>
                <div className="draw-offer-modal__title">
                    {t('game.draw_offer.title')}
                </div>
                <div className="draw-offer-modal__subtitle">
                    {t('game.draw_offer.subtitle')}
                </div>
                <div className="draw-offer-modal__buttons">
                    <button
                        className="draw-offer-modal__button draw-offer-modal__button--accept"
                        onClick={onAccept}
                    >
                        {t('game.draw_offer.accept')}
                    </button>
                    <button
                        className="draw-offer-modal__button draw-offer-modal__button--decline"
                        onClick={onDecline}
                    >
                        {t('game.draw_offer.decline')}
                    </button>
                </div>
            </div>
        </div>
    );
};
