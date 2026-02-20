import type { PlayerColor, ThirdEyeScores } from '@rps/shared';

const TIMER_DURATION_MS = 20_000;
const WIN_SCORE = 3;

interface PlayerPick {
    number: number | null;   // null = timed out
    submitted: boolean;
}

export interface ThirdEyeSession {
    sessionId: string;
    sockets: { red: string; blue: string };
    scores: ThirdEyeScores;
    roundNumber: number;
    rangeMin: number;
    rangeMax: number;
    luckyNumber: number;
    picks: { red: PlayerPick; blue: PlayerPick };
    timerRef: ReturnType<typeof setTimeout> | null;
    tickIntervalRef: ReturnType<typeof setInterval> | null;
    roundActive: boolean;
    roundResolving?: boolean;
    winner: PlayerColor | null;
    rematchRequests: { red: boolean; blue: boolean };
}

export class ThirdEyeGameService {
    private sessions: Map<string, ThirdEyeSession> = new Map();
    private socketToSession: Map<string, string> = new Map();

    // ---------------------------------------------------------------
    // Session lifecycle
    // ---------------------------------------------------------------

    public createSession(sessionId: string, socket1Id: string, socket2Id: string, p1Role: PlayerColor, _p2Role: PlayerColor): ThirdEyeSession {
        // Clean up any existing session with the same ID
        const oldSession = this.sessions.get(sessionId);
        if (oldSession) {
            this.clearTimers(oldSession);
            if (oldSession.sockets.red) this.socketToSession.delete(oldSession.sockets.red);
            if (oldSession.sockets.blue) this.socketToSession.delete(oldSession.sockets.blue);
            this.sessions.delete(sessionId);
        }

        // Map sockets to roles
        const redSocketId = p1Role === 'red' ? socket1Id : socket2Id;
        const blueSocketId = p1Role === 'blue' ? socket1Id : socket2Id;

        const session: ThirdEyeSession = {
            sessionId,
            sockets: { red: redSocketId, blue: blueSocketId },
            scores: { red: 0, blue: 0 },
            roundNumber: 0,
            rangeMin: 0,
            rangeMax: 0,
            luckyNumber: 0,
            picks: {
                red: { number: null, submitted: false },
                blue: { number: null, submitted: false },
            },
            timerRef: null,
            tickIntervalRef: null,
            roundActive: false,
            winner: null,
            rematchRequests: { red: false, blue: false },
        };

        this.sessions.set(sessionId, session);
        this.socketToSession.set(redSocketId, sessionId);
        this.socketToSession.set(blueSocketId, sessionId);

        return session;
    }

    public getSession(sessionId: string): ThirdEyeSession | undefined {
        return this.sessions.get(sessionId);
    }

    public getSessionBySocket(socketId: string): ThirdEyeSession | undefined {
        const sessionId = this.socketToSession.get(socketId);
        if (!sessionId) return undefined;
        return this.sessions.get(sessionId);
    }

    public getPlayerColor(socketId: string): PlayerColor | null {
        const session = this.getSessionBySocket(socketId);
        if (!session) return null;
        if (session.sockets.red === socketId) return 'red';
        if (session.sockets.blue === socketId) return 'blue';
        return null;
    }

    public deleteSession(sessionId: string): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;
        this.clearTimers(session);
        this.socketToSession.delete(session.sockets.red);
        this.socketToSession.delete(session.sockets.blue);
        this.sessions.delete(sessionId);
    }

    // ---------------------------------------------------------------
    // Round management
    // ---------------------------------------------------------------

    /**
     * Start a new round. Generates range + lucky number.
     * Returns the round-start payload to emit to clients.
     */
    public startRound(sessionId: string): {
        roundNumber: number;
        rangeMin: number;
        rangeMax: number;
        timerDurationMs: number;
    } | null {
        const session = this.sessions.get(sessionId);
        if (!session || session.winner) return null;

        // Prevent starting a new round if one is already active
        if (session.roundActive) return null;

        session.roundNumber++;

        // Generate range: min in [1, 500], max = min + uniform(100, 300)
        const min = Math.floor(Math.random() * 500) + 1;
        const rangeSize = Math.floor(Math.random() * 201) + 100; // 100..300
        const max = min + rangeSize;

        session.rangeMin = min;
        session.rangeMax = max;
        session.luckyNumber = Math.floor(Math.random() * (max - min + 1)) + min;

        // Reset picks
        session.picks = {
            red: { number: null, submitted: false },
            blue: { number: null, submitted: false },
        };
        session.roundActive = true;
        session.roundResolving = false;

        return {
            roundNumber: session.roundNumber,
            rangeMin: min,
            rangeMax: max,
            timerDurationMs: TIMER_DURATION_MS,
        };
    }

    /**
     * Submit a player's pick. Returns whether both players have submitted.
     */
    public submitPick(sessionId: string, socketId: string, number: number): {
        success: boolean;
        error?: string;
        bothSubmitted: boolean;
    } {
        const session = this.sessions.get(sessionId);
        if (!session) return { success: false, error: 'Session not found', bothSubmitted: false };
        if (!session.roundActive) return { success: false, error: 'No active round', bothSubmitted: false };

        const color = this.getPlayerColor(socketId);
        if (!color) return { success: false, error: 'Player not in session', bothSubmitted: false };

        if (session.picks[color].submitted) {
            return { success: false, error: 'Already submitted', bothSubmitted: false };
        }

        // Validate range
        if (number < session.rangeMin || number > session.rangeMax || !Number.isInteger(number)) {
            return { success: false, error: 'Number out of range', bothSubmitted: false };
        }

        session.picks[color] = { number, submitted: true };

        const bothSubmitted = session.picks.red.submitted && session.picks.blue.submitted;
        return { success: true, bothSubmitted };
    }

    /**
     * Resolve the current round. Returns the result payload.
     * Handles timeouts (picks that weren't submitted are null).
     */
    public resolveRound(sessionId: string): {
        luckyNumber: number;
        picks: { red: number | null; blue: number | null };
        distances: { red: number | null; blue: number | null };
        roundWinner: PlayerColor | 'tie';
        scores: ThirdEyeScores;
        matchOver: boolean;
        matchWinner: PlayerColor | null;
    } | null {
        const session = this.sessions.get(sessionId);
        if (!session) return null;
        if (session.roundResolving) return null;

        session.roundResolving = true;
        session.roundActive = false;
        this.clearTimers(session);

        const redPick = session.picks.red.number;
        const bluePick = session.picks.blue.number;

        const redDist = redPick !== null ? Math.abs(redPick - session.luckyNumber) : null;
        const blueDist = bluePick !== null ? Math.abs(bluePick - session.luckyNumber) : null;

        let roundWinner: PlayerColor | 'tie';

        if (redDist === null && blueDist === null) {
            roundWinner = 'tie'; // Both timed out
        } else if (redDist === null) {
            roundWinner = 'blue'; // Red timed out
            session.scores.blue++;
        } else if (blueDist === null) {
            roundWinner = 'red'; // Blue timed out
            session.scores.red++;
        } else if (redDist < blueDist) {
            roundWinner = 'red';
            session.scores.red++;
        } else if (blueDist < redDist) {
            roundWinner = 'blue';
            session.scores.blue++;
        } else {
            roundWinner = 'tie'; // Equal distances
        }

        // Check for match victory
        let matchOver = false;
        let matchWinner: PlayerColor | null = null;
        if (session.scores.red >= WIN_SCORE) {
            matchOver = true;
            matchWinner = 'red';
            session.winner = 'red';
        } else if (session.scores.blue >= WIN_SCORE) {
            matchOver = true;
            matchWinner = 'blue';
            session.winner = 'blue';
        }

        return {
            luckyNumber: session.luckyNumber,
            picks: { red: redPick, blue: bluePick },
            distances: { red: redDist, blue: blueDist },
            roundWinner,
            scores: { ...session.scores },
            matchOver,
            matchWinner,
        };
    }

    // ---------------------------------------------------------------
    // Timer
    // ---------------------------------------------------------------

    /**
     * Start the round timer. Returns callbacks for tick and timeout.
     */
    public startTimer(
        sessionId: string,
        onTick: (timeRemainingMs: number) => void,
        onTimeout: () => void,
    ): void {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        // Clear any existing timers to prevent stale refs
        this.clearTimers(session);

        const startTime = Date.now();
        const endTime = startTime + TIMER_DURATION_MS;

        // Tick every second
        session.tickIntervalRef = setInterval(() => {
            const remaining = Math.max(0, endTime - Date.now());
            onTick(remaining);
        }, 1000);

        // Final timeout
        session.timerRef = setTimeout(() => {
            this.clearTimers(session);
            onTimeout();
        }, TIMER_DURATION_MS);
    }

    private clearTimers(session: ThirdEyeSession): void {
        if (session.timerRef) {
            clearTimeout(session.timerRef);
            session.timerRef = null;
        }
        if (session.tickIntervalRef) {
            clearInterval(session.tickIntervalRef);
            session.tickIntervalRef = null;
        }
    }

    // ---------------------------------------------------------------
    // Rematch
    // ---------------------------------------------------------------

    public requestRematch(sessionId: string, socketId: string): { bothReady: boolean } {
        const session = this.sessions.get(sessionId);
        if (!session || !session.winner) return { bothReady: false };

        const color = this.getPlayerColor(socketId);
        if (!color) return { bothReady: false };

        session.rematchRequests[color] = true;

        if (session.rematchRequests.red && session.rematchRequests.blue) {
            // Reset for new match
            session.scores = { red: 0, blue: 0 };
            session.roundNumber = 0;
            session.winner = null;
            session.rematchRequests = { red: false, blue: false };
            return { bothReady: true };
        }

        return { bothReady: false };
    }

    // ---------------------------------------------------------------
    // Disconnect
    // ---------------------------------------------------------------

    public handleDisconnect(socketId: string): { sessionId: string; opponentSocketId: string | null } | null {
        const session = this.getSessionBySocket(socketId);
        if (!session) return null;

        const sessionId = session.sessionId;
        const color = this.getPlayerColor(socketId);
        let opponentSocketId: string | null = null;

        if (color === 'red') {
            opponentSocketId = session.sockets.blue;
        } else if (color === 'blue') {
            opponentSocketId = session.sockets.red;
        }

        this.deleteSession(sessionId);
        return { sessionId, opponentSocketId };
    }
}
