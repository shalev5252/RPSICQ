import { io } from 'socket.io-client';

const getSocketUrl = () => {
    if (import.meta.env.VITE_SOCKET_URL) {
        return import.meta.env.VITE_SOCKET_URL;
    }
    if (import.meta.env.PROD) {
        console.error('⚠️ VITE_SOCKET_URL is not defined in production environment!');
        return undefined; // Fallback to window.location
    }
    return 'http://localhost:3001';
};

// Generate or retrieve persistent player ID
const getOrCreatePlayerId = (): string => {
    // START_CHANGE
    // Use sessionStorage instead of localStorage so that multiple tabs (for testing) 
    // get unique IDs, but ID persists on page refresh within the same tab.
    const STORAGE_KEY = 'rps_player_id';
    let playerId = sessionStorage.getItem(STORAGE_KEY);
    if (!playerId) {
        playerId = crypto.randomUUID();
        sessionStorage.setItem(STORAGE_KEY, playerId);
        console.log('🆔 Generated new player ID:', playerId);
    } else {
        console.log('🆔 Using existing player ID:', playerId);
    }
    // END_CHANGE
    return playerId;
};

const URL = getSocketUrl();
const playerId = getOrCreatePlayerId();

export { playerId };

export const socket = io(URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,  // Keep trying
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['polling', 'websocket'],  // Start with polling, upgrade to websocket
    upgrade: true,                   // Allow upgrade from polling to websocket
    withCredentials: true,
    auth: {
        playerId,  // Send persistent player ID with connection
    },
});

