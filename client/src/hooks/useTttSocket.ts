import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import { SOCKET_EVENTS } from '@rps/shared';
import type { TttCell, TttMark, TttStartPayload, TttGameOverPayload } from '@rps/shared';

interface TttGameHookResult {
    board: TttCell[];
    myMark: TttMark | null;
    currentTurn: TttMark;
    winner: TttMark | 'draw' | 'disconnect' | null;
    winningLine: number[] | null;
    isGameStarted: boolean;
    rematchRequested: boolean;
}

export function useTttGame(): TttGameHookResult {
    const { socket } = useSocket();
    const [board, setBoard] = useState<TttCell[]>(Array(9).fill(null));
    const [myMark, setMyMark] = useState<TttMark | null>(null);
    const [currentTurn, setCurrentTurn] = useState<TttMark>('X');
    const [winner, setWinner] = useState<TttMark | 'draw' | 'disconnect' | null>(null);
    const [winningLine, setWinningLine] = useState<number[] | null>(null);
    const [isGameStarted, setIsGameStarted] = useState(false);
    const [rematchRequested, setRematchRequested] = useState(false);

    useEffect(() => {
        if (!socket) return;

        const handleGameStart = (data: TttStartPayload) => {
            setBoard(data.board);
            setMyMark(data.mark);
            setCurrentTurn(data.currentTurn);
            setWinner(null);
            setWinningLine(null);
            setIsGameStarted(true);
            setRematchRequested(false);
        };

        const handleState = (data: { board: TttCell[]; currentTurn: TttMark }) => {
            setBoard(data.board);
            setCurrentTurn(data.currentTurn);
        };

        const handleGameOver = (data: TttGameOverPayload) => {
            setBoard(data.board);
            setWinningLine(data.winningLine);
            setWinner(data.winner as TttMark | 'draw' | 'disconnect');
        };

        const handleRematchRequested = () => {
            setRematchRequested(true);
        };

        socket.on(SOCKET_EVENTS.TTT_GAME_START, handleGameStart);
        socket.on(SOCKET_EVENTS.TTT_STATE, handleState);
        socket.on(SOCKET_EVENTS.TTT_GAME_OVER, handleGameOver);
        socket.on(SOCKET_EVENTS.TTT_REMATCH_REQUESTED, handleRematchRequested);

        return () => {
            socket.off(SOCKET_EVENTS.TTT_GAME_START, handleGameStart);
            socket.off(SOCKET_EVENTS.TTT_STATE, handleState);
            socket.off(SOCKET_EVENTS.TTT_GAME_OVER, handleGameOver);
            socket.off(SOCKET_EVENTS.TTT_REMATCH_REQUESTED, handleRematchRequested);
        };
    }, [socket]);

    return {
        board,
        myMark,
        currentTurn,
        winner,
        winningLine,
        isGameStarted,
        rematchRequested,
    };
}
