# Incident Change Guardian: OpenSRE-inspired feature selection

Research date: 24 August 2026. OpenSRE was inspected at current `main` commit [`cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d`](https://github.com/Tracer-Cloud/opensre/tree/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d). This report compares first-party OpenSRE sources with the archived [Incident Change Guardian plan](../archive/INCIDENT_CHANGE_GUARDIAN_PRODUCT_PLAN.md). Statements labelled **Fact** describe the sources; statements labelled **Recommendation** or **Inference** are product judgments for this hackathon.

## Decision

**Recommendation: build one narrow product slice called _Proof-Carrying Remediation_.**

> When a post-deployment alert fires, Guardian identifies the causal configuration change, rejects a tempting fix that restores uptime by weakening security, proves a least-privilege patch in a TrueForge sandbox, and creates exactly one reviewable PR only after TrueForge approval.

Take four small patterns from OpenSRE, implemented independently on TrueForge:

1. a typed evidence ledger with provenance;
2. validated, refuted, and still-unknown claims;
3. a hidden-answer adversarial fixture containing a strong red herring; and
4. a proposal/execution split with an idempotency marker.

Guardian's differentiator should **not** be generic root-cause analysis. It should be the counterfactual proof that compares the suspect change, an unsafe quick fix, and the least-privilege remediation against both an availability contract and a security invariant.

This is smaller and stronger than the current plan's broad “three IaC checks across Dockerfile/Kubernetes/Terraform/GitHub Actions” framing. Implement exactly one Kubernetes NetworkPolicy policy pack and three deterministic checks: manifest validity, required service connectivity, and forbidden egress.

## What OpenSRE actually provides

### Product and architecture

- **Fact:** OpenSRE describes itself as a public-alpha framework, training environment, and evaluation environment for AI-SRE agents. Its flow fetches incident context, optionally masks identifiers, reasons in a tool-calling loop, produces an evidence-backed diagnosis, suggests or executes remediation, and delivers results. It exposes a REPL, headless CLI, one-shot investigation, Python API, remote-runtime path, and more than 60 advertised integrations. Its README currently reports no benchmark results. [OpenSRE README](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/README.md)
- **Fact:** The codebase is a layered platform with surfaces and gateways, a composition root, tools and integrations, runtime/infrastructure, and configuration. Those import boundaries are CI-enforced. [Architecture](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/ARCHITECTURE.md)
- **Inference:** Importing this platform, calling `opensre investigate`, or wrapping its `AgentSession` in an MCP tool would obscure the part judges need to see TrueForge perform. Guardian should reuse no OpenSRE runtime.

### Investigation pipeline

- **Fact:** The connected-investigation pipeline resolves integrations, extracts/classifies the alert, plans evidence tools, gathers evidence in a ReAct loop, parses a structured diagnosis, and delivers a report. Tool planning defaults to a budget of 10; the agent receives at most 32 tool schemas; the loop is capped at 20 iterations; duplicate calls are replayed from cache; two duplicate-only iterations trigger a forced text conclusion; and an LLM failure preserves partial evidence instead of silently producing certainty. [Investigation pipeline](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/investigation-pipeline-architecture.md)
- **Fact:** Each evidence record contains a stable key, raw data, tool name and arguments, source, timestamp, loop iteration, and optional confidence. [Evidence model](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/core/state/evidence.py)
- **Fact:** Diagnosis has an explicit causal chain, validated claims, non-validated claims, remediation steps, trade-offs, verification summary, follow-up questions, and a validity score; the unknown result says evidence is insufficient. [Diagnosis schema](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/core/domain/diagnosis/result.py)
- **Recommendation:** Borrow the contracts and fail-closed behavior, not the six-stage implementation. In Guardian, TrueForge's root agent and two subagents remain the visible investigation loop.

### Synthetic and end-to-end evaluation

- **Fact:** OpenSRE separates deterministic synthetic RCA scenarios from live/cloud-backed end-to-end tests. [Test catalog](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/tests/README.md)
- **Fact:** Synthetic answer keys can specify required and forbidden terms, required evidence sources, an optimal tool trajectory, and a maximum loop count. The RDS suite scores whether the agent consulted required evidence and ruled out alternatives, not merely whether its prose contains the expected diagnosis. [RDS synthetic suite](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/tests/synthetic/rds_postgres/README.md)
- **Fact:** OpenSRE's replication-lag scenario deliberately includes elevated CPU as a causal red herring. Its answer key requires WAL/replication evidence and forbids treating CPU as another root cause; its QA note says the goal is causal discrimination rather than surface correlation. [Red-herring answer key](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/tests/synthetic/rds_postgres/006-replication-lag-cpu-redherring/answer.yml) · [QA validation](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/tests/synthetic/rds_postgres/006-replication-lag-cpu-redherring/QA_VALIDATION.md)
- **Recommendation:** This evaluation discipline is OpenSRE's most useful lesson for Guardian. One well-designed adversarial fixture is more convincing than a long integration list.

### Remediation and approval behavior

- **Fact:** OpenSRE does not have one uniform GitHub-write policy. Its workflow tools separate a deterministic proposal from an approval-gated executor and use a proposal ID/idempotency marker. [GitHub workflow tools](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/github-workflow-tools.mdx)
- **Fact:** Its security-fix tool is mutating and approval-gated; the documentation says it asks before editing and again before commit/push/PR. [Security-fix tool](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/integrations/github/tools/security_fix/tool.py) · [Security-fix workflow](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/github-security-fix.mdx)
- **Fact:** By contrast, the general `github_cli` action path supports reads and writes without a separate approval gate. [GitHub integration](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/github.mdx)
- **Recommendation:** Guardian should be stricter and simpler: expose no alternate GitHub write path. Only `create_remediation_pull_request(proposal_id, diff_hash)` may write, and TrueForge approval must guard it.

## Guardian gap analysis

The current Guardian plan already has the correct skeleton: a fixed incident, two narrow TrueForge subagents, read-only GitHub and incident MCP calls, sandbox validation, persistent session state, and an approval-gated PR. Its weakness is that the decisive claim is underspecified: “a rule failed and the patch passed tests” does not prove that the change caused the incident or that the remedy preserves security.

| Current plan element | Gap | Precise replacement |
| --- | --- | --- |
| Evidence report | Prose can lose provenance between subagent and root agent | A small evidence ledger; every claim lists evidence IDs |
| Three generic SecureOps rules across several IaC formats | Too broad and weakly connected to one outage | One Kubernetes NetworkPolicy policy pack with three deterministic checks |
| “Most likely change” | Correlation may be presented as causation | Required chain: deployed diff → runtime mechanism → observed symptom → counterfactual result |
| Sandbox says proposed patch passes | Does not show why the obvious alternative is unsafe | Four-state availability/security comparison |
| Approval includes title, files, summary | Reconnect/retry could duplicate a write or approve changed content | Include proposal ID, exact diff hash, verification result, and idempotency key |
| One happy-path fixture | A scripted agent can look correct | Hidden expected answer plus one strong red herring and one unsafe-remediation trap |

## Candidate feature scoring

Scores are **1 (weak) to 5 (strong)** and are product inferences. All five dimensions are weighted equally because the goal is a small, judge-visible vertical slice rather than a general platform.

| Candidate inspired by OpenSRE | User value | Originality | 7-day feasibility | 3-minute demo | Visible TrueForge use | Total /25 | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Security-preserving counterfactual verifier | 5 | 5 | 4 | 5 | 5 | **24** | Product center |
| Proposal/execution split + idempotent PR | 5 | 3 | 4 | 5 | 5 | **22** | Keep |
| Provenance ledger + claim states | 5 | 3 | 5 | 4 | 4 | **21** | Keep, minimal schema |
| Hidden-answer red-herring fixture | 4 | 4 | 4 | 4 | 4 | **20** | Keep as evaluation proof |
| Bounded calls + honest inconclusive outcome | 4 | 2 | 5 | 3 | 4 | **18** | Keep as a small safety rule |
| Live autonomous rollback/remediation | 3 | 2 | 1 | 4 | 3 | **13** | Cut |
| Broad observability/cloud integration catalog | 3 | 1 | 1 | 2 | 1 | **8** | Cut |

The first five rows are not five separate product areas. They form one flow: bounded evidence produces claims; the adversarial case tests the claims; the counterfactual verifier selects a safe proposal; approval and idempotency control the only external write.

## Recommended product slice

### Name and promise

**Incident Change Guardian — Proof-Carrying Remediation**

> For an on-call engineer at a small SaaS team using GitHub and Kubernetes, Guardian turns one post-deploy availability alert into a cited diagnosis and a least-privilege remediation PR. It proves the patch restores the required dependency path without opening forbidden egress, and never writes before human approval.

The report shown to the engineer should have only five sections:

1. **Incident:** alert, affected service, suspect deployment, and window.
2. **Causal chain:** each step linked to evidence IDs.
3. **Ruled out:** the tempting red herring and the evidence refuting it.
4. **Remediation proof:** the four-state matrix below.
5. **Pending action:** exact diff hash, checks, proposal ID, and Approve/Deny.

### One specific incident

**Fixture name:** `checkout-networkpolicy-db-egress`

- A synthetic alert reports checkout dependency failures three minutes after demo commit `4c21`.
- Commit `4c21` changes `k8s/checkout-networkpolicy.yaml`. The policy still allows DNS, but no longer permits pods labelled `app=checkout-api` to reach PostgreSQL pods labelled `app=postgres` in namespace `payments-data` on TCP `5432`.
- Fixture logs contain PostgreSQL connection timeouts beginning after the deployment. Deployment metadata links the running revision to `4c21`.
- A strong red herring shows 82% CPU on an unrelated analytics worker. Checkout pods remain below their CPU request and show no throttling. Guardian must mark the CPU signal as real but non-causal.
- The tempting quick fix deletes the NetworkPolicy (or replaces it with unrestricted egress). It restores database connectivity but also permits checkout pods to reach a forbidden external test endpoint.
- Guardian's patch retains DNS and adds one peer constrained by both namespace `payments-data` and pod label `app=postgres`, TCP port `5432` only.

The sandbox renders this judge-readable matrix:

| Candidate state | Checkout → PostgreSQL:5432 | Checkout → forbidden external endpoint | Result |
| --- | --- | --- | --- |
| Last-known-good | Allow | Deny | Availability pass, security pass |
| Suspect commit `4c21` | Deny | Deny | Availability fail |
| Unsafe quick fix | Allow | Allow | Security fail — rejected |
| Guardian patch | Allow | Deny | **Availability pass, security pass** |

This scenario is concrete, reproducible without production credentials, and useful beyond the demo: an on-call engineer receives evidence about the causal change, sees why the fastest apparent recovery is unacceptable, and gets a reviewable least-privilege patch.

### TrueForge remains the only harness

```text
TrueForge persistent root session
  ├─ change investigator subagent → GitHub read MCP → evidence entries
  ├─ incident investigator subagent → fixture MCP → evidence entries
  ├─ root agent → cited claims + causal chain + candidate patch
  ├─ TrueForge sandbox → four-state deterministic verifier
  ├─ TrueForge approval → exact proposal ID + diff hash
  └─ GitHub write MCP → create/reuse exactly one remediation PR
```

The MCP servers are deterministic adapters only. They must contain no hidden LLM, agent loop, approval state, or OpenSRE call. This keeps subagents, MCP calls, sandboxing, persistence, and approval visibly attributable to TrueForge.

## Exact acceptance criteria

The slice is done only when all of these pass from a clean fixture:

1. **Ground truth is hidden:** the agent can read alert, metrics/logs, deployment metadata, and repository data, but cannot read the expected-answer file.
2. **Evidence is typed:** every evidence item has `evidence_id`, `source`, `source_ref`, `tool`, `observed_at`, and `fact`; no final causal claim lacks at least one evidence ID.
3. **Claims are explicit:** the final result separates `validated`, `refuted`, and `unknown` claims. CPU is reported as refuted as the incident cause, not ignored.
4. **Causality is demonstrated:** the result identifies `4c21`, the NetworkPolicy file and changed rule, the blocked `checkout-api → postgres:5432` mechanism, and the matching timeout evidence.
5. **Investigation is bounded:** use at most eight read-tool calls per run; duplicate identical calls do not execute twice; missing required evidence yields `INCONCLUSIVE` and no proposal.
6. **Three deterministic sandbox checks run:** Kubernetes manifest validation, required PostgreSQL connectivity, and forbidden-egress denial.
7. **The unsafe fix is rejected:** unrestricted egress may pass availability, but must fail the security invariant and must never become the pending proposal.
8. **The narrow patch passes:** it permits only the named namespace/pod peer on TCP `5432`, preserves DNS, and passes all three checks.
9. **Approval binds exact content:** the card shows repository, base/head, changed file, proposal ID, diff hash, and verifier result. Changing the diff after approval invalidates the authorization.
10. **Deny is side-effect free:** a denied request creates no branch and no PR.
11. **Approval is idempotent:** approving or retrying the same proposal creates exactly one PR; a repeated call returns the existing PR URL.
12. **Reconnect is safe:** reopening the TrueForge session restores the same pending proposal and cannot bypass or duplicate approval.
13. **Demo reliability:** the complete alert-to-PR flow succeeds three times from a clean fixture and the narrated run fits within three minutes.

## Explicit cuts

Cut these before cutting the proof-carrying vertical slice:

- OpenSRE as a dependency, subprocess, API, agent runtime, or MCP-wrapped agent.
- Copied OpenSRE source code; independently implement the small schemas and tests.
- Generic incident response, multiple services, multiple incident types, and live production access.
- Terraform, Dockerfile, GitHub Actions, and broad Kubernetes scanning. Support this one NetworkPolicy contract only.
- Live rollback, deployment, merge, auto-remediation, production shell, or cluster credentials.
- Slack, PagerDuty, Telegram, Twilio/voice, ticket systems, and notification writes.
- Broad observability integrations; use the deterministic incident-fixture MCP plus real GitHub reads.
- A custom dashboard, evidence explorer, mobile UI, or full timeline. Use the TrueForge UI and one compact result card.
- Benchmark platform, learning loop, identifier-masking subsystem, agent-fleet monitoring, cost dashboard, and 60+ integration ambition.
- More than two subagents, more than one write tool, or more than one PR.
- LLM-written policy rules or arbitrary repository command execution; keep verifier commands checked in and allow-listed.

## License and attribution

- **Fact:** OpenSRE's root source is Apache License 2.0 and its package metadata declares `Apache-2.0`. The license permits use and modification subject to its conditions, including retaining relevant notices, marking modified files, providing the license, and handling any applicable `NOTICE` content. [Root license](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/LICENSE) · [Package metadata](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/pyproject.toml)
- **Fact:** The OpenSRE `docs/` subtree also has an MIT license, so not every repository asset should be assumed to use only the root license. [Documentation license](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/LICENSE)
- **Recommendation:** Copy no code, fixture text, UI, logos, or diagrams. Add one README acknowledgement: “Evidence provenance, bounded investigation, and adversarial scenario design were inspired by OpenSRE,” with a link to the pinned commit. This avoids dependency and attribution complexity while honestly crediting the research source. This is an engineering recommendation, not legal advice.

## Final win-oriented assessment

**Inference:** This slice cannot guarantee a prize, but it gives Guardian a much stronger competitive story than “another SRE incident agent.” In three minutes, judges can see a plausible failure, a misleading signal, an unsafe fix being rejected, a safe fix being proven, a real human-control boundary, persistence, and exactly one external write. Each visible beat exercises a TrueForge capability while producing value an on-call engineer can understand immediately.

The final pitch should be:

> **Guardian does not merely suggest a fix. It proves the fix restores service without weakening the security boundary, then waits for your approval before creating the PR.**
