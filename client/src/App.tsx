import { useSocket } from './hooks/useSocket';
import './App.css';

function App() {
    const { isConnected } = useSocket();

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
                    <div className="lobby">
                        <h2>ברוכים הבאים ל-RPS Battle!</h2>
                        <p>משחק אבן נייר מספריים אסטרטגי לשני שחקנים</p>
                        <button className="start-button" disabled>
                            התחל משחק
                        </button>
                        <p className="coming-soon">🚧 בקרוב...</p>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
