# tie-breaker-ux Specification

## Purpose
Fix tie-breaker modal title to correctly distinguish between first tie and subsequent ties.

## ADDED Requirements

### Requirement: Tie-Breaker Modal Display
The tie-breaker modal SHALL accurately indicate whether this is the first tie or a retry.

#### Scenario: First tie in combat shows correct title
- **GIVEN** a combat results in a tie
- **AND** this is the first tie for this combat encounter
- **WHEN** the tie-breaker modal is displayed
- **THEN** the title shows "It's a Tie!"
- **AND** no "again" indication appears

#### Scenario: Retry tie shows again title
- **GIVEN** both players have chosen elements in tie-breaker
- **AND** their choices result in another tie
- **WHEN** the tie-breaker modal resets
- **THEN** a "It's a tie again!" message is shown for 2 seconds
- **AND** then the selection UI reappears

#### Scenario: Tie-breaker state resets for new combat
- **GIVEN** a previous combat had ties
- **AND** that combat was resolved
- **WHEN** a new combat results in a tie
- **THEN** the modal shows "It's a Tie!" (not "again")
- **AND** the retry counter starts fresh
