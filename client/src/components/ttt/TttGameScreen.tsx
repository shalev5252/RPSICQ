import React, { useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../hooks/useSocket';
import { useTttGame } from '../../hooks/useTttSocket';
import { SOCKET_EVENTS } from '@rps/shared';
import type { TttDifficulty } from '@rps/shared';
import { TttBoard } from './TttBoard';
import { TttGameOverScreen } from './TttGameOverScreen';
import './TttGameScreen.css';

interface TttGameScreenProps {
    mode: 'online' | 'ai';
    difficulty?: TttDifficulty;
    onBack: () => void;
}

export const TttGameScreen: React.FC<TttGameScreenProps> = ({ mode, difficulty, onBack }) => {
    const { t } = useTranslation();
    const { socket } = useSocket();
    const { board, myMark, currentTurn, winner, winningLine, isGameStarted, rematchRequested } = useTttGame();
    const [waitingForMatch, setWaitingForMatch] = useState(false);

    // Start game
    useEffect(() => {
        if (!socket) return;

        if (mode === 'ai' && difficulty) {
            socket.emit(SOCKET_EVENTS.TTT_START_SINGLEPLAYER, {
                playerId: socket.id,
                difficulty,
            });
        } else if (mode === 'online') {
            setWaitingForMatch(true);
            socket.emit(SOCKET_EVENTS.JOIN_QUEUE, {
                playerId: socket.id,
                gameMode: 'ttt-classic',
            });
        }

        return () => {
            if (mode === 'online') {
                socket.emit(SOCKET_EVENTS.LEAVE_QUEUE);
            }
        };
    }, [socket, mode, difficulty]);

    // When game starts in online mode, stop showing waiting
    useEffect(() => {
        if (isGameStarted) setWaitingForMatch(false);
    }, [isGameStarted]);

    const handleCellClick = useCallback((cellIndex: number) => {
        if (!socket || winner !== null) return;
        socket.emit(SOCKET_EVENTS.TTT_MOVE, { cellIndex });
    }, [socket, winner]);

    const handleRematch = useCallback(() => {
        if (!socket) return;
        socket.emit(SOCKET_EVENTS.TTT_REMATCH);
    }, [socket]);

    const isMyTurn = currentTurn === myMark;
    const isGameOver = winner !== null;

    // Waiting for match
    if (waitingForMatch && !isGameStarted) {
        return (
            <div className="ttt-game-screen">
                <div className="ttt-game-screen__waiting">
                    <div className="ttt-game-screen__spinner" />
                    <p>{t('ttt.waiting_for_opponent', 'Waiting for opponent...')}</p>
                    <button className="ttt-game-screen__cancel" onClick={onBack}>
                        {t('common.cancel', 'Cancel')}
                    </button>
                </div>
            </div>
        );
    }

    // Game not started yet (shouldn't happen but safety)
    if (!isGameStarted) {
        return (
            <div className="ttt-game-screen">
                <div className="ttt-game-screen__waiting">
                    <div className="ttt-game-screen__spinner" />
                    <p>{t('ttt.starting', 'Starting game...')}</p>
                </div>
            </div>
        );
    }

    // Game over
    if (isGameOver) {
        return (
            <TttGameOverScreen
                winner={winner}
                myMark={myMark!}
                board={board}
                winningLine={winningLine}
                rematchRequested={rematchRequested}
                onRematch={handleRematch}
                onBack={onBack}
                mode={mode}
            />
        );
    }

    return (
        <div className="ttt-game-screen">
            <div className="ttt-game-screen__status">
                <div className={`ttt-game-screen__turn-indicator ${isMyTurn ? 'ttt-game-screen__turn-indicator--my-turn' : ''}`}>
                    {isMyTurn
                        ? t('ttt.your_turn', 'Your turn')
                        : t('ttt.opponent_turn', "Opponent's turn")}
                </div>
                <div className="ttt-game-screen__mark-info">
                    {t('ttt.you_are', 'You are')} <span className={`ttt-mark ttt-mark--${myMark}`}>{myMark}</span>
                </div>
            </div>

            <TttBoard
                board={board}
                winningLine={winningLine}
                myMark={myMark!}
                currentTurn={currentTurn}
                isGameOver={false}
                onCellClick={handleCellClick}
            />

            <button className="ttt-game-screen__back-btn" onClick={onBack}>
                ← {t('common.back', 'Back')}
            </button>
        </div>
    );
};
