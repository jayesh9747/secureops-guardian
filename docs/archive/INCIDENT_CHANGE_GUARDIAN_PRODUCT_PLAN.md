# Incident Change Guardian — Proof-Carrying Remediation product and build plan

Updated: 24 August 2026. This plan replaces the earlier broad SecureOps/IaC-scanning scope with one narrow, reproducible product slice. Planning before the event was permitted; implementation and design work begin during the official 24–30 August build window.

## Decision

Build **Incident Change Guardian**, a TrueForge agent that produces **Proof-Carrying Remediation** for one post-deployment Kubernetes incident.

When a checkout alert follows a deployment, Guardian gathers evidence, identifies the causal NetworkPolicy change, rejects an unsafe quick fix, proves a least-privilege patch against availability and security contracts in the TrueForge sandbox, and waits for human approval before creating one remediation pull request.

This is deliberately not a general incident-response platform, an OpenSRE fork, or a broad infrastructure scanner. The product is one trustworthy decision loop:

```text
alert → evidence → causal claim → candidate fixes → deterministic proof → approval → PR
```

### One-sentence pitch

> **Guardian proves a fix restores the required service path without weakening the security boundary, then waits for your approval before creating the PR.**

### What changed from the previous plan

| Previous direction | Revised decision | Reason |
| --- | --- | --- |
| Scan Dockerfile, Kubernetes, Terraform, and GitHub Actions | Support one Kubernetes NetworkPolicy scenario | One causal story is more credible and achievable in seven days. |
| Three generic SecureOps checks | Check manifest validity, required database access, and forbidden broad egress | Each check now proves something needed for the incident decision. |
| Static finding plus proposed patch | Four-state counterfactual proof | Passing one test does not show that the fix is safe or causal. |
| Generic incident report | Evidence-linked validated, refuted, and unknown claims | Prevents correlation and model inference from being presented as fact. |
| PR creation described as irreversible | PR creation described as the only controlled external write | A PR is reversible; the product must not overstate its safety story. |
| Optional dashboard, voice, and multiple integrations | TrueForge UI plus one compact remediation card | Protects the end-to-end vertical slice and demo reliability. |

## User and useful job

### Primary user

An on-call software or platform engineer at a small SaaS team using GitHub and Kubernetes without a dedicated 24/7 SRE organization.

### Moment of need

Checkout requests begin failing shortly after a deployment. The engineer must quickly determine whether the deployment caused the incident, avoid an unsafe emergency workaround, and prepare a reviewable fix.

### Job Guardian is hired to do

> Turn one post-deployment alert into a cited causal explanation and a tested, least-privilege remediation PR without giving the agent production control.

### Value delivered

- Fewer manual hops among alert data, logs, deployment metadata, GitHub, and policy checks.
- A visible distinction between facts, refuted hypotheses, and unknowns.
- Protection against the tempting recovery action that restores availability by removing a security boundary.
- A reviewable patch with deterministic validation attached.
- Human control over the only external write the agent can perform.

Guardian is not useful if it merely summarizes fixture text or selects a predetermined patch. Its value depends on linking every causal claim to evidence and independently testing both the unsafe and safe remedies.

## Fixed incident: `checkout-networkpolicy-db-egress`

The entire MVP uses one synthetic but realistic incident owned by the team.

1. A checkout dependency-failure alert begins three minutes after demo commit `4c21` is deployed.
2. Commit `4c21` changes `k8s/checkout-networkpolicy.yaml`.
3. The policy still permits DNS but no longer allows pods labelled `app=checkout-api` to reach PostgreSQL pods labelled `app=postgres` in namespace `payments-data` on TCP port `5432`.
4. Fixture logs show PostgreSQL connection timeouts beginning after the deployment, and deployment metadata links the running revision to `4c21`.
5. A red herring shows 82% CPU on an unrelated analytics worker. Checkout pods remain below their CPU request and have no throttling evidence.
6. The unsafe quick fix removes the NetworkPolicy or permits unrestricted egress. It restores database access but also allows a forbidden external destination.
7. Guardian proposes a least-privilege rule that retains DNS and permits only the named namespace, pod selector, and TCP port `5432`.

### Required four-state proof

The sandbox verifier must render this matrix from checked-in fixture rules:

| Candidate state | Checkout → PostgreSQL:5432 | Checkout → forbidden destination | Decision |
| --- | --- | --- | --- |
| Last-known-good | Allow | Deny | Availability and security pass |
| Suspect commit `4c21` | Deny | Deny | Availability fails; incident reproduced |
| Unsafe quick fix | Allow | Allow | Security fails; candidate rejected |
| Guardian patch | Allow | Deny | **Availability and security pass** |

The verifier is a deterministic model of this fixture, not proof about a live cluster. The README and demo must state that limitation plainly.

## OpenSRE inspiration and boundary

OpenSRE demonstrates useful patterns for evidence provenance, explicit unvalidated claims, bounded investigations, adversarial synthetic incidents, and proposal/execution separation. Guardian independently implements small versions of those patterns on TrueForge.

| OpenSRE lesson | Guardian adaptation |
| --- | --- |
| Evidence records retain source and tool provenance | Both subagents return typed evidence items; final claims reference their IDs. |
| Diagnosis separates validated and non-validated claims | Guardian uses `validated`, `refuted`, and `unknown` claim states. |
| Synthetic scenarios test required evidence and red herrings | The hidden answer checks the NetworkPolicy cause and rejects unrelated CPU as causal. |
| Investigation loops are bounded and can return partial results | Guardian limits read calls and returns `INCONCLUSIVE` when required evidence is absent. |
| Mutation proposal is separate from execution | A proposal ID and diff hash are approved before the only GitHub write tool runs. |

Guardian must not import, execute, wrap, or depend on the OpenSRE runtime. TrueForge remains the sole agent harness and visibly owns the model loop, subagents, MCP calls, sandbox execution, session state, and approval. No OpenSRE code, fixture text, UI, logo, or diagram will be copied. The README will acknowledge pattern-level inspiration and link to the inspected OpenSRE commit.

## Product contract

### Inputs

- A specific incident request naming the checkout alert.
- Read-only alert, log, metric, and deployment fixtures served through an Incident Fixture MCP server.
- A real demo GitHub repository containing the suspect commit and Kubernetes manifest.

### Evidence item

Every evidence item contains `evidence_id`, `source`, `source_ref`, `tool`, `observed_at`, `fact`, and whether it supports or refutes a claim.

### Claim states

- **Validated Claim:** supported by named evidence and, where causal, by the counterfactual verifier.
- **Refuted Claim:** plausible but contradicted by named evidence.
- **Unknown Claim:** not settled by available evidence.

### Terminal outcomes

- **`SAFE_REMEDIATION_READY`:** the causal chain is supported, the narrow patch passes every check, and an exact proposal is ready for approval.
- **`INCONCLUSIVE`:** required evidence is missing or conflicting; no PR proposal is produced.
- **`NO_SAFE_REMEDIATION`:** tested candidates do not satisfy both availability and security; no PR proposal is produced.
- **`DENIED`:** the human rejected the proposal; no branch or PR exists.
- **`PR_CREATED`:** the approved proposal produced or reused exactly one remediation PR.

### Remediation proposal

The pending proposal binds approval to the repository and branches, changed file and exact diff, `proposal_id`, diff hash, supporting evidence IDs, verifier commands/results, and known limitations. Changing the diff invalidates the proposal and requires a new approval. Retrying the same approved proposal returns the existing PR URL rather than creating a duplicate.

## Core user journey

1. **Trigger:** “Checkout errors rose after the latest deployment. Investigate and prepare a safe remediation.”
2. **Scope:** the TrueForge root agent names the service, read tools, fixture boundary, investigation budget, and lack of production access.
3. **Investigate:** the root delegates to two bounded TrueForge subagents.
   - `change-investigator` reads the GitHub deployment diff and NetworkPolicy.
   - `incident-investigator` reads alert, logs, metrics, and deployment metadata.
4. **Correlate:** the root creates evidence-linked hypotheses and distinguishes facts from unknowns.
5. **Discriminate:** it refutes unrelated analytics CPU as the cause of checkout failures.
6. **Generate:** it proposes both the tempting broad remedy and a least-privilege patch.
7. **Prove:** the TrueForge sandbox runs the four-state deterministic verifier.
8. **Recommend:** the card shows the causal chain, ruled-out hypothesis, rejected unsafe fix, passing narrow fix, exact diff, and limitations.
9. **Control:** TrueForge pauses the GitHub PR tool for human approval of the exact proposal.
10. **Act:** approval creates one PR; denial leaves GitHub unchanged. Reconnect resumes the same proposal safely.

## MVP

| Capability | Exact behavior | Judge-visible proof |
| --- | --- | --- |
| Reproducible incident | One clean fixture reproduces the NetworkPolicy regression and red herring | Hidden answer is unavailable to the agent; three clean runs reach the same supported conclusion. |
| GitHub read MCP | Reads deployed commit, diff, manifest, and existing remediation PRs | Trace shows real repository identifiers and returned content. |
| Incident Fixture MCP | Serves owned synthetic alert, logs, metrics, and deployment metadata read-only | Trace labels the data synthetic and shows distinct evidence sources. |
| Two TrueForge subagents | Return typed, bounded evidence without write tools | The parent trace visibly delegates and consolidates results. |
| Evidence-linked claims | Final causal and refutation claims reference evidence IDs | The result card lets a judge trace each claim to a tool result. |
| Adversarial discrimination | Unrelated analytics CPU is reported as real but non-causal | Hidden-answer test fails if CPU is named as the checkout root cause. |
| Sandbox proof | Evaluates last-good, suspect, unsafe, and Guardian manifests | Matrix shows why the broad fix is rejected and the narrow fix passes. |
| Approval-bound proposal | Approval displays proposal ID, diff hash, file, checks, and limitations | Denial proves zero writes; changed content cannot reuse approval. |
| Idempotent PR write | The same proposal creates at most one branch and PR | Retry returns the original PR URL. |
| Persistent session | Reconnect restores evidence, proof, and pending approval | Refresh while paused, then resume the same proposal. |

## Explicitly out of scope

- OpenSRE as a library, subprocess, API, MCP-wrapped agent, or hidden runtime.
- General root-cause analysis, multiple services, or multiple incident types.
- Terraform, Dockerfile, GitHub Actions, or broad Kubernetes security scanning.
- Live cluster access, production credentials, rollback, restart, deploy, merge, or auto-remediation.
- Arbitrary untrusted repository execution or model-selected shell commands.
- Slack, PagerDuty, ticket systems, Twilio, voice, SMS, or other notification writes.
- Runbook ingestion, organization memory, learning loops, identifier-masking subsystems, or a benchmark platform.
- A custom dashboard, mobile UI, evidence explorer, or full incident timeline.
- More than two subagents, one write tool, one repository, or one PR.

## Architecture

```text
Engineer / bundled TrueForge UI
              │ incident request + approve/deny
              ▼
TrueForge root agent + persistent session
  ├─ change-investigator subagent
  │    └─ GitHub MCP read tools
  ├─ incident-investigator subagent
  │    └─ Incident Fixture MCP read tools
  ├─ evidence-linked claim synthesis
  ├─ TrueForge sandbox
  │    └─ checked-in, allow-listed four-state verifier
  └─ create_remediation_pull_request
       └─ TrueForge approval → scoped GitHub write
```

| Component | Owns | Must not own |
| --- | --- | --- |
| TrueForge root agent | Scope, delegation, claim synthesis, candidate patch, recommendation, approval request | Hidden expected answer, unlabelled assumptions, or direct GitHub writes |
| Change investigator | GitHub commit/diff/manifest evidence | Incident fixtures, sandbox, or write tools |
| Incident investigator | Alert/log/metric/deployment evidence | Repository mutation or configuration claims without evidence |
| Incident Fixture MCP | Deterministic read-only synthetic observations | An LLM, agent loop, approval state, or expected answer |
| Sandbox verifier | Fixture manifest parsing and three allow-listed deterministic checks | Network credentials, GitHub token, model key, or arbitrary commands |
| PR MCP tool | Idempotent execution of the exact approved proposal | Merge, deploy, broad credentials, or content changes after approval |

## Deterministic validation

Use one checked-in verifier command against disposable fixture files. It performs exactly three checks:

1. **Manifest validity:** the NetworkPolicy parses and contains the expected Kubernetes API/kind structure.
2. **Required-path contract:** the fixture policy model permits `checkout-api` to reach `payments-data/postgres` on TCP `5432` and preserves DNS.
3. **Forbidden-egress invariant:** the fixture policy model denies the declared external destination and rejects unrestricted egress.

The verifier is narrow by design and must not be marketed as a general Kubernetes network simulator or security scanner.

## Safety and trust model

| Boundary | Policy |
| --- | --- |
| Data | Use one public demo repository and owned synthetic incident fixtures. Label them everywhere. |
| GitHub permissions | Read tools use read-only access. The PR tool uses a fine-grained credential scoped to the demo repository. |
| Tool output | Treat repository text and MCP output as untrusted evidence; neither can override system policy or approval. |
| Sandbox | Disposable fixture only; no production network, `.env`, SSH keys, GitHub token, or model credentials. |
| Commands | Only checked-in allow-listed verifier commands may execute. |
| Writes | The sole external write is creating/reusing one PR after TrueForge approval. No merge or deployment capability exists. |
| Audit | Persist evidence IDs, claim states, proposal ID, diff hash, verifier results, decision, and PR URL without secrets. |

## Judging strategy

The official judging criteria are equally weighted. The primary target is **Best Use of TrueForge**; the compact remediation card provides enough clarity to remain credible for **Best UI**, and Qodo-reviewed PRs keep the project eligible for **Best Code Quality**.

| Criterion | Guardian proof |
| --- | --- |
| Potential impact | Prevents responders from restoring uptime through an over-broad security workaround. |
| Creativity and originality | Compares an unsafe quick fix with a least-privilege remediation and attaches proof to the selected action. |
| Technical excellence | Hidden-answer adversarial fixture, typed evidence, deterministic checks, idempotency, and failure outcomes. |
| Use of sponsor tools | TrueForge visibly owns subagents, MCP, sandbox, persistent state, approval, and the external write. |
| Control and safety | Missing evidence fails closed; unsafe remediation is rejected; exact write content is approval-bound. |
| Presentation | One alert, one red herring, one rejected fix, one proven fix, and one approved PR fit a three-minute story. |

Install Qodo before the first meaningful project PR and retain the review trail. The formal rules require it for Best Code Quality, while the main judging page also emphasizes sponsor-tool use more broadly.

## Acceptance criteria

The MVP is complete only when all of these pass from a clean fixture:

1. The agent cannot access the expected-answer file.
2. Every causal claim references at least one typed evidence item.
3. The result separates validated, refuted, and unknown claims.
4. The causal chain identifies commit `4c21`, the changed NetworkPolicy rule, blocked PostgreSQL path, and matching timeout evidence.
5. The unrelated CPU signal is explicitly refuted as the checkout cause.
6. The investigation makes at most eight read-tool calls; missing required evidence returns `INCONCLUSIVE` with no proposal.
7. All three deterministic checks run for the candidate states.
8. The broad-egress remedy is rejected and can never become the pending proposal.
9. The least-privilege patch passes manifest, required-path, and forbidden-egress checks.
10. Approval is bound to repository, branches, file, proposal ID, diff hash, proof, and limitations.
11. Denial creates no branch or PR; repeated approval creates exactly one PR.
12. Reconnecting restores the same pending proposal without bypassing or duplicating approval.
13. The complete flow succeeds three times from a clean fixture and the narrated run fits within three minutes.

## Build sequence: 24–30 August

| Day | Required outcome | Stop condition |
| --- | --- | --- |
| Day 1 — Aug 24 | Create the public project repo; install Qodo; run TrueForge; prove one GitHub read MCP call and one sandbox command | Do not start UI work until both traces are recorded. |
| Day 2 — Aug 25 | Build the demo GitHub history, Incident Fixture MCP, hidden answer, red herring, and deterministic verifier | Last-good, suspect, and unsafe states produce the expected matrix. |
| Day 3 — Aug 26 | Implement typed evidence and two bounded subagents; synthesize claim states and causal chain | Agent identifies and refutes the correct signals without reading the answer. |
| Day 4 — Aug 27 | Generate the narrow patch; add proposal ID, diff hash, TrueForge approval, and idempotent PR tool | Deny creates zero writes; approve creates exactly one PR. |
| Day 5 — Aug 28 | Add `INCONCLUSIVE`, verifier failure, reconnect, and compact remediation card | Full three-minute flow succeeds twice consecutively. |
| Day 6 — Aug 29 | Clean README, threat model, tests, AI-use disclosure, architecture, and demo narration; record backup and final video | Another engineer can run the fixture from a clean clone. |
| Day 7 — Aug 30 | Freeze dependencies and data; validate public links; submit early | No new features; only submission-critical fixes. |

## Three-minute demo

| Time | Screen and narration |
| --- | --- |
| 0:00–0:20 | Show checkout alert after `4c21`: “During incidents, the fastest fix can quietly remove a security boundary.” |
| 0:20–0:50 | TrueForge root scopes the task and delegates GitHub/change and incident evidence investigations. |
| 0:50–1:15 | Show evidence-linked causal chain and the unrelated CPU hypothesis being refuted. |
| 1:15–1:45 | Show sandbox matrix: suspect fails availability; broad fix restores access but fails security; narrow fix passes both. |
| 1:45–2:10 | Show remediation card with exact diff, evidence IDs, proposal ID, diff hash, checks, and limitation. |
| 2:10–2:35 | Pause at TrueForge approval; refresh/reconnect and recover the same pending proposal. |
| 2:35–2:50 | Approve; show exactly one GitHub PR and retry returning the same URL. |
| 2:50–3:00 | Close with the architecture: TrueForge owned delegation, MCP, sandbox, persistence, and approval. |

Record a backup before the final day. Never present fixture data, policy-model output, or a simulated operation as production evidence.

## Pitch copy

### 30-second pitch

“Incident Change Guardian helps small Kubernetes teams respond safely to post-deployment failures. It uses TrueForge subagents and MCP tools to connect an alert to the exact GitHub change, labels what is proven and what is not, and tests candidate remedies in the TrueForge sandbox. In our demo, the obvious fix restores checkout but opens unrestricted egress, so Guardian rejects it and proves a least-privilege alternative. Only after a human approves the exact diff does it create one remediation PR.”

### README promise

The README must let a judge verify:

1. the one target user and incident;
2. the owned synthetic fixture boundary;
3. the causal evidence and red-herring expectations;
4. the three deterministic verifier checks and their limitations;
5. which MCP tools read and which single tool writes;
6. how TrueForge subagents, sandbox, persistence, and approval are used;
7. denial, idempotency, reconnect, and `INCONCLUSIVE` tests;
8. setup from a clean clone, threat model, AI-use disclosure, and Qodo review history;
9. OpenSRE pattern-level inspiration with no copied runtime or source;
10. the three-minute demo link.

## Success metrics and cuts

| Metric | Target |
| --- | --- |
| Reproducibility | Three complete runs from a clean fixture before recording |
| Causal integrity | 100% of causal claims cite evidence; CPU is never accepted as the checkout cause |
| Safe-selection integrity | Unsafe broad egress is rejected in every run |
| Approval integrity | Zero writes after denial; one PR after repeated approval/retry |
| Fail-closed behavior | Missing required evidence always returns `INCONCLUSIVE` and no proposal |
| Presentation | A new viewer can explain the incident, rejected fix, safe proof, and approval boundary after three minutes |

If time slips, cut in this order: custom styling, second failure-state presentation, reconnect animation, second subagent trace detail. Never cut the hidden answer, red herring, unsafe-fix rejection, deterministic proof, approval boundary, or idempotency test.

## Product direction after the hackathon

Only after the narrow proof works should Guardian add real observability sources, additional Kubernetes policies, Terraform or container checks, runbook context, organization permissions, incident-system integrations, or approved ephemeral mitigation. The hackathon entry proves the product thesis; it does not build the platform.

## Sources

- [The Agent Harness Hackathon overview and judging](https://www.wemakedevs.org/hackathons/trueforge)
- [Official hackathon rules](https://www.wemakedevs.org/hackathons/trueforge/rules)
- [TrueForge repository and capabilities](https://github.com/truefoundry/trueforge)
- [OpenSRE repository at the inspected commit](https://github.com/Tracer-Cloud/opensre/tree/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d)
- [OpenSRE investigation pipeline](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/investigation-pipeline-architecture.md)
- [OpenSRE evidence model](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/core/state/evidence.py)
- [OpenSRE diagnosis model](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/core/domain/diagnosis/result.py)
- [OpenSRE synthetic scenario catalog](https://github.com/Tracer-Cloud/opensre/tree/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/tests/synthetic)
- [OpenSRE GitHub proposal/execution pattern](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/github-workflow-tools.mdx)
- [Guardian/OpenSRE adoption research](../research/OPENSRE_ADOPTION_RESEARCH.md)
- [Guardian feature-selection research](../research/GUARDIAN_FEATURE_SELECTION_RESEARCH.md)
