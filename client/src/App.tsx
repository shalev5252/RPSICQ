import { useSocket } from './hooks/useSocket';
import { useGameSession } from './hooks/useGameSession';
import { useGameStore } from './store/gameStore';
import { MatchmakingScreen } from './components/MatchmakingScreen';
import './App.css';

function App() {
    const { socket, isConnected } = useSocket();
    useGameSession(socket); // Handle global game events
    const gamePhase = useGameStore(state => state.gamePhase);

    return (
        <div className="app">
            <header className="app-header">
                <h1>🎮 RPS Battle</h1>
                <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                    {isConnected ? '🟢 מחובר' : '🔴 מנותק'}
                </div>
            </header>

            <main className="app-main">
                {!isConnected ? (
                    <div className="loading">
                        <p>מתחבר לשרת...</p>
                    </div>
                ) : (
                    <>
                        {gamePhase === 'waiting' && <MatchmakingScreen />}
                        {gamePhase !== 'waiting' && (
                            <div className="game-container">
                                <h2>Game Phase: {gamePhase}</h2>
                                <p>Multiplayer Session Active</p>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}

export default App;
