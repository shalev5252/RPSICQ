import { useEffect, useState, useCallback } from 'react';
import { useSocket } from './useSocket';
import { SOCKET_EVENTS } from '@rps/shared';
import type {
    PlayerColor,
    ThirdEyeRoundStartPayload,
    ThirdEyeRoundResultPayload,
    ThirdEyeGameOverPayload,
    ThirdEyeTimerPayload,
    ThirdEyeScores,
} from '@rps/shared';

interface ThirdEyeHookResult {
    // Match state
    isStarted: boolean;
    myColor: PlayerColor | null;
    scores: ThirdEyeScores;

    // Round state
    roundNumber: number;
    rangeMin: number;
    rangeMax: number;
    timeRemainingMs: number;
    hasSubmitted: boolean;
    pickConfirmed: number | null;

    // Round result
    roundResult: ThirdEyeRoundResultPayload | null;
    showingResult: boolean;

    // Game over
    gameOver: boolean;
    matchWinner: PlayerColor | 'disconnect' | null;
    finalScores: ThirdEyeScores | null;

    // Rematch
    rematchRequested: boolean;
    opponentRequestedRematch: boolean;
    requestRematch: () => void;

    // Actions
    submitPick: (number: number) => void;
}

export function useThirdEyeGame(): ThirdEyeHookResult {
    const { socket } = useSocket();

    const [isStarted, setIsStarted] = useState(false);
    const [myColor, setMyColor] = useState<PlayerColor | null>(null);
    const [scores, setScores] = useState<ThirdEyeScores>({ red: 0, blue: 0 });
    const [roundNumber, setRoundNumber] = useState(0);
    const [rangeMin, setRangeMin] = useState(0);
    const [rangeMax, setRangeMax] = useState(0);
    const [timeRemainingMs, setTimeRemainingMs] = useState(20000);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [pickConfirmed, setPickConfirmed] = useState<number | null>(null);
    const [roundResult, setRoundResult] = useState<ThirdEyeRoundResultPayload | null>(null);
    const [showingResult, setShowingResult] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [matchWinner, setMatchWinner] = useState<PlayerColor | 'disconnect' | null>(null);
    const [finalScores, setFinalScores] = useState<ThirdEyeScores | null>(null);
    const [rematchRequested, setRematchRequested] = useState(false);
    const [opponentRequestedRematch, setOpponentRequestedRematch] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleGameFound = (data: { color: PlayerColor }) => {
            setMyColor(data.color);
        };

        const handleRoundStart = (data: ThirdEyeRoundStartPayload) => {
            setIsStarted(true);
            setRoundNumber(data.roundNumber);
            setRangeMin(data.rangeMin);
            setRangeMax(data.rangeMax);
            setTimeRemainingMs(data.timerDurationMs);
            setHasSubmitted(false);
            setPickConfirmed(null);
            setRoundResult(null);
            setShowingResult(false);
        };

        const handlePickConfirmed = (data: { number: number }) => {
            setHasSubmitted(true);
            setPickConfirmed(data.number);
        };

        const handleTimer = (data: ThirdEyeTimerPayload) => {
            setTimeRemainingMs(data.timeRemainingMs);
        };

        const handleRoundResult = (data: ThirdEyeRoundResultPayload) => {
            setRoundResult(data);
            setShowingResult(true);
            setScores(data.scores);
        };

        const handleGameOver = (data: ThirdEyeGameOverPayload) => {
            setGameOver(true);
            setMatchWinner(data.winner);
            setFinalScores(data.finalScores);
        };

        const handleRematchRequested = () => {
            setOpponentRequestedRematch(true);
        };

        const handleRematchAccepted = () => {
            // Reset everything for new match
            setScores({ red: 0, blue: 0 });
            setRoundNumber(0);
            setGameOver(false);
            setMatchWinner(null);
            setFinalScores(null);
            setRematchRequested(false);
            setOpponentRequestedRematch(false);
        };

        socket.on(SOCKET_EVENTS.GAME_FOUND, handleGameFound);
        socket.on(SOCKET_EVENTS.TE_ROUND_START, handleRoundStart);
        socket.on(SOCKET_EVENTS.TE_PICK_CONFIRMED, handlePickConfirmed);
        socket.on(SOCKET_EVENTS.TE_TIMER, handleTimer);
        socket.on(SOCKET_EVENTS.TE_ROUND_RESULT, handleRoundResult);
        socket.on(SOCKET_EVENTS.TE_GAME_OVER, handleGameOver);
        socket.on(SOCKET_EVENTS.TE_REMATCH_REQUESTED, handleRematchRequested);
        socket.on(SOCKET_EVENTS.TE_REMATCH_ACCEPTED, handleRematchAccepted);

        return () => {
            socket.off(SOCKET_EVENTS.GAME_FOUND, handleGameFound);
            socket.off(SOCKET_EVENTS.TE_ROUND_START, handleRoundStart);
            socket.off(SOCKET_EVENTS.TE_PICK_CONFIRMED, handlePickConfirmed);
            socket.off(SOCKET_EVENTS.TE_TIMER, handleTimer);
            socket.off(SOCKET_EVENTS.TE_ROUND_RESULT, handleRoundResult);
            socket.off(SOCKET_EVENTS.TE_GAME_OVER, handleGameOver);
            socket.off(SOCKET_EVENTS.TE_REMATCH_REQUESTED, handleRematchRequested);
            socket.off(SOCKET_EVENTS.TE_REMATCH_ACCEPTED, handleRematchAccepted);
        };
    }, [socket]);

    const requestRematch = useCallback(() => {
        if (!socket) return;
        setRematchRequested(true);
        socket.emit(SOCKET_EVENTS.TE_REMATCH);
    }, [socket]);

    const submitPick = useCallback((number: number) => {
        if (!socket) return;
        socket.emit(SOCKET_EVENTS.TE_PICK_NUMBER, { number });
    }, [socket]);

    return {
        isStarted,
        myColor,
        scores,
        roundNumber,
        rangeMin,
        rangeMax,
        timeRemainingMs,
        hasSubmitted,
        pickConfirmed,
        roundResult,
        showingResult,
        gameOver,
        matchWinner,
        finalScores,
        rematchRequested,
        opponentRequestedRematch,
        requestRematch,
        submitPick,
    };
}
