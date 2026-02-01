## Context
The game currently has no in-game communication between players. Players can only interact through gameplay moves. A lightweight emote system allows players to send quick preset reactions to opponents during PvP games, adding a social element without the moderation complexity of free-form chat.

## Goals / Non-Goals
- **Goals:**
  - Allow players to send preset emoji reactions during gameplay
  - Ensure responsive UI for both desktop and mobile
  - Prevent emote spam with a cooldown mechanism
- **Non-Goals:**
  - Free-form text chat (out of scope)
  - Custom emotes or user-uploaded images
  - Emote sounds or voice messages
  - Emotes in singleplayer mode (no AI emotes)

## Decisions

### 1. Emote Set
- **Decision:** Provide 14 preset emotes: 👍 (thumbs up), 👏 (clap), 😂 (laughing), 🤔 (thinking), 🔥 (fire), 😢 (sad), 🤮 (vomit), 💩 (poop), 💥 (explosion), 😊 (smiling), 😴 (tired), 😈 (devil), 🙏 (pray), 😇 (angel). These cover a wide range of expressive reactions.
- **Alternatives considered:**
  - 6 emotes only → expanded per user request for more variety.
  - Custom text messages → rejected, requires moderation.

### 2. UI Placement
- **Decision:**
  - **Desktop**: A horizontal emote bar on the right side of the game board, always visible but compact. Clicking an emote sends it immediately.
  - **Mobile**: A floating action button (FAB) in the bottom-right corner. Tapping opens a scrollable emote grid overlay with all 11 emotes. Tapping an emote sends it and closes the overlay.
- **Rationale:** Desktop has more screen real estate; mobile needs a space-saving toggle.
- **Alternatives considered:**
  - Bottom toolbar for both → rejected, takes space from mobile board.
  - Hold-to-reveal on mobile → rejected, less discoverable.

### 3. Emote Display
- **Decision:** When an emote is received, display it as a floating bubble near the opponent's side of the board (top area) with a pop-in animation. The emote fades out after 2.5 seconds.
- **Rationale:** Non-intrusive but visible. Does not block gameplay.

### 4. Spam Prevention
- **Decision:** A 3-second cooldown per player after sending an emote. The emote buttons are disabled (grayed out) during cooldown. A subtle cooldown indicator shows remaining time.
- **Alternatives considered:**
  - Rate limit on server only → rejected, better UX to show cooldown on client.
  - No cooldown → rejected, spam risk.

### 5. Socket Architecture
- **Decision:**
  - Client emits `SEND_EMOTE` with `{ emoteId: string }`.
  - Server validates cooldown (optional server-side enforcement), then broadcasts `EMOTE_RECEIVED` with `{ emoteId: string, from: 'red' | 'blue' }` to the opponent.
- **Rationale:** Simple relay. The server doesn't need to store emote history.

### 6. AI Mode
- **Decision:** Emotes are hidden in singleplayer mode. AI does not send emotes.
- **Rationale:** No point in sending emotes to a bot.

## Risks / Trade-offs
- **Emote abuse:** With only 14 preset, curated emotes (14 in current implementation), the risk of offensive content is minimal. If issues arise, individual emotes can be removed or we can add a "mute emotes" option in settings.
- **Distraction:** Emotes appear for 2.5s and do not block input, so gameplay impact is minimal.

## Open Questions
- None; requirements are clear.
