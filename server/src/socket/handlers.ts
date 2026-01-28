import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS, JoinQueuePayload, StartSingleplayerPayload, PlaceKingPitPayload, MakeMovePayload, CombatChoicePayload } from '@rps/shared';
import { MatchmakingService } from '../services/MatchmakingService.js';
import { GameService } from '../services/GameService.js';

export function setupSocketHandlers(io: Server): void {
    const gameService = new GameService();
    const matchmakingService = new MatchmakingService(io, gameService);

    // Helper: schedule an AI move with a natural delay, then emit results
    function scheduleAIMove(sessionId: string, humanSocket: Socket) {
        const session = gameService.getSession(sessionId);
        if (!session || session.opponentType !== 'ai') return;
        if (session.phase !== 'playing') return;

        const aiColor = gameService.getAIColor(sessionId);
        if (!aiColor) return;
        if (session.currentTurn !== aiColor) return;

        const aiSocketId = gameService.getAISocketId(sessionId);
        if (!aiSocketId) return;

        // Check if AI has movable pieces
        if (!gameService.hasMovablePieces(aiSocketId)) {
            gameService.skipTurn(aiSocketId);

            // Check if Human is also blocked
            if (!gameService.hasMovablePieces(humanSocket.id)) {
                gameService.skipTurn(humanSocket.id);
            }

            const updatedView = gameService.getPlayerGameView(humanSocket.id);
            if (updatedView) {
                humanSocket.emit(SOCKET_EVENTS.GAME_STATE, updatedView);
            }
            return;
        }

        gameService.aiService.scheduleAction(() => {
            const freshSession = gameService.getSession(sessionId);
            if (!freshSession || freshSession.phase !== 'playing' || freshSession.currentTurn !== aiColor) return;

            const move = gameService.aiService.selectMove(freshSession, aiColor);
            if (!move) return;

            const result = gameService.makeMove(aiSocketId, move.from, move.to);
            if (!result.success) {
                console.error(`🤖 AI move failed: ${result.error}`);
                return;
            }

            // Record combat outcomes for AI inference
            const afterSession = gameService.getSession(sessionId);
            if (!afterSession) return;

            // Send updated game state to human player
            const humanView = gameService.getPlayerGameView(humanSocket.id);
            if (humanView) {
                humanSocket.emit(SOCKET_EVENTS.GAME_STATE, humanView);
            }

            // Check game-ending conditions
            if (afterSession.phase === 'finished') {
                humanSocket.emit(SOCKET_EVENTS.GAME_OVER, {
                    winner: afterSession.winner,
                    reason: afterSession.winReason || 'king_captured'
                });
            } else if (afterSession.phase === 'tie_breaker') {
                // AI needs to submit tie-breaker choice
                scheduleAITieBreaker(sessionId, humanSocket);
            } else if (afterSession.phase === 'playing') {
                // Check for draw
                if (gameService.checkDraw(sessionId)) {
                    gameService.setDraw(sessionId);
                    humanSocket.emit(SOCKET_EVENTS.GAME_OVER, {
                        winner: null,
                        reason: 'draw'
                    });
                    return;
                }

                // Check if human has no movable pieces
                if (!gameService.hasMovablePieces(humanSocket.id)) {
                    humanSocket.emit(SOCKET_EVENTS.TURN_SKIPPED, { reason: 'no_movable_pieces' });
                    gameService.skipTurn(humanSocket.id);
                    const updatedView = gameService.getPlayerGameView(humanSocket.id);
                    if (updatedView) {
                        humanSocket.emit(SOCKET_EVENTS.GAME_STATE, updatedView);
                    }
                    // Now it's AI's turn again
                    scheduleAIMove(sessionId, humanSocket);
                }
            }
        });
    }

    // Helper: schedule AI tie-breaker choice
    function scheduleAITieBreaker(sessionId: string, humanSocket: Socket) {
        const aiSocketId = gameService.getAISocketId(sessionId);
        if (!aiSocketId) return;

        gameService.aiService.scheduleAction(() => {
            const tbResult = gameService.performAITieBreakerChoice(sessionId);
            if (!tbResult.success || !tbResult.choice) return;

            const submitResult = gameService.submitTieBreakerChoice(aiSocketId, tbResult.choice);
            if (!submitResult.success) return;

            if (submitResult.bothChosen) {
                const afterSession = gameService.getSession(sessionId);
                if (!afterSession) return;

                const humanView = gameService.getPlayerGameView(humanSocket.id);
                if (humanView) {
                    humanSocket.emit(SOCKET_EVENTS.GAME_STATE, humanView);
                }

                if (afterSession.phase === 'finished') {
                    humanSocket.emit(SOCKET_EVENTS.GAME_OVER, {
                        winner: afterSession.winner,
                        reason: afterSession.winReason || 'king_captured'
                    });
                } else if (afterSession.phase === 'playing') {
                    // After tie-breaker resolved, check if it's AI's turn
                    scheduleAIMove(sessionId, humanSocket);
                }
            } else if (submitResult.isTieAgain) {
                // Notify human to choose again
                humanSocket.emit(SOCKET_EVENTS.TIE_BREAKER_RETRY);
                // AI will choose again after human chooses
            }
        });
    }

    io.on('connection', (socket: Socket) => {
        console.log(`✅ Client connected: ${socket.id}`);

        // Get the persistent player ID from auth
        const playerId = socket.handshake.auth?.playerId as string | undefined;

        if (playerId) {
            // Check if this player has an active session to reconnect to
            const reconnectResult = gameService.handleReconnect(playerId, socket.id);

            if (reconnectResult.success && reconnectResult.session && reconnectResult.color) {
                console.log(`🔄 Player ${playerId} reconnected to session ${reconnectResult.session.sessionId}`);

                // Join the session room
                socket.join(reconnectResult.session.sessionId);

                // Get the appropriate view based on game phase
                let gameView;
                if (reconnectResult.session.phase === 'setup') {
                    gameView = gameService.getPlayerSetupView(socket.id);
                } else {
                    gameView = gameService.getPlayerGameView(socket.id);
                }

                // Send session restored event with full state
                socket.emit(SOCKET_EVENTS.SESSION_RESTORED, {
                    color: reconnectResult.color,
                    phase: reconnectResult.session.phase,
                    gameMode: reconnectResult.session.gameMode,
                    gameState: gameView,
                    sessionId: reconnectResult.session.sessionId
                });

                // Notify opponent that player reconnected
                const opponentId = gameService.getOpponentSocketId(socket.id);
                if (opponentId) {
                    io.to(opponentId).emit(SOCKET_EVENTS.OPPONENT_RECONNECTED);
                }
            } else {
                // No active session - register as new player
                gameService.registerPlayer(playerId, socket.id);
            }
        }

        socket.on(SOCKET_EVENTS.JOIN_QUEUE, (payload: JoinQueuePayload) => {
            // Default to classic if gameMode is not provided (for fallback compatibility)
            const mode = payload.gameMode || 'classic';
            matchmakingService.addToQueue(socket.id, mode);
        });

        socket.on(SOCKET_EVENTS.LEAVE_QUEUE, () => {
            matchmakingService.removeFromQueue(socket.id);
        });

        // 4.1: Start singleplayer game against AI
        socket.on(SOCKET_EVENTS.START_SINGLEPLAYER, (payload: StartSingleplayerPayload) => {
            const mode = payload.gameMode || 'classic';
            const pId = payload.playerId || playerId || socket.id;

            const session = gameService.createSingleplayerSession(socket.id, pId, mode);

            // Join the session room
            socket.join(session.sessionId);

            // Emit GAME_FOUND to the human player
            socket.emit(SOCKET_EVENTS.GAME_FOUND, {
                sessionId: session.sessionId,
                color: 'red' // human is always red
            });

            console.log(`🤖 Singleplayer game started: session=${session.sessionId}, mode=${mode}`);
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
            const session = gameService.getSessionBySocketId(socket.id);

            // In singleplayer, perform AI setup first, then confirm human
            if (session && session.opponentType === 'ai') {
                // Perform AI setup before human confirm (so both ready at once)
                const aiSetupResult = gameService.performAISetup(session.sessionId);
                if (!aiSetupResult.success) {
                    console.error(`❌ AI Setup Failed for session ${session.sessionId}: ${aiSetupResult.error}`);
                    socket.emit(SOCKET_EVENTS.ERROR, { code: 'AI_SETUP_ERROR', message: 'Failed to setup AI opponent.' });
                    return;
                }
            }

            const result = gameService.confirmSetup(socket.id);

            if (!result.success) {
                socket.emit(SOCKET_EVENTS.ERROR, { code: 'CONFIRM_ERROR', message: result.error });
                return;
            }

            if (result.bothReady) {
                // Both players are ready - start the game
                const updatedSession = gameService.getSessionBySocketId(socket.id);
                if (updatedSession) {
                    // Send GAME_START to each real player with their specific view (fog of war)
                    const redSocketId = updatedSession.players.red?.socketId;
                    const blueSocketId = updatedSession.players.blue?.socketId;

                    if (redSocketId && !gameService.isAIPlayer(redSocketId)) {
                        const redView = gameService.getPlayerGameView(redSocketId);
                        io.to(redSocketId).emit(SOCKET_EVENTS.GAME_START, {
                            startingPlayer: updatedSession.currentTurn,
                            gameState: redView
                        });
                    }

                    if (blueSocketId && !gameService.isAIPlayer(blueSocketId)) {
                        const blueView = gameService.getPlayerGameView(blueSocketId);
                        io.to(blueSocketId).emit(SOCKET_EVENTS.GAME_START, {
                            startingPlayer: updatedSession.currentTurn,
                            gameState: blueView
                        });
                    }

                    // Initialize Bayesian tracker and schedule AI move
                    if (updatedSession.opponentType === 'ai') {
                        gameService.aiService.initializeTracking(updatedSession.sessionId, updatedSession);
                        scheduleAIMove(updatedSession.sessionId, socket);
                    }
                }
            } else {
                // Only this player is ready - notify opponent
                const opponentId = gameService.getOpponentSocketId(socket.id);
                if (opponentId && !gameService.isAIPlayer(opponentId)) {
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
                const isSingleplayer = session.opponentType === 'ai';

                // Send updated game state to current player
                const playerView = gameService.getPlayerGameView(socket.id);
                if (playerView) {
                    socket.emit(SOCKET_EVENTS.GAME_STATE, playerView);
                }

                // Send to opponent (only if human)
                const opponentId = gameService.getOpponentSocketId(socket.id);
                if (opponentId && !gameService.isAIPlayer(opponentId)) {
                    const opponentView = gameService.getPlayerGameView(opponentId);
                    if (opponentView) {
                        io.to(opponentId).emit(SOCKET_EVENTS.GAME_STATE, opponentView);
                    }
                }

                // Check if game ended - emit GAME_OVER after GAME_STATE so clients have final board
                if (session.phase === 'finished') {
                    if (isSingleplayer) {
                        socket.emit(SOCKET_EVENTS.GAME_OVER, {
                            winner: session.winner,
                            reason: session.winReason || 'king_captured'
                        });
                    } else {
                        io.to(session.sessionId).emit(SOCKET_EVENTS.GAME_OVER, {
                            winner: session.winner,
                            reason: session.winReason || 'king_captured'
                        });
                    }
                } else if (session.phase === 'tie_breaker' && isSingleplayer) {
                    // AI needs to submit tie-breaker choice
                    scheduleAITieBreaker(session.sessionId, socket);
                } else if (session.phase === 'playing') {
                    // Check for draw condition (both players only have immovable pieces)
                    if (gameService.checkDraw(session.sessionId)) {
                        gameService.setDraw(session.sessionId);
                        if (isSingleplayer) {
                            socket.emit(SOCKET_EVENTS.GAME_OVER, {
                                winner: null,
                                reason: 'draw'
                            });
                        } else {
                            io.to(session.sessionId).emit(SOCKET_EVENTS.GAME_OVER, {
                                winner: null,
                                reason: 'draw'
                            });
                        }
                        return;
                    }

                    // Check if next player has movable pieces
                    const nextPlayerId = session.currentTurn === 'red'
                        ? session.players.red?.socketId
                        : session.players.blue?.socketId;

                    if (nextPlayerId && !gameService.hasMovablePieces(nextPlayerId)) {
                        // Next player cannot move - notify and skip their turn
                        if (!gameService.isAIPlayer(nextPlayerId)) {
                            io.to(nextPlayerId).emit(SOCKET_EVENTS.TURN_SKIPPED, { reason: 'no_movable_pieces' });
                        }

                        // Skip the turn
                        gameService.skipTurn(nextPlayerId);

                        // Send updated game state after turn skip
                        if (opponentId && !gameService.isAIPlayer(opponentId)) {
                            const updatedOpponentView = gameService.getPlayerGameView(opponentId);
                            if (updatedOpponentView) {
                                io.to(opponentId).emit(SOCKET_EVENTS.GAME_STATE, updatedOpponentView);
                            }
                        }
                        const updatedPlayerView = gameService.getPlayerGameView(socket.id);
                        if (updatedPlayerView) {
                            socket.emit(SOCKET_EVENTS.GAME_STATE, updatedPlayerView);
                        }
                    }

                    // If it's now AI's turn, schedule AI move
                    if (isSingleplayer) {
                        scheduleAIMove(session.sessionId, socket);
                    }
                }
            }
        });

        socket.on(SOCKET_EVENTS.COMBAT_CHOICE, (payload: CombatChoicePayload) => {
            console.log(`⚔️ Player ${socket.id} chose ${payload.element} for tie breaker`);

            const session = gameService.getSessionBySocketId(socket.id);
            const isSingleplayer = session?.opponentType === 'ai';

            // In singleplayer, schedule AI tie-breaker choice AFTER human submits successfully
            // (Moved down to avoid race condition)

            const result = gameService.submitTieBreakerChoice(socket.id, payload.element);

            if (!result.success) {
                socket.emit(SOCKET_EVENTS.ERROR, { code: 'TIE_BREAKER_ERROR', message: result.error });
                return;
            }

            if (isSingleplayer && session) {
                scheduleAITieBreaker(session.sessionId, socket);
            }

            if (result.bothChosen) {
                // Both players have chosen - resolution complete
                const updatedSession = gameService.getSessionBySocketId(socket.id);
                if (updatedSession) {
                    // Send updated game state to human players
                    const redPlayer = updatedSession.players.red;
                    const bluePlayer = updatedSession.players.blue;

                    if (redPlayer?.socketId && !gameService.isAIPlayer(redPlayer.socketId)) {
                        const redView = gameService.getPlayerGameView(redPlayer.socketId);
                        if (redView) {
                            io.to(redPlayer.socketId).emit(SOCKET_EVENTS.GAME_STATE, redView);
                        }
                    }
                    if (bluePlayer?.socketId && !gameService.isAIPlayer(bluePlayer.socketId)) {
                        const blueView = gameService.getPlayerGameView(bluePlayer.socketId);
                        if (blueView) {
                            io.to(bluePlayer.socketId).emit(SOCKET_EVENTS.GAME_STATE, blueView);
                        }
                    }

                    // Emit GAME_OVER after GAME_STATE so clients have final board
                    if (updatedSession.phase === 'finished') {
                        if (isSingleplayer) {
                            socket.emit(SOCKET_EVENTS.GAME_OVER, {
                                winner: updatedSession.winner,
                                reason: updatedSession.winReason || 'king_captured'
                            });
                        } else {
                            io.to(updatedSession.sessionId).emit(SOCKET_EVENTS.GAME_OVER, {
                                winner: updatedSession.winner,
                                reason: updatedSession.winReason || 'king_captured'
                            });
                        }
                    } else if (updatedSession.phase === 'playing' && isSingleplayer) {
                        // After tie-breaker, check if AI should move next
                        scheduleAIMove(updatedSession.sessionId, socket);
                    }
                }
            } else if (result.isTieAgain) {
                // Another tie occurred - notify human players to choose again
                const updatedSession = gameService.getSessionBySocketId(socket.id);
                if (updatedSession) {
                    const redSocketId = updatedSession.players.red?.socketId;
                    const blueSocketId = updatedSession.players.blue?.socketId;

                    console.log(`🔄 Tie-breaker tie! Notifying players to retry.`);

                    if (redSocketId && !gameService.isAIPlayer(redSocketId)) {
                        io.to(redSocketId).emit(SOCKET_EVENTS.TIE_BREAKER_RETRY);
                    }
                    if (blueSocketId && !gameService.isAIPlayer(blueSocketId)) {
                        io.to(blueSocketId).emit(SOCKET_EVENTS.TIE_BREAKER_RETRY);
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
                        // Emit REMATCH_ACCEPTED to human players only
                        const redSocketId = session.players.red?.socketId;
                        const blueSocketId = session.players.blue?.socketId;

                        if (redSocketId && !gameService.isAIPlayer(redSocketId)) {
                            const redSetupView = gameService.getPlayerSetupView(redSocketId);
                            io.to(redSocketId).emit(SOCKET_EVENTS.REMATCH_ACCEPTED, { setupState: redSetupView });
                        }
                        if (blueSocketId && !gameService.isAIPlayer(blueSocketId)) {
                            const blueSetupView = gameService.getPlayerSetupView(blueSocketId);
                            io.to(blueSocketId).emit(SOCKET_EVENTS.REMATCH_ACCEPTED, { setupState: blueSetupView });
                        }
                    }
                }
            } else {
                // Only one player has requested - notify opponent (if human)
                if (result.opponentSocketId && !gameService.isAIPlayer(result.opponentSocketId)) {
                    io.to(result.opponentSocketId).emit(SOCKET_EVENTS.REMATCH_REQUESTED);
                }
            }
        });

        socket.on('disconnect', (reason: string) => {
            console.log(`❌ Client disconnected: ${socket.id} (${reason})`);

            // 1. Remove from queue if they are waiting
            matchmakingService.removeFromQueue(socket.id);

            // 2. Check if they are in an active game - use grace period instead of immediate end
            const opponentId = gameService.handleTemporaryDisconnect(socket.id, () => {
                // This runs after grace period expires without reconnection
                const result = gameService.handleDisconnect(socket.id);
                if (result && result.opponentId) {
                    console.log(`🔄 Grace period expired. Re-queueing opponent ${result.opponentId}`);

                    const opponentSocket = io.sockets.sockets.get(result.opponentId);

                    if (opponentSocket && opponentSocket.connected) {
                        io.to(result.opponentId).emit(SOCKET_EVENTS.OPPONENT_DISCONNECTED);
                        matchmakingService.addToQueue(result.opponentId);
                    }
                }
            });

            // Notify opponent that player is reconnecting (not fully disconnected yet)
            if (opponentId) {
                const opponentSocket = io.sockets.sockets.get(opponentId);
                if (opponentSocket && opponentSocket.connected) {
                    io.to(opponentId).emit(SOCKET_EVENTS.OPPONENT_RECONNECTING);
                }
            }
        });
    });
}
