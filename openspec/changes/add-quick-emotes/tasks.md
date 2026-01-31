## 1. Shared: Add socket events and types
- [x] 1.1 Add `SEND_EMOTE` and `EMOTE_RECEIVED` to `shared/src/constants.ts:SOCKET_EVENTS`
- [x] 1.2 Add `EmoteId` type (string literal union: 'thumbs_up' | 'clap' | 'laugh' | 'think' | 'fire' | 'sad' | 'vomit' | 'poop' | 'explosion' | 'smile' | 'tired') to `shared/src/types.ts`
- [x] 1.3 Add `SendEmotePayload` and `EmoteReceivedPayload` interfaces to `shared/src/types.ts`

## 2. Server: Handle emote relay
- [x] 2.1 In `server/src/socket/handlers.ts`, add handler for `SEND_EMOTE` event
  - Validate player is in an active PvP session
  - Emit `EMOTE_RECEIVED` to opponent socket with `{ emoteId, from: playerColor }`
- [x] 2.2 (Optional) Add server-side cooldown enforcement to prevent rapid emote spam

## 3. Client: State and socket listeners
- [x] 3.1 Add emote-related state to `client/src/store/gameStore.ts`: `receivedEmote: { emoteId: EmoteId, from: PlayerColor } | null`, `emoteCooldown: boolean`
- [x] 3.2 Add `setReceivedEmote`, `clearReceivedEmote`, `setEmoteCooldown` actions
- [x] 3.3 In `client/src/hooks/useSocket.ts`, add listener for `EMOTE_RECEIVED` → update store
- [x] 3.4 Add `sendEmote(emoteId)` emitter function in `useSocket.ts`

## 4. Client: Emote UI components
- [ ] 4.1 Create `client/src/components/game/EmoteBar.tsx` for desktop
  - Render 6 emote buttons horizontally
  - Handle click to call `sendEmote()`
  - Show cooldown indicator (disabled state + timer)
- [ ] 4.2 Create `client/src/components/game/EmotePicker.tsx` for mobile
  - FAB button to toggle overlay
  - Overlay with 6 emote buttons
  - Close on selection or tap outside
- [ ] 4.3 Create `client/src/components/game/EmoteDisplay.tsx`
  - Render received emote as a floating bubble near opponent's side
  - Pop-in animation, fade-out after 2.5s

## 5. Client: Integration into GameScreen
- [ ] 5.1 In `client/src/components/game/GameScreen.tsx`:
  - Import and render `EmoteBar` (desktop) or `EmotePicker` (mobile) conditionally based on viewport width
  - Render `EmoteDisplay` when `receivedEmote` is set
  - Hide emote UI when `opponentType === 'ai'`
- [ ] 5.2 Add CSS styles in `client/src/components/game/GameScreen.css` / new `Emote.css`

## 6. Client: Responsive viewport detection
- [ ] 6.1 Add a simple viewport width hook or use CSS media queries to switch between `EmoteBar` and `EmotePicker`

## 7. i18n
- [ ] 7.1 Add emote labels/alt-text to `client/src/locales/en/translation.json` and `he/translation.json`

## 8. Verification
- [ ] 8.1 Manual test: Open two browser windows, start PvP game, send emote from one, verify it appears on opponent's screen
- [ ] 8.2 Manual test: Verify cooldown disables buttons for 3 seconds after sending
- [ ] 8.3 Manual test: Verify emote UI is hidden in singleplayer mode
- [ ] 8.4 Manual test: Verify mobile FAB picker works on narrow viewport (use browser dev tools)
