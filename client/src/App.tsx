import React from 'react';
import rpsLogo from './assets/images/rps_logo.png';
import { useSocket } from './hooks/useSocket';
import { useGameSession } from './hooks/useGameSession';
import { useGameStore } from './store/gameStore';
import { MatchmakingScreen } from './components/MatchmakingScreen';
import { SetupScreen } from './components/setup';
import { GameScreen } from './components/game/GameScreen';
import { GameOverScreen } from './components/game/GameOverScreen';
import './App.css';

import { SoundProvider, useSound } from './context/SoundContext';

function AppContent() {
    const { socket, isConnected } = useSocket();
    useGameSession(socket); // Handle global game events
    const gamePhase = useGameStore(state => state.gamePhase);
    const { playBGM } = useSound();

    // Try to start BGM on first interaction or mount (if allowed)
    // We'll add a click listener to the window to ensure it starts if autoplay is blocked
    React.useEffect(() => {
        const handleInteraction = () => {
            playBGM();
        };

        window.addEventListener('click', handleInteraction, { once: true });
        return () => window.removeEventListener('click', handleInteraction);
    }, [playBGM]);

    return (
        <div className="app">
            <header className="app-header">
                <h1>RPS Battle</h1>
                <img src={rpsLogo} alt="RPS Battle Logo" className="header-logo" />
                <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? 'Connected' : 'Disconnected'}
                </div>
            </header>

            <main className="app-main">
                {!isConnected ? (
                    <div className="loading">
                        <p>Connecting to server...</p>
                    </div>
                ) : (
                    <>
                        {gamePhase === 'waiting' && <MatchmakingScreen />}
                        {gamePhase === 'setup' && <SetupScreen />}
                        {(gamePhase === 'playing' || gamePhase === 'tie_breaker') && <GameScreen />}
                        {gamePhase === 'finished' && <GameOverScreen />}
                    </>
                )}
            </main>
        </div>
    );
}

function App() {
    return (
        <SoundProvider>
            <AppContent />
        </SoundProvider>
    );
}

export default App;
