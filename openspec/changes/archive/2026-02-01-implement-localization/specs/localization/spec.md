# Spec Delta: Localization

## ADDED Requirements

### Requirement: Support for Multiple Languages
- The application MUST support at least **English (EN)** and **Hebrew (HE)**.
- The default language SHOULD be detected from the user's browser, falling back to English.
- The user MUST be able to switch languages manually.

#### Scenario: Switching to Hebrew
- GIVEN the user is on the site
- WHEN the user selects "Hebrew" from the language switcher
- THEN the text content updates to Hebrew
- AND the layout direction changes to Right-to-Left (RTL)

#### Scenario: Switching to English
- GIVEN the user is on the site
- WHEN the user selects "English" from the language switcher
- THEN the text content updates to English
- AND the layout direction changes to Left-to-Right (LTR)

### Requirement: Persistent Language Preference
- The user's selected language MUST be persisted (e.g., in localStorage) so it remains selected on reload.

#### Scenario: Reloading Page
- GIVEN the user has selected Hebrew
- WHEN the user reloads the page
- THEN the site loads in Hebrew
- AND the layout remains RTL

### Requirement: Content Translation
- All user-facing text (buttons, labels, messages, status indicators) MUST be translatable.
- Dynamic data (e.g., "Player 1", "Round 5") SHOULD be handled with interpolation.

#### Scenario: Translating Dynamic Text
- GIVEN the user is playing a game
- WHEN the turn indicator updates
- THEN the text "Player X's Turn" is correctly translated

