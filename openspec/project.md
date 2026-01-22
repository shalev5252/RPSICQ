# RPS Battle - Strategic Rock Paper Scissors Board Game

## Purpose
A two-player online board game combining strategy with Rock-Paper-Scissors mechanics, inspired by the classic ICQ version.
**Objective**: Defeat the opponent's King using strategic piece placement and the element of surprise.

---

## Tech Stack

### Frontend (Client)
- **React 18** + **Vite** + **TypeScript**
- **Zustand** - State management (selective re-renders)
- **CSS Modules** - Scoped styling
- **Socket.IO Client** - Real-time communication
- **React DnD** - Drag & drop for setup phase

### Backend (Server)
- **Node.js** + **Express** + **TypeScript**
- **Socket.IO** - Real-time WebSocket communication

### Shared
- **TypeScript interfaces** - Common types for Piece, GameState, Cell, etc.

### Infrastructure
- **Monorepo** - Single repository with `/client`, `/server`, `/shared`
- **Deployment** - Railway (both frontend and backend)

---

## Game Specification

### 1. Game Board
- **Size**: 6 rows × 7 columns matrix (42 cells)
- **Orientation**: Each player sees their side as the bottom (close to them), like chess or checkers
- **Rows by player**:
  - Player 1 (Red): Rows 1-2 (bottom from their perspective)
  - Player 2 (Blue): Rows 5-6 (bottom from their perspective)

### 2. Game Pieces
Each player receives **14 pieces** in their color (red/blue):

| Piece Type | Quantity | Movement | Special Properties |
|------------|----------|----------|-------------------|
| 👑 King | 1 | Cannot move | Game over if captured |
| 🕳️ Pit | 1 | Cannot move | Defeats any attacker |
| 🪨 Rock | 4 | One step (up/down/left/right) | Beats Scissors |
| 📄 Paper | 4 | One step (up/down/left/right) | Beats Rock |
| ✂️ Scissors | 4 | One step (up/down/left/right) | Beats Paper |

**Total**: 28 pieces (14 × 2 players)

### 3. Setup Phase
1. **Manual Placement**: Each player places their **King** and **Pit** in their two closest rows via Drag & Drop
   - No placement restrictions, but King and Pit cannot be placed on the same cell
2. **Confirm Placement**: Click confirm button
3. **Randomization**: Click button to randomly distribute remaining pieces (4 Rock, 4 Paper, 4 Scissors) in the two rows
4. **Fog of War**: Players cannot see opponent's piece types (only color)
5. **Starting Player**: Randomly selected after both players complete setup

### 4. Victory Condition
The game ends immediately when a player's piece **attacks the opponent's King**.
- **The King automatically loses** - any piece that attacks the King wins instantly
- The attacking player wins the game

### 5. Movement Rules
- **Rock/Paper/Scissors pieces**: Can move **one step** in 4 directions only: up, down, left, or right (no diagonal movement)
- **King and Pit**: **Cannot move** from their initial position
- **Valid move conditions**:
  - ✅ Target cell is empty OR contains enemy piece
  - ✅ Target cell is within board boundaries
  - ❌ Cannot step on your own piece

### 6. Combat System
When a piece moves to a cell with an enemy piece, combat occurs:

#### Victory Table:
```
🪨 Rock      →  beats  →  ✂️ Scissors
📄 Paper     →  beats  →  🪨 Rock
✂️ Scissors  →  beats  →  📄 Paper
🕳️ Pit      →  beats  →  Any attacker (Rock/Paper/Scissors)
```

#### Tie Resolution:
1. A selection screen opens for both players
2. Each player chooses a new element (Rock/Paper/Scissors) for their piece
3. **This change is permanent** - the piece's type changes for the rest of the game
4. After both players confirm - rematch occurs
5. Process repeats until there's a winner

#### Combat Results:
- **Loser**: Piece is removed from the board
- **Winner**: 
  - Stays on the target cell
  - Receives a visual **"Halo"** effect
  - Piece type is **revealed** to opponent for the rest of the game

### 7. Fog of War Mechanics
- At game start: Players see only the **color** of enemy pieces, not the **type**
- After combat: The winning piece is **revealed** - its type is known to both sides
- **Halo** visual indicator marks pieces that won combat (and are revealed)

### 8. Turn Timer
- Each player has **2 minutes** to make a move
- A countdown clock is displayed showing remaining time for current player's turn
- **Timeout**: If a player doesn't make a move within 2 minutes, they **lose the game**

### 9. No Valid Moves (Stalemate)
- If a player's only remaining pieces are **King and Pit** (which cannot move), their turn is automatically skipped
- The turn immediately passes to the opponent
- **Draw condition**: If both players have only immovable pieces (King and Pit), the game ends in a **draw**

### 10. Disconnection Handling
- If a player disconnects mid-game, the game ends
- The remaining player is shown a prompt asking if they want to start a new game
- If they accept, they are matched with a new opponent

---

## System Architecture

### Session Management
1. Player enters website and clicks "Start Game"
2. Server searches for waiting player or creates new session
3. When two players are connected - game begins
4. Real-time communication via WebSocket (Socket.IO)

### Game State
```typescript
interface GameState {
  sessionId: string;
  phase: 'setup' | 'playing' | 'combat' | 'finished';
  currentTurn: 'red' | 'blue';
  board: Cell[][];  // 6x7 matrix
  players: {
    red: PlayerState;
    blue: PlayerState;
  };
  combatState?: CombatState;
  winner?: 'red' | 'blue';
}

interface Cell {
  row: number;
  col: number;
  piece: Piece | null;
}

interface Piece {
  id: string;
  owner: 'red' | 'blue';
  type: 'king' | 'pit' | 'rock' | 'paper' | 'scissors';
  isRevealed: boolean;
  hasHalo: boolean;
}

interface PlayerState {
  id: string;
  socketId: string;
  isReady: boolean;
  pieces: Piece[];
}

interface CombatState {
  attacker: Piece;
  defender: Piece;
  attackerChoice?: 'rock' | 'paper' | 'scissors';
  defenderChoice?: 'rock' | 'paper' | 'scissors';
  isTie: boolean;
}
```

---

## Project Conventions

### Code Style
- **Language**: TypeScript (strict mode)
- **Naming**: camelCase for functions/variables, PascalCase for components/types
- **Files**: Component files in PascalCase, other files in kebab-case
- **Comments**: English, JSDoc for public functions

### Architecture Patterns
- **Frontend**: Component-based architecture, separation of UI and Logic
- **Backend**: WebSocket events (Socket.IO)
- **State**: Centralized game state on server, Zustand store on client

### Testing Strategy
- Unit tests for game logic functions (combat resolution, movement validation)
- Integration tests for Socket.IO events
- E2E tests for complete game scenarios

### Git Workflow
- `main` - production ready
- `develop` - integration branch
- Feature branches: `feature/[feature-name]`
- Conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`

---

## UI/UX Requirements

### Game Board
- Responsive 6×7 board display
- Smooth animations for piece movement
- Highlight valid moves when selecting a piece
- Visual indicator for current turn

### Pieces
- Clear and distinct design for each type
- Bold red/blue color distinction
- "?" icon for hidden enemy pieces
- Halo animation for combat winners

### Combat Screen
- Dramatic collision animation
- Display combat result
- On tie: UI for selecting new element

### Responsive Design
- Desktop first
- Tablet support

---

## Important Constraints
- Two players only
- Requires stable internet connection
- No mid-game save (session-based)

## External Dependencies
- Socket.IO for real-time communication

---

## Future Enhancements (Out of Scope)
- [ ] User authentication system
- [ ] Leaderboard
- [ ] In-game chat
- [ ] AI opponent
- [ ] Sound effects
- [ ] Spectator mode
