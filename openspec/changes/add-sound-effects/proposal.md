# Add Sound Effects

## Summary
Add background music and sound effects for game events (movement, battle, victory/defeat) to enhance the user experience.

## Motivation
The user requested auditory feedback to make the game more immersive.

## User Experience Flow
- **Background Music**: Plays continuously (looping) while the user is on the site.
- **Game Start**: Specific move sound ("move1.mp3" or "move2.mp3") is assigned to the player (and opponent).
- **Movement**: When a piece moves, its owner's assigned sound plays.
- **Battle/Tie**: "battle.mp3" plays when a piece attacks or ties.
- **Game Over**: "winner.mp3" plays for the winner, "looser.mp3" for the loser.

## Scope
- **In Scope**:
    - `client/src/assets/sounds/` directory creation.
    - `SoundContext` / `SoundManager` for handling audio playback.
    - Integration with `GameScreen` for movement/battle sounds.
    - Integration with `GameOverScreen` for result sounds.
    - Volume control (optional but good practice, though not explicitly requested, "calm background music" implies unobtrusive). I'll stick to fixed volume for now unless requested, or simple mute toggle if easy. *User didn't ask for toggle, but autoplay policies might block audio.* I'll assume standard auto-play handling (user interaction required).
- **Out of Scope**:
    - Advanced audio settings (volume sliders).
    - Dynamic music changing based on game state (unless implied by "calm background music").

## Related Specs
- None directly, but touches `game-screen` and `game-over` flows.
