# Design

## Forfeit Flow

1.  **UI Trigger**: User clicks "Give Up" button (visible in Setup and Game screens).
2.  **Confirmation**: A modal appears: "Are you sure you want to forfeit the game?" (Yes/No).
3.  **Action**:
    -   If "Yes": Client emits `FORFEIT_GAME` event.
    -   If "No": Modal closes.
4.  **Server Logic**:
    -   Server receives `FORFEIT_GAME`.
    -   Server identifies the session and the other player.
    -   Server marks game as `finished`.
    -   Winner: Opponent.
    -   Win Reason: `forfeit`.
    -   Server emits `GAME_OVER` to both players.
5.  **Client Handling**:
    -   **Forfeiter**: Receives `GAME_OVER` (reason: `forfeit`). Shows "You Lost" screen (custom message "You forfeited").
    -   **Opponent**: Receives `GAME_OVER` (reason: `forfeit`). Shows "You Won!" screen (custom message "Opponent forfeited").
    -   **Both**: The standard "Rematch" / "New Game" / "Home" buttons are available.

## Components

-   `ConfirmationModal`: New or reused modal.
-   `SetupScreen`: Add button (top right or bottom controls).
-   `GameScreen`: Add button (top header).
-   `GameOverScreen`: Ensure text reflects forfeit reason.

## socket Events

-   `FORFEIT_GAME` (Client -> Server): No payload (socket ID identifies player).
-   `GAME_OVER` (Server -> Client): Existing event. Reason added: `forfeit`.

## Navigation
Standard Game Over navigation applies. Players can choose to rematch or return to menu.
