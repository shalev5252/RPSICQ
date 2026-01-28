import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/gameStore';
import { socket } from '../../socket';
import { SOCKET_EVENTS } from '@rps/shared';
import './GameOverScreen.css';

export const GameOverScreen: React.FC = () => {
    const myColor = useGameStore((state) => state.myColor);
    const gameState = useGameStore((state) => state.gameState);
    const rematchState = useGameStore((state) => state.rematchState);
    const setRematchState = useGameStore((state) => state.setRematchState);
    const opponentType = useGameStore((state) => state.opponentType);

    if (!gameState || !myColor) return null;

    const isSingleplayer = opponentType === 'ai';
    const winner = gameState.winner;
    const isWinner = winner === myColor;

    const handleReturnHome = () => {
        // Reset game state and return to matchmaking
        useGameStore.getState().reset();
        window.location.reload();
    };

    const handlePlayAgain = () => {
        if (!socket?.connected) {
            console.error('Cannot request rematch: socket disconnected');
            return;
        }

        socket.emit(SOCKET_EVENTS.REQUEST_REMATCH);
        setRematchState({ hasRequested: true });
    };

    const { t } = useTranslation();

    const getRematchButtonText = () => {
        if (rematchState.hasRequested && rematchState.opponentRequested) {
            return t('game_over.starting');
        }
        if (rematchState.hasRequested) {
            return isSingleplayer ? t('game_over.starting') : t('game_over.waiting_opponent');
        }
        return t('game_over.play_again');
    };

    return (
        <div className="game-over-screen">
            <div className="game-over-screen__card">
                <div className={`game-over-screen__result ${isWinner ? 'game-over-screen__result--victory' : 'game-over-screen__result--defeat'}`}>
                    {isWinner ? t('game_over.victory') : t('game_over.defeat')}
                </div>

                <div className="game-over-screen__message">
                    {isWinner
                        ? t('game_over.msg_king_captured_win')
                        : t('game_over.msg_king_captured_loss')
                    }
                </div>

                {!isSingleplayer && rematchState.opponentRequested && !rematchState.hasRequested && (
                    <div className="game-over-screen__notification">
                        {t('game_over.opponent_rematch')}
                    </div>
                )}

                <div className="game-over-screen__buttons">
                    <button
                        className="game-over-screen__button game-over-screen__button--primary"
                        onClick={handlePlayAgain}
                        disabled={rematchState.hasRequested}
                    >
                        {getRematchButtonText()}
                    </button>
                    <button
                        className="game-over-screen__button game-over-screen__button--secondary"
                        onClick={handleReturnHome}
                    >
                        {t('game_over.return_home')}
                    </button>
                </div>
            </div>
        </div>
    );
};
