# Spec Delta: Sound Effects

## MODIFIED Requirements

### Requirement: Background Music
The application MUST play background music continuously, with user-adjustable volume.

#### Scenario: Adjusting BGM Volume
- **GIVEN** the user has the settings window open
- **WHEN** the user moves the BGM volume slider
- **THEN** the background music volume changes in real-time
- **AND** the new volume preference is saved


## NEW Requirements

### Requirement: Sound Effects Volume
All non-music sound effects (movement, combat, victory/defeat) MUST obey a separate volume control.

#### Scenario: Adjusting SFX Volume
- **GIVEN** the game is in progress
- **WHEN** the user moves the SFX volume slider
- **THEN** subsequent sound effects play at the new volume level
- **AND** the new volume preference is saved
