import React, { useState, useRef, useEffect } from 'react';
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

interface EmotePickerProps {
    className?: string;
}

export const EmotePicker: React.FC<EmotePickerProps> = ({ className }) => {
    const { t } = useTranslation();
    const { sendEmote } = useSocket();
    const emoteCooldown = useGameStore((state) => state.emoteCooldown);
    const [isOpen, setIsOpen] = useState(false);
    const pickerRef = useRef<HTMLDivElement>(null);

    const handleEmoteClick = (emoteId: EmoteId) => {
        if (!emoteCooldown) {
            sendEmote(emoteId);
            setIsOpen(false);
        }
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className={`emote-picker ${className || ''}`} ref={pickerRef}>
            <button
                className={`emote-fab ${isOpen ? 'open' : ''} ${emoteCooldown ? 'cooldown' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={t('emotes.toggle', 'Toggle Emotes')}
            >
                😀
            </button>
            {isOpen && (
                <div className="emote-picker-overlay">
                    {EMOTES.map((emote) => (
                        <button
                            key={emote.id}
                            className="emote-button"
                            onClick={() => handleEmoteClick(emote.id)}
                            disabled={emoteCooldown}
                            aria-label={t(`emotes.${emote.id}`, emote.id)}
                        >
                            {emote.emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
