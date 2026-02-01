import React from 'react';
import { useTranslation } from 'react-i18next';
import { EmoteId } from '@rps/shared';
import { useGameStore } from '../../store/gameStore';
import { useSocket } from '../../hooks/useSocket';
import './Emote.css';

const EMOTES: { id: EmoteId; emoji: string }[] = [
    { id: 'thumbs_up', emoji: '👍' },
    { id: 'clap', emoji: '👏' },
    { id: 'laugh', emoji: '😂' },
    { id: 'think', emoji: '🤔' },
    { id: 'fire', emoji: '🔥' },
    { id: 'sad', emoji: '😢' },
    { id: 'vomit', emoji: '🤮' },
    { id: 'poop', emoji: '💩' },
    { id: 'explosion', emoji: '💥' },
    { id: 'smile', emoji: '😊' },
    { id: 'tired', emoji: '😴' },
    { id: 'devil', emoji: '😈' },
    { id: 'pray', emoji: '🙏' },
    { id: 'angel', emoji: '😇' },
];

interface EmoteBarProps {
    className?: string;
}

export const EmoteBar: React.FC<EmoteBarProps> = ({ className }) => {
    const { t } = useTranslation();
    const { sendEmote } = useSocket();
    const emoteCooldown = useGameStore((state) => state.emoteCooldown);

    const handleEmoteClick = (emoteId: EmoteId) => {
        if (!emoteCooldown) {
            sendEmote(emoteId);
        }
    };

    return (
        <div className={`emote-bar ${className || ''} ${emoteCooldown ? 'cooldown' : ''}`}>
            <div className="emote-bar-label">{t('emotes.title', 'Emotes')}</div>
            <div className="emote-bar-buttons">
                {EMOTES.map((emote) => (
                    <button
                        key={emote.id}
                        className="emote-button"
                        onClick={() => handleEmoteClick(emote.id)}
                        disabled={emoteCooldown}
                        title={t(`emotes.${emote.id}`, emote.id)}
                        aria-label={t(`emotes.${emote.id}`, emote.id)}
                    >
                        {emote.emoji}
                    </button>
                ))}
            </div>
            {emoteCooldown && <div className="emote-cooldown-indicator" />}
        </div>
    );
};
