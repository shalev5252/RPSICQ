## 1. Shared Types & Constants
- [x] 1.1 Add socket events: `OFFER_DRAW`, `DRAW_OFFERED`, `RESPOND_DRAW`, `DRAW_DECLINED`
- [x] 1.2 Add `draw_offer` to winReason type union
- [x] 1.3 Add DrawOfferPayload and DrawResponsePayload types

## 2. Server Implementation
- [x] 2.1 Add draw offer state tracking to GameSession (hasOfferedDrawThisTurn per player)
- [x] 2.2 Implement `OFFER_DRAW` handler with validation (playing phase, is current turn, hasn't offered this turn, is PvP)
- [x] 2.3 Implement `RESPOND_DRAW` handler (accept → end game as draw, decline → notify offerer)
- [x] 2.4 Reset draw offer state when turn changes
- [x] 2.5 Clear pending draw offer when turn timer expires or game ends

## 3. Client Implementation
- [x] 3.1 Add "Offer Draw" button to GameScreen (visible only when isMyTurn, isPvP, canOfferDraw)
- [x] 3.2 Create DrawOfferModal component for opponent notification
- [x] 3.3 Add socket handlers for `DRAW_OFFERED` and `DRAW_DECLINED` events
- [x] 3.4 Add draw offer state to game store (pendingDrawOffer, canOfferDraw)
- [x] 3.5 Show "Draw declined" toast/notification when opponent declines

## 4. Localization
- [x] 4.1 Add English translation keys for draw offer UI
- [x] 4.2 Add Hebrew translation keys for draw offer UI

## 5. Testing & Validation
- [x] 5.1 Build verification passed
- [ ] 5.2 Test draw offer flow in browser (offer → accept → game ends)
- [ ] 5.3 Test draw decline flow (offer → decline → can't offer again until next turn)
- [ ] 5.4 Verify draw offer button not visible in singleplayer games
- [ ] 5.5 Verify draw offer button not visible when not player's turn
