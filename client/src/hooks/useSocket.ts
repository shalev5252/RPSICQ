import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { socket as socketInstance, playerId } from '../socket'; // Import singleton and persistent ID
import { useGameStore } from '../store/gameStore';
import {
    SOCKET_EVENTS,
    GameFoundPayload,
    GameStartPayload,
    ErrorPayload,
    SetupStatePayload,
    RoomCreatedPayload,
    RoomErrorPayload,
    PlayerCellView,
    PlayerColor,
    GamePhase,
    GameMode,
    Position,
    PieceType,
    CombatElement,
} from '@rps/shared';
import { useSound } from '../context/SoundContext';

export function useSocket() {
    const socketRef = useRef<Socket>(socketInstance); // Use singleton
    const [isConnected, setIsConnected] = useState(socketInstance.connected);
    const setConnectionStatus = useGameStore((state) => state.setConnectionStatus);
    const { playSound } = useSound();

    // Buffers for events that arrive during tie-breaker reveal/result animation
    const pendingGameStateRef = useRef<{ board: PlayerCellView[][]; currentTurn: PlayerColor | null; phase: string; isMyTurn: boolean; combatPosition?: Position; combatPieceType?: PieceType } | null>(null);
    const pendingRetryRef = useRef(false);
    const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const socket = socketRef.current;

        // ... (connection logic remains)
        if (!socket.connected) {
            socket.connect();
        }

        const onConnect = () => {
            console.log('✅ Connected to server:', socket.id);
            setIsConnected(true);
            setConnectionStatus('connected');
        };

        const onDisconnect = (reason: string) => {
            console.log('❌ Disconnected from server:', reason);
            setIsConnected(false);
            setConnectionStatus('disconnected');
        };

        const onConnectError = (error: Error) => {
            console.error('🔴 Connection error:', error.message);
            setConnectionStatus('disconnected');
        };

        const onGameFound = (payload: GameFoundPayload) => {
            console.log('🎮 Game found:', payload);
            // Clear room state when matched (room or random queue)
            useGameStore.getState().setRoomCode(null);
            useGameStore.getState().setRoomError(null);
            useGameStore.getState().setIsCreatingRoom(false);
            useGameStore.getState().setIsJoiningRoom(false);
        };

        const onGameStart = (payload: GameStartPayload) => {
            console.log('🚀 Game started:', payload);
            // Transition to playing phase
            useGameStore.getState().setGamePhase('playing');
            // Set initial game state
            const myColor = useGameStore.getState().myColor;
            if (payload.gameState && myColor) {
                useGameStore.getState().setGameState({
                    board: payload.gameState.board as PlayerCellView[][],
                    currentTurn: payload.gameState.currentTurn,
                    phase: payload.gameState.phase,
                    isMyTurn: payload.gameState.currentTurn === myColor
                });
            }
        };

        const countPieces = (board: PlayerCellView[][]) => {
            let count = 0;
            board.forEach(row => row.forEach(cell => {
                if (cell.piece) count++;
            }));
            return count;
        };

        const areBoardsEqual = (b1: PlayerCellView[][], b2: PlayerCellView[][]) => {
            if (b1.length !== b2.length) return false;
            for (let r = 0; r < b1.length; r++) {
                if (b1[r].length !== b2[r].length) return false;
                for (let c = 0; c < b1[r].length; c++) {
                    const p1 = b1[r][c].piece;
                    const p2 = b2[r][c].piece;
                    if (p1?.id !== p2?.id) return false;
                    if (p1?.type !== p2?.type) return false;
                }
            }
            return true;
        };

        // Applies a game state payload to the store (sounds + state update)
        const applyGameState = (payload: { board: PlayerCellView[][]; currentTurn: PlayerColor | null; phase: string; isMyTurn: boolean; combatPosition?: Position; combatPieceType?: PieceType }) => {
            // Sound Effect Logic
            const prevState = useGameStore.getState().gameState;
            const currentPhase = useGameStore.getState().gamePhase;

            if (prevState && (currentPhase === 'playing' || currentPhase === 'tie_breaker')) {
                const turnChanged = prevState.currentTurn !== payload.currentTurn;
                const boardChanged = !areBoardsEqual(prevState.board, payload.board);

                if (turnChanged && boardChanged) {
                    const prevCount = countPieces(prevState.board);
                    const newCount = countPieces(payload.board);
                    const validPrevTurn = prevState.currentTurn;

                    if (newCount < prevCount) {
                        playSound('battle');
                    } else if (payload.phase === 'tie_breaker' || prevState.phase === 'tie_breaker') {
                        playSound('battle');
                    } else if (validPrevTurn) {
                        const sound = validPrevTurn === 'red' ? 'move1' : 'move2';
                        playSound(sound);
                    }
                }
            }

            useGameStore.getState().setGameState(payload);

            if (payload.phase === 'tie_breaker' && currentPhase !== 'tie_breaker') {
                useGameStore.getState().resetTieBreakerState();
            }

            useGameStore.getState().setGamePhase(payload.phase as GamePhase);
        };

        const onGameState = (payload: { board: PlayerCellView[][]; currentTurn: PlayerColor | null; phase: string; isMyTurn: boolean; combatPosition?: Position; combatPieceType?: PieceType }) => {
            console.log('📊 Game state update:', payload);

            // If a reveal or result animation is active, buffer this update
            const tbState = useGameStore.getState().tieBreakerState;
            if (tbState.reveal || tbState.showingResult) {
                pendingGameStateRef.current = payload;
                return;
            }

            applyGameState(payload);
        };

        const REVEAL_DURATION = 2500; // ms to show battle animation
        const RESULT_DURATION = 2500; // ms to show outcome before returning to game

        const onTieBreakerReveal = (payload: { playerChoice: CombatElement; opponentChoice: CombatElement }) => {
            console.log('⚔️ Tie-breaker reveal:', payload);
            useGameStore.getState().setTieBreakerReveal(payload);

            // Clear any existing timers
            if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
            if (resultTimerRef.current) clearTimeout(resultTimerRef.current);

            // After battle animation, transition to result/tie-again screen
            revealTimerRef.current = setTimeout(() => {
                const store = useGameStore.getState();
                // Save choices so the next screen can display them
                store.setTieBreakerLastReveal(payload);
                store.setTieBreakerReveal(null);

                if (pendingRetryRef.current) {
                    // Tie again: go straight back to choices
                    pendingRetryRef.current = false;
                    store.incrementTieBreakerRetry();
                    store.setTieBreakerLastReveal(null);
                    pendingGameStateRef.current = null;
                } else {
                    // Resolution: show result screen, then flush game state
                    store.setTieBreakerShowingResult(true);
                    resultTimerRef.current = setTimeout(() => {
                        useGameStore.getState().setTieBreakerShowingResult(false);
                        useGameStore.getState().setTieBreakerLastReveal(null);
                        if (pendingGameStateRef.current) {
                            applyGameState(pendingGameStateRef.current);
                            pendingGameStateRef.current = null;
                        }
                    }, RESULT_DURATION);
                }
            }, REVEAL_DURATION);
        };

        const onError = (payload: ErrorPayload) => {
            console.error('❌ Server error:', payload);
        };

        const onGameOver = (payload: { winner: PlayerColor | null; reason: string }) => {
            console.log('🏁 Game Over:', payload);

            const myColor = useGameStore.getState().myColor;
            if (myColor && payload.winner) {
                if (payload.winner === myColor) {
                    playSound('winner');
                } else {
                    playSound('looser');
                }
            }

            useGameStore.getState().setGamePhase('finished');
            useGameStore.getState().setGameState({
                board: useGameStore.getState().gameState?.board || [],
                currentTurn: null,
                phase: 'finished',
                isMyTurn: false,
                winner: payload.winner
            });
        };

        const onRematchRequested = () => {
            console.log('🔄 Opponent requested rematch');
            useGameStore.getState().setRematchState({ opponentRequested: true });
        };

        const onRematchAccepted = (payload: { setupState: SetupStatePayload }) => {
            console.log('🔄 Rematch accepted, resetting game');
            // Reset for rematch and update setup state
            useGameStore.getState().resetForRematch();
            if (payload.setupState) {
                useGameStore.getState().setSetupState({
                    board: payload.setupState.board,
                    hasPlacedKingPit: payload.setupState.hasPlacedKingPit,
                    hasShuffled: payload.setupState.hasShuffled,
                    isReady: payload.setupState.isReady,
                    opponentReady: payload.setupState.opponentReady,
                });
            }
        };

        const onTieBreakerRetry = () => {
            console.log('🔄 Tie-breaker tied again, retrying');
            // If reveal is active, buffer the retry so it fires after the animation
            const reveal = useGameStore.getState().tieBreakerState.reveal;
            if (reveal) {
                pendingRetryRef.current = true;
                return;
            }
            useGameStore.getState().incrementTieBreakerRetry();
        };

        const onTurnSkipped = () => {
            console.log('⏭️ Turn skipped - no movable pieces');
            useGameStore.getState().setShowTurnSkipped(true);
        };

        const onSessionRestored = (payload: { color: PlayerColor; phase: string; gameMode: GameMode; gameState: unknown; sessionId: string }) => {
            console.log('🔄 Session restored:', payload);
            useGameStore.getState().setPlayerInfo(playerId, payload.color);
            useGameStore.getState().setSessionId(payload.sessionId);
            useGameStore.getState().setGamePhase(payload.phase as GamePhase);
            useGameStore.getState().setGameMode(payload.gameMode);

            if (payload.phase === 'setup') {
                const setupState = payload.gameState as { board: PlayerCellView[][]; hasPlacedKingPit: boolean; hasShuffled: boolean; isReady: boolean; opponentReady: boolean };
                useGameStore.getState().setSetupState({
                    board: setupState.board,
                    hasPlacedKingPit: setupState.hasPlacedKingPit,
                    hasShuffled: setupState.hasShuffled,
                    isReady: setupState.isReady,
                    opponentReady: setupState.opponentReady,
                });
            } else {
                const gameView = payload.gameState as { board: PlayerCellView[][]; currentTurn: PlayerColor | null; phase: string; isMyTurn: boolean };
                useGameStore.getState().setGameState(gameView);
            }
        };

        const onOpponentReconnecting = () => {
            console.log('⏳ Opponent is reconnecting...');
            useGameStore.getState().setOpponentReconnecting(true);
        };

        const onOpponentReconnected = () => {
            console.log('✅ Opponent reconnected!');
            useGameStore.getState().setOpponentReconnecting(false);
        };

        const onOpponentDisconnected = () => {
            console.log('🚪 Opponent disconnected permanently');
            useGameStore.getState().setOpponentReconnecting(false);
            // Reset to matchmaking screen from any active game phase
            const phase = useGameStore.getState().gamePhase;
            if (phase === 'setup' || phase === 'playing' || phase === 'tie_breaker' || phase === 'finished') {
                useGameStore.getState().reset();
            }
        };

        const onRoomCreated = (payload: RoomCreatedPayload) => {
            console.log('🏠 Room created:', payload.roomCode);
            useGameStore.getState().setRoomCode(payload.roomCode);
            useGameStore.getState().setIsCreatingRoom(false);
            useGameStore.getState().setRoomError(null);
        };

        const onRoomError = (payload: RoomErrorPayload) => {
            console.error('🏠 Room error:', payload);
            useGameStore.getState().setRoomError(payload.message);
            useGameStore.getState().setIsCreatingRoom(false);
            useGameStore.getState().setIsJoiningRoom(false);
        };

        const onRoomExpired = () => {
            console.log('⏰ Room expired');
            useGameStore.getState().setRoomCode(null);
            useGameStore.getState().setRoomError(null);
            useGameStore.getState().setIsCreatingRoom(false);
        };

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('connect_error', onConnectError);
        socket.on(SOCKET_EVENTS.GAME_FOUND, onGameFound);
        socket.on(SOCKET_EVENTS.GAME_START, onGameStart);
        socket.on(SOCKET_EVENTS.GAME_STATE, onGameState);
        socket.on(SOCKET_EVENTS.GAME_OVER, onGameOver);
        socket.on(SOCKET_EVENTS.REMATCH_REQUESTED, onRematchRequested);
        socket.on(SOCKET_EVENTS.REMATCH_ACCEPTED, onRematchAccepted);
        socket.on(SOCKET_EVENTS.TIE_BREAKER_RETRY, onTieBreakerRetry);
        socket.on(SOCKET_EVENTS.TIE_BREAKER_REVEAL, onTieBreakerReveal);
        socket.on(SOCKET_EVENTS.TURN_SKIPPED, onTurnSkipped);
        socket.on(SOCKET_EVENTS.SESSION_RESTORED, onSessionRestored);
        socket.on(SOCKET_EVENTS.OPPONENT_RECONNECTING, onOpponentReconnecting);
        socket.on(SOCKET_EVENTS.OPPONENT_RECONNECTED, onOpponentReconnected);
        socket.on(SOCKET_EVENTS.OPPONENT_DISCONNECTED, onOpponentDisconnected);
        socket.on(SOCKET_EVENTS.ROOM_CREATED, onRoomCreated);
        socket.on(SOCKET_EVENTS.ROOM_ERROR, onRoomError);
        socket.on(SOCKET_EVENTS.ROOM_EXPIRED, onRoomExpired);
        socket.on(SOCKET_EVENTS.ERROR, onError);

        // Sync state immediately if socket is already connected (handles race condition on mount)
        if (socket.connected) {
            setIsConnected(true);
            setConnectionStatus('connected');
        }

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('connect_error', onConnectError);
            socket.off(SOCKET_EVENTS.GAME_FOUND, onGameFound);
            socket.off(SOCKET_EVENTS.GAME_START, onGameStart);
            socket.off(SOCKET_EVENTS.GAME_STATE, onGameState);
            socket.off(SOCKET_EVENTS.GAME_OVER, onGameOver);
            socket.off(SOCKET_EVENTS.REMATCH_REQUESTED, onRematchRequested);
            socket.off(SOCKET_EVENTS.REMATCH_ACCEPTED, onRematchAccepted);
            socket.off(SOCKET_EVENTS.TIE_BREAKER_RETRY, onTieBreakerRetry);
            socket.off(SOCKET_EVENTS.TIE_BREAKER_REVEAL, onTieBreakerReveal);
            socket.off(SOCKET_EVENTS.TURN_SKIPPED, onTurnSkipped);
            socket.off(SOCKET_EVENTS.SESSION_RESTORED, onSessionRestored);
            socket.off(SOCKET_EVENTS.OPPONENT_RECONNECTING, onOpponentReconnecting);
            socket.off(SOCKET_EVENTS.OPPONENT_RECONNECTED, onOpponentReconnected);
            socket.off(SOCKET_EVENTS.OPPONENT_DISCONNECTED, onOpponentDisconnected);
            socket.off(SOCKET_EVENTS.ROOM_CREATED, onRoomCreated);
            socket.off(SOCKET_EVENTS.ROOM_ERROR, onRoomError);
            socket.off(SOCKET_EVENTS.ROOM_EXPIRED, onRoomExpired);
            socket.off(SOCKET_EVENTS.ERROR, onError);
            if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
            if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
            // Do NOT disconnect base socket on unmount of hook, usually
        };
    }, [setConnectionStatus, playSound]);

    const joinQueue = () => {
        socketRef.current?.emit(SOCKET_EVENTS.JOIN_QUEUE, {
            playerId: playerId,
        });
    };

    const leaveQueue = () => {
        socketRef.current?.emit(SOCKET_EVENTS.LEAVE_QUEUE);
    };

    return {
        socket: socketRef.current,
        isConnected,
        joinQueue,
        leaveQueue,
    };
}
