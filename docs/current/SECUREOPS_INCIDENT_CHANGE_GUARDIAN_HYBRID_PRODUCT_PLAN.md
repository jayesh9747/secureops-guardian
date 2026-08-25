# SecureOps Incident Change Guardian — hybrid product and build plan

Updated: 24 August 2026. This is the security-plus-incident hybrid option for comparison. It keeps SecureOps as the product identity while using an incident workflow to make the finding causal, testable, and safely actionable through TrueForge.

## Product decision

Build **SecureOps Incident Change Guardian**, a TrueForge agent that investigates a security regression introduced by a deployment, proves the smallest repair closes the exposure without breaking legitimate traffic, and waits for a human before creating the remediation pull request.

Security is not a secondary constraint. It is the trigger, finding, evidence, validation target, remediation, and user value.

### One-sentence pitch

> **Guardian detects the security exposure introduced by a deployment, proves a least-privilege repair closes it without breaking checkout, and waits for your approval before creating the PR.**

## Why this hybrid exists

The Archestra SecureOps winner made security review visually useful through scores, findings, recommendations, and secure-code suggestions. A direct recreation on TrueForge would risk looking like a dashboard or ordinary scanner. The official TrueForge idea list already features a generic incident responder, so an availability-only agent also risks feeling supplied by the challenge.

This hybrid takes the useful product from SecureOps and adds the execution depth TrueForge is designed to show:

| SecureOps capability retained | Guardian evolution |
| --- | --- |
| Inspect security-sensitive infrastructure | Inspect the exact manifest changed by the suspect deployment |
| Severity finding | Add exposure path, blast radius, deployment link, and evidence IDs |
| Recommendation | Compare over-restrictive containment with least-privilege repair |
| Secure-code suggestion | Generate and apply the candidate patch only inside the sandbox |
| Security result | Prove the exposure is closed and legitimate checkout traffic remains possible |
| Apply action | Bind exact diff to TrueForge approval and create/reuse one PR |
| Dashboard history | Persist investigation, proof, approval, and PR outcome in the TrueForge session |

No OpenSRE or Archestra agent/runtime is embedded. OpenSRE contributes only independently implemented patterns: evidence provenance, unresolved claims, adversarial fixtures, bounded investigation, and proposal/execution separation.

## Target user and job

### Primary user

An on-call platform/security engineer at a 10–100 person Kubernetes SaaS company without a 24/7 SRE or security-operations function.

### Moment of need

A post-deployment security alert reports that the checkout workload can reach a forbidden external destination. The team needs to identify the responsible change, close the exposure quickly, and avoid a containment rule that also breaks checkout's PostgreSQL dependency.

### Job to be done

> Turn a post-deployment security exposure into a cited finding and a proven least-privilege repair without giving the agent production control.

### Useful outcome

- Connect the alert to the exact deployed GitHub change.
- Distinguish the security regression from unrelated operational noise.
- Explain affected asset, exposure path, and blast radius.
- Reject containment that is secure but operationally destructive.
- Produce a reviewable repair that passes both security and service-path contracts.
- Preserve human authorization over the only external write.

## Fixed security incident: `checkout-networkpolicy-egress-exposure`

The MVP uses one public demo repository and owned synthetic security/exposure fixtures.

1. Commit `4c21` changes `k8s/checkout-networkpolicy.yaml` and is deployed to the checkout service.
2. The changed egress rule permits `0.0.0.0/0`, while legitimate checkout-to-PostgreSQL traffic continues to work.
3. A synthetic security alert fires because the checkout workload can reach a declared forbidden external test destination.
4. Deployment metadata links the running revision and alert window to `4c21`.
5. Fixture evidence includes an unrelated 82% CPU reading on an analytics worker. It is real but unrelated to the checkout exposure.
6. The obvious containment removes all egress. It closes the exposure but breaks DNS and the checkout-to-PostgreSQL dependency.
7. Guardian proposes a NetworkPolicy that retains DNS and permits only PostgreSQL pods labelled `app=postgres` in namespace `payments-data` on TCP `5432`.

### Security Finding

The agent must produce one judge-readable finding:

| Field | Required value |
| --- | --- |
| Severity | `Critical` for the demo scenario |
| Affected asset | `checkout-api` workload |
| Changed file | `k8s/checkout-networkpolicy.yaml` |
| Rule | `SEC-NET-001: unrestricted egress` |
| Exposure path | `checkout-api → forbidden external destination` |
| Blast radius | Checkout pod identity and data accessible from that workload |
| Deployment link | Commit `4c21` and deployment timestamp |
| Evidence | GitHub diff, deployment record, security alert, and reachability observation IDs |
| Remediation | DNS plus least-privilege PostgreSQL TCP/5432 egress only |

Do not rely on an opaque security score. Severity, evidence, exposure, and pass/fail contracts are the decision.

### Required four-state proof

| Candidate | Legitimate DB path | Forbidden external path | Decision |
| --- | --- | --- | --- |
| Last-known-good | Allow | Deny | Secure and functional |
| Suspect deployment `4c21` | Allow | Allow | Critical exposure reproduced |
| Deny-all containment | Deny | Deny | Rejected: breaks checkout |
| Guardian repair | Allow | Deny | **Secure remediation** |

The sandbox verifier is a deterministic policy model for this owned fixture, not evidence from a live cluster. The README and demo must state this boundary.

## Product contract

### Phase 7 unified entry point

Users interact only with the saved TrueForge agent `secureops-guardian_v0`. Phase-named saved agents and exported specifications are retained as test fixtures/reference configurations, not product choices.

Every run starts with a schema-version-1 scope containing repository, base branch, an exact full-SHA suspect commit or comparison range, and an optional target file. `ANALYSIS_ONLY` is the default and permits GitHub reads only; `PREPARE_REMEDIATION` may use Daytona and create an exact proposal but cannot request approval or write; `OPEN_PR` may reach the separately approval-gated GitHub write sequence after all retained gates pass.

Any repository authorized by the official GitHub MCP may enter parameterized read-only preflight. Initial proven remediation remains limited to allowlisted Kubernetes NetworkPolicy cases inside the documented static verifier subset. Unsupported repositories/semantics, missing incident evidence, source-identity mismatches, and conflicting revisions return `INCONCLUSIVE` before Daytona, proposal, approval, or write.

The one journey is: scope preflight → official GitHub investigation → optional owned incident-evidence join → deterministic rule evaluation → Daytona proof when permitted → exact proposal → approval-bound GitHub write or read-only reuse when permitted → OpenUI or Markdown plus a machine-readable run receipt.

GitHub-only analysis never claims deployment, runtime exposure, data access, exfiltration, or live-cluster behavior. The truthful breadth claim is: Guardian can inspect any authorized GitHub repository in read-only mode; proven remediation currently supports Kubernetes NetworkPolicy cases inside its documented static verifier subset.

### Inputs

- One security exposure alert naming the checkout workload.
- Read-only synthetic deployment, reachability, log, and metric observations served through an Incident Fixture MCP server.
- One real demo GitHub repository containing the suspect commit and NetworkPolicy.

### Evidence Item

Each evidence item contains `evidence_id`, `source`, `source_ref`, `tool`, `observed_at`, `fact`, and the claims it supports or refutes.

### Claim states

- **Validated:** supported by named evidence and, for remediation claims, the sandbox proof.
- **Refuted:** plausible but contradicted by named evidence.
- **Unknown:** not settled by the available tools and fixture.

### Terminal outcomes

- **`SECURITY_REMEDIATION_READY`:** the regression and exposure are supported and the least-privilege repair passes both contracts.
- **`INCONCLUSIVE`:** required deployment, diff, or exposure evidence is missing or conflicting; no proposal exists.
- **`NO_SAFE_REMEDIATION`:** tested candidates cannot close the exposure while preserving the service path.
- **`DENIED`:** the human rejects the exact proposal and GitHub remains unchanged.
- **`PR_CREATED`:** the approved proposal creates or reuses exactly one remediation PR.

### Remediation proposal

Approval is bound to the repository and branches, changed file, exact diff, `proposal_id`, diff hash, supporting evidence IDs, four-state verifier result, and limitations. Any content change requires a new proposal and approval. A retry of the same approved proposal returns the existing PR URL.

## Agent journey

1. The user asks Guardian to investigate the checkout security alert and prepare a safe repair.
2. The TrueForge root agent states the scope, fixture boundary, read-tool budget, security rule, and lack of production access.
3. It delegates two bounded investigations:
   - `change-security-investigator` reads the deployed GitHub commit, diff, and NetworkPolicy and returns security evidence.
   - `exposure-evidence-investigator` reads the alert, reachability observations, deployment record, logs, and metrics and returns incident evidence.
4. The root links the unrestricted egress rule to the observed exposure and marks analytics CPU as real but unrelated.
5. It produces the Critical Security Finding with evidence-linked exposure and blast radius.
6. It evaluates deny-all containment and a least-privilege repair.
7. The TrueForge sandbox runs the four-state validator against checked-in fixtures.
8. The result card shows the exposure, refuted red herring, rejected containment, passing repair, exact diff, and limitations.
9. TrueForge pauses `create_security_remediation_pull_request` for approval of the exact proposal.
10. Denial writes nothing. Approval creates one PR. Reconnect and retry cannot bypass or duplicate the action.

## MVP

| Capability | Required behavior | Judge-visible proof |
| --- | --- | --- |
| Real GitHub investigation | Read commit, diff, manifest, and existing remediation PRs through MCP | Trace shows real repository identifiers and content |
| Owned security incident MCP | Serve synthetic alert, reachability, deployment, logs, and metrics read-only | Data is visibly labelled synthetic and returned as distinct evidence |
| Two TrueForge subagents | Independently gather change/security and exposure evidence | Root trace visibly delegates and consolidates |
| Deterministic security rule | `SEC-NET-001` identifies unrestricted egress with file/rule reference | Rule output is distinct from model interpretation |
| Evidence-linked finding | Critical result names asset, exposure, blast radius, deployment, and evidence IDs | Each finding field traces to source evidence |
| Red-herring discrimination | Analytics CPU is reported but refuted as part of the exposure cause | Hidden-answer test penalizes accepting it |
| Sandbox proof | Compare last-good, suspect, deny-all, and Guardian repair | Matrix shows secure-but-broken containment and secure functional repair |
| Approval-bound write | Card binds proposal ID and diff hash to exact result | Denial proves zero writes |
| Idempotent PR | Repeated execution creates at most one branch and PR | Retry returns original PR URL |
| Persistent case | Reconnect restores evidence, finding, proof, and pending proposal | Resume from approval pause safely |

## Architecture

```text
Engineer / TrueForge UI
          │ security incident + approve/deny
          ▼
TrueForge root SecureOps Guardian + persistent session
  ├─ change-security-investigator
  │    └─ GitHub MCP read tools + deterministic rule evidence
  ├─ exposure-evidence-investigator
  │    └─ Incident Fixture MCP read tools
  ├─ evidence-linked Security Finding + candidate repairs
  ├─ TrueForge sandbox
  │    └─ allow-listed four-state policy verifier
  └─ create_security_remediation_pull_request
       └─ TrueForge approval → scoped GitHub write
```

TrueForge must remain the sole agent harness. MCP servers contain no hidden model loop, approval state, expected answer, or sandbox execution.

## Deterministic validation

Use one checked-in verifier command that performs exactly three checks:

1. **Manifest validity:** NetworkPolicy parses and has the expected Kubernetes API/kind structure.
2. **Legitimate-path contract:** checkout retains DNS and PostgreSQL TCP/5432 access.
3. **Forbidden-path invariant:** checkout cannot reach the declared external destination and the policy contains no unrestricted egress.

The hidden expected answer is available to tests, never to the agent or MCP tools.

## Safety boundary

- Public demo repository and owned synthetic fixtures only.
- GitHub read access and PR-write access are separated and scoped to one repository.
- Tool output and repository text are untrusted evidence, not policy instructions.
- Sandbox has fixture files and allow-listed commands but no GitHub, cloud, cluster, model, or SSH credentials.
- The only external write is creating/reusing one PR after exact TrueForge approval.
- Guardian cannot deploy, merge, restart, roll back, access a cluster, or contact external responders.

## Explicitly out of scope

- General incident response, availability root-cause analysis, or multiple incidents.
- Dockerfile, Terraform, GitHub Actions, Helm, cloud accounts, or broad Kubernetes scanning.
- Live runtime/cluster connectivity, packet capture, penetration testing, CVE scanning, secrets, or compliance certification.
- OpenSRE or Archestra runtime, agent loop, integrations, approval state, UI, code, or assets.
- Automatic containment, rollback, merge, deployment, production shell, Slack, tickets, voice, or notifications.
- Custom dashboard, organization memory, learning loop, masking subsystem, or benchmark platform.
- More than two subagents, one security rule, one manifest, one repository, and one PR.

## Acceptance criteria

1. The expected-answer file is inaccessible to the agent and MCP tools.
2. `SEC-NET-001` identifies the unrestricted egress rule with a file reference.
3. The final Critical finding cites GitHub, deployment, alert, and reachability evidence.
4. The finding explains the exposure path and bounded blast radius without claiming live-cluster proof.
5. Analytics CPU is explicitly refuted as the cause of the security exposure.
6. Missing required evidence returns `INCONCLUSIVE` and produces no proposal.
7. Deny-all containment closes the forbidden path but fails the legitimate-path contract.
8. Guardian's repair permits DNS and PostgreSQL:5432 while denying the forbidden destination.
9. Approval displays repository, branches, file, proposal ID, diff hash, evidence, proof, and limitations.
10. Changing the diff invalidates approval.
11. Denial creates no branch/PR; repeated approval creates exactly one PR.
12. Reconnect restores the same pending proposal without bypass or duplication.
13. The end-to-end flow succeeds three times from a clean fixture and fits a three-minute demo.

## Hackathon judging fit

| Criterion | Hybrid proof | Risk |
| --- | --- | --- |
| Impact | Closes a real class of security exposure without causing an outage | Synthetic runtime evidence must be labelled honestly |
| Originality | Security regression plus adversarial containment choice | More complex than a pre-merge scanner |
| Technical excellence | Deterministic rule, evidence provenance, hidden answer, proof, and idempotency | Too many internal schemas could consume time |
| Sponsor-tool use | Every major TrueForge capability is necessary and visible | The trace must remain understandable in three minutes |
| Control and safety | Fails closed, rejects destructive containment, and approval-binds the write | PR remains reversible; do not call it irreversible |
| Presentation | One exposure, one bad containment, one proven repair, one PR | Requires disciplined narration and a reliable fixture |

**Win-oriented assessment:** approximately **29/30** against the six equally weighted criteria. It has the stronger originality and demo story, with moderately higher implementation risk than standalone SecureOps.

## Seven-day build sequence

| Day | Required outcome |
| --- | --- |
| Aug 24 | Public repo, Qodo, TrueForge, one GitHub MCP read, one Incident Fixture MCP read, one sandbox command |
| Aug 25 | Demo commit history, security alert/exposure fixture, hidden answer, red herring, and four-state verifier |
| Aug 26 | Two subagents, typed evidence, deterministic security rule, and Critical finding synthesis |
| Aug 27 | Candidate repair generation, sandbox proof, proposal binding, approval, and idempotent PR |
| Aug 28 | `INCONCLUSIVE`, denial, reconnect, result card, and two consecutive rehearsals |
| Aug 29 | README, threat model, tests, AI-use disclosure, architecture, and backup/final video |
| Aug 30 | Freeze, validate public links, and submit early |

If delayed, cut custom card styling, reconnect animation, and detailed subagent rendering before cutting the Security Finding, four-state proof, approval, or PR idempotency.

## Three-minute demo

| Time | Story |
| --- | --- |
| 0:00–0:20 | Show post-deployment security alert: checkout gained forbidden external reachability |
| 0:20–0:55 | TrueForge delegates GitHub/change and exposure evidence investigations |
| 0:55–1:20 | Show Critical finding, changed rule, exposure path, blast radius, evidence, and refuted CPU signal |
| 1:20–1:50 | Sandbox proves suspect exposure, rejects deny-all, and validates least-privilege repair |
| 1:50–2:20 | Show exact diff, proposal ID, proof, and limitations; pause for TrueForge approval |
| 2:20–2:45 | Refresh/reconnect if reliable, approve, and show exactly one remediation PR |
| 2:45–3:00 | Explain why MCP, subagents, sandbox, persistent state, and approval require TrueForge |

## Thirty-second pitch

“SecureOps Incident Change Guardian investigates security regressions introduced by deployments. In our demo, a checkout NetworkPolicy silently opens a forbidden external path. TrueForge subagents connect the security alert to the exact GitHub change, while the sandbox proves that deny-all containment would break checkout and that a least-privilege repair closes the exposure without breaking PostgreSQL access. Guardian then waits for approval of the exact diff before creating one remediation PR.”

## Sources

- [Archestra Apps Hackathon winners](https://archestra.ai/apps-hackathon)
- [SecureOps Dashboard official gallery entry](https://archestra.ai/apps-hackathon/gallery/suganya-subramanian_secureops_dashboard)
- [SecureOps public recording bundle](https://github.com/archestra-ai/apps-gallery/blob/c13836fe2468e4ebfcb1f3e601fa23c8eda694be/apps/suganya-subramanian_secureops_dashboard/recording.json)
- [TrueForge hackathon overview](https://www.wemakedevs.org/hackathons/trueforge)
- [TrueForge official rules](https://www.wemakedevs.org/hackathons/trueforge/rules)
- [OpenSRE evidence model](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/core/state/evidence.py)
- [OpenSRE investigation pipeline](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/investigation-pipeline-architecture.md)
- [SecureOps + Guardian product research](../research/SECUREOPS_GUARDIAN_PRODUCT_RESEARCH.md)
