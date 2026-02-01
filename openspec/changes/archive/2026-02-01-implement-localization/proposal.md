# Proposal: Implement Localization (i18n)

## Summary
Add support for multiple languages, starting with English (EN) and Hebrew (HE).
This will be achieved by integrating `i18next` and `react-i18next`.

## Motivation
To make the game accessible to a wider audience and support the requested Hebrew localization.

## Proposed Solution
- Install `i18next` and `react-i18next`.
- Configure `i18n` instance in `client/src/i18n.ts`.
- Create translation files in `client/src/locales/en` and `client/src/locales/he`.
- Update `main.tsx` to initialize i18n.
- Replace hardcoded text with `t()` calls throughout the application.
- Add a language switcher UI.
