# Change: Add Comprehensive Test Suite

## Why
The project currently has **zero tests**—no test framework installed, no unit tests, no integration tests, no E2E tests. This makes every change risky and regressions invisible until a user hits them. A layered testing strategy will lock in correctness across the server game logic, Socket.IO integration, and client UX.

## What Changes
- Install **Vitest** as the unified test runner (server + shared; optionally client unit tests)
- Install **Playwright** for browser-based E2E tests
- Add **server unit tests** covering `GameService`, `MatchmakingService`, `RoomService`, and combat/movement logic
- Add **Socket.IO integration tests** verifying the full multiplayer event flow via real sockets
- Add **E2E tests** simulating two-player sessions through Setup → Play → Game Over in the browser
- Add npm scripts (`test`, `test:unit`, `test:integration`, `test:e2e`) to the root and per-workspace `package.json`
- Update CI (`ci.yml`) to run the new test suites

## Impact
- Affected specs: `ci` (add test step to pipeline)
- Affected code: `package.json` (root, server, client), CI workflow, new `__tests__/` directories under `server/src/` and `client/`
- No breaking changes—purely additive
