## MODIFIED Requirements

### Requirement: Server Socket.IO setup
The server SHALL create a Socket.IO instance attached to an Express HTTP server with tightened ping settings for faster disconnect detection: `pingInterval: 10000` (10s) and `pingTimeout: 15000` (15s).

#### Scenario: Server starts successfully
- **GIVEN** the server source files exist
- **WHEN** the user runs the server dev script
- **THEN** the server starts on the configured port
- **AND** Socket.IO is ready to accept connections
- **AND** Socket.IO is configured with `pingInterval: 10000` and `pingTimeout: 15000`
