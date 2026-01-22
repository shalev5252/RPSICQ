# Design: Initialize RPS Battle Monorepo

## Architecture Overview

```
rps/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── index.css
│   │   ├── hooks/
│   │   │   └── useSocket.ts
│   │   └── store/
│   │       └── gameStore.ts
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── index.ts
│   │   └── socket/
│   │       └── handlers.ts
│   ├── package.json
│   └── tsconfig.json
│
├── shared/                 # Shared Types
│   ├── types.ts
│   ├── constants.ts
│   ├── package.json
│   └── tsconfig.json
│
├── package.json            # Root workspace config
├── pnpm-workspace.yaml     # pnpm workspace definition
└── .gitignore
```

## Key Decisions

### 1. Package Manager: pnpm
- Efficient disk space usage (symlinks)
- Great monorepo support with workspaces
- Fast installation

### 2. Shared Package
The `/shared` package contains:
- TypeScript interfaces (GameState, Piece, Cell, etc.)
- Constants (BOARD_ROWS, BOARD_COLS, etc.)
- Imported by both client and server

### 3. Socket.IO Setup
- Server creates HTTP server + Socket.IO instance
- Client connects on mount with `useSocket` hook
- Basic connection/disconnection logging

### 4. Zustand Store
- Minimal initial store with connection status
- Will be expanded with game state later

## Dependencies

### Client
- react, react-dom
- vite, @vitejs/plugin-react
- typescript
- socket.io-client
- zustand

### Server
- express
- socket.io
- typescript, ts-node, tsx
- @types/express
