# localization Specification

## Purpose
TBD - created by archiving change implement-localization. Update Purpose after archive.
## Requirements
### Requirement: Support for Multiple Languages
- The application MUST support at least **English (EN)** and **Hebrew (HE)**.
- The default language SHALL be detected from the user's browser, falling back to English.
- The user MUST be able to switch languages manually.

#### Scenario: Switching to Hebrew
- **WHEN** the user selects "Hebrew" from the language switcher
- **THEN** the text content updates to Hebrew
- **THEN** the layout direction changes to Right-to-Left (RTL)

#### Scenario: Switching to English
- **WHEN** the user selects "English" from the language switcher
- **THEN** the text content updates to English
- **THEN** the layout direction changes to Left-to-Right (LTR)

### Requirement: Persistent Language Preference
- The user's selected language MUST be persisted (e.g., in localStorage) so it remains selected on reload.

#### Scenario: Reloading Page
- **WHEN** the user reloads the page after selecting Hebrew
- **THEN** the site loads in Hebrew
- **THEN** the layout remains RTL

### Requirement: Content Translation
- All user-facing text (buttons, labels, messages, status indicators) MUST be translatable.
- Dynamic data (e.g., "Player 1", "Round 5") SHALL be handled with interpolation.

#### Scenario: Translating Dynamic Text
- **WHEN** the turn indicator updates during a game
- **THEN** the text "Player X's Turn" is correctly translated

