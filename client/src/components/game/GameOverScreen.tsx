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
    const winReason = gameState.winReason;
    const isDraw = winReason === 'draw' || winReason === 'draw_offer';
    const isWinner = winner === myColor;

    const handleReturnHome = () => {
        // Notify server so it can clean up the session
        socket.emit(SOCKET_EVENTS.LEAVE_SESSION);
        // Reset game state — sets gamePhase to 'waiting', which unmounts this screen
        useGameStore.getState().reset();
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
            return t('game.game_over.starting');
        }
        if (rematchState.hasRequested) {
            return isSingleplayer ? t('game.game_over.starting') : t('game.game_over.waiting_opponent');
        }
        return t('game.game_over.play_again');
    };

    const getReasonMessage = () => {
        const reason = gameState.winReason;

        switch (reason) {
            case 'forfeit':
                return isWinner
                    ? t('game.game_over.msg_forfeit_win', 'Opponent forfeited.')
                    : t('game.game_over.msg_forfeit_loss', 'You forfeited.');
            case 'disconnect':
                return isWinner
                    ? t('game.game_over.msg_disconnect_win', 'Opponent disconnected.')
                    : t('game.game_over.msg_disconnect_loss', 'Disconnected.');
            case 'timeout':
                return isWinner
                    ? t('game.game_over.msg_timeout_win', 'Opponent timed out.')
                    : t('game.game_over.msg_timeout_loss', 'Time ran out.');
            case 'draw':
            case 'draw_offer':
                return t('game.game_over.msg_draw', 'Game ended in a draw.');
            case 'elimination':
                return isWinner
                    ? t('game.game_over.msg_elimination_win', 'You eliminated the enemy army!')
                    : t('game.game_over.msg_elimination_loss', 'Your army was eliminated!');
            case 'king_captured':
            default:
                return isWinner
                    ? t('game.game_over.msg_king_captured_win')
                    : t('game.game_over.msg_king_captured_loss');
        }
    };

    return (
        <div className="game-over-screen">
            <div className="game-over-screen__card">
                <div className={`game-over-screen__result ${isDraw ? 'game-over-screen__result--draw' : isWinner ? 'game-over-screen__result--victory' : 'game-over-screen__result--defeat'}`}>
                    {isDraw ? t('game.game_over.draw') : isWinner ? t('game.game_over.victory') : t('game.game_over.defeat')}
                </div>

                <div className="game-over-screen__message">
                    {getReasonMessage()}
                </div>

                {!isSingleplayer && rematchState.opponentRequested && !rematchState.hasRequested && (
                    <div className="game-over-screen__notification">
                        {t('game.game_over.opponent_rematch')}
                    </div>
                )}

                <div className="game-over-screen__buttons">
                    <button
                        className="game-over-screen__button game-over-screen__button--primary"
                        onClick={handlePlayAgain}
                        disabled={rematchState.hasRequested}
                        data-testid="rematch-button"
                    >
                        {getRematchButtonText()}
                    </button>
                    <button
                        className="game-over-screen__button game-over-screen__button--secondary"
                        onClick={handleReturnHome}
                    >
                        {t('game.game_over.return_home')}
                    </button>
                </div>
            </div>
        </div>
    );
};
