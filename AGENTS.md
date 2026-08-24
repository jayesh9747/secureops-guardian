# SecureOps Guardian agent instructions

## Mandatory context

Before implementation, read completely:

1. `docs/current/SECUREOPS_INCIDENT_CHANGE_GUARDIAN_HYBRID_PRODUCT_PLAN.md`
2. `docs/current/HYBRID_PLAN_HACKATHON_COMPLIANCE_AND_4_DAY_FEASIBILITY.md`
3. `plans/secureops-guardian-hackathon/README.md`
4. The single phase file named by the task
5. `docs/current/DEVELOPMENT_WORKFLOW.md`

Research and archived plans are supporting references. The current product plan and phase plans control implementation when documents disagree.

## Phase gate

Implement one phase only. Begin from the phase's entry conditions, execute its ordered steps, and stop when every exit-gate criterion is evidenced. Leave later phases unchanged except for narrowly required interfaces explicitly named by the current phase.

If a phase prerequisite is unavailable, exhaust safe in-scope diagnosis, record the exact blocker and evidence, and stop before substituting another architecture.

## Product truth

- Real GitHub evidence is joined with explicitly synthetic incident evidence.
- Sandbox output is static policy-contract validation.
- Severity begins at `High`; actual data access remains `Unknown`.
- TrueForge is the only agent harness.
- Official GitHub MCP performs GitHub reads and writes.
- Dynamic subagent roles are instruction-scoped, not hard authorization boundaries.
- GitHub writes are approval-gated and retry-safe, not one atomic transaction.
- The agent never merges, deploys, accesses a live cluster, or claims live reachability.

## Git and review

Work from the phase branch named in `docs/current/DEVELOPMENT_WORKFLOW.md`. Keep `main` releasable and planning-led. Use small, reviewable commits. Push the phase branch, open a pull request with the repository template, obtain Qodo review, address actionable findings, rerun the phase checks, and merge only after the phase exit gate passes.

Preserve unrelated user changes. Keep secrets, tokens, local absolute paths, and private data out of commits, logs, screenshots, and recordings.

