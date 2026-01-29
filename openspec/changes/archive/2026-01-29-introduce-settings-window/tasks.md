# Tasks: Introduce Settings Window

- [x] Refactor `SoundContext` to support volume state for BGM and SFX <!-- id: 0 -->
    - [x] Add `bgmVolume` and `sfxVolume` to state (persisted)
    - [x] Update `playBGM` and `playSound` to use these volumes
    - [x] Add `setBgmVolume` and `setSfxVolume` methods
- [x] Create `SettingsWindow` component <!-- id: 1 -->
    - [x] Implement movable/draggable container (using `react-draggable` or native DnD logic)
    - [x] Add "Close" button
    - [x] Implement Language selector UI inside window
    - [x] Implement Volume sliders
- [x] Update `App.tsx` Header <!-- id: 2 -->
    - [x] Remove direct `LanguageSwitcher` usage
    - [x] Add `SettingsButton` (gear icon)
    - [x] Implement state to toggle `SettingsWindow` visibility
- [x] Verify Audio Levels <!-- id: 3 -->
    - [x] Test sliders affect volume in real-time
- [x] Verify Localization <!-- id: 4 -->
    - [x] Ensure language switching works from new location
