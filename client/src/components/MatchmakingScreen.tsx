import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMatchmaking } from '../hooks/useMatchmaking';
import { useGameStore } from '../store/gameStore';
import { ModeSelect } from './ModeSelect';
import { socket } from '../socket';
import { SOCKET_EVENTS } from '@rps/shared';
import './MatchmakingScreen.css';

export const MatchmakingScreen: React.FC = () => {
    const isSearching = useMatchmaking().isSearching;
    const joinQueue = useMatchmaking().joinQueue;
    const leaveQueue = useMatchmaking().leaveQueue;
    const { gameMode, setGameMode, gameVariant, setGameVariant, opponentType, setOpponentType } = useGameStore((state) => ({
        gameMode: state.gameMode,
        setGameMode: state.setGameMode,
        gameVariant: state.gameVariant,
        setGameVariant: state.setGameVariant,
        opponentType: state.opponentType,
        setOpponentType: state.setOpponentType
    }));

    const pvpMode = useGameStore((state) => state.pvpMode);
    const setPvpMode = useGameStore((state) => state.setPvpMode);
    const roomCode = useGameStore((state) => state.roomCode);
    const roomError = useGameStore((state) => state.roomError);
    const isCreatingRoom = useGameStore((state) => state.isCreatingRoom);
    const isJoiningRoom = useGameStore((state) => state.isJoiningRoom);
    const setIsCreatingRoom = useGameStore((state) => state.setIsCreatingRoom);
    const setIsJoiningRoom = useGameStore((state) => state.setIsJoiningRoom);
    const setRoomError = useGameStore((state) => state.setRoomError);

    const [joinCode, setJoinCode] = useState('');

    const { t } = useTranslation();

    const handleJoin = () => {
        if (opponentType === 'ai') {
            socket.emit(SOCKET_EVENTS.START_SINGLEPLAYER, { gameMode, gameVariant });
        } else {
            joinQueue(gameMode, gameVariant);
        }
    };

    const handleCreateRoom = () => {
        setIsCreatingRoom(true);
        setRoomError(null);
        socket.emit(SOCKET_EVENTS.CREATE_ROOM, { gameMode, gameVariant });
    };

    const handleCancelRoom = () => {
        socket.emit(SOCKET_EVENTS.CANCEL_ROOM);
        useGameStore.getState().setRoomCode(null);
        setIsCreatingRoom(false);
    };

    const handleJoinRoom = () => {
        if (joinCode.length !== 7) return;
        setIsJoiningRoom(true);
        setRoomError(null);
        socket.emit(SOCKET_EVENTS.JOIN_ROOM, { roomCode: joinCode });
    };

    const isInRoom = roomCode !== null;
    const isBusy = isSearching || isCreatingRoom || isJoiningRoom || isInRoom;

    return (
        <div className="matchmaking-screen">
            <ModeSelect
                selectedMode={gameMode}
                onSelectMode={setGameMode}
                disabled={isBusy}
            />

            {/* Variant selector */}
            <div className="variant-select">
                <h3 className="variant-select__title">{t('matchmaking.select_variant')}</h3>
                <div className="variant-select__options">
                    <button
                        className={`variant-select__option ${gameVariant === 'standard' ? 'variant-select__option--selected' : ''}`}
                        onClick={() => setGameVariant('standard')}
                        disabled={isBusy}
                    >
                        <div className="variant-select__icon">🎭</div>
                        <div className="variant-select__label">{t('matchmaking.variant_standard')}</div>
                    </button>
                    <button
                        className={`variant-select__option ${gameVariant === 'clearday' ? 'variant-select__option--selected' : ''}`}
                        onClick={() => setGameVariant('clearday')}
                        disabled={isBusy}
                    >
                        <div className="variant-select__icon">☀️</div>
                        <div className="variant-select__label">{t('matchmaking.variant_clearday')}</div>
                    </button>
                </div>
            </div>

            <div className="opponent-select">
                <h3 className="opponent-select__title">{t('matchmaking.select_opponent')}</h3>
                <div className="opponent-select__options">
                    <button
                        className={`opponent-select__option ${opponentType === 'human' ? 'opponent-select__option--selected' : ''}`}
                        onClick={() => setOpponentType('human')}
                        disabled={isBusy}
                    >
                        <div className="opponent-select__icon">&#x1F465;</div>
                        <div className="opponent-select__label">{t('matchmaking.vs_player')}</div>
                    </button>
                    <button
                        className={`opponent-select__option ${opponentType === 'ai' ? 'opponent-select__option--selected' : ''}`}
                        onClick={() => setOpponentType('ai')}
                        disabled={isBusy}
                    >
                        <div className="opponent-select__icon">&#x1F916;</div>
                        <div className="opponent-select__label">{t('matchmaking.vs_computer')}</div>
                    </button>
                </div>
            </div>

            {/* PvP sub-options: Random vs Friend */}
            {opponentType === 'human' && (
                <div className="pvp-mode-select">
                    <div className="pvp-mode-select__options">
                        <button
                            className={`pvp-mode-select__option ${pvpMode === 'random' ? 'pvp-mode-select__option--selected' : ''}`}
                            onClick={() => setPvpMode('random')}
                            disabled={isBusy}
                        >
                            {t('matchmaking.random_opponent')}
                        </button>
                        <button
                            className={`pvp-mode-select__option ${pvpMode === 'friend' ? 'pvp-mode-select__option--selected' : ''}`}
                            onClick={() => setPvpMode('friend')}
                            disabled={isBusy}
                        >
                            {t('matchmaking.play_with_friend')}
                        </button>
                    </div>
                </div>
            )}

            <div className="actions">
                {/* AI or Random PvP */}
                {(opponentType === 'ai' || (opponentType === 'human' && pvpMode === 'random')) && (
                    <>
                        {!isSearching ? (
                            <button className="btn-primary" onClick={handleJoin}>
                                {opponentType === 'ai' ? t('matchmaking.start_game') : t('matchmaking.find_game')}
                            </button>
                        ) : (
                            <div className="searching-state">
                                <div className="spinner"></div>
                                <p>{t('matchmaking.searching')}</p>
                                <button className="btn-secondary" onClick={leaveQueue}>
                                    {t('matchmaking.cancel')}
                                </button>
                            </div>
                        )}
                    </>
                )}

                {/* Play with Friend */}
                {opponentType === 'human' && pvpMode === 'friend' && (
                    <div className="room-section">
                        {/* Show room code if created */}
                        {isInRoom && (
                            <div className="room-section__created">
                                <p className="room-section__label">{t('matchmaking.room_code_label')}</p>
                                <div className="room-section__code">{roomCode}</div>
                                <p className="room-section__hint">{t('matchmaking.room_share_hint')}</p>
                                <div className="room-section__waiting">
                                    <div className="spinner"></div>
                                    <p>{t('matchmaking.room_waiting')}</p>
                                </div>
                                <button className="btn-secondary" onClick={handleCancelRoom}>
                                    {t('matchmaking.cancel')}
                                </button>
                            </div>
                        )}

                        {/* Creating room spinner */}
                        {isCreatingRoom && !isInRoom && (
                            <div className="searching-state">
                                <div className="spinner"></div>
                                <p>{t('matchmaking.room_creating')}</p>
                            </div>
                        )}

                        {/* Default: Create or Join buttons */}
                        {!isInRoom && !isCreatingRoom && !isJoiningRoom && (
                            <div className="room-section__actions">
                                <button className="btn-primary" onClick={handleCreateRoom}>
                                    {t('matchmaking.create_room')}
                                </button>
                                <div className="room-section__divider">{t('matchmaking.or')}</div>
                                <div className="room-section__join">
                                    <input
                                        className="room-section__input"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={7}
                                        placeholder={t('matchmaking.room_code_placeholder')}
                                        value={joinCode}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setJoinCode(val);
                                            setRoomError(null);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleJoinRoom();
                                        }}
                                    />
                                    <button
                                        className="btn-primary room-section__join-btn"
                                        onClick={handleJoinRoom}
                                        disabled={joinCode.length !== 7}
                                    >
                                        {t('matchmaking.join_room')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Joining room spinner */}
                        {isJoiningRoom && (
                            <div className="searching-state">
                                <div className="spinner"></div>
                                <p>{t('matchmaking.room_joining')}</p>
                            </div>
                        )}

                        {/* Room error */}
                        {roomError && (
                            <div className="room-section__error">{roomError}</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
