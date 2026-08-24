# SecureOps — TrueForge Security Review and Repair Agent

Updated: 24 August 2026. This is the standalone, security-first option for comparison. It preserves the winning Archestra SecureOps product idea while rebuilding it as a real TrueForge agent rather than a dashboard.

## Product decision

Build **SecureOps**, an approval-gated infrastructure security review and repair agent for small teams using GitHub, Docker, and Kubernetes.

SecureOps reads a selected repository change, delegates focused security reviews, produces deterministic and evidence-linked findings, generates the smallest secure patch, validates the patch in the TrueForge sandbox, and waits for human approval before creating one remediation pull request.

It is not an incident-response agent. Its job happens before a risky configuration reaches production.

### One-sentence pitch

> **SecureOps turns an infrastructure change into evidence-linked security findings and a sandbox-verified remediation PR—only after you approve the exact patch.**

## Relationship to the Archestra winner

The Archestra SecureOps Dashboard won Most Useful App by making infrastructure security review immediately understandable: select configuration, see severity findings, read recommendations, and view safer code.

This plan preserves that product identity but strengthens the implementation for TrueForge:

| Archestra SecureOps experience | TrueForge SecureOps agent |
| --- | --- |
| Paste or browse infrastructure files | Read one real demo GitHub change through MCP |
| AI security score | Deterministic rule results plus evidence-linked agent explanation |
| Findings and severity | Rule ID, severity, affected file/line, exploit path, and evidence ID |
| Recommendations | Minimal proposed patch with trade-offs and limitations |
| Secure-code suggestion | Apply the patch in a disposable sandbox and rescan it |
| Copy/Apply controls | Exact approval-gated, idempotent remediation PR |
| Dashboard interaction | TrueForge session, subagents, trace, approval, and compact result card |

Do not copy the winner's code, UI, prompts, branding assets, or hard-coded score behavior. SecureOps is inspiration for the recurring security workflow, not an implementation dependency.

## Target user and job

### Primary user

A DevSecOps or platform engineer at a 10–100 person SaaS team that uses GitHub, Docker, and Kubernetes but lacks a dedicated application-security team.

### Moment of need

A repository change modifies the checkout container and deployment manifests. The reviewer needs to know whether it introduces a privilege escalation path and how to repair it safely before merge or deployment.

### Job to be done

> Review the security-sensitive infrastructure changes, explain the concrete exposure, prove the proposed remediation removes it, and prepare a human-controlled PR.

### Useful outcome

- Review only the changed security-sensitive files instead of scanning the whole organization.
- Separate deterministic rule failures from model interpretation.
- Show how multiple weak settings combine into an exploit path.
- Provide a tested patch rather than generic advice.
- Preserve a durable evidence and approval record.

## Fixed demo change: `checkout-container-privilege-regression`

The MVP uses one public demo repository and one deliberately vulnerable change.

1. `Dockerfile` removes the non-root `USER 10001` instruction, so the image defaults to root.
2. `k8s/checkout-deployment.yaml` sets `securityContext.privileged: true` and permits privilege escalation.
3. An unrelated memory-limit change is included as a red herring. It may affect reliability, but it is not evidence of the privilege exposure.
4. SecureOps must identify one combined **Critical** finding: the checkout workload can run a privileged root container.
5. The proposed patch restores a non-root image user and requires `runAsNonRoot: true`, `privileged: false`, and `allowPrivilegeEscalation: false`.

### Transparent rule pack

Implement exactly three deterministic rules:

| Rule | Pass condition | Failure meaning |
| --- | --- | --- |
| `SEC-CONTAINER-001` | Dockerfile declares a non-root final `USER` | Image may run as root by default |
| `SEC-K8S-001` | Workload requires non-root execution and disables privilege escalation | Process may gain more privileges than intended |
| `SEC-K8S-002` | No container is privileged | Container may bypass normal isolation controls |

Show **rules passing: 0/3 → 3/3**, not an opaque numeric security score.

### Required four-state validation

| Candidate | Non-root image | Escalation blocked | Privileged disabled | Decision |
| --- | --- | --- | --- | --- |
| Last-known-good | Pass | Pass | Pass | Secure baseline |
| Suspect change | Fail | Fail | Fail | Critical exposure reproduced |
| Partial quick fix | Pass | Fail | Fail | Rejected: exploit path remains |
| SecureOps patch | Pass | Pass | Pass | **Validated remediation** |

The validator proves only the declared fixture rules. It must not be described as a full container escape test, Kubernetes penetration test, or replacement for a production scanner.

## Product contract

### Inputs

- One public/demo GitHub repository and selected base/head commits.
- Changed Dockerfile and Kubernetes deployment manifest.
- Read-only repository metadata returned through GitHub MCP tools.

### Security Finding

Every finding contains:

- `finding_id` and deterministic `rule_ids`;
- severity and affected asset;
- changed file and line references;
- exploit path and blast-radius explanation;
- supporting evidence IDs;
- proposed remediation and limitations.

### Evidence and claim states

- **Validated:** supported by a deterministic rule result or named repository fact.
- **Refuted:** plausible but contradicted by available evidence.
- **Unknown:** not established by the selected files and checks.

### Terminal outcomes

- **`REMEDIATION_READY`:** the finding is supported and the proposed patch passes all three rules.
- **`INCONCLUSIVE`:** required files or rule evidence are missing; no proposal is created.
- **`NO_VALID_REMEDIATION`:** tested patches still fail at least one security rule.
- **`DENIED`:** the human rejects the proposal and GitHub remains unchanged.
- **`PR_CREATED`:** the exact approved proposal creates or reuses one remediation PR.

## Agent journey

1. User asks SecureOps to review the selected checkout infrastructure change.
2. The TrueForge root agent declares its file scope, read-only tools, rule pack, and write boundary.
3. It delegates to two TrueForge subagents:
   - `container-security-reviewer` inspects the Dockerfile and rule output.
   - `kubernetes-security-reviewer` inspects the deployment manifest and rule output.
4. The root combines their evidence into one exploit-path finding and refutes the memory-limit change as part of that security finding.
5. It generates the minimum cross-file patch.
6. The TrueForge sandbox applies the patch to a disposable fixture and runs the four-state validator.
7. A compact card shows severity, evidence, exploit path, changed files, rejected partial fix, passing patch, and limitations.
8. TrueForge pauses `create_security_remediation_pull_request` for approval of the exact proposal ID and diff hash.
9. Denial performs no write. Approval creates exactly one PR; retry returns the same PR URL.
10. The persistent TrueForge session retains the review, proof, approval decision, and PR result.

## MVP

| Capability | Required behavior | Proof in demo/tests |
| --- | --- | --- |
| Real GitHub read | Read selected commit range and changed files through MCP | Trace shows repository, commits, file paths, and content |
| Two focused subagents | Review Docker and Kubernetes evidence independently | Parent trace visibly delegates and consolidates |
| Deterministic rules | Three checked-in rules return file/line/rule evidence | Raw rule results are distinct from LLM explanation |
| Combined exploit path | Explain why root plus privileged execution is Critical | Finding cites both file sources and rule IDs |
| Red-herring handling | Memory-limit change is real but unrelated to privilege escalation | Result labels it non-causal rather than ignoring it |
| Sandbox repair proof | Suspect and partial states fail; full patch passes | Four-state matrix and command output are visible |
| Approval-bound write | Approval displays exact repo, files, diff hash, and test result | Denial creates zero branches/PRs |
| Idempotency | Retry of the same proposal creates no duplicate PR | Existing PR URL is returned |
| Persistent review | Reconnect restores the same pending proposal | Resume while paused without changing content |

## Architecture

```text
Engineer / TrueForge UI
          │ review request + approve/deny
          ▼
TrueForge root SecureOps agent + persistent session
  ├─ container-security-reviewer
  │    └─ GitHub MCP reads + deterministic rule evidence
  ├─ kubernetes-security-reviewer
  │    └─ GitHub MCP reads + deterministic rule evidence
  ├─ exploit-path synthesis + patch proposal
  ├─ TrueForge sandbox
  │    └─ allow-listed four-state security validator
  └─ create_security_remediation_pull_request
       └─ TrueForge approval → scoped GitHub write
```

TrueForge must visibly own the model loop, delegation, MCP calls, sandbox, session state, approval, and final write. MCP servers and validator commands are deterministic adapters, not hidden agents.

## Safety boundary

- Public demo repository only; no customer or production data.
- Read tools and the write tool use separate least-privilege credentials.
- Repository text and MCP output are untrusted and cannot override approval policy.
- Sandbox receives fixture files and allow-listed commands but no GitHub, model, cloud, or SSH credentials.
- The only external write is creating/reusing one PR after approval.
- SecureOps cannot merge, deploy, restart, access a cluster, or modify repository content after approval.

## Explicitly out of scope

- Incident alerts, logs, metrics, runtime exposure evidence, or root-cause analysis.
- Terraform, GitHub Actions, Helm, cloud accounts, registries, and organization-wide scanning.
- More than the three declared rules or the two declared file types.
- General vulnerability scanning, CVE detection, secret scanning, compliance certification, or penetration testing.
- OpenSRE runtime, agent loop, integrations, UI, or approval system.
- Custom dashboard, Slack, tickets, voice, notifications, merge, deployment, or automatic remediation.

## Acceptance criteria

1. The agent reads only the selected commit range and changed Docker/Kubernetes files.
2. Raw rule results identify all three failures with file/line references.
3. The final Critical finding cites both the Dockerfile and Kubernetes evidence.
4. The memory-limit red herring is not included in the privilege exploit path.
5. Missing required evidence returns `INCONCLUSIVE` and no proposal.
6. The partial fix remains rejected because two rules still fail.
7. The SecureOps patch passes all three rules in the sandbox.
8. The proposal contains repository, branches, changed files, diff hash, rule results, and limitations.
9. Changing the diff invalidates approval.
10. Denial creates no branch or PR; repeated approval creates exactly one PR.
11. Reconnecting restores the same pending proposal.
12. The complete flow succeeds three times from a clean fixture and fits a three-minute demo.

## Hackathon judging fit

| Criterion | SecureOps proof | Risk |
| --- | --- | --- |
| Impact | Recurring security review for teams without AppSec specialists | Market already has many scanners |
| Originality | Cross-file exploit-path reasoning plus validated repair | Less original than the hybrid security-incident story |
| Technical excellence | Deterministic rules, red herring, four states, idempotent execution | Must avoid a hard-coded happy path |
| Sponsor-tool use | MCP, subagents, sandbox, persistence, and approval are necessary | Incident/session depth is lighter than the hybrid |
| Control and safety | Fail closed and approve exact external write | PR is reversible, so describe it honestly |
| Presentation | Familiar before/after security review and real PR | Needs crisp proof to avoid looking like a dashboard |

**Win-oriented assessment:** approximately **24/30** against the six equally weighted criteria. It is the easier and safer build, but it competes in a crowded security-scanner category.

## Seven-day build sequence

| Day | Required outcome |
| --- | --- |
| Aug 24 | Public repo, Qodo, TrueForge, one GitHub MCP read, one sandbox command |
| Aug 25 | Vulnerable commit history, three deterministic rules, four fixture states |
| Aug 26 | Two subagents, typed evidence, combined finding, and red-herring test |
| Aug 27 | Patch generation, sandbox rescan, exact approval, and idempotent PR |
| Aug 28 | `INCONCLUSIVE`, denial, reconnect, compact result card, full rehearsal |
| Aug 29 | README, threat model, tests, AI-use disclosure, backup/final recording |
| Aug 30 | Freeze, validate public links, and submit early |

## Three-minute demo

| Time | Story |
| --- | --- |
| 0:00–0:20 | Show risky checkout infrastructure change and explain the small-team review gap |
| 0:20–0:50 | TrueForge delegates Docker and Kubernetes reviews and reads the real demo repo |
| 0:50–1:20 | Show Critical exploit path, three raw rule failures, and refuted memory red herring |
| 1:20–1:50 | Sandbox rejects the partial fix and validates the complete SecureOps patch |
| 1:50–2:20 | Show exact evidence, before/after rules, diff, proposal ID, and limitations |
| 2:20–2:45 | Pause for approval, refresh/reconnect, then approve |
| 2:45–3:00 | Show one PR and summarize why TrueForge is central |

## Sources

- [Archestra Apps Hackathon winners](https://archestra.ai/apps-hackathon)
- [SecureOps Dashboard official gallery entry](https://archestra.ai/apps-hackathon/gallery/suganya-subramanian_secureops_dashboard)
- [SecureOps public recording bundle](https://github.com/archestra-ai/apps-gallery/blob/c13836fe2468e4ebfcb1f3e601fa23c8eda694be/apps/suganya-subramanian_secureops_dashboard/recording.json)
- [TrueForge hackathon overview](https://www.wemakedevs.org/hackathons/trueforge)
- [TrueForge official rules](https://www.wemakedevs.org/hackathons/trueforge/rules)
- [SecureOps + Guardian product research](../research/SECUREOPS_GUARDIAN_PRODUCT_RESEARCH.md)
