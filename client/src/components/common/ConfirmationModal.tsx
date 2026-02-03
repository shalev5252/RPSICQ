import React from 'react';
import './ConfirmationModal.css';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    isDangerous?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'Yes',
    cancelText = 'No',
    isDangerous = false
}) => {
    if (!isOpen) return null;

    return (
        <div className="confirmation-modal">
            <div className="confirmation-modal__overlay" onClick={onCancel} />
            <div className="confirmation-modal__card">
                <h2 className="confirmation-modal__title">{title}</h2>
                <p className="confirmation-modal__message">{message}</p>
                <div className="confirmation-modal__actions">
                    <button
                        className="confirmation-modal__btn confirmation-modal__btn--cancel"
                        onClick={onCancel}
                    >
                        {cancelText}
                    </button>
                    <button
                        className={`confirmation-modal__btn confirmation-modal__btn--confirm ${isDangerous ? 'confirmation-modal__btn--danger' : ''}`}
                        onClick={onConfirm}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
