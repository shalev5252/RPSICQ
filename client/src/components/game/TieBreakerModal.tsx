import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../store/gameStore';
import { SOCKET_EVENTS, CombatElement } from '@rps/shared';
import { PIECE_ICONS } from '../setup/Piece';
import './TieBreakerModal.css';

const ELEMENT_ICONS: Record<CombatElement, string> = {
    rock: PIECE_ICONS.rock,
    paper: PIECE_ICONS.paper,
    scissors: PIECE_ICONS.scissors,
    lizard: PIECE_ICONS.lizard,
    spock: PIECE_ICONS.spock,
};

export const TieBreakerModal: React.FC = () => {
    const { socket } = useSocket();
    const { t } = useTranslation();
    const [selectedChoice, setSelectedChoice] = useState<CombatElement | null>(null);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const retryCount = useGameStore((state) => state.tieBreakerState.retryCount);
    const reveal = useGameStore((state) => state.tieBreakerState.reveal);
    const lastReveal = useGameStore((state) => state.tieBreakerState.lastReveal);
    const showingResult = useGameStore((state) => state.tieBreakerState.showingResult);
    const uniqueId = useGameStore((state) => state.tieBreakerState.uniqueId);
    const gameMode = useGameStore((state) => state.gameMode);

    // Reset local state when a new tie-breaker session starts (uniqueId changes)
    useEffect(() => {
        setIsMinimized(false);
        setSelectedChoice(null);
        setHasSubmitted(false);
    }, [uniqueId]);

    // After retry fires, reset straight to choices
    useEffect(() => {
        if (retryCount > 0) {
            setIsMinimized(false);
            setSelectedChoice(null);
            setHasSubmitted(false);
        }
    }, [retryCount]);

    const handleSelect = (choice: CombatElement) => {
        if (hasSubmitted || reveal || showingResult) return;
        setSelectedChoice(choice);
    };

    const handleConfirm = () => {
        if (!selectedChoice || !socket || hasSubmitted || reveal || showingResult) return;
        socket.emit(SOCKET_EVENTS.COMBAT_CHOICE, { element: selectedChoice });
        setHasSubmitted(true);
    };

    const isRevealing = !!reveal;
    const isLocked = isRevealing || showingResult;

    if (isMinimized && !isLocked) {
        return (
            <motion.button
                className="tie-breaker-modal__minimized-btn"
                onClick={() => setIsMinimized(false)}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                {t('game.tie_breaker.open_tie_breaker')}
            </motion.button>
        );
    }

    // Determine which choices to display on non-reveal screens
    const displayReveal = reveal ?? lastReveal;

    return (
        <div className="tie-breaker-modal">
            <div className="tie-breaker-modal__overlay" onClick={isLocked ? undefined : () => setIsMinimized(true)} />
            <motion.div
                className="tie-breaker-modal__card"
                drag={!isLocked}
                dragMomentum={false}
                dragElastic={0.1}
                initial={{ y: 50, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 50, opacity: 0, scale: 0.95 }}
            >
                <div className="tie-breaker-modal__header">
                    <div className="tie-breaker-modal__drag-hint">
                        {isLocked ? '' : t('game.tie_breaker.drag_hint')}
                    </div>
                    {!isLocked && (
                        <button
                            className="tie-breaker-modal__minimize-btn"
                            onClick={() => setIsMinimized(true)}
                            title={t('game.tie_breaker.minimize')}
                        >
                            _
                        </button>
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {isRevealing && reveal ? (
                        /* ── Battle animation: both pieces clash ── */
                        <motion.div
                            key="reveal"
                            className="tie-breaker-modal__reveal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="tie-breaker-modal__reveal-title">
                                {t('game.tie_breaker.battle')}
                            </div>

                            <div className="tie-breaker-modal__clash">
                                <div className="tie-breaker-modal__clash-side">
                                    <motion.div
                                        className="tie-breaker-modal__clash-piece tie-breaker-modal__clash-piece--left"
                                        animate={{
                                            x: [0, 50, -15, 40, 0],
                                            rotate: [0, 15, -5, 8, 0],
                                        }}
                                        transition={{
                                            duration: 1.4,
                                            ease: 'easeInOut',
                                            times: [0, 0.3, 0.5, 0.7, 1],
                                        }}
                                    >
                                        {ELEMENT_ICONS[reveal.playerChoice]}
                                    </motion.div>
                                    <div className="tie-breaker-modal__clash-label tie-breaker-modal__clash-label--you">
                                        {t('game.tie_breaker.you')}
                                    </div>
                                </div>

                                <motion.div
                                    className="tie-breaker-modal__clash-vs"
                                    animate={{
                                        scale: [0.8, 1.3, 0.9, 1.2, 1],
                                        opacity: [0.3, 1, 0.5, 1, 0.8],
                                    }}
                                    transition={{
                                        duration: 1.4,
                                        ease: 'easeInOut',
                                        times: [0, 0.3, 0.5, 0.7, 1],
                                    }}
                                >
                                    VS
                                </motion.div>

                                <div className="tie-breaker-modal__clash-side">
                                    <motion.div
                                        className="tie-breaker-modal__clash-piece tie-breaker-modal__clash-piece--right"
                                        animate={{
                                            x: [0, -50, 15, -40, 0],
                                            rotate: [0, -15, 5, -8, 0],
                                        }}
                                        transition={{
                                            duration: 1.4,
                                            ease: 'easeInOut',
                                            times: [0, 0.3, 0.5, 0.7, 1],
                                        }}
                                    >
                                        {ELEMENT_ICONS[reveal.opponentChoice]}
                                    </motion.div>
                                    <div className="tie-breaker-modal__clash-label tie-breaker-modal__clash-label--opponent">
                                        {t('game.tie_breaker.opponent')}
                                    </div>
                                </div>
                            </div>

                            <motion.div
                                className="tie-breaker-modal__clash-spark-center"
                                animate={{
                                    scale: [0, 1.8, 0, 1.5, 0],
                                    opacity: [0, 1, 0, 0.8, 0],
                                }}
                                transition={{
                                    duration: 1.4,
                                    ease: 'easeInOut',
                                    times: [0, 0.3, 0.45, 0.7, 0.85],
                                }}
                            >
                                {'\u{1F4A5}'}
                            </motion.div>

                            <div className="tie-breaker-modal__reveal-names">
                                <span>{t(`pieces.${reveal.playerChoice}`)}</span>
                                <span className="tie-breaker-modal__reveal-vs-text">vs</span>
                                <span>{t(`pieces.${reveal.opponentChoice}`)}</span>
                            </div>
                        </motion.div>
                    ) : showingResult && displayReveal ? (
                        /* ── Resolution: show who won before returning to game ── */
                        <motion.div
                            key="result"
                            className="tie-breaker-modal__result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                        >
                            <div className="tie-breaker-modal__result-title">
                                {t('game.tie_breaker.resolved')}
                            </div>

                            <div className="tie-breaker-modal__result-matchup">
                                <div className="tie-breaker-modal__result-side tie-breaker-modal__result-side--player">
                                    <span className="tie-breaker-modal__result-icon">
                                        {ELEMENT_ICONS[displayReveal.playerChoice]}
                                    </span>
                                    <span className="tie-breaker-modal__result-name">
                                        {t(`pieces.${displayReveal.playerChoice}`)}
                                    </span>
                                    <span className="tie-breaker-modal__result-label">
                                        {t('game.tie_breaker.you')}
                                    </span>
                                </div>

                                <div className="tie-breaker-modal__result-vs">vs</div>

                                <div className="tie-breaker-modal__result-side tie-breaker-modal__result-side--opponent">
                                    <span className="tie-breaker-modal__result-icon">
                                        {ELEMENT_ICONS[displayReveal.opponentChoice]}
                                    </span>
                                    <span className="tie-breaker-modal__result-name">
                                        {t(`pieces.${displayReveal.opponentChoice}`)}
                                    </span>
                                    <span className="tie-breaker-modal__result-label">
                                        {t('game.tie_breaker.opponent')}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ) : !hasSubmitted ? (
                        /* ── Choice screen ── */
                        <motion.div
                            key="choices"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="tie-breaker-modal__title">
                                {t('game.tie_breaker.title')}
                            </div>

                            <div className="tie-breaker-modal__subtitle">
                                {t('game.tie_breaker.subtitle')}
                            </div>

                            <div className="tie-breaker-modal__choices">
                                <button
                                    className={`tie-breaker-modal__choice ${selectedChoice === 'rock' ? 'tie-breaker-modal__choice--selected' : ''}`}
                                    onClick={() => handleSelect('rock')}
                                >
                                    <span className="tie-breaker-modal__icon">{PIECE_ICONS.rock}</span>
                                    <span className="tie-breaker-modal__label">{t('pieces.rock')}</span>
                                </button>

                                <button
                                    className={`tie-breaker-modal__choice ${selectedChoice === 'paper' ? 'tie-breaker-modal__choice--selected' : ''}`}
                                    onClick={() => handleSelect('paper')}
                                >
                                    <span className="tie-breaker-modal__icon">{PIECE_ICONS.paper}</span>
                                    <span className="tie-breaker-modal__label">{t('pieces.paper')}</span>
                                </button>

                                <button
                                    className={`tie-breaker-modal__choice ${selectedChoice === 'scissors' ? 'tie-breaker-modal__choice--selected' : ''}`}
                                    onClick={() => handleSelect('scissors')}
                                >
                                    <span className="tie-breaker-modal__icon">{PIECE_ICONS.scissors}</span>
                                    <span className="tie-breaker-modal__label">{t('pieces.scissors')}</span>
                                </button>

                                {gameMode === 'rpsls' && (
                                    <>
                                        <button
                                            className={`tie-breaker-modal__choice ${selectedChoice === 'lizard' ? 'tie-breaker-modal__choice--selected' : ''}`}
                                            onClick={() => handleSelect('lizard')}
                                        >
                                            <span className="tie-breaker-modal__icon">{PIECE_ICONS.lizard}</span>
                                            <span className="tie-breaker-modal__label">{t('pieces.lizard')}</span>
                                        </button>

                                        <button
                                            className={`tie-breaker-modal__choice ${selectedChoice === 'spock' ? 'tie-breaker-modal__choice--selected' : ''}`}
                                            onClick={() => handleSelect('spock')}
                                        >
                                            <span className="tie-breaker-modal__icon">{PIECE_ICONS.spock}</span>
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
                        </motion.div>
                    ) : (
                        /* ── Waiting for opponent ── */
                        <motion.div
                            key="waiting"
                            className="tie-breaker-modal__waiting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="tie-breaker-modal__selected-recap">
                                <span className="tie-breaker-modal__selected-recap-label">
                                    {t('game.tie_breaker.your_choice')}
                                </span>
                                <span className="tie-breaker-modal__selected-recap-icon">
                                    {selectedChoice && ELEMENT_ICONS[selectedChoice]}
                                </span>
                                <span className="tie-breaker-modal__selected-recap-name">
                                    {selectedChoice && t(`pieces.${selectedChoice}`)}
                                </span>
                            </div>
                            <div className="tie-breaker-modal__spinner"></div>
                            <div className="tie-breaker-modal__waiting-text">
                                {t('game.tie_breaker.waiting')}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};
