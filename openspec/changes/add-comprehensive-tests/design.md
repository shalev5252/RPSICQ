## Context

RPS Battle is a monorepo (client / server / shared) with no existing test infrastructure. The server holds all authoritative game logic (~1 900 LOC in `GameService.ts`), and the client is a React 18 + Vite + TypeScript SPA communicating via Socket.IO.

## Goals / Non-Goals

**Goals**
- Cover core game logic with fast unit tests (combat, movement, setup, victory, draw, forfeit, draw-offer, reconnection, onslaught, RPSLS)
- Validate Socket.IO event contracts with integration tests (matchmaking → setup → play → game-over round-trip)
- Provide a small but meaningful set of E2E browser tests for the critical happy path (find game, setup, make moves, game over)
- Integrate all suites into CI so every PR is validated

**Non-Goals**
- ~100 % coverage—focus on critical paths first
- Visual regression or screenshot testing
- Load / stress testing

## Decisions

### Test Runner: **Vitest** for server & shared
- TypeScript-first, near-zero config via Vite
- Alternatives: Jest (heavier TS setup, slower ESM story), Mocha (less integrated)

### E2E: **Playwright**
- Reliable multi-tab support required (two players in one test)
- Alternatives: Cypress (poor multi-browser/multi-tab), Puppeteer (no built-in assertions)

### Socket.IO integration tests use real sockets
- Spin up the server in-process, connect two `socket.io-client` instances, assert on emitted events
- Avoids mocking the entire Socket.IO layer which would reduce confidence

### Test location conventions

| Layer | Location | Runner |
|-------|----------|--------|
| Server unit tests | `server/src/__tests__/` | Vitest |
| Shared unit tests | `shared/src/__tests__/` | Vitest |
| Socket.IO integration | `server/src/__tests__/integration/` | Vitest |
| E2E browser tests | `e2e/` (root-level) | Playwright |


## Risks / Trade-offs

- **CI time**: Integration/E2E tests add ~30-60 s. Mitigated by running unit tests first and parallelising.
- **Socket test flakiness**: Real sockets may race. Mitigated by explicit `waitFor` utilities and generous timeouts.
- **E2E maintenance**: UI changes may break selectors. Mitigated by using `data-testid` attributes.

## Open Questions
- Should we add `data-testid` attributes to existing components now or defer?
  → Proposed: add only the minimal set needed for E2E tests.
