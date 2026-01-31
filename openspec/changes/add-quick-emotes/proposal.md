# Change: Add quick-chat emotes during gameplay

## Why
Players want a lightweight way to communicate with their opponent during a game without a full chat system. Quick emotes (preset emoji reactions) provide a fun, friendly, and low-friction way to interact, celebrate, or playfully taunt without the moderation overhead of free-form text. This feature is especially important for mobile users, where typing is cumbersome.

## What Changes
- **Emote system (feature)**: Add a set of preset emote buttons visible during gameplay (PvP only). When a player taps/clicks an emote, the opponent sees the emote displayed near the sender's side of the board with a brief animation. Emotes support:
  - 11 preset reactions: 👍, 👏, 😂, 🤔, 🔥, 😢, 🤮, 💩, 💥, 😊, 😴
  - A cooldown (e.g., 3 seconds) to prevent spam.
  - Desktop: a collapsible emote bar at the edge of the game screen; click to send.
  - Mobile: a floating action button (FAB) that opens an emote picker overlay.
- **Socket events**: `SEND_EMOTE` (client → server), `EMOTE_RECEIVED` (server → opponent).
- **UI component**: `EmoteBar` / `EmotePicker` component integrated into `GameScreen`.
- **No AI emotes**: Emotes are disabled in singleplayer (AI) mode.

## Impact
- New spec: `specs/quick-emotes/spec.md`
- Affected code:
  - **Shared**: `constants.ts` (new events), `types.ts` (emote payload)
  - **Server**: `handlers.ts` (handle `SEND_EMOTE`, broadcast to opponent)
  - **Client**: `GameScreen.tsx`, new `EmoteBar.tsx`/`EmotePicker.tsx`, `useSocket.ts`, `gameStore.ts` (emote state), i18n files
