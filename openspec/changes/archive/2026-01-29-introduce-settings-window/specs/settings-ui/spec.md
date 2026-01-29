# Spec: Settings UI

## ADDED Requirements

### Requirement: Settings Access
The user MUST be able to access global game settings from the application header at any time.

#### Scenario: Opening Settings
- **GIVEN** the user is on any screen (Lobby, Setup, Game, Game Over)
- **WHEN** the user clicks the "Settings" (gear) button in the header
- **THEN** the Settings Window appears
- **AND** the window floats above other content

### Requirement: Movable Settings Window
The Settings Window MUST be a movable (draggable) panel to allow users to uncover game information if needed.

#### Scenario: Dragging Window
- **GIVEN** the Settings Window is open
- **WHEN** the user drags the window header
- **THEN** the window moves with the cursor
- **AND** the window remains within the viewport bounds

### Requirement: Consolidated Controls
The Settings Window MUST contain controls for all global configurations.

#### Scenario: Switching Language from Settings
- **GIVEN** the Settings Window is open
- **WHEN** the user changes the language selection
- **THEN** the application language updates immediately (as defined in `localization` spec)

#### Scenario: Content Organization
- **THEN** the window contains sections for:
  - Language Settings (En/He)
  - Sound Settings (BGM Slider, SFX Slider)
