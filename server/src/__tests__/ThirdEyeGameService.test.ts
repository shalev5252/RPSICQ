import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ThirdEyeGameService } from '../services/ThirdEyeGameService.js';

describe('ThirdEyeGameService', () => {
    let svc: ThirdEyeGameService;

    beforeEach(() => {
        svc = new ThirdEyeGameService();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe('createSession', () => {
        it('creates a session with initial scores 0-0', () => {
            const session = svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            expect(session.sessionId).toBe('s1');
            expect(session.scores).toEqual({ red: 0, blue: 0 });
            expect(session.roundNumber).toBe(0);
            expect(session.winner).toBeNull();
        });

        it('maps sockets to colors', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            expect(svc.getPlayerColor('sock-r')).toBe('red');
            expect(svc.getPlayerColor('sock-b')).toBe('blue');
        });
    });

    describe('startRound', () => {
        it('generates range with max - min >= 100', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            const round = svc.startRound('s1');

            expect(round).not.toBeNull();
            expect(round!.rangeMax - round!.rangeMin).toBeGreaterThanOrEqual(100);
            expect(round!.roundNumber).toBe(1);
        });

        it('increments round number', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            svc.startRound('s1');
            // Resolve so roundActive becomes false, allowing next round
            svc.resolveRound('s1');
            const round2 = svc.startRound('s1');
            expect(round2!.roundNumber).toBe(2);
        });

        it('generates lucky number within range', () => {
            for (let i = 0; i < 20; i++) {
                const sid = `s-${i}`;
                svc.createSession(sid, `r${i}`, `b${i}`, 'red', 'blue');
                svc.startRound(sid);
                const session = svc.getSession(sid)!;
                expect(session.luckyNumber).toBeGreaterThanOrEqual(session.rangeMin);
                expect(session.luckyNumber).toBeLessThanOrEqual(session.rangeMax);
            }
        });
    });

    describe('submitPick', () => {
        it('accepts a valid pick', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            svc.startRound('s1');
            const session = svc.getSession('s1')!;

            const result = svc.submitPick('s1', 'sock-r', session.rangeMin + 10);
            expect(result.success).toBe(true);
            expect(result.bothSubmitted).toBe(false);
        });

        it('reports bothSubmitted when both pick', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            svc.startRound('s1');
            const session = svc.getSession('s1')!;

            svc.submitPick('s1', 'sock-r', session.rangeMin + 10);
            const result = svc.submitPick('s1', 'sock-b', session.rangeMin + 20);
            expect(result.success).toBe(true);
            expect(result.bothSubmitted).toBe(true);
        });

        it('rejects out-of-range pick', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            svc.startRound('s1');
            const session = svc.getSession('s1')!;

            const result = svc.submitPick('s1', 'sock-r', session.rangeMax + 1);
            expect(result.success).toBe(false);
        });

        it('rejects duplicate submission', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            svc.startRound('s1');
            const session = svc.getSession('s1')!;

            svc.submitPick('s1', 'sock-r', session.rangeMin + 5);
            const result = svc.submitPick('s1', 'sock-r', session.rangeMin + 10);
            expect(result.success).toBe(false);
        });

        it('rejects non-integer pick', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            svc.startRound('s1');
            const session = svc.getSession('s1')!;

            const result = svc.submitPick('s1', 'sock-r', session.rangeMin + 0.5);
            expect(result.success).toBe(false);
        });
    });

    describe('resolveRound', () => {
        it('closer pick wins', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            svc.startRound('s1');
            const session = svc.getSession('s1')!;
            const lucky = session.luckyNumber;

            // Red picks exactly lucky, blue picks further away
            const bluePick = lucky === session.rangeMax
                ? Math.max(session.rangeMin ?? 0, lucky - 10)
                : Math.min(lucky + 10, session.rangeMax);

            svc.submitPick('s1', 'sock-r', lucky);
            svc.submitPick('s1', 'sock-b', bluePick);

            const result = svc.resolveRound('s1');
            expect(result).not.toBeNull();
            // Red picked exactly, so red's distance = 0, blue's >= 0
            // If lucky + 10 > rangeMax they might still be different
            expect(result!.roundWinner).toBe('red');
            expect(result!.scores.red).toBe(1);
            expect(result!.scores.blue).toBe(0);
        });

        it('equal distance is a tie', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            svc.startRound('s1');
            const session = svc.getSession('s1')!;
            const lucky = session.luckyNumber;

            // Both pick the same number → equal distance
            svc.submitPick('s1', 'sock-r', lucky);
            svc.submitPick('s1', 'sock-b', lucky);

            const result = svc.resolveRound('s1');
            expect(result!.roundWinner).toBe('tie');
            expect(result!.scores.red).toBe(0);
            expect(result!.scores.blue).toBe(0);
        });

        it('timeout player loses to submitted player', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            svc.startRound('s1');
            const session = svc.getSession('s1')!;

            // Only red submits
            svc.submitPick('s1', 'sock-r', session.rangeMin + 1);
            // Blue doesn't submit → timeout

            const result = svc.resolveRound('s1');
            expect(result!.roundWinner).toBe('red');
            expect(result!.picks.blue).toBeNull();
        });

        it('both timeout = tie', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            svc.startRound('s1');
            // Nobody submits

            const result = svc.resolveRound('s1');
            expect(result!.roundWinner).toBe('tie');
        });
    });

    describe('scoring and match victory', () => {
        it('first to 3 points wins the match', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');

            for (let i = 0; i < 3; i++) {
                svc.startRound('s1');
                const session = svc.getSession('s1')!;
                // Only red submits each round → red gets the point
                svc.submitPick('s1', 'sock-r', session.rangeMin + 1);
                const result = svc.resolveRound('s1');

                if (i < 2) {
                    expect(result!.matchOver).toBe(false);
                } else {
                    expect(result!.matchOver).toBe(true);
                    expect(result!.matchWinner).toBe('red');
                }
            }
        });
    });

    describe('timer', () => {
        it('calls onTick with decreasing time and eventually completes', () => {
            vi.useFakeTimers({ shouldAdvanceTime: false });
            let now = 1000;
            vi.spyOn(Date, 'now').mockImplementation(() => now);

            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            svc.startRound('s1');

            const onTick = vi.fn();
            const onTimeout = vi.fn();
            svc.startTimer('s1', onTick, onTimeout);

            // Advance 5 seconds
            now += 5000;
            vi.advanceTimersByTime(5000);
            expect(onTick.mock.calls.length).toBeGreaterThanOrEqual(4);
            // The tick should report ~15000ms remaining
            const latestRemaining = onTick.mock.calls[onTick.mock.calls.length - 1][0];
            expect(latestRemaining).toBeLessThanOrEqual(16000);
            expect(onTimeout).not.toHaveBeenCalled();

            // Advance to 20s total
            now += 15000;
            vi.advanceTimersByTime(15000);
            expect(onTimeout).toHaveBeenCalled();

            // Ensure decreasing ticks were logged
            const calls = onTick.mock.calls.map(call => call[0]);
            expect(calls.length).toBeGreaterThan(0);
            for (let i = 0; i < calls.length - 1; i++) {
                expect(calls[i]).toBeGreaterThanOrEqual(calls[i + 1]);
            }
        });
    });

    describe('rematch', () => {
        it('resets scores when both request rematch', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            // Simulate a finished match
            const session = svc.getSession('s1')!;
            session.scores = { red: 3, blue: 1 };
            session.winner = 'red';

            svc.requestRematch('s1', 'sock-r');
            const result = svc.requestRematch('s1', 'sock-b');
            expect(result.bothReady).toBe(true);

            const updated = svc.getSession('s1')!;
            expect(updated.scores).toEqual({ red: 0, blue: 0 });
            expect(updated.winner).toBeNull();
            expect(updated.roundNumber).toBe(0);
        });
    });

    describe('disconnect', () => {
        it('returns opponent socket on disconnect', () => {
            svc.createSession('s1', 'sock-r', 'sock-b', 'red', 'blue');
            const result = svc.handleDisconnect('sock-r');
            expect(result).not.toBeNull();
            expect(result!.opponentSocketId).toBe('sock-b');
            expect(svc.getSession('s1')).toBeUndefined();
        });
    });
});
