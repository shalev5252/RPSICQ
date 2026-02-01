import { CombatElement, RPSLS_WINS } from '@rps/shared';

/**
 * Two-tier pattern tracking for tie-breaker exploitation:
 * - Tier 1 (Cross-Battle): Tracks first-choice in each tie-breaker across the session
 * - Tier 2 (Intra-Battle): Tracks choices within the current prolonged tie
 */

interface CrossBattleData {
    firstChoices: CombatElement[];  // History of first choices in each tie
}

interface IntraBattleData {
    currentTieChoices: CombatElement[];  // Choices within the current tie
    roundNumber: number;
}

interface SessionPatternState {
    crossBattle: CrossBattleData;
    intraBattle: IntraBattleData;
}

interface PredictionResult {
    predictedChoice: CombatElement | null;
    confidence: number;  // 0.0 to 1.0
    counter: CombatElement | null;
}

const COMBAT_ELEMENTS: CombatElement[] = ['rock', 'paper', 'scissors'];
const RPSLS_ELEMENTS: CombatElement[] = ['rock', 'paper', 'scissors', 'lizard', 'spock'];
const CONFIDENCE_THRESHOLD = 0.6;
const MAX_HISTORY_LENGTH = 20;

export class TiePatternTracker {
    private sessions: Map<string, SessionPatternState> = new Map();

    /**
     * Initialize tracking for a session (called on session start).
     */
    public initSession(sessionId: string): void {
        this.sessions.set(sessionId, {
            crossBattle: { firstChoices: [] },
            intraBattle: { currentTieChoices: [], roundNumber: 0 }
        });
    }

    /**
     * Clear session data.
     */
    public clearSession(sessionId: string): void {
        this.sessions.delete(sessionId);
    }

    /**
     * Called when a new tie-breaker combat begins.
     * Resets the intra-battle tracker.
     */
    public startNewTie(sessionId: string): void {
        const state = this.sessions.get(sessionId);
        if (!state) return;

        state.intraBattle = { currentTieChoices: [], roundNumber: 0 };
    }

    /**
     * Record the opponent's choice in the current tie.
     * For the first round, also records to cross-battle history.
     */
    public recordOpponentChoice(sessionId: string, choice: CombatElement): void {
        const state = this.sessions.get(sessionId);
        if (!state) return;

        const isFirstRound = state.intraBattle.roundNumber === 0;

        // Record to intra-battle
        state.intraBattle.currentTieChoices.push(choice);
        state.intraBattle.roundNumber++;

        // If first round, also record to cross-battle
        if (isFirstRound) {
            state.crossBattle.firstChoices.push(choice);
            // Keep history bounded
            if (state.crossBattle.firstChoices.length > MAX_HISTORY_LENGTH) {
                state.crossBattle.firstChoices.shift();
            }
        }
    }

    /**
     * Get AI's counter-choice for the current tie round.
     * Uses intra-battle patterns for rounds > 1, cross-battle for round 1.
     */
    public predictAndCounter(sessionId: string, isRpsls: boolean): CombatElement {
        const state = this.sessions.get(sessionId);
        const elements = isRpsls ? RPSLS_ELEMENTS : COMBAT_ELEMENTS;

        if (!state) {
            return this.randomChoice(elements);
        }

        const isFirstRound = state.intraBattle.roundNumber === 0;

        let prediction: PredictionResult;

        if (isFirstRound) {
            // Use cross-battle prediction
            prediction = this.predictCrossBattle(state.crossBattle, elements);
        } else {
            // Use intra-battle prediction
            prediction = this.predictIntraBattle(state.intraBattle, elements);
        }

        // Apply confidence threshold
        if (prediction.confidence >= CONFIDENCE_THRESHOLD && prediction.counter) {
            // 10% chance to still randomize (avoid being too predictable)
            if (Math.random() < 0.1) {
                return this.randomChoice(elements);
            }
            return prediction.counter;
        }

        // Fallback to random
        return this.randomChoice(elements);
    }

    /**
     * Tier 1: Predict based on cross-battle first-choice history.
     */
    private predictCrossBattle(data: CrossBattleData, elements: CombatElement[]): PredictionResult {
        if (data.firstChoices.length < 2) {
            return { predictedChoice: null, confidence: 0, counter: null };
        }

        // Frequency analysis
        const freq = this.calculateFrequencies(data.firstChoices, elements);
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        const topChoice = sorted[0][0] as CombatElement;
        const topFreq = sorted[0][1];

        return {
            predictedChoice: topChoice,
            confidence: topFreq,
            counter: this.getCounter(topChoice, elements)
        };
    }

    /**
     * Tier 2: Predict based on intra-battle patterns.
     * Detects: repetition, rotation, preference.
     */
    private predictIntraBattle(data: IntraBattleData, elements: CombatElement[]): PredictionResult {
        const choices = data.currentTieChoices;

        if (choices.length < 1) {
            return { predictedChoice: null, confidence: 0, counter: null };
        }

        // Check for repetition (last N are the same)
        const repetitionResult = this.detectRepetition(choices, elements);
        if (repetitionResult.confidence >= CONFIDENCE_THRESHOLD) {
            return repetitionResult;
        }

        // Check for rotation (R -> P -> S -> R)
        const rotationResult = this.detectRotation(choices, elements);
        if (rotationResult.confidence >= CONFIDENCE_THRESHOLD) {
            return rotationResult;
        }

        // Fall back to preference (frequency within this tie)
        return this.detectPreference(choices, elements);
    }

    /**
     * Detect if opponent is repeating the same choice.
     */
    private detectRepetition(choices: CombatElement[], elements: CombatElement[]): PredictionResult {
        if (choices.length < 2) {
            return { predictedChoice: null, confidence: 0, counter: null };
        }

        const last = choices[choices.length - 1];
        let streak = 1;

        for (let i = choices.length - 2; i >= 0 && choices[i] === last; i--) {
            streak++;
        }

        // Confidence based on streak length (2 = 0.6, 3 = 0.8, 4+ = 0.95)
        let confidence = 0;
        if (streak >= 4) confidence = 0.95;
        else if (streak === 3) confidence = 0.8;
        else if (streak === 2) confidence = 0.6;

        return {
            predictedChoice: last,
            confidence,
            counter: this.getCounter(last, elements)
        };
    }

    /**
     * Detect rotational pattern (e.g., R -> P -> S -> R).
     */
    private detectRotation(choices: CombatElement[], elements: CombatElement[]): PredictionResult {
        if (choices.length < 3) {
            return { predictedChoice: null, confidence: 0, counter: null };
        }

        // Check for standard RPS rotation
        const standardRotation: CombatElement[] = ['rock', 'paper', 'scissors'];
        const reverseRotation: CombatElement[] = ['scissors', 'paper', 'rock'];

        const last3 = choices.slice(-3);

        // Check if last 3 follow standard rotation
        let matchesStandard = true;
        let matchesReverse = true;

        for (let i = 0; i < 3; i++) {
            if (last3[i] !== standardRotation[i % 3]) matchesStandard = false;
            if (last3[i] !== reverseRotation[i % 3]) matchesReverse = false;
        }

        if (matchesStandard) {
            const nextInRotation = standardRotation[choices.length % 3];
            return {
                predictedChoice: nextInRotation,
                confidence: 0.75,
                counter: this.getCounter(nextInRotation, elements)
            };
        }

        if (matchesReverse) {
            const nextInRotation = reverseRotation[choices.length % 3];
            return {
                predictedChoice: nextInRotation,
                confidence: 0.75,
                counter: this.getCounter(nextInRotation, elements)
            };
        }

        return { predictedChoice: null, confidence: 0, counter: null };
    }

    /**
     * Detect preference (most common choice in current tie).
     */
    private detectPreference(choices: CombatElement[], elements: CombatElement[]): PredictionResult {
        const freq = this.calculateFrequencies(choices, elements);
        const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
        const topChoice = sorted[0][0] as CombatElement;
        const topFreq = sorted[0][1];

        return {
            predictedChoice: topChoice,
            confidence: topFreq,
            counter: this.getCounter(topChoice, elements)
        };
    }

    /**
     * Calculate frequency of each element in the history.
     */
    private calculateFrequencies(history: CombatElement[], elements: CombatElement[]): Record<CombatElement, number> {
        const freq: Record<string, number> = {};
        for (const e of elements) freq[e] = 0;

        if (history.length === 0) return freq as Record<CombatElement, number>;

        for (const choice of history) {
            freq[choice] = (freq[choice] || 0) + 1;
        }

        // Normalize to 0-1
        for (const e of elements) {
            freq[e] /= history.length;
        }

        return freq as Record<CombatElement, number>;
    }

    /**
     * Get a counter-move that beats the predicted choice.
     */
    private getCounter(predicted: CombatElement, elements: CombatElement[]): CombatElement {
        const counters = elements.filter(e => {
            const wins = RPSLS_WINS[e];
            return wins && wins.includes(predicted);
        });

        if (counters.length > 0) {
            return counters[Math.floor(Math.random() * counters.length)];
        }

        return this.randomChoice(elements);
    }

    /**
     * Get a random choice.
     */
    private randomChoice(elements: CombatElement[]): CombatElement {
        return elements[Math.floor(Math.random() * elements.length)];
    }
}
