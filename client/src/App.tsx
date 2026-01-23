import { useSocket } from './hooks/useSocket';
import { useGameSession } from './hooks/useGameSession';
import { useGameStore } from './store/gameStore';
import { MatchmakingScreen } from './components/MatchmakingScreen';
import { SetupScreen } from './components/setup';
import { GameScreen } from './components/game/GameScreen';
import { GameOverScreen } from './components/game/GameOverScreen';
import './App.css';

function App() {
    const { socket, isConnected } = useSocket();
    useGameSession(socket); // Handle global game events
    const gamePhase = useGameStore(state => state.gamePhase);

    return (
        <div className="app">
            <header className="app-header">
                <h1>RPS Battle</h1>
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
                        {gamePhase === 'playing' && <GameScreen />}
                        {gamePhase === 'finished' && <GameOverScreen />}
                    </>
                )}
            </main>
        </div>
    );
}

export default App;
