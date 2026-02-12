/**
 * Session Storage Utility
 * Manages persistence of active game sessions to localStorage
 */

const STORAGE_KEY = 'rps_active_session';
const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export interface StoredSession {
    sessionId: string;
    phase: string;
    timestamp: number;
}

/**
 * Save the current active session to localStorage
 */
export function setActiveSession(sessionId: string, phase: string): void {
    try {
        const session: StoredSession = {
            sessionId,
            phase,
            timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        console.log('💾 Session saved to localStorage:', sessionId, phase);
    } catch (error) {
        // Graceful fallback if localStorage is unavailable
        console.warn('⚠️ Failed to save session to localStorage:', error);
    }
}

/**
 * Retrieve stored session from localStorage and validate age
 * Returns null if not found, expired, or invalid
 */
export function getActiveSession(): StoredSession | null {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return null;

        const session: StoredSession = JSON.parse(stored);

        // Validate parsed data shape
        if (
            typeof session !== 'object' ||
            session === null ||
            typeof session.sessionId !== 'string' ||
            session.sessionId === '' ||
            typeof session.timestamp !== 'number' ||
            !Number.isFinite(session.timestamp) ||
            typeof session.phase !== 'string'
        ) {
            console.warn('⚠️ Malformed session data in localStorage, clearing');
            clearActiveSession();
            return null;
        }

        const age = Date.now() - session.timestamp;

        if (age > MAX_AGE_MS) {
            console.log('⏰ Stored session expired (age:', Math.round(age / 1000), 's)');
            clearActiveSession();
            return null;
        }

        console.log('📂 Retrieved stored session:', session.sessionId, session.phase);
        return session;
    } catch (error) {
        console.warn('⚠️ Failed to retrieve session from localStorage:', error);
        return null;
    }
}

/**
 * Clear the stored session from localStorage
 */
export function clearActiveSession(): void {
    try {
        localStorage.removeItem(STORAGE_KEY);
        console.log('🗑️ Cleared stored session from localStorage');
    } catch (error) {
        console.warn('⚠️ Failed to clear session from localStorage:', error);
    }
}
