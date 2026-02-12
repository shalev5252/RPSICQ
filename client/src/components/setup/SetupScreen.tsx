import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../../hooks/useSocket';
import { useGameStore } from '../../store/gameStore';
import type { PieceType, Position, PlayerCellView, PlayerPieceView } from '@rps/shared';
import { SOCKET_EVENTS, RED_SETUP_ROWS, BLUE_SETUP_ROWS, BOARD_CONFIG, ONSLAUGHT_CONFIG } from '@rps/shared';
import { Board } from './Board';
import { PieceTray } from './PieceTray';
import { RulesModal } from '../game/RulesModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import './SetupScreen.css';

export const SetupScreen: React.FC = () => {
    const { t } = useTranslation();
    const { socket } = useSocket();
    const myColor = useGameStore((state) => state.myColor);
    const setupState = useGameStore((state) => state.setupState);
    const gamePhase = useGameStore((state) => state.gamePhase);
    const gameMode = useGameStore((state) => state.gameMode);
    const gameVariant = useGameStore((state) => state.gameVariant);
    const setKingPosition = useGameStore((state) => state.setKingPosition);
    const setPitPosition = useGameStore((state) => state.setPitPosition);

    const opponentReconnecting = useGameStore((state) => state.opponentReconnecting);

    const [draggingPiece, setDraggingPiece] = useState<PieceType | null>(null);
    const [selectedTrayPiece, setSelectedTrayPiece] = useState<PieceType | null>(null);
    const [showRules, setShowRules] = useState(false);
    const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);

    const handleForfeit = useCallback(() => {
        if (!socket) return;
        socket.emit(SOCKET_EVENTS.FORFEIT_GAME);
        setShowForfeitConfirm(false);
    }, [socket]);

    const validDropRows = myColor === 'red' ? RED_SETUP_ROWS : BLUE_SETUP_ROWS;
    const activeRows = BOARD_CONFIG[gameMode].rows;
    const activeCols = gameVariant === 'onslaught'
        ? ONSLAUGHT_CONFIG[gameMode].cols
        : BOARD_CONFIG[gameMode].cols;

    // Convert rows to Position array for Board component
    // Valid cells are shown if dragging OR if a piece is selected
    const activePiece = draggingPiece || selectedTrayPiece;
    const validDropCells = activePiece
        ? validDropRows.flatMap(row =>
            Array.from({ length: activeCols }, (_, col) => ({ row, col }))
        )
        : [];

    const kingPlaced = setupState.kingPosition !== null;
    const pitPlaced = setupState.pitPosition !== null;
    const canReposition = !setupState.hasShuffled;

    // Calculate selected piece position on board for highlighting
    const selectedPiecePosition = useMemo(() => {
        if (activePiece === 'king' && setupState.kingPosition) return setupState.kingPosition;
        if (activePiece === 'pit' && setupState.pitPosition) return setupState.pitPosition;
        return null;
    }, [activePiece, setupState.kingPosition, setupState.pitPosition]);

    // Merge local king/pit positions with server board to show pieces immediately
    const displayBoard = useMemo((): PlayerCellView[][] => {
        // Start with empty board or server board
        const baseBoard: PlayerCellView[][] = setupState.board.length > 0
            ? setupState.board.map(row => row.map(cell => ({ ...cell, piece: cell.piece ? { ...cell.piece } : null })))
            : Array(activeRows).fill(null).map((_, row) =>
                Array(activeCols).fill(null).map((_, col) => ({
                    row,
                    col,
                    piece: null,
                }))
            );

        // If we haven't shuffled yet, overlay local king/pit positions
        if (!setupState.hasShuffled && myColor) {
            // Clear any existing king/pit from our color (to handle repositioning)
            for (const row of baseBoard) {
                for (const cell of row) {
                    if (cell.piece?.owner === myColor && (cell.piece.type === 'king' || cell.piece.type === 'pit')) {
                        cell.piece = null;
                    }
                }
            }

            // Add king at local position
            if (setupState.kingPosition) {
                const { row, col } = setupState.kingPosition;
                if (typeof row === 'number' && typeof col === 'number' &&
                    row >= 0 && row < baseBoard.length &&
                    col >= 0 && col < baseBoard[row].length) {
                    const kingPiece: PlayerPieceView = {
                        id: 'local-king',
                        owner: myColor,
                        type: 'king',
                        position: setupState.kingPosition,
                        isRevealed: false,
                        hasHalo: false,
                    };
                    baseBoard[row][col].piece = kingPiece;
                } else {
                    console.warn(`Invalid king position for ${myColor}:`, setupState.kingPosition);
                }
            }

            // Add pit at local position
            if (setupState.pitPosition) {
                const { row, col } = setupState.pitPosition;
                if (typeof row === 'number' && typeof col === 'number' &&
                    row >= 0 && row < baseBoard.length &&
                    col >= 0 && col < baseBoard[row].length) {
                    const pitPiece: PlayerPieceView = {
                        id: 'local-pit',
                        owner: myColor,
                        type: 'pit',
                        position: setupState.pitPosition,
                        isRevealed: false,
                        hasHalo: false,
                    };
                    baseBoard[row][col].piece = pitPiece;
                } else {
                    console.warn(`Invalid pit position for ${myColor}:`, setupState.pitPosition);
                }
            }
        }

        return baseBoard;
    }, [setupState.board, setupState.kingPosition, setupState.pitPosition, setupState.hasShuffled, myColor, activeRows, activeCols]);

    const handleDragStart = useCallback((pieceType: PieceType) => {
        setDraggingPiece(pieceType);
        setSelectedTrayPiece(pieceType); // Select on drag too
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggingPiece(null);
    }, []);

    const handleTrayPieceClick = useCallback((pieceType: PieceType) => {
        // Toggle selection
        setSelectedTrayPiece(prev => prev === pieceType ? null : pieceType);
    }, []);

    // Rename to handleCellInteraction to reflect it handles both drop and click
    const handleCellInteraction = useCallback((row: number, col: number) => {
        const pieceToPlace = draggingPiece || selectedTrayPiece;

        // Defensive guards
        if (!socket || !myColor) return;

        // Validate bounds
        if (row < 0 || row >= activeRows || col < 0 || col >= activeCols) return;

        // Validate game phase and state
        if (gamePhase !== 'setup' || setupState.hasShuffled) return;

        // Check content of clicked cell
        // We use setupState positions directly for accuracy, or displayBoard
        // displayBoard has the most up-to-date visual state including our local overrides
        const clickedCellPiece = displayBoard[row][col]?.piece;
        const isMyPiece = clickedCellPiece?.owner === myColor;

        // Logic for clicking on an existing piece (Selection / Swap / Deselect)
        if (isMyPiece && clickedCellPiece) {
            if (pieceToPlace === clickedCellPiece.type) {
                // Clicked the same piece we are holding -> Deselect
                setSelectedTrayPiece(null);
                return;
            } else if (pieceToPlace) {
                // Holding a different piece -> SWAP
                const newPosForActive: Position = { row, col };
                const currentPosOfActive = pieceToPlace === 'king' ? setupState.kingPosition : setupState.pitPosition;

                // Perform swap: 
                // Active piece goes to {row, col}
                // Clicked piece goes to where active piece was (or tray if null)

                if (pieceToPlace === 'king') setKingPosition(newPosForActive);
                else setPitPosition(newPosForActive);

                if (clickedCellPiece.type === 'king') setKingPosition(currentPosOfActive);
                else setPitPosition(currentPosOfActive);

                const finalKingPos = pieceToPlace === 'king' ? newPosForActive : (clickedCellPiece.type === 'king' ? currentPosOfActive : setupState.kingPosition);
                const finalPitPos = pieceToPlace === 'pit' ? newPosForActive : (clickedCellPiece.type === 'pit' ? currentPosOfActive : setupState.pitPosition);

                if (finalKingPos && finalPitPos) {
                    socket.emit(SOCKET_EVENTS.PLACE_KING_PIT, {
                        kingPosition: finalKingPos,
                        pitPosition: finalPitPos,
                    });
                }

                setSelectedTrayPiece(null); // Clear selection after swap
                return;
            } else {
                // Not holding anything -> Select this piece
                if (clickedCellPiece.type !== 'hidden') {
                    setSelectedTrayPiece(clickedCellPiece.type);
                }
                return;
            }
        }

        // If we get here, we clicked an empty cell (or opponent's, but that shouldn't happen in setup rows normally, 
        // though validDropRows check handles that)

        // Validate valid setup rows
        const isValidRow = validDropRows.includes(row);
        if (!isValidRow) {
            // Clicked on invalid row -> clear selection if not dragging
            if (!draggingPiece) setSelectedTrayPiece(null);
            return;
        }

        // If we are not holding a piece, nothing to do on empty cell
        if (!pieceToPlace) return;

        // Move piece to empty cell
        const newPosition: Position = { row, col };

        if (pieceToPlace === 'king') {
            // Prevent placing king on pit
            if (setupState.pitPosition?.row === row && setupState.pitPosition?.col === col) {
                return;
            }
            setKingPosition(newPosition);
        } else if (pieceToPlace === 'pit') {
            // Prevent placing pit on king
            if (setupState.kingPosition?.row === row && setupState.kingPosition?.col === col) {
                return;
            }
            setPitPosition(newPosition);
        }

        setDraggingPiece(null);
        setSelectedTrayPiece(null); // Clear selection after placement

        const kingPos = pieceToPlace === 'king' ? newPosition : setupState.kingPosition;
        const pitPos = pieceToPlace === 'pit' ? newPosition : setupState.pitPosition;

        if (kingPos && pitPos) {
            socket.emit(SOCKET_EVENTS.PLACE_KING_PIT, {
                kingPosition: kingPos,
                pitPosition: pitPos,
            });
        }
    }, [draggingPiece, selectedTrayPiece, socket, myColor, setupState.kingPosition, setupState.pitPosition, setupState.hasShuffled, gamePhase, validDropRows, setKingPosition, setPitPosition, displayBoard, activeRows, activeCols]);

    const handlePieceDragFromBoard = useCallback((pieceType: PieceType, _row: number, _col: number) => {
        if (!canReposition) return;
        handleDragStart(pieceType);
    }, [canReposition, handleDragStart]);

    const handleShuffle = useCallback(() => {
        if (!socket) return;
        socket.emit(SOCKET_EVENTS.RANDOMIZE_PIECES);
    }, [socket]);

    const handleConfirm = useCallback(() => {
        if (!socket) return;
        socket.emit(SOCKET_EVENTS.CONFIRM_SETUP);
    }, [socket]);

    if (!myColor) {
        return <div className="setup-screen">{t('setup.loading')}</div>;
    }

    const canShuffle = (kingPlaced && pitPlaced) || gameVariant === 'onslaught';
    const canConfirm = setupState.hasShuffled && !setupState.isReady;

    return (
        <div className="setup-screen">
            <div className="setup-screen__header">
                <div className="setup-screen__title-row">
                    <h2 className="setup-screen__title">{t('setup.setup_your_army')}</h2>
                    <div className="setup-screen__header-actions">
                        <button
                            className="setup-screen__icon-btn"
                            onClick={() => setShowForfeitConfirm(true)}
                            title={t('game.forfeit')}
                        >
                            🏳️
                        </button>
                        <button
                            className="setup-screen__rules-btn"
                            onClick={() => setShowRules(true)}
                            title="Game Rules"
                        >
                            ℹ️
                        </button>
                    </div>
                </div>
                <div className="setup-screen__status-row">
                    <div className={`setup-screen__color setup-screen__color--${myColor}`}>
                        {t('setup.you_are', { color: t(`colors.${myColor}`) })}
                    </div>
                    {setupState.opponentReady && (
                        <div className="setup-screen__opponent-ready setup-screen__opponent-ready--mobile">
                            {t('setup.opponent_ready')}
                        </div>
                    )}
                </div>
            </div>

            {opponentReconnecting && (
                <div className="setup-screen__reconnecting-banner">
                    <div className="setup-screen__reconnecting-spinner"></div>
                    {t('game.opponent_reconnecting')}
                </div>
            )}

            <div className="setup-screen__content">
                {gameVariant !== 'onslaught' && (
                    <div className="setup-screen__tray">
                        <PieceTray
                            myColor={myColor}
                            kingPlaced={kingPlaced}
                            pitPlaced={pitPlaced}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            selectedPiece={selectedTrayPiece}
                            onPieceClick={handleTrayPieceClick}
                            gameMode={gameMode}
                        />
                    </div>
                )}

                <div className="setup-screen__board-container">
                    <div className="setup-screen__board-label setup-screen__board-label--opponent">
                        {t('setup.enemy_territory')}
                    </div>
                    <Board
                        board={displayBoard}
                        myColor={myColor}
                        validDropCells={validDropCells}
                        onCellDrop={handleCellInteraction}
                        onCellClick={handleCellInteraction}
                        onPieceDrag={canReposition ? handlePieceDragFromBoard : undefined}
                        onPieceDragEnd={handleDragEnd}
                        draggablePieceTypes={canReposition ? ['king', 'pit'] : []}
                        selectedPiecePosition={selectedPiecePosition}
                    />
                    <div className="setup-screen__board-label setup-screen__board-label--mine">
                        {t('setup.your_territory')}
                    </div>
                </div>

                <div className="setup-screen__controls">
                    <button
                        className="setup-screen__btn setup-screen__btn--shuffle"
                        onClick={handleShuffle}
                        disabled={!canShuffle}
                        data-testid="shuffle-button"
                    >
                        {t('setup.shuffle')}
                    </button>
                    <button
                        className={`setup-screen__btn ${setupState.isReady ? 'setup-screen__btn--waiting' : 'setup-screen__btn--confirm'}`}
                        onClick={handleConfirm}
                        disabled={!canConfirm}
                        data-testid="confirm-setup-button"
                    >
                        {setupState.isReady ? t('setup.waiting') : t('setup.lets_start')}
                    </button>

                    {setupState.opponentReady && (
                        <div className="setup-screen__opponent-ready">
                            {t('setup.opponent_ready')}
                        </div>
                    )}
                </div>
            </div>

            <RulesModal
                isOpen={showRules}
                onClose={() => setShowRules(false)}
                gameMode={gameMode}
            />
            <ConfirmationModal
                isOpen={showForfeitConfirm}
                title={t('game.forfeit_title', 'Forfeit Game?')}
                message={t('game.forfeit_message', 'Are you sure you want to give up? You will lose the game.')}
                onConfirm={handleForfeit}
                onCancel={() => setShowForfeitConfirm(false)}
                confirmText={t('game.forfeit_confirm', 'Give Up')}
                cancelText={t('common.cancel', 'Cancel')}
                isDangerous={true}
            />
        </div>
    );
};
