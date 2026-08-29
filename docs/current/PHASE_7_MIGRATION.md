# Phase 7 saved-agent migration

Phase 7 changes the user-facing TrueForge entry point, not the frozen safety contracts.

- Users select only the saved agent `secureops-guardian`.
- Saved agent ID: `01m16kjdg9xkg1hrv1x291whn8`.
- TrueForge agent names are immutable. Phase 7 therefore used `secureops-guardian_v0` during migration. After the Phase 12 release merged and the original name was no longer registered, the exact final manifest was saved as `secureops-guardian`; `_v0` was retired only after the new record passed read-back verification.
- `secureops-guardian-phase-2`, `secureops-guardian-phase-3`, and `secureops-guardian-phase-4` remain only as repository test fixtures and reference configurations for reproducing historical traces; they are not registered saved agents.
- Repository exports such as `PHASE_THREE_AGENT_SPEC`, `PHASE_FOUR_AGENT_SPEC`, and `PHASE_SIX_AGENT_SPEC` remain compatibility fixtures for existing tests. New user instructions and documentation must not ask users to select them.
- The exact Phase 2 evidence validators, Phase 3 verifier/proposal, Phase 4 approval/receipt contracts, Phase 5 reliability records, and Phase 6 presentation adapters remain controlling internal modules.

The final exported saved specification is [`exports/secureops-guardian.trueforge.json`](../../exports/secureops-guardian.trueforge.json).
