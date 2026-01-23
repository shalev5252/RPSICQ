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

const URL = getSocketUrl();

export const socket = io(URL, {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    transports: ['websocket', 'polling'], // Prefer websocket
});
