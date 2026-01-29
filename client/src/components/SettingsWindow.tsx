import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useSound } from '../context/SoundContext';
import './SettingsWindow.css';

interface SettingsWindowProps {
    onClose: () => void;
}

export const SettingsWindow: React.FC<SettingsWindowProps> = ({ onClose }) => {
    const { t, i18n } = useTranslation();
    const { bgmVolume, setBgmVolume, sfxVolume, setSfxVolume } = useSound();
    // Using a constraint reference to keep window within viewport if needed, 
    // but for now we'll just let it float freely or constrained by window
    const constraintsRef = useRef(null);

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
        document.documentElement.dir = i18n.dir(lng);
        document.documentElement.lang = lng;
    };

    return (
        <div className="settings-overlay" ref={constraintsRef}>
            <motion.div
                className="settings-window"
                drag
                dragMomentum={false}
                dragElastic={0.1}
                // Initial position centered (handled by CSS, but framer needs to know)
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
            >
                <div className="settings-header">
                    <h2>{t('settings.title')}</h2>
                    <button className="close-button" onClick={onClose}>×</button>
                </div>

                <div className="settings-content">
                    {/* Language Setting */}
                    <div className="setting-group">
                        <h3>{t('settings.language')}</h3>
                        <div className="language-options">
                            <button
                                className={i18n.resolvedLanguage === 'en' ? 'active' : ''}
                                onClick={() => changeLanguage('en')}
                            >
                                English
                            </button>
                            <button
                                className={i18n.resolvedLanguage === 'he' ? 'active' : ''}
                                onClick={() => changeLanguage('he')}
                            >
                                עברית
                            </button>
                        </div>
                    </div>

                    {/* Music Volume */}
                    <div className="setting-group">
                        <h3>{t('settings.music_volume')}</h3>
                        <div className="volume-control">
                            <span className={`settings-icon-wrapper ${bgmVolume === 0 ? 'muted' : ''}`}>🎵</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={bgmVolume}
                                onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                            />
                            <span className="volume-value">{Math.round(bgmVolume * 100)}%</span>
                        </div>
                    </div>

                    {/* SFX Volume */}
                    <div className="setting-group">
                        <h3>{t('settings.sfx_volume')}</h3>
                        <div className="volume-control">
                            <span className={`settings-icon-wrapper ${sfxVolume === 0 ? 'muted' : ''}`}>🔊</span>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={sfxVolume}
                                onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                            />
                            <span className="volume-value">{Math.round(sfxVolume * 100)}%</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
