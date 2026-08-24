# SecureOps + Guardian: win-oriented product research

Research date: 24 August 2026. This report uses official event pages, public submission artifacts, official repositories, and the OpenSRE primary-source research already captured in this workspace. Statements marked **Fact** report what sources show; statements marked **Inference** or **Recommendation** are product judgments. No product-plan or glossary file was changed.

## Executive conclusion

The concern is valid: the current plan did **not** remove every security mechanism, but it changed security from the product's primary job into a constraint on an availability fix. The original plan felt like SecureOps; the current plan reads mainly like an SRE incident responder.

Do not restore the original four-format scanner. Restore **security as the incident and decision being resolved**.

The strongest hybrid is:

> **SecureOps Incident Change Guardian detects a security regression introduced by a deployment, proves the smallest configuration repair closes the exposure without breaking the legitimate service path, and asks a human to approve the exact remediation PR.**

This is an upsert into the current plan, not a new project. Keep its strongest machinery—evidence provenance, a red herring, four-state proof, fail-closed outcomes, TrueForge subagents, sandbox validation, exact approval, persistence, and idempotent PR creation—but change the fixed incident from “the policy blocks PostgreSQL” to “the policy opens forbidden egress.” Add a judge-readable **Security Finding** with severity, affected asset, exploit path, blast radius, causal evidence, and secure patch.

That shape is more likely to compete than either a broad SecureOps dashboard or a generic incident responder. It makes security the reason the agent exists while giving every major TrueForge feature a necessary role.

## 1. What the winning Archestra SecureOps Dashboard actually was

### Published product

- **Fact:** SecureOps Dashboard won **Most Useful App** in the Archestra Apps Hackathon 2026. The official winner page calls it a DevSecOps platform for auditing Dockerfiles, Kubernetes YAML, and Terraform. [Official Archestra winners page](https://archestra.ai/apps-hackathon)
- **Fact:** Its published prompt asked to connect a GitHub repository using a personal access token, explore Dockerfiles, Kubernetes YAML, Terraform, and GitHub Actions, and show an AI-generated security score, findings, recommendations, and secure-code suggestions. [Official SecureOps gallery entry](https://archestra.ai/apps-hackathon/gallery/suganya-subramanian_secureops_dashboard)
- **Fact:** The public metadata records 38 user prompts, 29 app versions, Gemini 3.5 Flash Lite, and four MCP entries: `archestra` plus three SecureOps-named app servers. [Official submission recording](https://github.com/archestra-ai/apps-gallery/blob/c13836fe2468e4ebfcb1f3e601fa23c8eda694be/apps/suganya-subramanian_secureops_dashboard/recording.json)

### What the public artifact proves

The official recording bundle contains the replay, transcript, and an embedded HTML/JavaScript snapshot. Inspecting that snapshot shows:

- The GitHub connection calls GitHub's REST API directly from the app after asking for a PAT; it is not shown using a GitHub MCP integration.
- It fetches the repository root contents and loads root-level files into an editor.
- `Analyze Security` calls a SecureOps-named MCP tool with the configuration text.
- The rendered result is hard-coded in the app snapshot: score `85`, `Low` risk, a `Critical` “Root User Detected” finding, generic recommendation text, and a placeholder secure-code suggestion. The JavaScript does not use the MCP response to populate those fields.
- The visible `Copy` and `Apply` buttons have no handlers in the recorded snapshot.

These are **facts about the submitted replay artifact**, not an accusation about unrecorded versions or infrastructure. The recording proves a polished MCP-backed app interaction; it does not independently prove a real scanner generated the displayed diagnosis or that applying a fix worked. [Pinned public recording bundle](https://github.com/archestra-ai/apps-gallery/blob/c13836fe2468e4ebfcb1f3e601fa23c8eda694be/apps/suganya-subramanian_secureops_dashboard/recording.json)

### Is its source code available?

There is no conventional, standalone SecureOps source project linked by the official entry. The public gallery repository says submissions consist of replayable app-session recordings rather than hand-written project source; this submission directory contains only `recording.json`. The embedded snapshot is inspectable, but it is not a separately packaged, documented, runnable SecureOps repository. [Pinned apps-gallery README](https://github.com/archestra-ai/apps-gallery/blob/c13836fe2468e4ebfcb1f3e601fa23c8eda694be/README.md)

Therefore, it is inaccurate to describe this specific winner as an open-source SRE/security agent. It was an Archestra App submission.

### Why it won

- **Fact:** Archestra did not publish a project-specific judging explanation. Its **Most Useful App** criterion was whether the app addressed a recurring workflow, worked as shown, and would be useful to someone other than its builder. [Official Archestra rules](https://archestra.ai/apps-hackathon/quickstart)
- **Inference:** SecureOps aligned well because configuration security review is immediately recognizable, recurring, useful beyond the creator, and easy to understand visually. We cannot honestly claim that technical scanner depth, multi-agent behavior, or remediation execution caused the win.

The lesson to borrow is **clear security workflow + visual decision-ready output**, not its breadth or implementation.

## 2. Why the same dashboard would not be enough for TrueForge

The two hackathons reward different work.

| Dimension | Archestra Apps Hackathon | TrueForge Agent Harness Hackathon |
| --- | --- | --- |
| Build surface | Describe an app in chat; Archestra generated an interface connected through MCP | Build an agent whose runtime visibly runs through TrueForge |
| Primary entry proof | Finished app, build/session recording, prompt, connected MCP servers | Public runnable source, README, about-three-minute agent demo, TrueForge write-up |
| Winner relevant here | Most Useful App: recurring, works as shown, useful to others | Six equal criteria: impact, originality, technical excellence, sponsor-tool use, control/safety, presentation |
| Key technical expectation | MCP-connected app use was encouraged | A real tool call, code in the sandbox, and a human stop before the sensitive action are explicit expectations |
| Agent-runtime depth | Not required for the SecureOps category win | TrueForge must be central rather than a thin wrapper |

Sources: [Archestra event and winners](https://archestra.ai/apps-hackathon), [Archestra quickstart/rules](https://archestra.ai/apps-hackathon/quickstart), [TrueForge hackathon page](https://www.wemakedevs.org/hackathons/trueforge), and [TrueForge rules](https://www.wemakedevs.org/hackathons/trueforge/rules).

**Fact:** TrueForge's Best Use track explicitly highlights real MCP tools, generated code in a sandbox, human approval, subagents, and sessions that survive reconnects. The official advice also says one narrow end-to-end job scores better than several half-finished features. The official project list already names an incident responder as its “Hero project.” [Official TrueForge hackathon page](https://www.wemakedevs.org/hackathons/trueforge)

**Recommendation:** A broad configuration scanner risks looking like a dashboard with TrueForge underneath. A generic incident responder risks looking like the organizer's example. Guardian needs the intersection: **a security regression, causal investigation, adversarial remediation choice, deterministic proof, and controlled action**.

## 3. What each Guardian plan gets right and wrong

### Original plan backup

Source: `/tmp/INCIDENT_CHANGE_GUARDIAN_PRODUCT_PLAN.before-proof-carrying.md`

What it gets right:

- Security is visible in the name, target users, workflow, output, and pitch.
- It preserves the SecureOps concepts of changed-infrastructure inspection, concrete findings, recommendations, and safer code.
- It adds an agentic progression that the Archestra app did not demonstrate: incident evidence, subagents, sandbox testing, approval, PR creation, and a durable case record.

What weakens it:

- Dockerfile, Kubernetes, Terraform, and GitHub Actions scanning is too much for seven days.
- A static IaC finding may be real but unrelated to the incident. The example “missing resource limits” does not by itself explain checkout failure.
- A scorecard, generic findings, incident correlation, patch generation, multiple formats, failure handling, persistence, and a real PR are too many surfaces to make reliable.
- The official hackathon already suggests incident response, so breadth does not create originality.

### Current proof-carrying plan

Source: `INCIDENT_CHANGE_GUARDIAN_PRODUCT_PLAN.md`

What it gets right:

- One reproducible incident and one deterministic policy model are feasible.
- The unsafe quick fix versus least-privilege fix creates a memorable demo.
- Evidence-linked claims, a hidden answer, a red herring, `INCONCLUSIVE`, exact approval, and idempotency make the agent credible rather than theatrical.
- TrueForge necessarily owns MCP calls, subagents, sandbox execution, persistence, approval, and the final write.

What weakens it:

- The trigger and primary user job are an availability outage. Security appears mainly as “do not weaken egress while restoring service.”
- It explicitly removes broad security scanning without replacing it with a clearly named security result or security incident.
- Its language positions the product as SRE remediation, close to the official Hero project.
- Thirteen acceptance criteria plus evidence schemas, claim states, hidden answers, bounded calls, diff hashes, reconnect, and idempotency may still be heavy. Several should be implementation tests, not demo features.

### Correct synthesis

Do not choose between “broad security scanner” and “narrow availability agent.” Use the current narrow architecture to execute a **security-first job**.

## 4. OpenSRE features worth keeping

The existing OpenSRE research in this workspace is directionally correct. The strongest transferable patterns are:

1. **Evidence provenance:** tool results retain stable source and tool references. [OpenSRE evidence model](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/core/state/evidence.py)
2. **Validated versus unresolved claims:** do not present a plausible model inference as established root cause. [OpenSRE diagnosis model](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/core/domain/diagnosis/result.py)
3. **Bounded investigation:** cap loops, reuse duplicate results, and preserve partial evidence instead of inventing certainty. [OpenSRE investigation pipeline](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/investigation-pipeline-architecture.md)
4. **Adversarial fixtures:** the expected answer can require evidence and penalize accepting a red herring. [OpenSRE synthetic tests](https://github.com/Tracer-Cloud/opensre/tree/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/tests/synthetic)
5. **Proposal/execution separation:** approval binds a deterministic proposal, and an idempotency marker prevents duplicate execution. [OpenSRE GitHub workflow pattern](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/github-workflow-tools.mdx)

Keep these as small Guardian-owned schemas and tests on TrueForge. Do not use OpenSRE's runtime, agent loop, integrations, approvals, or UI; that would hide TrueForge behind another agent platform.

## 5. Three hybrid product shapes

Scores are product judgments from **1 (weak) to 5 (strong)**. The six columns mirror the official equally weighted criteria.

| Product shape | Impact | Originality | 7-day technical feasibility | Visible TrueForge use | Control and safety | 3-minute presentation | Total /30 |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| **A. Security Regression Guardian** | 5 | 5 | 4 | 5 | 5 | 5 | **29** |
| **B. Availability Guardian with SecureOps proof** | 5 | 4 | 4 | 5 | 5 | 5 | **28** |
| **C. SecureOps PR Repair Agent** | 4 | 3 | 5 | 4 | 4 | 4 | **24** |

### A. Security Regression Guardian — recommended

**Job:** Investigate a post-deployment security exposure and prepare the smallest proven-safe fix.

**Fixed incident:** commit `4c21` broadens a checkout NetworkPolicy so the legitimate PostgreSQL path still works but a forbidden external path becomes reachable. A synthetic security alert fires after deployment.

The agent:

1. delegates the GitHub/configuration investigation and runtime-exposure evidence to two TrueForge subagents;
2. produces one `Critical` Security Finding with affected workload, changed rule, exposure path, blast radius, and evidence IDs;
3. rejects a blunt “deny all egress” containment because it breaks checkout's database dependency;
4. proves a narrow policy permits DNS and PostgreSQL:5432 while denying the forbidden path;
5. pauses for approval of the exact diff, then creates/reuses one PR.

Four-state sandbox proof:

| Candidate | Legitimate DB path | Forbidden external path | Decision |
| --- | --- | --- | --- |
| Last-known-good | Allow | Deny | Secure and functional |
| Suspect deploy | Allow | Allow | Exposure reproduced |
| Blunt containment | Deny | Deny | Rejected: breaks checkout |
| Guardian repair | Allow | Deny | **Secure remediation** |

Why it is strongest: security is the trigger, evidence, output, validation invariant, and user value. It is more distinctive than the organizer's generic incident responder and deeper than a static scanner. The visual matrix makes it understandable in seconds.

### B. Availability Guardian with SecureOps proof — smallest change from the current plan

Keep the current checkout-to-PostgreSQL outage scenario. Restore a named **SecureOps Change Review** stage and result card containing severity, rule, incident relevance, blast radius, unsafe alternative, and secure patch. The broad-egress rejection remains the security proof.

This is excellent technically and easiest to adopt without rewriting the plan. Its weakness is positioning: the user still hires it to restore availability, so security remains a constraint rather than the primary problem. It is a strong fallback if implementation of a security-alert fixture is delayed.

### C. SecureOps PR Repair Agent — safest schedule, weaker originality

Move before deployment: inspect changed Dockerfile and Kubernetes files in one PR, run a very small deterministic rule pack, generate a patch, run checks in the TrueForge sandbox, and ask before pushing the remediation commit or commenting on the PR.

This keeps security central and is easier to build than incident correlation. It is also close to existing security review bots and to the Archestra winner, gives session persistence and incident evidence less purpose, and has a flatter three-minute story. Choose it only if incident-fixture work threatens the end-to-end delivery.

## 6. Exact recommendation for the existing plan

Use **Shape A** by editing the current plan rather than creating another plan.

### Keep unchanged

- TrueForge as the sole agent harness.
- One GitHub repository, one Kubernetes manifest, two subagents, one sandbox verifier, one approval-gated PR tool.
- Evidence IDs and `validated` / `refuted` / `unknown` claims.
- Hidden expected answer, bounded investigation, `INCONCLUSIVE`, denial, reconnect, diff-bound approval, and idempotency.
- No live production credentials, deployment, merge, rollback, voice, Slack, or large custom dashboard.

### Restore or change

- Name: **SecureOps Incident Change Guardian**.
- Primary user: an on-call platform/security engineer at a 10–100 person Kubernetes SaaS team without a 24/7 SRE or security-operations function.
- Trigger: a security exposure alert after a deployment, not an availability alert.
- Fixed regression: suspect NetworkPolicy opens forbidden egress while legitimate checkout traffic still works.
- Security output: one concrete finding with `severity`, `asset`, `changed_file/rule`, `exposure_path`, `blast_radius`, `incident_relevance`, `evidence_ids`, and `proposed_fix`.
- Four states: last-good, suspect exposure, over-restrictive containment, least-privilege Guardian repair.
- Pitch: “Guardian proves the repair closes the exposure without breaking checkout, then waits for approval before creating the PR.”

### Do not restore

- Four configuration formats in the MVP.
- An opaque numeric security score. The winning SecureOps recording itself shows why this can be confusing: `85 / Low risk` beside a `Critical` finding. Prefer exact severity, evidence, exposure, and pass/fail contracts.
- Generic recommendations or placeholder secure-code suggestions.
- “Apply fix” UI that is not wired to an approval-enforced action.
- A general dashboard, integration catalog, or OpenSRE runtime.

### If time remains

Add a Dockerfile `USER` rule as a second policy pack only after the full security-alert-to-PR flow succeeds three times. Do not include it in the main three-minute story.

## 7. Winning demo story

1. **0:00–0:20 — Problem:** “A deployment silently opened a forbidden network path from checkout. The fastest containment would also break checkout.”
2. **0:20–0:55 — TrueForge investigates:** two subagents read the real demo GitHub change and owned security/exposure fixtures through MCP.
3. **0:55–1:20 — Security finding:** show the changed rule, critical exposure, blast radius, evidence links, and one refuted red herring.
4. **1:20–1:50 — Sandbox proof:** suspect permits the forbidden path; deny-all closes it but breaks the DB path; Guardian's least-privilege patch passes both contracts.
5. **1:50–2:20 — Human control:** show exact diff, proof, proposal ID, and TrueForge's approval pause. Refresh/reconnect if reliable.
6. **2:20–2:45 — Action:** approve and show exactly one remediation PR; retry returns the same URL.
7. **2:45–3:00 — Why TrueForge:** MCP evidence, subagents, sandbox, approval, and persistent state are the product's control plane.

## Final candid assessment

No plan can guarantee a prize. Shape A gives the best odds because it satisfies all six criteria with one visible causal story:

- **Impact:** prevents a real security exposure without causing an outage.
- **Originality:** not a generic scanner and not the organizer's generic incident responder.
- **Technical excellence:** evidence, adversarial candidate fixes, deterministic proof, and idempotent execution.
- **Sponsor-tool use:** every major TrueForge capability performs necessary work.
- **Control and safety:** safe sandbox, fail-closed evidence handling, and exact human authorization.
- **Presentation:** one exposure, one bad containment, one proven repair, one approved PR.

The broad SecureOps idea was not wrong. Its *breadth* was the risk. The right correction is to make one security regression deep, causal, proven, and safely actionable.

