# RASD API Specification

The typed API is exposed under the tRPC gateway and is versioned conceptually as `/api/v1`. `rasd.overview` is protected and returns scoped operational indicators. `rasd.intakeEvent` is administrator-only, validates the event contract, creates a correlation ID when absent, and rejects duplicate event IDs through the persistence layer.
