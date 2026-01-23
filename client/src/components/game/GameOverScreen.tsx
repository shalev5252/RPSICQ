import React from 'react';
import { useGameStore } from '../../store/gameStore';
import './GameOverScreen.css';

export const GameOverScreen: React.FC = () => {
    const myColor = useGameStore((state) => state.myColor);
    const gameState = useGameStore((state) => state.gameState);

    if (!gameState || !myColor) return null;

    const winner = gameState.winner;
    const isWinner = winner === myColor;

    const handleReturnHome = () => {
        // Reset game state and return to matchmaking
        useGameStore.getState().reset();
        window.location.reload();
    };

    return (
        <div className="game-over-screen">
            <div className="game-over-screen__card">
                <div className={`game-over-screen__result ${isWinner ? 'game-over-screen__result--victory' : 'game-over-screen__result--defeat'}`}>
                    {isWinner ? '🎉 Victory!' : '💔 Defeat'}
                </div>

                <div className="game-over-screen__message">
                    {isWinner
                        ? `You have captured the opponent's King!`
                        : `Your King has been captured!`
                    }
                </div>

                <button
                    className="game-over-screen__button"
                    onClick={handleReturnHome}
                >
                    Return to Menu
                </button>
            </div>
        </div>
    );
};
