## ADDED Requirements

### Requirement: Classic Tic Tac Toe Rules
The system MUST implement standard 3×3 Tic Tac Toe where two players (X and O) alternate turns placing their mark on an empty cell. The first player to complete a row, column, or diagonal of three marks wins. If all 9 cells are filled with no winner, the game ends in a draw.

#### Scenario: Player places a mark
- **WHEN** it is a player's turn
- **AND** they select an empty cell on the 3×3 board
- **THEN** their mark (X or O) is placed on that cell
- **AND** the turn passes to the other player

#### Scenario: Win by completing a line
- **WHEN** a player completes 3 marks in a row, column, or diagonal
- **THEN** that player wins the game immediately
- **AND** the winning line is highlighted on the board

#### Scenario: Draw when board is full
- **WHEN** all 9 cells are filled and no player has 3 in a line
- **THEN** the game ends in a draw

### Requirement: Tic Tac Toe Mode Selection
The Tic Tac Toe game MUST present a mode-selection screen offering: "Play Online" (multiplayer) and "Play vs Computer" (single-player with AI). An "Ultimate Tic Tac Toe" option SHALL be displayed as "Coming Soon" and be non-interactive.

#### Scenario: Mode selection screen
- **WHEN** a player selects Tic Tac Toe from the portal
- **THEN** they see three options: "Play Online", "Play vs Computer", and "Ultimate (Coming Soon)"
- **AND** "Ultimate (Coming Soon)" is visually disabled and not clickable

#### Scenario: Selecting Play Online
- **WHEN** a player clicks "Play Online"
- **THEN** they enter the Tic Tac Toe matchmaking queue

#### Scenario: Selecting Play vs Computer
- **WHEN** a player clicks "Play vs Computer"
- **THEN** they see a difficulty selection screen with Easy, Medium, and Hard options

### Requirement: Tic Tac Toe Online Multiplayer
The system MUST support online 2-player Tic Tac Toe using the existing Socket.IO and matchmaking infrastructure. Players are randomly assigned X (first turn) or O.

#### Scenario: Online match found
- **WHEN** two players are in the Tic Tac Toe matchmaking queue
- **THEN** the server creates a session, randomly assigns X and O, and starts the game
- **AND** both players see the empty 3×3 board with X playing first

#### Scenario: Turn enforcement
- **WHEN** a player attempts to place a mark and it is not their turn
- **THEN** the action is rejected and no mark is placed

### Requirement: Tic Tac Toe AI Opponent
The system MUST provide an AI opponent for single-player Tic Tac Toe with three difficulty levels: Easy, Medium, and Hard.

#### Scenario: Easy AI
- **WHEN** the player selects Easy difficulty
- **THEN** the AI chooses moves randomly from available empty cells

#### Scenario: Medium AI
- **WHEN** the player selects Medium difficulty
- **THEN** the AI uses Minimax search at limited depth with a 30% chance of choosing a suboptimal move
- **AND** the AI provides a moderate challenge without being unbeatable

#### Scenario: Hard AI
- **WHEN** the player selects Hard difficulty
- **THEN** the AI uses full Minimax with alpha-beta pruning
- **AND** the AI never loses (optimal play results in a draw or AI win)

### Requirement: Tic Tac Toe Game Over and Rematch
The system MUST display a game-over screen after a win or draw, showing the result and offering a rematch option (following the same pattern as RPS Battle).

#### Scenario: Game over — win
- **WHEN** a player wins
- **THEN** the game-over screen shows "X Wins!" or "O Wins!" with the winning line highlighted
- **AND** a "Rematch" button is available

#### Scenario: Game over — draw
- **WHEN** the game ends in a draw
- **THEN** the game-over screen shows "Draw!" and a "Rematch" button is available

#### Scenario: Rematch in multiplayer
- **WHEN** both players click "Rematch" in an online game
- **THEN** a new game starts with the previous O player now playing X (alternating first player)

#### Scenario: Rematch vs AI
- **WHEN** the player clicks "Rematch" in a single-player game
- **THEN** a new game starts immediately with the same difficulty level
