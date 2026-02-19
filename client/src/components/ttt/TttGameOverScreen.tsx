import React from 'react';
import { useTranslation } from 'react-i18next';
import type { TttCell, TttMark } from '@rps/shared';
import { TttBoard } from './TttBoard';
import './TttGameOverScreen.css';

interface TttGameOverScreenProps {
    winner: TttMark | 'draw' | 'disconnect';
    myMark: TttMark;
    board: TttCell[];
    winningLine: number[] | null;
    rematchRequested: boolean;
    onRematch: () => void;
    onBack: () => void;
    mode: 'online' | 'ai';
}

export const TttGameOverScreen: React.FC<TttGameOverScreenProps> = ({
    winner,
    myMark,
    board,
    winningLine,
    rematchRequested,
    onRematch,
    onBack,
    mode,
}) => {
    const { t } = useTranslation();

    let resultText: string;
    let resultClass: string;

    if (winner === 'disconnect') {
        resultText = t('ttt.opponent_disconnected', 'Opponent disconnected');
        resultClass = 'ttt-game-over__result--win';
    } else if (winner === 'draw') {
        resultText = t('ttt.draw', "It's a Draw!");
        resultClass = 'ttt-game-over__result--draw';
    } else if (winner === myMark) {
        resultText = t('ttt.you_win', 'You Win! 🎉');
        resultClass = 'ttt-game-over__result--win';
    } else {
        resultText = t('ttt.you_lose', 'You Lose!');
        resultClass = 'ttt-game-over__result--lose';
    }

    return (
        <div className="ttt-game-over">
            <h2 className={`ttt-game-over__result ${resultClass}`}>{resultText}</h2>

            {winner !== 'disconnect' && (
                <div className="ttt-game-over__board">
                    <TttBoard
                        board={board}
                        winningLine={winningLine}
                        myMark={myMark}
                        currentTurn={myMark}
                        isGameOver={true}
                        onCellClick={() => { }}
                    />
                </div>
            )}

            <div className="ttt-game-over__actions">
                {winner !== 'disconnect' && (
                    <button
                        className={`ttt-game-over__btn ttt-game-over__btn--rematch ${rematchRequested ? 'ttt-game-over__btn--waiting' : ''}`}
                        onClick={onRematch}
                        disabled={rematchRequested}
                    >
                        {rematchRequested
                            ? (mode === 'ai'
                                ? t('ttt.starting', 'Starting...')
                                : t('ttt.rematch_waiting', 'Waiting for opponent...'))
                            : t('ttt.rematch', 'Rematch')}
                    </button>
                )}

                <button className="ttt-game-over__btn ttt-game-over__btn--back" onClick={onBack}>
                    ← {t('ttt.back_to_menu', 'Back to menu')}
                </button>
            </div>
        </div>
    );
};
