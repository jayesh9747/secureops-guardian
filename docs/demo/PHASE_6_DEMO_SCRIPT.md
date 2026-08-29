# SecureOps Guardian three-minute release demo

Use the stock TrueForge UI at normal playback speed. The controlling completed release rehearsal is session `01m16e0sej7ybprysty571k1qf`; it returned the existing public fixture PR with no write or approval. Do not present the approximately six-to-seven-minute cold model execution as a three-minute completion claim. The three-minute flow is a guided walkthrough of the canonical completed session.

Hide browser bookmarks, notifications, provider settings, terminal paths, connector headers, tokens, and private identifiers before recording. Recording, upload, public visibility, and signed-out playback validation remain operator-only.

## Primary recording — natural language to exact PR reuse

Target duration: 2:55–3:05.

| Time | Screen and narration |
| --- | --- |
| 0:00–0:20 | Show the ordinary-language request containing the exact checkout commit URL, `main`, and `k8s/checkout-networkpolicy.yaml`. Explain that Guardian interprets `OPEN_PR` scope and asks for confirmation before preflight; request confirmation is not write approval. |
| 0:20–0:35 | Show the interpreted repository, branch, full commit, target, `OPEN_PR` ceiling, and `k8s-network-egress-v1@1.0.4`. State that the pinned pack is selected by the agent, not uploaded or named by the user. |
| 0:35–1:05 | Open the Investigation rail. Point to `change-security-investigator`, `exposure-evidence-investigator`, official GitHub MCP, and `guardian-fixture`. “GitHub evidence is real; the incident observations are owned synthetic fixtures.” |
| 1:05–1:35 | Show the Incident Brief summary and Evidence/Causal Chain tabs: `High`, `SEC-NET-001`, `checkout-api`, suspect commit, exact file/blob, forbidden TCP/443 path, and actual data access/exfiltration `Unknown`. |
| 1:35–2:00 | Show Verification: last-known-good secure/functional; suspect exposed; deny-all secure but operationally rejected; Guardian candidate secure/functional. State that this is deterministic static NetworkPolicy verification, not Kubernetes admission, CNI, packet, or live-cluster proof. |
| 2:00–2:30 | Show Proposed Change and the exact candidate/blob/proposal/pack-binding identities. Point to the three configured write approval boundaries, then show that this run performed six fresh reads and returned `PR_REUSED` with zero write calls and zero approval events. |
| 2:30–2:50 | Show the receipt tab and open [fixture PR #1](https://github.com/jayesh9747/guardian-demo-checkout/pull/1). State that the PR remains open and unmerged at `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3`. |
| 2:50–3:00 | “TrueForge makes the evidence join, bounded subagents, sandbox proof, persistence, approval boundaries, and stock Incident Brief visible. Guardian did not merge, deploy, access a cluster, or prove data access.” |

The timed rows contain roughly 250 words of screen direction and narration plus about one minute of visible tab changes and reading pauses, calibrated for a three-minute operator walkthrough at normal pace. The final recorded duration is the operator-controlled acceptance value.

## Backup proof

If the primary session is unavailable, use accepted rehearsal `01m16dknygk9013rm7t6nens2w`. It has the same frozen manifest, proposal, pack binding, child roles, one sandbox, six-read reconciliation, valid stock OpenUI, `PR_REUSED`, and zero approval/write events.

Use workload session `01m16cd5dtc76v5djytwmsz71b` only as short backup evidence of pack breadth. It shows five exact workload-security findings and stops at GitHub-only `ANALYSIS_ONLY`. Use benign session `01m16epj331ec41djrb38xfvnr` to show `NO_DETERMINISTIC_FINDING` with three GitHub reads and zero sandbox/Fixture/approval/write. Neither should replace the checkout story in the primary video.

If OpenUI fails during a backup take:

1. Keep the actual TrueForge trace visible.
2. Rerun once or display the complete Markdown recovery rendering.
3. Narrate the same identities, evidence, capability ceiling, and limitations.
4. State that Markdown is the recovery path; do not describe a failed card as successful.

## Cancellation/no-write proof

Session `01m16ef7cw4nzwpygbfcrjdx2m` demonstrates cancellation at interpreted-request confirmation. It shows zero agents, zero MCP calls, zero sandboxes, and the terminal cancellation message. This is not a live first-write approval denial. The deterministic mutation matrix proves first-write denial; a new live first-write path was not manufactured because doing so would require a destructive fixture reset.

## Recording acceptance check

- Duration is approximately three minutes and normal playback is readable.
- The natural-language request, interpreted scope, selected pack, both children, both MCP sources, one Daytona sandbox, exact PR reuse, and stock OpenUI are visible.
- The approval boundary is explained accurately; no approval is claimed for the read-only reuse run.
- The proposal hash, pack binding, and real PR URL are legible.
- Real-GitHub, synthetic-incident, static-verifier, no-live-cluster, and `Unknown` data-access boundaries are spoken or visible.
- No secret, authorization header, provider settings screen, private data, model reasoning, notification, or local absolute path appears.
- No edit disguises a failed or rejected trace as success.
- Primary and backup video permissions are tested signed out before submission.
