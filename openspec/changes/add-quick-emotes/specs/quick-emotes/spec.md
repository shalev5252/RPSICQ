## ADDED Requirements

### Requirement: Emote Sending
A player SHALL be able to send a preset emote to their opponent during a PvP game.

#### Scenario: Player sends an emote
- **WHEN** the player clicks/taps an emote button during gameplay
- **THEN** the client SHALL emit `SEND_EMOTE` with `{ emoteId }`
- **AND** the server SHALL broadcast `EMOTE_RECEIVED` to the opponent with `{ emoteId, from }`

#### Scenario: Player sees their sent emote
- **WHEN** the player sends an emote
- **THEN** the player SHALL see a brief confirmation (the emote appears near their side)

### Requirement: Emote Receiving
A player SHALL see emotes sent by their opponent with a non-intrusive animation.

#### Scenario: Opponent sends an emote
- **WHEN** the opponent sends an emote
- **THEN** the receiving player SHALL see the emote displayed near the opponent's side of the board
- **AND** the emote SHALL animate in with a pop effect
- **AND** the emote SHALL fade out after 2.5 seconds

### Requirement: Emote Cooldown
Emotes SHALL have a cooldown to prevent spam.

#### Scenario: Player sends an emote and cooldown starts
- **WHEN** the player sends an emote
- **THEN** the emote buttons SHALL become disabled for 3 seconds
- **AND** a visual cooldown indicator SHALL be displayed

#### Scenario: Cooldown expires
- **WHEN** the 3-second cooldown expires
- **THEN** the emote buttons SHALL become enabled again

### Requirement: Desktop UI
The emote UI on desktop SHALL be always visible and easily accessible.

#### Scenario: Desktop user views emote bar
- **WHEN** the game is in playing or combat phase on a desktop viewport
- **THEN** an emote bar with 11 emotes SHALL be visible on the right side of the board
- **AND** each emote button SHALL be clearly labeled with its emoji
- **AND** emotes SHALL be arranged in a compact grid or row

### Requirement: Mobile UI
The emote UI on mobile SHALL be space-efficient and accessible via a toggle.

#### Scenario: Mobile user opens emote picker
- **WHEN** the user taps the emote FAB on a mobile viewport
- **THEN** a scrollable grid overlay with 11 emote buttons SHALL appear
- **AND** the overlay SHALL be positioned near the bottom of the screen

#### Scenario: Mobile user sends emote and picker closes
- **WHEN** the user taps an emote in the picker
- **THEN** the emote SHALL be sent
- **AND** the picker overlay SHALL close automatically

### Requirement: No Emotes in Singleplayer
Emotes SHALL be disabled when playing against the AI.

#### Scenario: Player in singleplayer mode
- **WHEN** the opponent type is AI
- **THEN** the emote bar/FAB SHALL NOT be displayed

### Requirement: Emote Set
The system SHALL provide exactly 11 preset emotes.

#### Scenario: Emote list contents
- **WHEN** the emote UI is displayed
- **THEN** the following emotes SHALL be available: 👍, 👏, 😂, 🤔, 🔥, 😢, 🤮, 💩, 💥, 😊, 😴
