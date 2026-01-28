import React from 'react';
import { useTranslation } from 'react-i18next';
import { useMatchmaking } from '../hooks/useMatchmaking';
import { useGameStore } from '../store/gameStore';
import { ModeSelect } from './ModeSelect';
import { socket } from '../socket';
import { SOCKET_EVENTS } from '@rps/shared';
import './MatchmakingScreen.css';

export const MatchmakingScreen: React.FC = () => {
    const isSearching = useMatchmaking().isSearching;
    const joinQueue = useMatchmaking().joinQueue;
    const leaveQueue = useMatchmaking().leaveQueue;
    const { gameMode, setGameMode, opponentType, setOpponentType } = useGameStore((state) => ({
        gameMode: state.gameMode,
        setGameMode: state.setGameMode,
        opponentType: state.opponentType,
        setOpponentType: state.setOpponentType
    }));

    const { t } = useTranslation();

    const handleJoin = () => {
        if (opponentType === 'ai') {
            socket.emit(SOCKET_EVENTS.START_SINGLEPLAYER, { gameMode });
        } else {
            joinQueue(gameMode);
        }
    };

    return (
        <div className="matchmaking-screen">


            <ModeSelect
                selectedMode={gameMode}
                onSelectMode={setGameMode}
                disabled={isSearching}
            />

            <div className="opponent-select">
                <h3 className="opponent-select__title">{t('matchmaking.select_opponent')}</h3>
                <div className="opponent-select__options">
                    <button
                        className={`opponent-select__option ${opponentType === 'human' ? 'opponent-select__option--selected' : ''}`}
                        onClick={() => setOpponentType('human')}
                        disabled={isSearching}
                    >
                        <div className="opponent-select__icon">&#x1F465;</div>
                        <div className="opponent-select__label">{t('matchmaking.vs_player')}</div>
                    </button>
                    <button
                        className={`opponent-select__option ${opponentType === 'ai' ? 'opponent-select__option--selected' : ''}`}
                        onClick={() => setOpponentType('ai')}
                        disabled={isSearching}
                    >
                        <div className="opponent-select__icon">&#x1F916;</div>
                        <div className="opponent-select__label">{t('matchmaking.vs_computer')}</div>
                    </button>
                </div>
            </div>

            <div className="actions">
                {!isSearching ? (
                    <button className="btn-primary" onClick={handleJoin}>
                        {opponentType === 'ai' ? t('matchmaking.start_game') : t('matchmaking.find_game')}
                    </button>
                ) : (
                    <div className="searching-state">
                        <div className="spinner"></div>
                        <p>{t('matchmaking.searching')}</p>
                        <button className="btn-secondary" onClick={leaveQueue}>
                            {t('matchmaking.cancel')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
