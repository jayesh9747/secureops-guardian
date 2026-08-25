# Phase 7 saved-agent migration

Phase 7 changes the user-facing TrueForge entry point, not the frozen safety contracts.

- Users select only the saved agent `secureops-guardian_v0`.
- Saved agent ID: `01m0w6s2eyqtzyb6q4y6ppsta9`.
- TrueForge agent names are immutable. The prior `secureops-guardian` record, ID `01m0vvphezaejvtcxgf9z972ed`, remains saved so its existing reference sessions keep resolving; `secureops-guardian_v0` carries the same manifest for new sessions.
- `secureops-guardian-phase-2`, `secureops-guardian-phase-3`, and `secureops-guardian-phase-4` remain saved only as test fixtures and reference configurations for reproducing historical traces.
- Repository exports such as `PHASE_THREE_AGENT_SPEC`, `PHASE_FOUR_AGENT_SPEC`, and `PHASE_SIX_AGENT_SPEC` remain compatibility fixtures for existing tests. New user instructions and documentation must not ask users to select them.
- The exact Phase 2 evidence validators, Phase 3 verifier/proposal, Phase 4 approval/receipt contracts, Phase 5 reliability records, and Phase 6 presentation adapters remain controlling internal modules.

The final exported saved specification is [`exports/secureops-guardian.trueforge.json`](../../exports/secureops-guardian.trueforge.json).
