import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useThirdEyeGame } from '../../hooks/useThirdEyeSocket';
import './ThirdEyeGameScreen.css';

interface ThirdEyeGameScreenProps {
    onBack: () => void;
}

export const ThirdEyeGameScreen: React.FC<ThirdEyeGameScreenProps> = ({ onBack }) => {
    const { t } = useTranslation();
    const {
        isStarted,
        myColor,
        scores,
        roundNumber,
        rangeMin,
        rangeMax,
        timeRemainingMs,
        hasSubmitted,
        pickConfirmed,
        roundResult,
        showingResult,
        gameOver,
        matchWinner,
        finalScores,
        rematchRequested,
        requestRematch,
        submitPick,
    } = useThirdEyeGame();

    const opponentColor = myColor === 'red' ? 'blue' : 'red';
    const myScore = myColor ? scores[myColor] : scores.red;
    const opponentScore = myColor ? scores[opponentColor] : scores.blue;

    const [inputValue, setInputValue] = useState('');
    const [inputError, setInputError] = useState('');

    // Reset input on new round
    useEffect(() => {
        if (roundNumber > 0 && !showingResult) {
            setInputValue('');
            setInputError('');
        }
    }, [roundNumber, showingResult]);

    const handleSubmit = useCallback(() => {
        if (hasSubmitted) return;
        const num = parseInt(inputValue, 10);
        if (isNaN(num)) {
            setInputError(t('portal.third_eye.invalid_number', 'Enter a valid number'));
            return;
        }
        if (num < rangeMin || num > rangeMax) {
            setInputError(t('portal.third_eye.out_of_range', 'Number must be between {{min}} and {{max}}', { min: rangeMin, max: rangeMax }));
            return;
        }
        setInputError('');
        submitPick(num);
    }, [inputValue, rangeMin, rangeMax, hasSubmitted, t, submitPick]);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSubmit();
    }, [handleSubmit]);

    const timerSeconds = Math.ceil(Math.max(0, timeRemainingMs) / 1000);
    const timerUrgent = timerSeconds <= 5;

    // ----- Waiting for match -----
    if (!isStarted) {
        return (
            <div className="te-screen">
                <div className="te-screen__waiting">
                    <div className="te-screen__spinner" />
                    <p>{t('portal.third_eye.waiting', 'Waiting for opponent...')}</p>
                    <button className="te-btn te-btn--secondary" onClick={onBack}>
                        {t('common.cancel', 'Cancel')}
                    </button>
                </div>
            </div>
        );
    }

    // ----- Game Over -----
    if (gameOver) {
        const isWin = matchWinner !== 'disconnect' && matchWinner === myColor;

        return (
            <div className="te-screen">
                <div className="te-game-over">
                    <h2 className={`te-game-over__title ${matchWinner === 'disconnect' ? 'te-game-over__title--disconnect' :
                        isWin ? 'te-game-over__title--win' : 'te-game-over__title--lose'
                        }`}>
                        {matchWinner === 'disconnect'
                            ? t('portal.third_eye.opponent_disconnected', 'Opponent disconnected')
                            : isWin
                                ? t('portal.third_eye.you_win', 'You Win! 🎉')
                                : t('portal.third_eye.you_lose', 'You Lose!')}
                    </h2>

                    {finalScores && (
                        <div className="te-score-final">
                            <span className="te-score-final__label">{t('portal.third_eye.final_score', 'Final Score')}</span>
                            <span className="te-score-final__value">
                                {myColor ? finalScores[myColor] : finalScores.red} — {myColor ? finalScores[opponentColor] : finalScores.blue}
                            </span>
                        </div>
                    )}

                    <div className="te-game-over__actions">
                        <button
                            className="te-btn te-btn--primary"
                            onClick={requestRematch}
                            disabled={rematchRequested}
                        >
                            {rematchRequested
                                ? t('portal.third_eye.rematch_waiting', 'Waiting...')
                                : t('portal.third_eye.rematch', 'Rematch')}
                        </button>
                        <button className="te-btn te-btn--secondary" onClick={onBack}>
                            ← {t('portal.third_eye.back', 'Back to menu')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ----- Round result overlay -----
    if (showingResult && roundResult) {
        return (
            <div className="te-screen">
                <div className="te-scoreboard">
                    <span className="te-scoreboard__label">{t('portal.third_eye.you', 'You')}</span>
                    <span className="te-scoreboard__score te-scoreboard__score--mine">{myScore}</span>
                    <span className="te-scoreboard__divider">—</span>
                    <span className="te-scoreboard__score te-scoreboard__score--opponent">{opponentScore}</span>
                    <span className="te-scoreboard__label">{t('portal.third_eye.opponent', 'Opponent')}</span>
                </div>

                <div className="te-result-overlay">
                    <div className="te-result-overlay__lucky">
                        <span className="te-result-overlay__label">{t('portal.third_eye.lucky_number', 'Lucky Number')}</span>
                        <span className="te-result-overlay__number">{roundResult.luckyNumber}</span>
                    </div>

                    <div className="te-result-overlay__picks">
                        <div className="te-result-overlay__pick">
                            <span className="te-result-overlay__player">{t('portal.third_eye.you', 'You')}</span>
                            <span className="te-result-overlay__value">
                                {myColor && roundResult.picks[myColor] !== null ? roundResult.picks[myColor] : t('portal.third_eye.timeout', '⏰ Timeout')}
                            </span>
                            {myColor && roundResult.distances[myColor] !== null && (
                                <span className="te-result-overlay__dist">
                                    {t('portal.third_eye.distance', 'Distance')}: {roundResult.distances[myColor]}
                                </span>
                            )}
                        </div>
                        <div className="te-result-overlay__pick">
                            <span className="te-result-overlay__player">{t('portal.third_eye.opponent', 'Opponent')}</span>
                            <span className="te-result-overlay__value">
                                {roundResult.picks[opponentColor] !== null ? roundResult.picks[opponentColor] : t('portal.third_eye.timeout', '⏰ Timeout')}
                            </span>
                            {roundResult.distances[opponentColor] !== null && (
                                <span className="te-result-overlay__dist">
                                    {t('portal.third_eye.distance', 'Distance')}: {roundResult.distances[opponentColor]}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className={`te-result-overlay__winner ${roundResult.roundWinner === 'tie' ? 'te-result-overlay__winner--tie' :
                        roundResult.roundWinner === myColor ? 'te-result-overlay__winner--you' : 'te-result-overlay__winner--opponent'
                        }`}>
                        {roundResult.roundWinner === 'tie'
                            ? t('portal.third_eye.round_tie', '🤝 Tie!')
                            : roundResult.roundWinner === myColor
                                ? t('portal.third_eye.round_you_win', '🎯 You scored!')
                                : t('portal.third_eye.round_opponent_wins', 'Opponent scored!')}
                    </div>
                </div>
            </div>
        );
    }

    // ----- Active round -----
    return (
        <div className="te-screen">
            <div className="te-scoreboard">
                <span className="te-scoreboard__label">{t('portal.third_eye.you', 'You')}</span>
                <span className="te-scoreboard__score te-scoreboard__score--mine">{myScore}</span>
                <span className="te-scoreboard__divider">—</span>
                <span className="te-scoreboard__score te-scoreboard__score--opponent">{opponentScore}</span>
                <span className="te-scoreboard__label">{t('portal.third_eye.opponent', 'Opponent')}</span>
            </div>

            <div className="te-round-info">
                <span className="te-round-info__round">{t('portal.third_eye.round', 'Round')} {roundNumber}</span>
                <div className={`te-timer ${timerUrgent ? 'te-timer--urgent' : ''}`}>
                    <span className="te-timer__value">{timerSeconds}</span>
                    <span className="te-timer__label">s</span>
                </div>
            </div>

            <div className="te-range">
                <span className="te-range__label">{t('portal.third_eye.pick_between', 'Pick a number between')}</span>
                <div className="te-range__values">
                    <span className="te-range__min">{rangeMin}</span>
                    <span className="te-range__dash">—</span>
                    <span className="te-range__max">{rangeMax}</span>
                </div>
            </div>

            {hasSubmitted ? (
                <div className="te-submitted">
                    <span className="te-submitted__icon">✅</span>
                    <span className="te-submitted__text">
                        {t('portal.third_eye.submitted', 'You picked')} <strong>{pickConfirmed}</strong>
                    </span>
                    <span className="te-submitted__waiting">{t('portal.third_eye.waiting_opponent', 'Waiting for opponent...')}</span>
                </div>
            ) : (
                <div className="te-input-area">
                    <input
                        type="number"
                        className="te-input-area__input"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={`${rangeMin} – ${rangeMax}`}
                        min={rangeMin}
                        max={rangeMax}
                        step={1}
                        autoFocus
                    />
                    {inputError && <span className="te-input-area__error">{inputError}</span>}
                    <button className="te-btn te-btn--primary" onClick={handleSubmit}>
                        {t('portal.third_eye.submit', 'Submit')} 🔮
                    </button>
                </div>
            )}
        </div>
    );
};
