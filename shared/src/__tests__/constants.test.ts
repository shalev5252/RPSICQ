import { describe, it, expect } from 'vitest';
import {
    RPSLS_WINS,
    BOARD_CONFIG,
    ONSLAUGHT_CONFIG,
    COMBAT_OUTCOMES,
    PieceType,
} from '../index.js';

describe('COMBAT_OUTCOMES', () => {
    it('covers all classic RPS matchups', () => {
        const types: PieceType[] = ['rock', 'paper', 'scissors'];
        for (const attacker of types) {
            for (const defender of types) {
                const key = `${attacker}-${defender}`;
                expect(COMBAT_OUTCOMES[key]).toBeDefined();
            }
        }
    });
});

describe('RPSLS_WINS', () => {
    const rpslsTypes: PieceType[] = ['rock', 'paper', 'scissors', 'lizard', 'spock'];

    it('is defined for all RPSLS piece types', () => {
        for (const type of rpslsTypes) {
            expect(RPSLS_WINS[type]).toBeDefined();
        }
    });

    it('each type defeats exactly 2 others', () => {
        for (const type of rpslsTypes) {
            expect(RPSLS_WINS[type].length).toBe(2);
        }
    });

    it('no type defeats itself', () => {
        for (const type of rpslsTypes) {
            expect(RPSLS_WINS[type]).not.toContain(type);
        }
    });

    it('wins and losses are symmetric: if A beats B, B does not beat A', () => {
        for (const attacker of rpslsTypes) {
            for (const defender of RPSLS_WINS[attacker]) {
                expect(RPSLS_WINS[defender]).not.toContain(attacker);
            }
        }
    });

    it('every type is beaten by exactly 2 others', () => {
        const lossCount: Record<string, number> = {};
        for (const type of rpslsTypes) lossCount[type] = 0;

        for (const attacker of rpslsTypes) {
            for (const loser of RPSLS_WINS[attacker]) {
                lossCount[loser]++;
            }
        }

        for (const type of rpslsTypes) {
            expect(lossCount[type]).toBe(2);
        }
    });
});

describe('BOARD_CONFIG', () => {
    it('classic mode has correct piece counts', () => {
        const config = BOARD_CONFIG.classic;
        expect(config.rows).toBeGreaterThan(0);
        expect(config.cols).toBeGreaterThan(0);

        // Classic has rock, paper, scissors only
        const totalPieces = config.pieces.rock + config.pieces.paper + config.pieces.scissors;
        expect(totalPieces).toBeGreaterThan(0);
    });

    it('rpsls mode includes lizard and spock', () => {
        const config = BOARD_CONFIG.rpsls;
        expect(config.pieces.lizard).toBeGreaterThan(0);
        expect(config.pieces.spock).toBeGreaterThan(0);
    });

    it('onslaught configs exist for classic and rpsls', () => {
        expect(ONSLAUGHT_CONFIG.classic).toBeDefined();
        expect(ONSLAUGHT_CONFIG.rpsls).toBeDefined();
        expect(ONSLAUGHT_CONFIG.classic.rows).toBeGreaterThan(0);
    });
});
