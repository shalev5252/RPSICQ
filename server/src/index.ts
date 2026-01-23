import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { setupSocketHandlers } from './socket/handlers.js';

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const httpServer = createServer(app);

const io = new Server(httpServer, {
    cors: {
        origin: CLIENT_URL,
        methods: ['GET', 'POST'],
        credentials: true,
    },
    pingTimeout: 60000,      // 60s to wait for pong (more lenient for slow networks)
    pingInterval: 25000,     // Ping every 25s (less aggressive, reduces overhead)
    transports: ['websocket', 'polling'],
    allowUpgrades: true,
    perMessageDeflate: false, // Disable compression (can cause issues with some proxies)
});

setupSocketHandlers(io);

httpServer.listen(PORT, () => {
    console.log(`🚀 RPS Battle Server running on port ${PORT}`);
    console.log(`📡 Accepting connections from ${CLIENT_URL}`);
});
