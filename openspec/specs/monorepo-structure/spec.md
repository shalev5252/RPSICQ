# monorepo-structure Specification

## Purpose
TBD - created by archiving change init-project. Update Purpose after archive.
## Requirements
### Requirement: Root workspace configuration
The project SHALL have a root `package.json` with pnpm workspaces configuration pointing to client, server, and shared packages.

#### Scenario: pnpm install from root
Given the user is in the project root
When they run `pnpm install`
Then all dependencies for client, server, and shared are installed
And symlinks are created for workspace packages

### Requirement: Workspace packages
The project SHALL contain three workspace packages: `/client`, `/server`, and `/shared`.

#### Scenario: Package structure
Given the monorepo is initialized
Then `/client/package.json` exists with name "@rps/client"
And `/server/package.json` exists with name "@rps/server"
And `/shared/package.json` exists with name "@rps/shared"

### Requirement: Shared types import
Both client and server packages SHALL be able to import types from the shared package.

#### Scenario: Import shared types in client
Given the client package references "@rps/shared"
When a component imports from "@rps/shared"
Then TypeScript resolves the types correctly

