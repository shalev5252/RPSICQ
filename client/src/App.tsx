import React from 'react';
import { useSocket } from './hooks/useSocket';
import { useGameSession } from './hooks/useGameSession';
import { useGameStore } from './store/gameStore';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { MatchmakingScreen } from './components/MatchmakingScreen';
import { SetupScreen } from './components/setup';
import { GameScreen } from './components/game/GameScreen';
import { GameOverScreen } from './components/game/GameOverScreen';
import './App.css';

import { SoundProvider, useSound } from './context/SoundContext';
import './i18n'; // Ensure i18n is initialized if not already in main, but duplicate is harmless or consistent with main

function AppContent() {
    const { socket, isConnected } = useSocket();
    useGameSession(socket); // Handle global game events
    const gamePhase = useGameStore(state => state.gamePhase);
    const { playBGM } = useSound();
    const { t } = useTranslation();

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
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <h1>{t('app.title')}</h1>
                    <LanguageSwitcher />
                </div>
                <img src="/rps_logo.png" alt="RPS Battle Logo" className="header-logo" />
                <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? t('app.connected') : t('app.disconnected')}
                </div>
            </header>

            <main className="app-main">
                {!isConnected ? (
                    <div className="loading">
                        <p>{t('app.connecting')}</p>
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
