import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { socket } from '../../socket';
import { SOCKET_EVENTS } from '@rps/shared';
import './GameOverScreen.css';

export const GameOverScreen: React.FC = () => {
    const myColor = useGameStore((state) => state.myColor);
    const gameState = useGameStore((state) => state.gameState);
    const rematchState = useGameStore((state) => state.rematchState);
    const setRematchState = useGameStore((state) => state.setRematchState);

    if (!gameState || !myColor) return null;

    const winner = gameState.winner;
    const isWinner = winner === myColor;

    const handleReturnHome = () => {
        // Reset game state and return to matchmaking
        useGameStore.getState().reset();
        window.location.reload();
    };

    const handlePlayAgain = () => {
        setRematchState({ hasRequested: true });
        socket.emit(SOCKET_EVENTS.REQUEST_REMATCH);
    };

    const getRematchButtonText = () => {
        if (rematchState.hasRequested && rematchState.opponentRequested) {
            return 'Starting...';
        }
        if (rematchState.hasRequested) {
            return 'Waiting for opponent...';
        }
        return 'Play Again';
    };

    return (
        <div className="game-over-screen">
            <div className="game-over-screen__card">
                <div className={`game-over-screen__result ${isWinner ? 'game-over-screen__result--victory' : 'game-over-screen__result--defeat'}`}>
                    {isWinner ? 'Victory!' : 'Defeat'}
                </div>

                <div className="game-over-screen__message">
                    {isWinner
                        ? `You have captured the opponent's King!`
                        : `Your King has been captured!`
                    }
                </div>

                {rematchState.opponentRequested && !rematchState.hasRequested && (
                    <div className="game-over-screen__notification">
                        Opponent wants to play again!
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
                        Return to Menu
                    </button>
                </div>
            </div>
        </div>
    );
};
