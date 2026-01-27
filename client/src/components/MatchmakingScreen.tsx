import React from 'react';
import { useMatchmaking } from '../hooks/useMatchmaking';
import { useGameStore } from '../store/gameStore';
import { ModeSelect } from './ModeSelect';
import './MatchmakingScreen.css';

export const MatchmakingScreen: React.FC = () => {
    const isSearching = useMatchmaking().isSearching;
    const joinQueue = useMatchmaking().joinQueue;
    const leaveQueue = useMatchmaking().leaveQueue;
    const { gameMode, setGameMode } = useGameStore((state) => ({
        gameMode: state.gameMode,
        setGameMode: state.setGameMode
    }));

    const handleJoin = () => {
        joinQueue(gameMode);
    };

    return (
        <div className="matchmaking-screen">
            <h2>RPS Battle</h2>

            <ModeSelect
                selectedMode={gameMode}
                onSelectMode={setGameMode}
                disabled={isSearching}
            />

            <div className="actions">
                {!isSearching ? (
                    <button className="btn-primary" onClick={handleJoin}>
                        Find Game
                    </button>
                ) : (
                    <div className="searching-state">
                        <div className="spinner"></div>
                        <p>Searching for opponent...</p>
                        <button className="btn-secondary" onClick={leaveQueue}>
                            Cancel
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
