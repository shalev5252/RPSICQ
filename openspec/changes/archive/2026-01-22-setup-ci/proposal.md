# Setup CI/CD Pipeline & Code Analysis

## Goal
Establish a robust Continuous Integration (CI) pipeline using GitHub Actions to ensure code quality and type safety across the monorepo. Additionally, integrate CodeRabbit for automated AI-driven code reviews.

## Requirements
1.  **GitHub Actions Workflow**:
    *   Trigger on push/pull requests to main/develop branches.
    *   **Phase 1**: Validate `@rps/shared` (Lint + Type Check).
    *   **Phase 2**: Validate `@rps/client` and `@rps/server` *in parallel* (Lint + Type Check), but *only* if Phase 1 passes.
2.  **CodeRabbit Integration**:
    *   Add configuration for CodeRabbit to review PRs and provide warnings/suggestions.

## Architecture
*   **Monorepo Strategy**: Use `npm --workspace` commands to isolate checks where possible, or path-based eslint arguments.
*   **Sequential Stages**: `shared` -> `client` & `server`.
