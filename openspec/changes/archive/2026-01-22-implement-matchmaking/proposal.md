# Implement Matchmaking System

## Summary
Implement a basic matchmaking system where players can join a queue and be randomly paired with another waiting player to start a game session.

## Problem Statement
Currently, the system has placeholder socket handlers but no actual logic to pair players. We need a way to connect two users into a shared game context so they can play against each other.

## Goals
- Allow players to join a matchmaking queue.
- Automatically pair two waiting players.
- create a unique game session and assign roles (Red/Blue).
- Notify players when a match is found.
- Handle player disconnection while in queue.

## Non-Goals
- Elo/Skill-based matchmaking (random for now).
- Private rooms/invites (future scope).
- Persisting game state to database (in-memory for now, as per "No mid-game save" constraint).

## Implementation Strategy
1.  **Backend**:
    -   Implement a simple in-memory queue in `MatchmakingService`.
    -   Handle `JOIN_QUEUE` and `LEAVE_QUEUE` events.
    -   When queue size >= 2, pop two players, create a session, and emit `GAME_FOUND`.
    -   Update `socket/handlers.ts` to use the service.
2.  **Frontend**:
    -   Add a "Find Game" button.
    -   Show a "Waiting for opponent..." state.
    -   Handle `GAME_FOUND` event to transition to the game setup screen.

## Risks
- **Concurrency**: Race conditions when popping from queue (single-threaded Node.js helps, but need to be careful with async if any).
- **Zombies**: Players disconnecting without explicit leave event (need to handle socket disconnect).

