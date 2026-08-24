# SecureOps Guardian agent instructions

## Context route

Before implementation, read completely:

1. `docs/current/IMPLEMENTATION_STATUS.md` to identify the live phase, merged prerequisites, immutable references, and known risks.
2. `docs/current/SECUREOPS_INCIDENT_CHANGE_GUARDIAN_HYBRID_PRODUCT_PLAN.md` for the product contract.
3. The single phase file named by the task for its entry conditions, ordered work, exclusions, and exit gate.
4. `docs/current/DEVELOPMENT_WORKFLOW.md` for branch, review, and handoff rules.

Read `docs/current/HYBRID_PLAN_HACKATHON_COMPLIANCE_AND_4_DAY_FEASIBILITY.md` when changing scope, capability claims, competition requirements, or timebox decisions. Read `plans/secureops-guardian-hackathon/README.md` when changing phase order, cross-phase contracts, or retained work. Read prior phase evidence only to verify a prerequisite, reproduce a trace, or diagnose a regression. Read `docs/current/CONTEXT.md` when introducing or changing project terminology.

Research and archived plans are supporting references. The current product plan and current phase plan control implementation when documents disagree. If the status snapshot is stale, verify repository state and correct the snapshot in the current phase branch.

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
