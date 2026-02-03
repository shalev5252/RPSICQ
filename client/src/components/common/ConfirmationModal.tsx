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
    const modalRef = React.useRef<HTMLDivElement>(null);
    const previousFocusRef = React.useRef<HTMLElement | null>(null);

    React.useEffect(() => {
        if (isOpen) {
            previousFocusRef.current = document.activeElement as HTMLElement;
            // Focus the modal container or the first focusable element
            // Using a timeout to ensure the DOM is ready
            setTimeout(() => {
                modalRef.current?.focus();
            }, 0);
        } else {
            // Restore focus
            previousFocusRef.current?.focus();
        }
    }, [isOpen]);

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            if (e.key === 'Escape') {
                onCancel();
                return;
            }

            if (e.key === 'Tab') {
                const modalElement = modalRef.current;
                if (!modalElement) return;

                const focusableElements = modalElement.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0] as HTMLElement;
                const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const titleId = 'confirmation-modal-title';
    const messageId = 'confirmation-modal-message';

    return (
        <div
            className="confirmation-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={messageId}
        >
            <div className="confirmation-modal__overlay" onClick={onCancel} />
            <div
                className="confirmation-modal__card"
                ref={modalRef}
                tabIndex={-1}
            >
                <h2 id={titleId} className="confirmation-modal__title">{title}</h2>
                <p id={messageId} className="confirmation-modal__message">{message}</p>
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
