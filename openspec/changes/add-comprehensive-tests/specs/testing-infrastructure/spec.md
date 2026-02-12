## ADDED Requirements

### Requirement: Test Runner Configuration
The project SHALL use Vitest as the test runner for server and shared packages, and Playwright for browser-based E2E tests.

#### Scenario: Vitest runs server unit tests
- **WHEN** `npm run test:unit` is executed from the root
- **THEN** Vitest discovers and runs all `*.test.ts` files under `server/src/__tests__/` and `shared/src/__tests__/`

#### Scenario: Playwright runs E2E tests
- **WHEN** `npm run test:e2e` is executed from the root
- **THEN** Playwright discovers and runs all `*.spec.ts` files under `e2e/`

### Requirement: Test Script Convention
The project SHALL provide standardised npm scripts for running different test layers.

#### Scenario: Available test scripts
- **WHEN** inspecting the root `package.json`
- **THEN** the scripts `test`, `test:unit`, `test:integration`, and `test:e2e` SHALL be defined

### Requirement: Data Test ID Attributes
Key interactive UI elements SHALL include `data-testid` attributes to support reliable E2E selectors.

#### Scenario: Core game actions have test IDs
- **WHEN** rendering the Setup, Game, or Game Over screens
- **THEN** primary buttons (confirm setup, randomise, rematch) and board cells SHALL have unique `data-testid` attributes
