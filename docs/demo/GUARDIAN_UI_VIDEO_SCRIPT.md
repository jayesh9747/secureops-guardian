# SecureOps Guardian product video script

**Status:** approval draft — script and storyboard only. No video has been generated.

**Target duration:** 2 minutes 59 seconds

**Audience:** hackathon judges and security/platform engineers seeing SecureOps Guardian for the first time

**Core promise:** turn a suspicious infrastructure change into bounded, source-linked evidence, a statically verified remediation candidate, and an auditable human-controlled outcome.

## Voice and visual direction

- Calm, precise, incident-response tone; never sensational.
- Record the real submission-specific TrueForge UI and saved sessions. Do not synthesize product screens.
- Keep the pointer movement deliberate and use short callouts only where the interface does not already carry the message.
- Label GitHub evidence as real, Fixture incident observations as synthetic, and Daytona verification as deterministic and static.
- Never imply live-cluster access, network enforcement, packet observation, data access, exfiltration proof, merge, or deployment.

## Timed script and storyboard

### Scene 1 — The alert is only the beginning (`0:00–0:18`)

**Screen:** Begin on a tight crop of the completed incident brief, then pull back to reveal the Guardian investigation rail.

**On-screen text:** `From suspicious change to controlled outcome`

**Voice-over:**

> A security alert tells you that something may be wrong. It rarely tells you which change caused it, what a safe fix looks like, or whether an automated action can be trusted. SecureOps Guardian closes that gap without taking control away from the operator.

### Scene 2 — Problem statement (`0:18–0:40`)

**Screen:** Move across the Evidence, Verify, Human control, and Outcome stages. Briefly reveal the source labels in the Evidence tab.

**On-screen text:** `Evidence is fragmented. Remediation is risky. Actions need proof.`

**Voice-over:**

> During an incident, repository history, deployment context, security observations, and remediation checks live in different systems. A fast patch can break a required dependency, while a confident-looking answer can hide missing evidence. Teams need one workflow that separates facts from assumptions, tests the proposed change, and makes every write explicit.

### Scene 3 — Who it is for (`0:40–0:56`)

**Screen:** Show the Guardian welcome screen and its three starter tasks: investigate a security regression, analyze a repository, and prepare a remediation pull request.

**On-screen text:** `For the on-call security or platform engineer`

**Voice-over:**

> Guardian is designed for the engineer on call: someone who must understand the regression quickly, explain it to a reviewer, and prepare a safe next step without granting an agent permission to merge, deploy, or touch a cluster.

### Scene 4 — Why TrueForge (`0:56–1:17`)

**Screen:** Hold on the welcome screen, then reveal the saved-agent name, connected sources, agent activity, and sandbox execution in the existing completed session.

**On-screen text:** `One TrueForge agent · bounded subagents · MCP evidence · Daytona verification`

**Voice-over:**

> We use TrueForge as the product harness because the investigation needs more than chat. One saved Guardian agent interprets the request, delegates bounded evidence work, calls connected MCP tools, runs a pinned verifier in a Daytona sandbox, pauses for human decisions, and preserves the execution trail in a persistent session.

### Scene 5 — Intent becomes a bounded scope (`1:17–1:35`)

**Screen:** Start from the exact natural-language request. Show the interpreted repository, revision, base branch, target file, verifier pack, capability ceiling, and evidence limitations. Then show the confirmation controls.

**On-screen text:** `Confirm the scope before investigation`

**Voice-over:**

> The operator starts with a plain-language request. Guardian converts it into a reviewable scope: repository, commit, branch, target file, selected verifier, allowed capability, and known limitations. This first confirmation approves the interpretation only. It is not permission for a GitHub write.

### Scene 6 — Parallel evidence, clearly labelled (`1:35–1:55`)

**Screen:** Open the subagent cards, then the Evidence table. Highlight the `official-github-mcp` and `guardian-fixture` source labels.

**On-screen text:** `Real GitHub evidence + owned synthetic incident observations`

**Voice-over:**

> Two investigators work in parallel. The change investigator traces the suspect commit, parent state, file history, branch, and existing pull requests through GitHub. The exposure investigator reads the owned Fixture MCP for synthetic alert, deployment, reachability, and dependency observations. Every record keeps its source, tool, and observed fact.

### Scene 7 — Build and verify the candidate (`1:55–2:17`)

**Screen:** Open Verification and show the four states: last-good, suspect, deny-all negative control, and candidate. Then open Proposed change.

**On-screen text:** `A safe candidate must restore policy and preserve dependencies`

**Voice-over:**

> Guardian binds the evidence to a pinned verifier and tests four states in an isolated Daytona workspace. Last-good passes. The suspect state fails because unrestricted egress was introduced. A deny-all patch also fails because it blocks required dependencies. Only the candidate passes both security and dependency checks, producing a reviewable NetworkPolicy change.

### Scene 8 — Human control at the write boundary (`2:17–2:34`)

**Screen:** Show the write approval boundary, then cut to the cancellation result with `CANCELLED`, zero writes, zero approvals, and no receipt.

**On-screen text:** `Cancellation means no write`

**Voice-over:**

> If a new branch or pull request is required, Guardian asks again at the exact write boundary. The operator can also stop earlier. In this saved cancellation, no investigators start, no GitHub write occurs, and no receipt pretends otherwise.

### Scene 9 — Reconcile before writing (`2:34–2:49`)

**Screen:** Show the saved completed session with `PR_REUSED`, the receipt tab, and the terminal summary in the investigation rail.

**On-screen text:** `PR_REUSED · 0 writes · 0 approvals`

**Voice-over:**

> In this saved run, remote-state reconciliation found the exact remediation pull request already open. Guardian returned PR_REUSED with zero new writes and zero approvals, while preserving the finding, proposal identity, evidence, verification result, and machine-readable receipt.

### Scene 10 — Honest outcome and close (`2:49–2:59`)

**Screen:** End on the full completed interface and product mark.

**On-screen text:** `Investigate with evidence. Remediate with control.`

**Voice-over:**

> SecureOps Guardian turns an uncertain alert into a bounded, auditable next step—without claiming evidence it lacks or taking the final decision away from the human.

## Capture plan

| Scene | Primary source | Required interaction |
| --- | --- | --- |
| 1–2 | Saved `PR_REUSED` session `01m16kn1n07evwtjtje2e7rfk1` | Incident brief, tabs, investigation rail |
| 3–4 | New-chat welcome state | Starter tasks, evidence boundary, connected execution surfaces |
| 5 | Saved confirmation-boundary session | Interpreted scope and confirmation controls |
| 6–7 | Saved `PR_REUSED` session | Agent cards, Evidence, Verification, Proposed change |
| 8 | Saved cancelled session `01m16n6h2k2hbv34b1nv5mkjd4` | Terminal cancellation summary |
| 9–10 | Saved `PR_REUSED` session | Receipt and terminal `PR_REUSED` outcome |

The existing README release screenshots and the new UI gallery can be used as still-frame fallbacks. Any screen recording should hide credentials, provider settings, private paths, notifications, and unrelated browser or chat history.

## Gemini media handoff — only after approval

After the operator approves this script, Gemini media tooling may assemble the supplied real screen recordings and screenshots, voice-over, captions, music, and transitions. It must not generate replacement UI, invent investigation steps, alter displayed evidence, or expand the product claims.

Suggested production prompt:

> Create a concise 2:59 product demonstration from the supplied SecureOps Guardian recordings, storyboard, and approved narration. Preserve the chronological scene order and all factual UI text. Use restrained security-product motion graphics, readable captions, subtle zooms, and neutral instrumental audio under the voice-over. Treat real GitHub evidence, synthetic Fixture observations, and static Daytona verification as distinct evidence classes. Do not fabricate screens, results, tool calls, cluster access, write activity, merge activity, deployment, data access, or exfiltration proof. End on the supplied completed PR_REUSED interface and the line: “Investigate with evidence. Remediate with control.”

## Approval checklist

- [ ] Story and target user are correct.
- [ ] Spoken claims stay inside the demonstrated evidence boundary.
- [ ] Timing and narration are approved.
- [ ] Saved sessions and screen states are acceptable for recording.
- [ ] Only after all four checks: generate the video assets.
