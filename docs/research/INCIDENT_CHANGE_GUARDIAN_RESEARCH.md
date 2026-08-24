# Incident Change Guardian — research and build decision

Research date: 21 August 2026. This note separates published facts from the recommended hackathon scope.

## Decision in one paragraph

Build **an agent**, not a new agent platform. Incident Change Guardian should be a narrowly scoped, approval-gated DevSecOps incident-response agent running on TrueForge. It should reuse the strongest part of the Archestra SecureOps Dashboard—real infrastructure-as-code (IaC) scanning and actionable secure fixes—but turn that dashboard pattern into a safe action workflow: investigate an incident, scan the changed Docker/Kubernetes/Terraform files, validate a proposed patch in a sandbox, and require human approval before opening a remediation pull request. Do **not** make phone calling part of the core submission; at most, add it as a small, approval-gated notification after the reliable core flow works.

## 1. What the SecureOps Dashboard actually did

The public Archestra gallery description is precise:

- It was a **DevSecOps platform** that audited **Dockerfiles, Kubernetes YAML, and Terraform** through GitHub REST API integrations.
- Its summarized build prompt asked for: connect a repository with a personal access token; browse Dockerfiles, Kubernetes YAML, Terraform, and GitHub Actions workflows; run AI-powered security audits; show a security score, findings, recommendations, and secure-code suggestions.
- It used four MCP servers and was built through 38 prompt iterations.

Source: [SecureOps Dashboard gallery entry](https://archestra.ai/apps-hackathon/gallery/suganya-subramanian_secureops_dashboard).

The winning lesson is not “copy the dashboard.” It is: choose a painful, specific workflow; inspect real artefacts; give decision-ready findings; then show the recommended fix. Archestra’s event was designed around chat-generated **apps** with MCP-connected tools/data and a public gallery. Its own overview says Archestra generated the interface and used MCP to connect it to tools and data, with no separate deployment/login flow required for those hackathon apps. Source: [Archestra Apps Hackathon winners and format](https://archestra.ai/apps-hackathon/).

### What we should retain from SecureOps

| Retain | Change for TrueForge |
| --- | --- |
| GitHub-connected repository inspection | Use a repository you control and read it through a GitHub MCP server. |
| Dockerfile, Kubernetes YAML, Terraform, and workflow scanning | Focus each demo on files touched by the suspect deployment/change. |
| Findings, score, recommendation, safer code | Make the output an evidence report plus a concrete patch/rollback proposal. |
| Dashboard-style visual clarity | Use the TrueForge agent trace/timeline as the primary experience; do not spend the week rebuilding a large dashboard. |
| Suggested fixes | Execute deterministic tests on the patch in the sandbox before proposing a write. |

## 2. What TrueForge is—and the hackathon implication

TrueForge is an open-source **agent harness**, not a prompt-to-app generator. Its documentation says the harness runs the agent loop around an LLM—planning/tool routing, context management, sandboxing, human approvals, and persistent session state. It exposes that runtime through a bundled chat UI, HTTP API with TypeScript SDK, and an embeddable React UI SDK. Sources: [TrueForge introduction](https://trueforge.dev/introduction), [repository README](https://github.com/truefoundry/trueforge).

Therefore the entry is an **agent built with TrueForge**. You do not need to build a second TrueForge-like platform. A custom app/front end is optional and only helpful if it makes the agent’s safety and evidence clearer.

### Can it be exposed/deployed?

Yes, but deploy it safely:

- TrueForge’s Docker Compose/Helm “hosted mode” is intended for a shared deployment; its UI and HTTP API are served by the server. Its docs describe `PUBLIC_BASE_URL` for the public origin used by OAuth callbacks.
- The bundled React UI may also be embedded in another application.
- Do **not** expose the local/standalone mode to the internet: the official docs explicitly say it has no login by default and should remain on localhost. For a shared/public deployment, use hosted mode and configure OIDC before exposing it.

Sources: [Quickstart](https://trueforge.dev/quickstart), [authentication and public deployment guidance](https://trueforge.dev/authentication/overview), [chat UI](https://trueforge.dev/chat-ui).

For a hackathon demo, localhost plus a public video is sufficient unless the official submission page specifically requires a live link. If deploying, use a demo-only account/repository, least-privilege credentials, OIDC, HTTPS, and a non-public sandbox provider key.

## 3. Incident Change Guardian: problem and users

### Problem

After a deployment, an engineer must rapidly answer: *what changed, is it responsible, what is the smallest safe recovery, and who has approved it?* Existing dashboards can surface alerts and static scan findings, but they often leave the human to join logs, Git history, deployment configuration, security policy, and change-control records manually.

### User and value

The user is an on-call engineer, platform engineer, or security engineer responding to a **demo incident**. The agent reduces investigation time while retaining human control over actions that modify systems.

This is valuable because it makes the boundary explicit:

1. The agent may read evidence autonomously.
2. It may analyse an untrusted patch only inside an isolated sandbox.
3. It must explain its proposed change and risk.
4. A human must approve the write action.
5. The agent records the evidence and outcome in the durable session.

This maps naturally to TrueForge: MCP servers provide external tools; the sandbox runs code/files separately from the agent server and infrastructure; the approval system pauses a sensitive MCP tool call until Allow/Deny; subagents can investigate independent evidence in parallel. Sources: [MCP servers](https://trueforge.dev/mcp-servers), [sandbox](https://trueforge.dev/sandbox), [agent tool approval](https://trueforge.dev/create-agent/overview#whats-in-an-agent), [subagents](https://trueforge.dev/key-features/subagents).

## 4. Exact recommended demo architecture

```text
Demo alert / fixtures
        |
        v
Incident Change Guardian (TrueForge root agent + persistent session)
   |             |                      |
   |             |                      +-- TrueForge sandbox
   |             |                            - policy/lint tests
   |             |                            - patch validation
   |             |                            - no production credentials
   |             |
   |             +-- parallel subagent A: deployment diff + IaC scan
   |             +-- parallel subagent B: logs/metrics + blast-radius analysis
   |
   +-- GitHub MCP (read commits/files/PRs; write PR is approval-gated)
   +-- optional demo incident/log MCP (read only)
                         |
                         v
        Evidence report -> proposed patch -> human Allow/Deny -> GitHub PR
```

### A three-minute happy path

1. Start with a fixed alert: “checkout errors rose after release `4c21`.” Use synthetic logs/metrics and a repository you own.
2. The root agent reads the incident and fans out two narrowly defined investigations. Show the subagent traces/results.
3. It identifies a risky changed IaC file—e.g., a Dockerfile running as root, a Kubernetes manifest missing resource limits, or Terraform permitting public ingress—and reports SecureOps-style finding, severity, evidence, and safer replacement.
4. It generates a patch and runs deterministic validation in the TrueForge sandbox. Clearly show that the sandbox tests fixtures, not production.
5. It presents options (rollback / patch / no action) and recommends one. Creating the pull request is a write operation that pauses for **human approval**.
6. Allow it. The agent creates a PR in the demo repo, then produces an audit-ready summary with links/evidence.

### Scope guardrails

- One demo repo, one incident narrative, three or fewer deterministic security checks, one remediation PR.
- Real GitHub reads and a real PR are ideal; if write permissions create risk, use a custom demo MCP write action labelled “simulated rollback” and show its approval boundary honestly.
- Do not claim that an LLM’s security review is a full security scanner. Pair it with deterministic rules/tests and call out limitations.
- Do not provide production credentials to the demo, repository, browser recording, or sandbox.

## 5. SecureOps inside Guardian: yes, as a capability—not a second product

Include a small “SecureOps scan” stage in the investigation. The agent’s report can have:

| Field | Example |
| --- | --- |
| Changed file | `deploy/checkout.yaml` |
| Finding | Container has no CPU/memory limits |
| Evidence | Diff and policy-rule output |
| Incident relevance | Pod eviction/throttling can produce checkout failures |
| Proposed fix | Add resource requests/limits shown as a patch |
| Validation | Render/lint fixture and run the contained test suite in sandbox |
| Action | Create PR only after explicit approval |

That honors the SecureOps idea while proving the differentiator TrueForge judges should see: a harness-managed agent that acts safely. The product name can be **Incident Change Guardian, powered by SecureOps Scan**. Avoid presenting it as an unconnected dashboard + separate voice bot; one coherent incident/change-control story is stronger.

## 6. Voice / phone calling agent: feasible, but not core

### Is it technically possible?

Yes. TrueForge can connect to a custom remote MCP server by URL, so a small service can expose tools such as `create_incident_call`, `send_sms`, or `get_call_status`. The agent invokes those tools through TrueForge; a phone platform such as Twilio, Vapi, or LiveKit manages telephony/media. Source: [TrueForge MCP-server setup](https://trueforge.dev/mcp-servers).

However, TrueForge itself is the orchestration harness; it is not a PSTN/voice-media provider. Integrating phone calls adds a second event-driven system, consent/compliance needs, credentials, webhooks, retries, and demo failure modes. It can dilute the proof of sandbox, subagents, and approval—the features the project should make unmistakable.

### Recommended voice decision

**Core submission: no live phone calling.** Build and demo the Guardian flow first. If that is complete and rehearsed, add the small extension below:

> After human approval of the remediation plan—not before—the agent uses an approval-gated `notify_incident_commander` tool to place a call to **your own verified demo number**, saying a short, factual status message, or sends an SMS instead.

This makes the call an escalation/notification action, never the mechanism for making or approving a production change. A notification must not be the only audit record; show the same action in the session/PR report.

### Provider choice

| Option | Best fit | Why / trade-off |
| --- | --- | --- |
| **Twilio Voice** | Smallest reliable notification add-on | Direct programmable outbound calls plus webhooks/status callbacks. You implement the call text/flow and your MCP wrapper. Use only your own verified test number while developing. |
| **Vapi** | Conversational voice-agent experience | Built for voice-agent calls, but introduces another agent orchestration layer; this can confuse the “TrueForge is the harness” story. |
| **LiveKit** | Rich real-time browser/voice experience | Good if the product is fundamentally a live voice room; excessive for an incident notification extension and needs more real-time infrastructure. |

Use Twilio only after the core is stable. Do not build an autonomous caller that contacts real people without a per-call approval and an explicit allow-list. Before using any provider, verify country, recipient-consent, recording, and disclosure requirements for your location and intended recipients; this is product/legal research outside the TrueForge feature decision.

Primary provider docs to use during implementation: [Twilio Voice API overview](https://www.twilio.com/docs/voice/api), [Twilio outbound calls tutorial](https://www.twilio.com/docs/voice/tutorials/how-to-make-outbound-phone-calls/node), [Vapi phone calls](https://docs.vapi.ai/phone-calls), and [LiveKit Agents overview](https://docs.livekit.io/agents/).

## 7. Build order

1. **First:** TrueForge agent, model, GitHub MCP read operations, fixed fixture incident.
2. **Second:** SecureOps scan rules + sandbox validation. Prove that model/MCP credentials remain outside the sandbox, as the TrueForge sandbox design intends.
3. **Third:** subagents and a non-bypassable approval policy on `create_pull_request`.
4. **Fourth:** session resume/reconnect, clean readme, tests, demo rehearsal.
5. **Only if all four are solid:** Twilio MCP notification extension, called only after an explicit approval.

## Open questions to verify before implementation

- Confirm the official TrueForge submission rules, deadlines, and judging wording at the hackathon page immediately before work begins; event details can change.
- Confirm whether GitHub MCP exposes the exact PR-write tool and annotations needed, or implement a tiny custom MCP server with a strictly scoped demo token.
- Decide whether the write action will be a real pull request in a public demo repo (recommended) or a visibly simulated rollback.
- Decide whether phone escalation is a genuine user need in the story. If it is only “cool,” leave it out.

