# Design: Localization Architecture

## Library Choice
Using `i18next` and `react-i18next` as requested and due to their popularity and robustness in the React ecosystem.

## File Structure
We will colocate translations or keep them in a dedicated locales directory.
Proposed structure:
```
client/src/
  locales/
    en/
      translation.json
    he/
      translation.json
  i18n.ts  <-- Initialization logic
```

## Language Detection
- Default to English if no language is detected.
- Detect browser language.
- Persist selection in localStorage.

## RTL Support
- Hebrew is RTL. We need to handle `dir="rtl"` on the `html` or `body` tag when Hebrew is selected.
- `i18next` provides `dir()` helper, or we can simply toggle a class/attribute on the root element.

## Components to Update
- `App.tsx`: Header (Title)
- `MatchmakingScreen.tsx`: Text for "Find Match", "Searching..."
- `SetupScreen.tsx`: "Place your pieces", "Confirm", "Randomize"
- `GameScreen.tsx`: Turn indicators, Combat messages
- `GameOverScreen.tsx`: "You Win", "You Lose", "Play Again"
- Any other text-heavy components.
