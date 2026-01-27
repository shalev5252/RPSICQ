import React from 'react';
import { useMatchmaking } from '../hooks/useMatchmaking';
import './MatchmakingScreen.css';

export const MatchmakingScreen: React.FC = () => {
    const { isSearching, joinQueue, leaveQueue } = useMatchmaking();

    return (
        <div className="matchmaking-screen">
            <h2>RPS Battle</h2>
            <div className="actions">
                {!isSearching ? (
                    <button className="btn-primary" onClick={joinQueue}>
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
