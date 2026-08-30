# SecureOps Guardian product video script

**Status:** revised approval draft — script and storyboard only. No video has been generated.

**Target duration:** 3 minutes

**Audience:** hackathon judges and security/platform engineers seeing SecureOps Guardian for the first time

**Story:** introduce the product as a stranger would discover it, begin with a normal conversation, let the agent request missing scope, show human confirmation, fast-forward real execution, and finish by inspecting the complete TrueForge harness.

## Recording rules

- Record the real submission-specific TrueForge UI and saved sessions. Do not generate replacement product screens.
- Do not prefill or mention a repository before the agent asks for one.
- Present Guardian as a general security-investigation agent, not as an agent trained for one fixture repository.
- Label GitHub evidence as real, Fixture incident observations as synthetic, and Daytona verification as deterministic and static.
- Never claim live-cluster access, network enforcement, packet observation, data access, exfiltration proof, merge, or deployment.

## Timed script and storyboard

### Scene 1 — First look at the product (`0:00–0:18`)

**Screen:** Start on the clean Guardian welcome page. Slowly identify the session history on the left, the human conversation in the center, and the investigation rail area on the right.

**On-screen text:** `SecureOps Guardian · Human-controlled security investigation`

**Voice-over:**

> This is SecureOps Guardian, a security investigation agent built inside TrueForge. The left side preserves agents and sessions, the center is the human conversation, and the right-side investigation rail exposes what the harness is actually doing—scope, evidence, verification, human control, and outcome.

### Scene 2 — Why it exists and who it helps (`0:18–0:35`)

**Screen:** Highlight the evidence-boundary message and the starter tasks.

**On-screen text:** `For security, platform, and on-call engineers`

**Voice-over:**

> We built Guardian for security and platform engineers who must move from a suspicious change to a defensible next step. It joins fragmented evidence, tests whether a remediation is safe, and keeps every external action under explicit human control.

### Scene 3 — Architecture in three lines (`0:35–0:52`)

**Screen:** Animate three restrained callouts over the welcome page, then reveal the connected execution labels in a saved session.

**On-screen text:**

1. `Saved Guardian agent → bounded specialist agents`
2. `GitHub MCP + synthetic Fixture MCP → source-labelled evidence`
3. `Daytona sandbox → pinned static verifier → typed UI + receipt`

**Voice-over:**

> One saved Guardian agent orchestrates bounded specialists. GitHub MCP supplies real repository facts while the owned Fixture MCP supplies clearly labelled synthetic incident context. Daytona runs a pinned static verifier in isolation, and TrueForge preserves the result as an inspectable UI and receipt.

### Scene 4 — The three choices (`0:52–1:08`)

**Screen:** Show each welcome-page option as it is named.

**On-screen text:** `Analyze only · Prepare remediation · Open pull request`

**Voice-over:**

> A user can choose three levels of capability. Analyze only is read-only. Prepare remediation adds sandbox verification and a proposed fix without external writes. Open pull request can create or reuse a GitHub pull request, but any new write requires a separate approval.

### Scene 5 — Begin like a normal human (`1:08–1:35`)

**Screen:** Start a fresh chat. Type the first line naturally; do not paste a repository or structured scope yet. Let the short exchange appear at normal speed.

**Human:**

> Hi there—what can you help me with?

**Guardian:**

> I can analyze security risks, prepare a sandbox-verified remediation, or open a pull request with separate write approval. What would you like to do?

**Human:**

> Can you analyze a repository without making changes?

**Guardian:**

> Yes. Send the repository URL. I will ask for any missing scope rather than assume it.

**Voice-over:**

> Guardian understands the desired outcome first, then asks for missing scope without assuming a repository.

### Scene 6 — Supply scope, then accept it (`1:35–1:52`)

**Screen:** Only now paste the demonstration repository URL. Show Guardian’s interpreted scope card and the confirmation controls.

**Human:**

> Here is the repository I want reviewed. Use the default branch and start read-only.

**Guardian:**

> This is read-only analysis of the supplied repository. No remediation or GitHub writes are permitted. Proceed?

**Human:**

> Yes. The scope is correct—proceed.

**Voice-over:**

> This confirms scope, not permission for a later write.

### Scene 7 — Fast-forward the read-only work (`1:52–2:02`)

**Screen:** Speed the recording to `8×–12×`. Keep the investigation rail visible while Evidence advances. Return to normal speed when the finding appears.

**On-screen text:** `Fast-forwarding real agent execution`

**Voice-over:**

> We fast-forward model wait time, but we do not replace the execution. The saved session still preserves every tool call, source, duration, failure, and result.

### Scene 8 — A human requests deeper proof (`2:02–2:22`)

**Screen:** Show the read-only finding, then enter the follow-up request and the second scope confirmation.

**Human:**

> Now prepare a verified remediation. Use two focused investigators and the sandbox, but do not write to GitHub.

**Guardian:**

> I will run two bounded investigators, join the evidence, verify a candidate in Daytona, and return a proposal only. GitHub writes stay disabled. Proceed?

**Human:**

> Yes—prepare the remediation only. No GitHub writes.

**Voice-over:**

> Guardian changes capability only after the human requests and confirms it.

### Scene 9 — Fast-forward, then reveal the complete harness (`2:22–2:42`)

**Screen:** Fast-forward active execution. Briefly pan across the saved session history, then stop on the corrected investigation overview showing both agent cards and the execution counts.

**On-screen text:** `2 agents · MCP evidence · Daytona sandbox · persistent sessions`

**Voice-over:**

> The session history shows repeated harness validation, including analysis, remediation, cancellation, benign controls, failures, and retry-safe outcomes. In this run, TrueForge exposes two specialist agents, MCP calls, sandbox steps, timing, and failed attempts instead of hiding them behind a polished answer.

### Scene 10 — Inspect the work, not just the answer (`2:42–2:56`)

**Screen:** Click Change Security Investigator. Show Findings, Evidence, and Activity. Return to all agents, open Exposure Evidence Investigator, then show Sandbox Validation, the four-state proof, proposed change, limitations, and receipt.

**On-screen text:** `Findings · Evidence · Activity · Four-state verification`

**Voice-over:**

> Each specialist is inspectable. We can review its finding, evidence references, and activity; then inspect GitHub and Fixture calls, Daytona verification, the proposed change, limitations, write count, approvals, and receipt. This is the TrueForge harness being validated—not a mock dashboard.

### Scene 11 — Human control and close (`2:56–3:00`)

**Screen:** End on the `PR_REUSED` terminal outcome with zero writes and zero approvals.

**On-screen text:** `Investigate with evidence. Remediate with control.`

**Voice-over:**

> Visible evidence. Human control. That is SecureOps Guardian.

## Capture plan

| Scene | Primary source | Required interaction |
| --- | --- | --- |
| 1–4 | New-chat welcome state | Explain the three-pane layout, evidence boundary, architecture, and three capabilities |
| 5–6 | Fresh conversational session | Use the exact human dialogue; provide the repository only after Guardian asks |
| 7 | Read-only analysis run | Accelerate waiting while leaving the live rail and activity visible |
| 8–9 | Prepared-remediation session `01m0x0n0hqq69kaxq35xfc2zfh` | Human follow-up, two agents, counts, history, and persistent execution |
| 10–11 | Saved `PR_REUSED` session `01m16kn1n07evwtjtje2e7rfk1` | Agent workspaces, sandbox proof, receipt, and terminal outcome |

The original README screenshots remain unchanged. The updated UI gallery supplies fallback stills for the welcome state, safe cancellation, visible agent list, selected-agent workspace, and `PR_REUSED` outcome.

## Editing notes

- Use a visible `8×–12×` fast-forward badge during model wait time; never cut in fabricated tool results.
- Keep the full chat exchange readable long enough for a first-time viewer.
- Pan across session history for no more than three seconds; its purpose is to show persistence and breadth of validation, not clutter.
- Hide credentials, settings, private paths, notifications, unrelated tabs, and unrelated session content.
- Prefer direct cuts and subtle zooms over cinematic effects; the evidence should remain the focus.

## Gemini media handoff — only after approval

After the operator approves this script, Gemini media tooling may assemble the supplied real recordings and screenshots, voice-over, captions, music, fast-forward segments, and transitions. It must not generate replacement UI, invent dialogue, alter displayed evidence, or expand product claims.

Suggested production prompt:

> Create a three-minute product demonstration from the supplied SecureOps Guardian recordings, revised storyboard, and approved narration. Begin with the stranger-first welcome page, explain the product, audience, three-line architecture, and three capability options, then show the exact natural human conversation. Do not reveal or prefill a repository before Guardian asks for it. Use visible 8×–12× fast-forward treatment for real waiting periods. Clearly reveal persistent sessions, two specialist agents, MCP evidence, Daytona sandbox execution, failures, verification, human confirmation, terminal outcome, and receipt. Use restrained security-product motion graphics, readable captions, subtle zooms, and neutral instrumental audio. Do not fabricate screens, dialogue, results, tool calls, cluster access, writes, merges, deployment, data access, or exfiltration proof. End on the supplied PR_REUSED screen and the line: “Investigate with evidence. Remediate with control.”

## Approval checklist

- [ ] First look, target audience, architecture, and three capabilities are clear.
- [ ] The conversation feels natural and no repository is revealed before Guardian requests it.
- [ ] Human scope acceptance and write boundaries are unambiguous.
- [ ] Fast-forward treatment still preserves the real TrueForge execution trail.
- [ ] Two subagents, MCP, sandbox, sessions, verification, limitations, and receipt are visible.
- [ ] Only after all five content checks: generate video assets.
