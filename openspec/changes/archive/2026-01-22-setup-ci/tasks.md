# CI Implementation Tasks

<!-- VALIDATION: START -->
- [x] Run `npm run lint` locally to ensure clean baseline.
- [x] Run `npm run build --workspace=@rps/shared` locally.
- [x] Run `npm run build --workspace=@rps/server` locally.
- [x] Run `npm run build --workspace=@rps/client` locally.
- [x] Run `openspec validate setup-ci --strict`.
<!-- VALIDATION: END -->

## Configuration
1. [x] Create `.github/workflows/ci.yml`
    - [x] Define `shared-validation` job.
    - [x] Define `app-validation` job (needs `shared-validation`).
    - [x] Configure steps for checkout, cache, install, lint, typecheck.
2. [x] Create `coderabbit.yaml` in root.
    - [x] Configure language settings (TS/React).
    - [x] Enable high-level summary and walkthrough.
