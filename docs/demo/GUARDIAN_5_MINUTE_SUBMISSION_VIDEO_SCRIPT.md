# SecureOps Guardian five-minute submission demo

**Status:** rendered and verified from the supplied real screen recording

**Target duration:** exactly 5 minutes

**Source recording:** `Screen Recording 2026-08-30 at 12.31.36 PM.mov` (`8:36.250`, silent)

**Audience:** hackathon judges, security engineers, platform engineers, and on-call responders

**Story:** show the product a first-time viewer sees, follow the operator's real clicks and prompts, expose every important TrueForge execution surface, and finish with the human-approved pull request on GitHub.

## Truth and editing rules

- Use only the supplied real TrueForge recording for product visuals.
- Keep the operator's clicks, prompts, responses, agent cards, evidence, sandbox steps, approval state, and GitHub result in their recorded order.
- Compress only inactive wait periods. Do not fabricate tool results or replace the interface.
- GitHub evidence is real. Guardian Fixture observations are owned synthetic evidence. Daytona verification is deterministic static policy validation.
- Do not claim live-cluster access, Kubernetes admission, CNI enforcement, packet observation, deployment, merge, data access, or exfiltration proof.
- The final GitHub write is separately human-approved. Guardian does not merge the pull request.

## Timed narration and edit map

### Scene 1 — First look and purpose (`0:00–0:25`)

**Source:** recording `0:00–0:20`; preserve the welcome page and the click into the Agents Library.

**Screen focus:** session history, one saved Guardian agent, evidence boundary, and three capability cards.

**Voice-over:**

> This is SecureOps Guardian, a human-controlled security investigation agent built in TrueForge. It is designed for security, platform, and on-call engineers who need to move from a suspicious repository change to a reviewable, evidence-backed response. The left rail preserves sessions, the center holds the human conversation, and the investigation rail makes the execution visible instead of hiding it behind a final answer.

### Scene 2 — Architecture and three capability choices (`0:25–0:50`)

**Source:** recording `0:20–0:31`; hold the real welcome state long enough to read each card.

**Screen focus:** `Analysis only`, `Prepare remediation`, and `Open PR`.

**Voice-over:**

> One saved Guardian agent coordinates bounded specialist agents. Official GitHub MCP supplies real repository evidence. An owned Fixture MCP can contribute clearly labelled synthetic incident observations. Daytona provides an isolated sandbox for the pinned static verifier. The human chooses the ceiling: read-only analysis, a verified proposal with no write, or an approval-gated pull request.

### Scene 3 — The operator starts read-only (`0:50–1:15`)

**Source:** recording `0:25–1:08`; keep prompt preparation and submission at normal speed, then accelerate the inactive wait.

**Screen focus:** the exact repository, branch, commit, target file, and the explicit instruction not to remediate or write.

**Voice-over:**

> The operator begins with the lowest capability. The request names the repository, base branch, suspect commit, and exact NetworkPolicy file, then explicitly forbids remediation and GitHub writes. Guardian compiles that natural-language request into bounded scope. While we fast-forward the model wait, the right rail shows the real progress: scope, evidence, five GitHub MCP calls, zero sandbox steps, and zero write capability.

### Scene 4 — Finding and source-labelled evidence (`1:15–1:50`)

**Source:** recording `1:08–2:12`; preserve the finding, evidence, limitations, and receipt interactions; compress static dwell.

**Screen focus:** `SEC-NET-001`, unrestricted `0.0.0.0/0` egress, commit identity, target file, counts, and zero writes/approvals.

**Voice-over:**

> The read-only run completes with high-severity finding SEC-NET-001. Guardian traces unrestricted egress to the exact commit and file: a zero-prefix CIDR now permits outbound IPv4 traffic from checkout-api. The result cites consumed GitHub evidence and keeps its limits explicit. Repository facts do not prove deployment or live reachability. This run used no subagents, no Daytona sandbox, no approvals, and no writes.

### Scene 5 — The human asks for a verified fix (`1:50–2:15`)

**Source:** recording `2:12–2:35`; preserve the real typing and submission.

**Screen focus:** the operator's request to open a PR only after checking the change locally.

**Voice-over:**

> Now the human deliberately raises the capability. The follow-up asks Guardian to open a pull request, but only after checking that the proposed change works. This is not treated as blanket permission. Changing from analysis to remediation creates a new run with a new scope decision, new proof requirements, and separate control over any external write.

### Scene 6 — Scope confirmation before execution (`2:15–2:45`)

**Source:** recording `2:35–3:25`; show the interpreted request card and the operator's confirmation.

**Screen focus:** repository, base branch, suspect revision, target file, `OPEN_PR`, verifier pack, capability ceiling, and the confirmation control.

**Voice-over:**

> Guardian presents the interpreted request before it proceeds: the exact repository, main branch, frozen revision, NetworkPolicy target, OPEN_PR mode, and the selected k8s-network-egress verifier. The card also states the ceiling: Fixture reads, Daytona verification, candidate generation, and approval-bound GitHub writes. The operator confirms this interpretation. Guardian still cannot merge, deploy, or access a live cluster.

### Scene 7 — Two specialists investigate (`2:45–3:25`)

**Source:** recording `3:25–5:35`; accelerate waits while preserving agent-card clicks and tool lists.

**Screen focus:** Change Security Investigator and Exposure Evidence Investigator, with their Findings, Evidence, and Activity tabs.

**Voice-over:**

> TrueForge spawns two bounded specialists. The Change Security Investigator uses official GitHub evidence to reconstruct the change and identify the unrestricted egress rule. The Exposure Evidence Investigator makes four calls to the owned Fixture MCP: security alert, deployment observation, reachability observation, and service dependencies. The recording lets us click into each agent and inspect findings, evidence references, activity, call counts, and duration. Real and synthetic sources remain clearly separated.

### Scene 8 — Evidence joins into a causal case (`3:25–4:00`)

**Source:** recording `4:15–5:35`, using the agent workspace and overview; retain visible evidence identifiers and agent completion.

**Screen focus:** exact commit/file evidence, synthetic forbidden-destination observation, two completed agents, and persistent execution counts.

**Voice-over:**

> The evidence is joined only after both specialists complete. GitHub establishes what changed. The synthetic fixture reports that checkout-api reached the declared forbidden test destination. Guardian records the exact evidence identifiers and preserves unknowns instead of overstating runtime truth. The overview now shows two completed agents, ten MCP calls, their individual steps, and a persistent execution trace that a reviewer can reopen later.

### Scene 9 — Daytona verifies the candidate (`4:00–4:25`)

**Source:** recording `5:35–6:35`; accelerate sandbox execution while keeping all six validation steps and the successful Verify stage visible.

**Screen focus:** six Sandbox Validation steps, proposal identity, and four-state proof.

**Voice-over:**

> Next, the proposed NetworkPolicy change runs inside the Daytona sandbox with a pinned verifier. Six sandbox steps evaluate a four-state matrix: last-known-good is secure and functional, the suspect state is exposed, deny-all is secure but operationally rejected, and the Guardian candidate is both secure and functional. The proposal hash and verified candidate identity bind the later write to exactly what passed this proof.

### Scene 10 — Human approval and controlled GitHub write (`4:25–4:48`)

**Source:** recording `6:35–8:10`; compress tool waits, but preserve the pending approval, the human approval action, and completion of the GitHub MCP route.

**Screen focus:** GitHub MCP read checks, `Create pull request — Approval pending`, approval allowed, then `PR_CREATED`.

**Voice-over:**

> Before GitHub changes, Guardian rechecks branches, existing pull requests, file contents, and commits. The create-pull-request action stops at a visible human-in-the-loop gate. Only after the operator approves does the official GitHub MCP perform the controlled write. The terminal receipt records one write, one approval, the completed agents, six sandbox steps, eight GitHub MCP steps, and PR_CREATED.

### Scene 11 — Reviewable outcome on GitHub (`4:48–5:00`)

**Source:** recording `8:24–8:31`; slow the real GitHub review sequence slightly and finish on the pull request.

**Screen focus:** PR #2, proposal hash, verified candidate SHA-256, verifier version, four-state matrix, and `Ready to merge`.

**Voice-over:**

> The result is a real, reviewable pull request carrying the proposal hash, verified candidate identity, verifier version, and four-state proof. Guardian investigated with evidence, verified in Daytona, and wrote only after human approval. It leaves the final merge to the accountable reviewer.

## Recorded execution facts used in narration

| Stage | Recorded fact |
| --- | --- |
| Read-only analysis | `0 agents`, `6 tools`, `5 MCP`, `0 sandbox`, `0 writes`, `0 approvals` |
| Finding | `SEC-NET-001`, unrestricted `0.0.0.0/0` egress in `k8s/checkout-networkpolicy.yaml` |
| Specialist investigation | `2 agents`: Change Security Investigator and Exposure Evidence Investigator |
| Fixture evidence | `4` calls: security alert, deployment, reachability observations, service dependencies |
| Daytona | `6` sandbox steps and a four-state deterministic verifier matrix |
| GitHub route | `8` GitHub MCP steps, including pre-write rechecks and pull-request creation |
| Human control | `1` approval for `1` controlled write |
| Terminal state | `PR_CREATED`, duration `5m 27s`, pull request `#2` |

## Production treatment

- Output: `1920×1080`, `30 fps`, H.264 video, AAC stereo audio.
- Burn in readable captions and also provide an `.srt` sidecar.
- Use the Gemini `Kore` voice and a restrained, low-volume instrumental bed.
- Display a small `Fast-forwarding real execution` badge only while recorded wait periods are accelerated.
- Crop the 3024×1814 source proportionally into the 16:9 output without hiding the investigation rail.
- Keep the GitHub PR visible for the final twelve seconds.
