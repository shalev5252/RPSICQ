# Proposal: Introduce Settings Window

## Goal
Implement a movable settings window accessible from the header to consolidate game configurations.

## Problem
- Language selection is currently inline in the header, taking up space.
- Audio volume is hardcoded with no user control (only mute toggle exists).
- No unified place for game settings.

## Solution
1. **Settings Button**: Replace inline `LanguageSwitcher` in the header with a "Settings" (gear icon) button.
2. **Settings Window**: A movable modal/window containing:
    - **Language**: Dropdown or toggle for EN/HE.
    - **Music Volume**: Slider (0-100).
    - **SFX Volume**: Slider (0-100).
3. **Audio System Update**: Refactor `SoundContext` to support dynamic volume adjustment.

## Risks
- **Audio Glitches**: Changing volume while playing might need smooth transitions.
- **UI Clutter**: Movable window on mobile might be tricky (should potentially be a full modal on mobile).
