# Tasks: Initialize RPS Battle Monorepo

## Phase 1: Monorepo Setup
1. [x] Create root `package.json` with pnpm workspaces config
2. [x] Create `pnpm-workspace.yaml`
3. [x] Create `.gitignore`

## Phase 2: Shared Package
4. [x] Create `/shared/package.json`
5. [x] Create `/shared/tsconfig.json`
6. [x] Create `/shared/types.ts` with core interfaces (GameState, Piece, Cell, etc.)
7. [x] Create `/shared/constants.ts` with game constants

## Phase 3: Server Setup
8. [x] Create `/server/package.json` with dependencies
9. [x] Create `/server/tsconfig.json`
10. [x] Create `/server/src/index.ts` with Express + Socket.IO
11. [x] Create `/server/src/socket/handlers.ts` with connection handlers

## Phase 4: Client Setup
12. [x] Initialize Vite React TypeScript project in `/client`
13. [x] Install dependencies (socket.io-client, zustand)
14. [x] Create `/client/src/hooks/useSocket.ts`
15. [x] Create `/client/src/store/gameStore.ts`
16. [x] Update `/client/src/App.tsx` with connection status

## Phase 5: Verification
17. [x] Run `pnpm install` from root (switched to npm)
18. [x] Start server with `pnpm --filter server dev` (using npm run dev:server)
19. [x] Start client with `pnpm --filter client dev` (using npm run dev:client)
20. [x] Verify Socket.IO connection in browser console
