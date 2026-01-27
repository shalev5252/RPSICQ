import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

// Import sound assets
import bgmUrl from '../assets/sounds/bgm.mp3';
import move1Url from '../assets/sounds/move1.mp3';
import move2Url from '../assets/sounds/move2.mp3';
import battleUrl from '../assets/sounds/battle.mp3';
import winnerUrl from '../assets/sounds/winner.mp3';
import looserUrl from '../assets/sounds/looser.mp3'; // Preservation of user typo

type SoundEffect = 'move1' | 'move2' | 'battle' | 'winner' | 'looser';

interface SoundContextType {
    playBGM: () => void;
    stopBGM: () => void;
    playSound: (effect: SoundEffect) => void;
    isMuted: boolean;
    toggleMute: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const bgmRef = useRef<HTMLAudioElement | null>(null);
    const soundsRef = useRef<Record<SoundEffect, HTMLAudioElement | null>>({
        move1: null,
        move2: null,
        battle: null,
        winner: null,
        looser: null
    });

    // Mute state (could be persisted in localStorage)
    const [isMuted, setIsMuted] = useState(false);
    const [bgmInitialized, setBgmInitialized] = useState(false);

    // Initialize Audio objects
    useEffect(() => {
        bgmRef.current = new Audio(bgmUrl);
        bgmRef.current.loop = true;
        bgmRef.current.volume = 0.1; // Significantly lower volume for background to let SFX shine

        soundsRef.current.move1 = new Audio(move1Url);
        soundsRef.current.move2 = new Audio(move2Url);
        soundsRef.current.battle = new Audio(battleUrl);
        soundsRef.current.winner = new Audio(winnerUrl);
        soundsRef.current.looser = new Audio(looserUrl);

        // Preload sounds and set high volume
        Object.values(soundsRef.current).forEach(audio => {
            if (audio) {
                audio.load();
                audio.volume = 1.0; // Max volume for effects
            }
        });

        return () => {
            if (bgmRef.current) {
                bgmRef.current.pause();
                bgmRef.current = null;
            }
        };
    }, []);

    // Handle Mute Toggle
    useEffect(() => {
        if (bgmRef.current) {
            bgmRef.current.muted = isMuted;
        }
        Object.values(soundsRef.current).forEach(audio => {
            if (audio) audio.muted = isMuted;
        });
    }, [isMuted]);

    const playBGM = useCallback(() => {
        if (bgmRef.current && !bgmInitialized) {
            bgmRef.current.play().catch(e => {
                console.log("Audio autoplay blocked, waiting for interaction", e);
            });
            setBgmInitialized(true);
        }
    }, [bgmInitialized]);

    const stopBGM = useCallback(() => {
        if (bgmRef.current) {
            bgmRef.current.pause();
            bgmRef.current.currentTime = 0;
            setBgmInitialized(false);
        }
    }, []);

    const playSound = useCallback((effect: SoundEffect) => {
        const audio = soundsRef.current[effect];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => console.error("Error playing sound:", e));
        }
    }, []);

    const toggleMute = useCallback(() => {
        setIsMuted(prev => !prev);
    }, []);

    return (
        <SoundContext.Provider value={{ playBGM, stopBGM, playSound, isMuted, toggleMute }}>
            {children}
        </SoundContext.Provider>
    );
};

export const useSound = () => {
    const context = useContext(SoundContext);
    if (context === undefined) {
        throw new Error('useSound must be used within a SoundProvider');
    }
    return context;
};
