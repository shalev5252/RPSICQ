import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, JoinQueuePayload, PlaceKingPitPayload, MakeMovePayload, CombatChoicePayload } from '@rps/shared';
import { MatchmakingService } from '../services/MatchmakingService.js';
import { GameService } from '../services/GameService.js';

export function setupSocketHandlers(io: Server): void {
    const gameService = new GameService();
    const matchmakingService = new MatchmakingService(io, gameService);

    io.on('connection', (socket: Socket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        socket.on(SOCKET_EVENTS.JOIN_QUEUE, (_payload: JoinQueuePayload) => {
            matchmakingService.addToQueue(socket.id);
        });

        socket.on(SOCKET_EVENTS.LEAVE_QUEUE, () => {
            matchmakingService.removeFromQueue(socket.id);
        });

        socket.on(SOCKET_EVENTS.PLACE_KING_PIT, (payload: PlaceKingPitPayload) => {
            const result = gameService.placeKingPit(socket.id, payload.kingPosition, payload.pitPosition);

            if (!result.success) {
                socket.emit(SOCKET_EVENTS.ERROR, { code: 'PLACE_KING_PIT_ERROR', message: result.error });
                return;
            }

            // Send updated setup state to the player
            const setupView = gameService.getPlayerSetupView(socket.id);
            if (setupView) {
                socket.emit(SOCKET_EVENTS.SETUP_STATE, setupView);
            }
        });

        socket.on(SOCKET_EVENTS.RANDOMIZE_PIECES, () => {
            const result = gameService.randomizePieces(socket.id);

            if (!result.success) {
                socket.emit(SOCKET_EVENTS.ERROR, { code: 'RANDOMIZE_ERROR', message: result.error });
                return;
            }

            // Send updated setup state to the player
            const setupView = gameService.getPlayerSetupView(socket.id);
            if (setupView) {
                socket.emit(SOCKET_EVENTS.SETUP_STATE, setupView);
            }
        });

        socket.on(SOCKET_EVENTS.CONFIRM_SETUP, () => {
            const result = gameService.confirmSetup(socket.id);

            if (!result.success) {
                socket.emit(SOCKET_EVENTS.ERROR, { code: 'CONFIRM_ERROR', message: result.error });
                return;
            }

            if (result.bothReady) {
                // Both players are ready - start the game
                const session = gameService.getSessionBySocketId(socket.id);
                if (session) {
                    // Send GAME_START to each player with their specific view (fog of war)
                    const redSocketId = session.players.red?.socketId;
                    const blueSocketId = session.players.blue?.socketId;

                    if (redSocketId) {
                        const redView = gameService.getPlayerGameView(redSocketId);
                        io.to(redSocketId).emit(SOCKET_EVENTS.GAME_START, {
                            startingPlayer: session.currentTurn,
                            gameState: redView
                        });
                    }

                    if (blueSocketId) {
                        const blueView = gameService.getPlayerGameView(blueSocketId);
                        io.to(blueSocketId).emit(SOCKET_EVENTS.GAME_START, {
                            startingPlayer: session.currentTurn,
                            gameState: blueView
                        });
                    }
                }
            } else {
                // Only this player is ready - notify opponent
                const opponentId = gameService.getOpponentSocketId(socket.id);
                if (opponentId) {
                    io.to(opponentId).emit(SOCKET_EVENTS.OPPONENT_READY);
                }

                // Send updated setup state to current player
                const setupView = gameService.getPlayerSetupView(socket.id);
                if (setupView) {
                    socket.emit(SOCKET_EVENTS.SETUP_STATE, setupView);
                }
            }
        });

        socket.on(SOCKET_EVENTS.MAKE_MOVE, (payload: MakeMovePayload) => {
            console.log(`♟️ Player ${socket.id} making move:`, payload);

            const result = gameService.makeMove(socket.id, payload.from, payload.to);

            if (!result.success) {
                socket.emit(SOCKET_EVENTS.ERROR, { code: 'MOVE_ERROR', message: result.error });
                return;
            }

            // Send updated game view to both players (for both combat and non-combat scenarios)
            const session = gameService.getSessionBySocketId(socket.id);
            if (session) {
                    // Send updated game state to current player
                const playerView = gameService.getPlayerGameView(socket.id);
                if (playerView) {
                    socket.emit(SOCKET_EVENTS.GAME_STATE, playerView);
                }

                // Send to opponent
                const opponentId = gameService.getOpponentSocketId(socket.id);
                if (opponentId) {
                    const opponentView = gameService.getPlayerGameView(opponentId);
                    if (opponentView) {
                        io.to(opponentId).emit(SOCKET_EVENTS.GAME_STATE, opponentView);
                    }
                }

                // Check if game ended - emit GAME_OVER after GAME_STATE so clients have final board
                if (session.phase === 'finished') {
                    io.to(session.sessionId).emit(SOCKET_EVENTS.GAME_OVER, {
                        winner: session.winner,
                        reason: session.winReason || 'king_captured'
                    });
                }
            }
        });

        socket.on(SOCKET_EVENTS.COMBAT_CHOICE, (payload: CombatChoicePayload) => {
            console.log(`⚔️ Player ${socket.id} chose ${payload.element} for tie breaker`);

            const result = gameService.submitTieBreakerChoice(socket.id, payload.element);

            if (!result.success) {
                socket.emit(SOCKET_EVENTS.ERROR, { code: 'TIE_BREAKER_ERROR', message: result.error });
                return;
            }

            if (result.bothChosen) {
                // Both players have chosen - resolution complete
                const session = gameService.getSessionBySocketId(socket.id);
                if (session) {
                    // Send updated game state to both players first
                    const redPlayer = session.players.red;
                    const bluePlayer = session.players.blue;

                    if (redPlayer?.socketId) {
                        const redView = gameService.getPlayerGameView(redPlayer.socketId);
                        if (redView) {
                            io.to(redPlayer.socketId).emit(SOCKET_EVENTS.GAME_STATE, redView);
                        }
                    }
                    if (bluePlayer?.socketId) {
                        const blueView = gameService.getPlayerGameView(bluePlayer.socketId);
                        if (blueView) {
                            io.to(bluePlayer.socketId).emit(SOCKET_EVENTS.GAME_STATE, blueView);
                        }
                    }

                    // Emit GAME_OVER after GAME_STATE so clients have final board
                    if (session.phase === 'finished') {
                        io.to(session.sessionId).emit(SOCKET_EVENTS.GAME_OVER, {
                            winner: session.winner,
                            reason: session.winReason || 'king_captured'
                        });
                    }
                }
            }
        });

        socket.on(SOCKET_EVENTS.REQUEST_REMATCH, () => {
            console.log(`🔄 Player ${socket.id} requesting rematch`);

            const result = gameService.requestRematch(socket.id);

            if (!result.success) {
                socket.emit(SOCKET_EVENTS.ERROR, { code: 'REMATCH_ERROR', message: result.error });
                return;
            }

            if (result.bothRequested) {
                // Both players want rematch - reset game and notify both
                const session = gameService.getSessionBySocketId(socket.id);
                if (session) {
                    const resetResult = gameService.resetGameForRematch(session.sessionId);
                    if (resetResult.success) {
                        // Emit REMATCH_ACCEPTED to both players
                        const redSocketId = session.players.red?.socketId;
                        const blueSocketId = session.players.blue?.socketId;

                        if (redSocketId) {
                            const redSetupView = gameService.getPlayerSetupView(redSocketId);
                            io.to(redSocketId).emit(SOCKET_EVENTS.REMATCH_ACCEPTED, { setupState: redSetupView });
                        }
                        if (blueSocketId) {
                            const blueSetupView = gameService.getPlayerSetupView(blueSocketId);
                            io.to(blueSocketId).emit(SOCKET_EVENTS.REMATCH_ACCEPTED, { setupState: blueSetupView });
                        }
                    }
                }
            } else {
                // Only one player has requested - notify opponent
                if (result.opponentSocketId) {
                    io.to(result.opponentSocketId).emit(SOCKET_EVENTS.REMATCH_REQUESTED);
                }
            }
        });

        socket.on('disconnect', (reason: string) => {
            console.log(`❌ Client disconnected: ${socket.id} (${reason})`);

            // 1. Remove from queue if they are waiting
            matchmakingService.removeFromQueue(socket.id);

            // 2. Check if they are in an active game
            const result = gameService.handleDisconnect(socket.id);
            if (result && result.opponentId) {
                // If the game was in setup/waiting phase, automatically requeue the opponent
                console.log(`🔄 Re-queueing opponent ${result.opponentId} due to disconnect`);

                const opponentSocket = io.sockets.sockets.get(result.opponentId);

                if (opponentSocket && opponentSocket.connected) {
                    // Notify them (optional, maybe just a toast on client side saying "Opponent disconnected, finding new match...")
                    io.to(result.opponentId).emit(SOCKET_EVENTS.OPPONENT_DISCONNECTED);

                    // Add them back to queue!
                    matchmakingService.addToQueue(result.opponentId);
                } else {
                    console.log(`⚠️ Opponent socket ${result.opponentId} not found or disconnected, skipping re-queue`);
                }
            }
        });
    });
}
