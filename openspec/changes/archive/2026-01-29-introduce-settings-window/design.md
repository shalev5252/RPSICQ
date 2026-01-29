# Design: Settings Window

## Architecture

### Component Hierarchy
We will introduce `SettingsWindow` as a top-level component in `App.tsx`, controlled by a local state `isSettingsOpen`.

```tsx
<App>
  <Header>
    <SettingsButton onClick={() => setIsSettingsOpen(true)} />
  </Header>
  {isSettingsOpen && <SettingsWindow onClose={() => setIsSettingsOpen(false)} />}
  <Main />
</App>
```

### Sound Context Refactor
The `SoundContext` currently manages audio instances but lacks dynamic volume control. We will update it to:
1.  **State**: Add `bgmVolume` (number 0-1) and `sfxVolume` (number 0-1).
2.  **Persistence**: Initialize from `localStorage` or default to `0.5` (BGM) and `1.0` (SFX).
3.  **Effect**: A `useEffect` will watch these volume states and update all `Audio` instances immediately.

```typescript
useEffect(() => {
    if (bgmRef.current) bgmRef.current.volume = isMuted ? 0 : bgmVolume;
}, [bgmVolume, isMuted]);
```

### Draggable UI
We will use `@dnd-kit/core` or `react-draggable` if available, or a simple custom hook for dragging if we want to minimize dependencies. Given the project already uses `react-dnd` (gameplay), adding `react-draggable` is a lightweight addition for this specific modal behavior, or we can use a simple absolute position with mouse event listeners if we want to avoid deps.
*Decision*: Use `react-draggable` if permissible, otherwise custom implementation. Checking package.json for existing deps.

### Localization
Existing `LanguageSwitcher` logic will be moved into `SettingsWindow`. The context `i18n` will remain the source of truth.
