# mobile-ui Specification

## Purpose
Define UI requirements for mobile device support, ensuring the game is playable on smartphones in portrait orientation.

## ADDED Requirements

### Requirement: Responsive Board Sizing
The game board MUST adapt its size to fit within the mobile screen width.

#### Scenario: Board on mobile viewport
**Given** a mobile device with screen width ≤ 767px
**When** viewing the game board
**Then** the board fills the available width with appropriate padding
**And** all 7 columns are visible without horizontal scrolling

#### Scenario: Cell size adapts to screen
**Given** a mobile device with 375px screen width
**When** viewing the game board
**Then** each cell is approximately (375px - padding) / 7 ≈ 51px

---

### Requirement: Mobile Setup Layout
The setup screen MUST display elements in a mobile-friendly vertical layout.

#### Scenario: Setup screen on mobile
**Given** a mobile device in portrait orientation
**When** viewing the setup screen
**Then** the layout is stacked vertically: status → board → tray/buttons

#### Scenario: Tray below board on mobile
**Given** a mobile device viewing the setup screen
**When** King and Pit have not been placed
**Then** the piece tray appears below the board

#### Scenario: Buttons replace tray after placement
**Given** a mobile device viewing the setup screen
**When** King and Pit have been placed
**Then** the tray is replaced with Shuffle and Start buttons

---

### Requirement: Mobile Game Layout
The game screen MUST display turn information prominently above the board on mobile.

#### Scenario: Turn indicator above board
**Given** a mobile device viewing the game screen
**When** the game is in progress
**Then** the turn indicator ("Your Turn" / "Opponent's Turn") appears above the board

#### Scenario: Board fills mobile width
**Given** a mobile device viewing the game screen
**When** the board is displayed
**Then** the board occupies the full available width

---

### Requirement: Touch Compatibility
The game MUST be playable using touch inputs on mobile devices.

#### Scenario: Click-to-move on touch
**Given** a mobile device with touch screen
**When** tapping on a piece, then double-tapping a valid destination
**Then** the move is executed correctly

#### Scenario: Drag on touch
**Given** a mobile device with touch screen
**When** performing a touch-and-drag gesture on a piece
**Then** the piece can be dragged to a valid destination

---

### Requirement: Minimum Touch Target Size
Interactive elements MUST be at least 44px to meet Apple Human Interface Guidelines.

#### Scenario: Cell touch target
**Given** a mobile device with minimum supported screen width (375px)
**When** cells are rendered
**Then** each cell is at least 44px in size

---
