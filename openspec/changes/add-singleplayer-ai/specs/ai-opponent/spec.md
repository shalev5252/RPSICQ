## ADDED Requirements

### Requirement: AI Board Setup
The AI opponent MUST perform board setup (King/Pit placement and piece randomization) automatically when a singleplayer game session is created.

#### Scenario: AI places King and Pit strategically
- **WHEN** a singleplayer session enters the setup phase
- **THEN** the AI MUST place its King in the back row (row farthest from the human player), avoiding edge columns when possible
- **AND** the AI MUST place its Pit in a position that guards likely approach paths to the King
- **AND** the AI MUST randomize its remaining RPS pieces across its setup rows

#### Scenario: AI confirms setup automatically
- **WHEN** the AI has placed all pieces
- **THEN** the AI MUST confirm setup automatically
- **AND** the game waits only for the human player to confirm before starting

### Requirement: AI Move Selection
The AI opponent MUST select moves using a weighted evaluation system that considers positional advantage, piece tracking, and combat risk.

#### Scenario: AI evaluates and selects best move
- **WHEN** it is the AI's turn during the playing phase
- **THEN** the AI MUST evaluate all valid moves for all its movable pieces
- **AND** the AI MUST score each move based on: proximity to opponent King, protection of own King, avoidance of known Pit, board control, and combat win probability
- **AND** the AI MUST select a move from the top-scoring candidates with controlled randomness

#### Scenario: AI tracks revealed pieces
- **WHEN** a combat outcome reveals an opponent piece type
- **THEN** the AI MUST update its internal tracking of known opponent piece types
- **AND** the AI MUST use this information in future move evaluations and combat risk assessments

#### Scenario: AI avoids known Pit
- **WHEN** the AI has identified the opponent's Pit location
- **THEN** the AI MUST strongly avoid moving pieces into the Pit cell unless no other moves are available

### Requirement: AI Tie-Breaker Response
The AI opponent MUST respond to tie-breaker situations with a strategic element selection.

#### Scenario: AI selects tie-breaker element
- **WHEN** a combat tie occurs involving an AI piece
- **THEN** the AI MUST select a new element type for the tie-breaker
- **AND** the selection MUST account for known opponent piece types when available
- **AND** the AI MUST respond within the standard turn time limit

### Requirement: AI Response Timing
The AI opponent MUST introduce natural-feeling delays before executing actions to simulate human behavior.

#### Scenario: AI delays before move
- **WHEN** it is the AI's turn to act (move, setup, or tie-breaker)
- **THEN** the AI MUST wait a randomized delay between 500ms and 2000ms before executing the action

### Requirement: AI Controlled Imperfection
The AI opponent MUST occasionally make suboptimal moves to feel human-like while remaining challenging.

#### Scenario: AI introduces controlled randomness
- **WHEN** the AI selects a move
- **THEN** there MUST be a 10-20% chance of selecting a non-optimal but still valid move
- **AND** the AI MUST never deliberately lose (e.g., moving King into danger or moving into a known Pit)
