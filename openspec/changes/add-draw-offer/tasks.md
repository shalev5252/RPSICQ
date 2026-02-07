## 1. Shared Types & Constants
- [ ] 1.1 Add socket events: `OFFER_DRAW`, `DRAW_OFFERED`, `RESPOND_DRAW`, `DRAW_DECLINED`
- [ ] 1.2 Add `draw_offer` to winReason type union
- [ ] 1.3 Add DrawOfferPayload and DrawResponsePayload types

## 2. Server Implementation
- [ ] 2.1 Add draw offer state tracking to GameSession (hasOfferedDrawThisTurn per player)
- [ ] 2.2 Implement `OFFER_DRAW` handler with validation (playing phase, is current turn, hasn't offered this turn, is PvP)
- [ ] 2.3 Implement `RESPOND_DRAW` handler (accept → end game as draw, decline → notify offerer)
- [ ] 2.4 Reset draw offer state when turn changes
- [ ] 2.5 Clear pending draw offer when turn timer expires or game ends

## 3. Client Implementation
- [ ] 3.1 Add "Offer Draw" button to GameScreen (visible only when isMyTurn, isPvP, canOfferDraw)
- [ ] 3.2 Create DrawOfferModal component for opponent notification
- [ ] 3.3 Add socket handlers for `DRAW_OFFERED` and `DRAW_DECLINED` events
- [ ] 3.4 Add draw offer state to game store (pendingDrawOffer, canOfferDraw)
- [ ] 3.5 Show "Draw declined" toast/notification when opponent declines

## 4. Localization
- [ ] 4.1 Add English translation keys for draw offer UI
- [ ] 4.2 Add Hebrew translation keys for draw offer UI

## 5. Testing & Validation
- [ ] 5.1 Test draw offer flow in browser (offer → accept → game ends)
- [ ] 5.2 Test draw decline flow (offer → decline → can't offer again until next turn)
- [ ] 5.3 Verify draw offer button not visible in singleplayer games
- [ ] 5.4 Verify draw offer button not visible when not player's turn
