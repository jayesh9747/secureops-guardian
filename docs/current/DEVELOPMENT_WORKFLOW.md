# Development and Qodo workflow

## Branches

`main` contains the approved product contract, execution plans, and code that has passed its phase gate. Each implementation phase uses one branch and pull request:

| Phase | Branch |
| --- | --- |
| 0 | `phase-0/platform-gate` |
| 1 | `phase-1/demo-evidence` |
| 2 | `phase-2/agent-investigation` |
| 3 | `phase-3/sandbox-proof` |
| 4 | `phase-4/github-approval-write` |
| 5 | `phase-5/reliability-persistence` |
| 6 | `phase-6/ui-quality-submission` |
| 7 | `phase-7/unified-guardian` |

Open one PR per phase. Later-phase work begins from updated `main` only after the previous phase PR is merged.

## Qodo gate

Qodo must be installed for `jayesh9747/secureops-guardian` before the Phase 0 PR is opened. Verify installation in the GitHub/Qodo app settings; the current `gh` token cannot enumerate GitHub App installations.

For every phase PR:

1. Open a non-draft PR when the phase checks pass locally.
2. Confirm Qodo posts or can be invoked for a review on the PR.
3. Resolve correctness, security, maintainability, and missing-test findings that apply.
4. Reply with evidence when a finding does not apply; do not silently ignore it.
5. Rerun format, lint, typecheck, tests, build, and the phase-specific gate.
6. Record Qodo status and command/test evidence in the PR description.
7. Merge only after the phase exit gate passes.

If Qodo is not installed or does not review the PR, keep the PR open and treat Phase 0 as incomplete.

## Commit and PR scope

- Keep commits small enough to review by purpose.
- Separate repository/bootstrap work, Fixture MCP work, tests, and documentation when practical.
- Never combine two implementation phases in one PR.
- Avoid generated artifacts unless the runtime or submission requires them.
- Keep credentials in local/TrueForge/GitHub settings, never repository files.

## Phase handoff

The implementing session finishes with:

- Branch and PR URL.
- Commit SHAs.
- Checks executed and results.
- Qodo findings and resolutions.
- Phase exit-gate evidence.
- Remaining blockers or risks.
- Explicit confirmation that no later phase was implemented.
