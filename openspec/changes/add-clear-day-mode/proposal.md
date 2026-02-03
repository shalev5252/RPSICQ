# Change: Add Clear Day Game Variant

## Why
Players want a strategic game mode where all pieces are visible from the start. This removes the fog of war element, enabling pure tactical gameplay based on piece positioning rather than hidden information.

## What Changes
- Add `GameVariant` type with `'standard' | 'clearday'` values
- Add variant selection UI on mode select screen
- Add server logic to reveal all pieces when game transitions to playing phase
- Add visual indicator (☀️) when Clear Day is active

## Impact
- Affected specs: clear-day-mode (new capability)
- Affected code: shared/types.ts, GameService.ts, MatchmakingService.ts, client components
