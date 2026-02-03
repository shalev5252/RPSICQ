# Design

## Forfeit Flow

1.  **UI Trigger**: User clicks "Give Up" button (visible in Setup and Game screens).
    - Ref: `SetupScreen` -> [ui/components/setup/SetupScreen.tsx](file:///Users/shalevshasha/rps/client/src/components/setup/SetupScreen.tsx)
    - Ref: `GameScreen` -> [ui/components/game/GameScreen.tsx](file:///Users/shalevshasha/rps/client/src/components/game/GameScreen.tsx)
2.  **Confirmation**: A modal appears: "Are you sure you want to forfeit the game?" (Yes/No).
    - Ref: `ConfirmationModal` -> [ui/components/common/ConfirmationModal.tsx](file:///Users/shalevshasha/rps/client/src/components/common/ConfirmationModal.tsx)
    - Spec: [specs/game-control/spec.md:Requirement: Forfeit Confirmation](file:///Users/shalevshasha/rps/openspec/changes/implement-forfeit-option/specs/game-control/spec.md#L18)
3.  **Action**:
    -   If "Yes": Client emits `FORFEIT_GAME` event.
        - Ref: `useSocket.ts` -> [ui/hooks/useSocket.ts](file:///Users/shalevshasha/rps/client/src/hooks/useSocket.ts)
    -   If "No": Modal closes.
4.  **Server Logic**:
    -   Server receives `FORFEIT_GAME`.
        - Ref: `socket/handlers.ts` -> [server/socket/handlers.ts](file:///Users/shalevshasha/rps/server/src/socket/handlers.ts)
    -   Server identifies the session and the other player.
    -   Server marks game as `finished`.
        - Ref: `GameService.forfeitGame` -> [server/services/GameService.ts](file:///Users/shalevshasha/rps/server/src/services/GameService.ts)
    -   Winner: Opponent.
    -   Win Reason: `forfeit`.
    -   Server emits `GAME_OVER` to both players.
        - Ref: `SOCKET_EVENTS.GAME_OVER`
5.  **Client Handling**:
    -   **Forfeiter**: Receives `GAME_OVER` (reason: `forfeit`). Shows "You Lost" screen (custom message "You forfeited").
    -   **Opponent**: Receives `GAME_OVER` (reason: `forfeit`). Shows "You Won!" screen (custom message "Opponent forfeited").
    -   **Both**: The standard "Rematch" / "New Game" / "Home" buttons are available.
    - Ref: `GameOverScreen` -> [ui/components/game/GameOverScreen.tsx](file:///Users/shalevshasha/rps/client/src/components/game/GameOverScreen.tsx)

## Components

-   `ConfirmationModal`: New or reused modal. -> [ui/components/common/ConfirmationModal.tsx](file:///Users/shalevshasha/rps/client/src/components/common/ConfirmationModal.tsx)
-   `SetupScreen`: Add button (top right or bottom controls). -> [ui/components/setup/SetupScreen.tsx](file:///Users/shalevshasha/rps/client/src/components/setup/SetupScreen.tsx)
-   `GameScreen`: Add button (top header). -> [ui/components/game/GameScreen.tsx](file:///Users/shalevshasha/rps/client/src/components/game/GameScreen.tsx)
-   `GameOverScreen`: Ensure text reflects forfeit reason. -> [ui/components/game/GameOverScreen.tsx](file:///Users/shalevshasha/rps/client/src/components/game/GameOverScreen.tsx)

## socket Events

-   `FORFEIT_GAME` (Client -> Server): No payload (socket ID identifies player). -> [server/socket/handlers.ts](file:///Users/shalevshasha/rps/server/src/socket/handlers.ts)
-   `GAME_OVER` (Server -> Client): Existing event. Reason added: `forfeit`. -> [server/socket/handlers.ts](file:///Users/shalevshasha/rps/server/src/socket/handlers.ts)

## Navigation
Standard Game Over navigation applies. Players can choose to rematch or return to menu.
