import React from 'react';
import { EmoteId, PlayerColor } from '@rps/shared';
import './Emote.css';

const EMOTE_MAP: Record<EmoteId, string> = {
    thumbs_up: '👍',
    clap: '👏',
    laugh: '😂',
    think: '🤔',
    fire: '🔥',
    sad: '😢',
    vomit: '🤮',
    poop: '💩',
    explosion: '💥',
    smile: '😊',
    tired: '😴',
    devil: '😈',
    pray: '🙏',
    angel: '😇',
};

interface EmoteDisplayProps {
    emoteId: EmoteId;
    from: PlayerColor;
}

export const EmoteDisplay: React.FC<EmoteDisplayProps> = ({ emoteId, from }) => {
    const emoji = EMOTE_MAP[emoteId] || '❓';

    return (
        <div className={`emote-display emote-display-${from}`}>
            <span className="emote-display-emoji">{emoji}</span>
        </div>
    );
};
