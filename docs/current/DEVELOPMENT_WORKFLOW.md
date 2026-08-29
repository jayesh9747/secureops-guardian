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
| Expansion Phase 1 — natural-language request compiler | `expansion-phase-1/natural-language-request-compiler` |
| Expansion Phase 2 — verifier skill bundle | `expansion-phase-2/verifier-skill-bundle` |
| Expansion Phase 3 — finding packs and workload security | `expansion-phase-3/finding-packs` |
| Expansion Phase 4 — Incident Brief and artifacts | `expansion-phase-4/incident-brief-artifacts` |
| Expansion Phase 5 — evaluation, demo, and release | `expansion-phase-5/evaluation-demo-release` |

Expansion Phase 2 also uses a separate public skill repository, `jayesh9747/secureops-guardian-verifier-skill`, with the same branch name. Its immutable tag/commit is reviewed in a separate, unmerged skill PR. Do not fold skill payloads into the product repository or open a TrueForge upstream PR.

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

For Expansion Phase 5 release PR [#18](https://github.com/jayesh9747/secureops-guardian/pull/18), both the automatic attempt and official `/agentic_review` request reported reviews paused for this user. They contain no findings or approval. The independent Standards/Spec reviews were clean and the operator later merged the PR; do not reinterpret the paused Qodo responses as a completed review.

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
