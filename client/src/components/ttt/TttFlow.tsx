import React, { useState, useCallback } from 'react';
import type { TttDifficulty } from '@rps/shared';
import { TttModeSelection } from './TttModeSelection';
import { TttDifficultySelection } from './TttDifficultySelection';
import { TttGameScreen } from './TttGameScreen';

type TttScreen = 'mode-select' | 'difficulty-select' | 'playing-online' | 'playing-ai';

export const TttFlow: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [screen, setScreen] = useState<TttScreen>('mode-select');
    const [difficulty, setDifficulty] = useState<TttDifficulty>('easy');

    const handlePlayOnline = useCallback(() => {
        setScreen('playing-online');
    }, []);

    const handlePlayAI = useCallback(() => {
        setScreen('difficulty-select');
    }, []);

    const handleDifficultySelect = useCallback((d: TttDifficulty) => {
        setDifficulty(d);
        setScreen('playing-ai');
    }, []);

    const handleBackToModeSelect = useCallback(() => {
        onBack();
    }, [onBack]);


    switch (screen) {
        case 'mode-select':
            return <TttModeSelection onPlayOnline={handlePlayOnline} onPlayAI={handlePlayAI} />;

        case 'difficulty-select':
            return <TttDifficultySelection onSelect={handleDifficultySelect} onBack={handleBackToModeSelect} />;

        case 'playing-online':
            return <TttGameScreen mode="online" onBack={handleBackToModeSelect} />;

        case 'playing-ai':
            return <TttGameScreen mode="ai" difficulty={difficulty} onBack={handleBackToModeSelect} />;
    }
};
