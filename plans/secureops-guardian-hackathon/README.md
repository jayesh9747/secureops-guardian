# SecureOps Guardian hackathon execution plan

Status: approved planning baseline as of 24 August 2026.

This folder turns the [hybrid product plan](../../docs/current/SECUREOPS_INCIDENT_CHANGE_GUARDIAN_HYBRID_PRODUCT_PLAN.md) into ordered, independently executable phases for a solo 38-hour build. The [compliance and feasibility audit](../../docs/current/HYBRID_PLAN_HACKATHON_COMPLIANCE_AND_4_DAY_FEASIBILITY.md) is the source for hackathon constraints and corrected capability claims.

## Outcome

Build a TrueForge agent for an on-call engineer at a small GitHub-and-Kubernetes SaaS team. Guardian must trace a post-deployment security exposure to an exact change, reject a containment that breaks checkout, validate a least-privilege NetworkPolicy repair in the sandbox, and wait for human approval before using the official GitHub MCP to open or reuse a remediation PR.

The submission targets, in order:

1. Best Use of TrueForge.
2. Best Code Quality, maintained from the first commit.
3. Best UI, through TrueForge's existing UI and Generative UI.

## Locked decisions

- One public product repository: `secureops-guardian`.
- One public owned fixture repository: `guardian-demo-checkout`.
- The existing TrueForge fork is the runtime, not the project repository.
- TypeScript, pnpm, Zod, a YAML parser, Vitest, and the official MCP TypeScript SDK form the product stack.
- The official GitHub MCP performs every GitHub read and write.
- A small custom Incident Fixture MCP exposes owned synthetic evidence read-only.
- Two dynamic TrueForge subagents receive focused instructions but share attached tools and sandbox access. The project claims instruction-level role separation, not enforced isolation.
- Candidate YAML is created in the TrueForge sandbox and passes deterministic static policy-contract validation before any GitHub write.
- GitHub write calls may require multiple TrueForge approvals. The product claims retry safety through a deterministic branch and existing-PR lookup, not an atomic custom transaction.
- The result uses real GitHub evidence, synthetic incident evidence, and static sandbox validation. It makes no live-cluster or confirmed-exfiltration claim.
- Initial severity is `High`; actual data access is `Unknown`.
- The existing TrueForge chat, trace, approval interface, and Generative UI render the product experience. No separate dashboard is in the hackathon build.
- Technically inaccurate mechanisms are replaced while their product intent is retained.

## Promotion protocol

Execute one phase at a time. A phase is complete only when every exit-gate statement is evidenced. Record the evidence in the product repository's PR description or linked test output. Start the next phase only after the current gate passes.

When a phase misses its timebox:

1. Use the phase's recovery route.
2. Preserve the competition-core acceptance path.
3. Move unfinished prize-strengthening work to Phase 7.
4. Protect the two-hour submission buffer.

Phase 7 retains deferred features. Retention means they remain ordered and specified; it does not make them part of the 38-hour commitment.

## Phase index and budget

| Order | Plan | Timebox | Gate produced |
| --- | --- | ---: | --- |
| 0 | [Platform gate](./PHASE_0_PLATFORM_GATE.md) | 4 h | TrueForge proves MCP, sandbox, subagent, approval, and persistence primitives |
| 1 | [Demo target and incident evidence](./PHASE_1_DEMO_EVIDENCE.md) | 5 h | Exact Git history and four read-only incident tools return cited fixtures |
| 2 | [Agent investigation and finding](./PHASE_2_AGENT_INVESTIGATION.md) | 7 h | Two subagents produce a causal, evidence-linked `High` finding |
| 3 | [Sandbox remediation proof](./PHASE_3_SANDBOX_PROOF.md) | 7 h | Exact candidate passes the four-state deterministic contract |
| 4 | [Approval and GitHub write](./PHASE_4_APPROVAL_GITHUB_WRITE.md) | 5 h | Denial writes nothing; approval opens or reuses one reviewable PR |
| 5 | [Reliability and persistence](./PHASE_5_RELIABILITY_PERSISTENCE.md) | 4 h | Missing evidence fails closed, reconnect resumes, and three rehearsals pass |
| 6 | [UI, quality, and submission](./PHASE_6_UI_QUALITY_SUBMISSION.md) | 4 h | Judge-readable card, reviewed repo, runnable README, and recorded demo |
| — | Emergency buffer | 2 h | Submission-critical recovery only |
| 7 | [Unified SecureOps Guardian](./PHASE_7_UNIFIED_GUARDIAN.md) | Post-core | One saved agent composes the frozen Phase 2-6 contracts |
| Backlog | [Retained prize-strengthening features](./PHASE_7_RETAINED_FEATURES.md) | Post-core | Historical ordered backlog after unified-agent delivery |
| Post-event | [TrueForge subagent boundary proposal](./POST_HACKATHON_SUBAGENT_BOUNDARIES.md) | Outside event | Evidence-backed upstream feature request |

Baseline total: 38 hours including buffer.

## Competition-core trace

The core is complete only when the following trace is observable:

1. TrueForge receives the named synthetic security alert.
2. The root creates a GitHub/change investigator and an incident-evidence investigator.
3. Tool traces expose exact GitHub and incident evidence IDs.
4. The root produces a bounded `High` finding and keeps actual data access `Unknown`.
5. The model creates candidate NetworkPolicy YAML inside the sandbox.
6. The verifier reproduces the suspect exposure, rejects deny-all, and accepts the least-privilege repair.
7. The exact verified patch and limitations are visible before a write.
8. TrueForge pauses on GitHub write tools.
9. Denial leaves the target unchanged.
10. Approval creates or reuses the deterministic remediation PR.
11. Reconnect returns to the same session and evidence.
12. The final result cites commit, file, alert, observations, verifier output, proposal hash, approval outcome, and PR URL.

## Non-negotiable evidence

| Claim | Required evidence |
| --- | --- |
| Deployment introduced the exposure | Real repository, full commit SHA, changed file, diff hunk, synthetic deployment ID |
| Exposure is observable | Synthetic alert ID and reachability observation ID |
| Deny-all is unsafe | Deterministic failed DNS/DB service-path contract |
| Repair is least privilege for the fixture | Parsed YAML plus passing DNS, PostgreSQL:5432, and forbidden-egress contracts |
| Human controlled the write | TrueForge approval-required and approval/denial trace events |
| Write is retry-safe | Deterministic branch, open-PR lookup, and reused PR URL |

## Definition of submission-ready

- The complete core trace succeeds three consecutive times.
- At least one rehearsal begins from a fresh TrueForge session.
- One denial rehearsal proves the target repository remains unchanged.
- Public setup succeeds from the documented commands with no local-only secrets or paths.
- Qodo has reviewed the meaningful implementation PRs.
- Tests, lint, typecheck, and build pass at the pinned submission commit.
- The recorded demo is no longer than approximately three minutes and uses no manual result substitution.
- The README states synthetic/static boundaries, permissions, limitations, AI assistance, architecture, and TrueForge usage.
