# SecureOps Guardian three-minute demo

Use the stock TrueForge UI at normal playback speed. Record the real trace and the public fixture PR URL. Hide browser bookmarks, notifications, provider settings, terminal paths, connector headers, tokens, and private identifiers before recording.

## Primary recording — preserved approval trace plus deterministic reuse

Target duration: 2:55–3:05.

| Time | Screen and narration |
| --- | --- |
| 0:00–0:20 | Show the public product README and the bounded prompt. “An on-call platform/security engineer has a post-deployment checkout egress alert. Deny-all would close the path but could also break checkout.” |
| 0:20–0:50 | In the preserved real TrueForge investigation trace, point to `change-security-investigator` and `exposure-evidence-investigator`, official GitHub MCP reads, and separate Fixture MCP reads. “GitHub change evidence is real; operational observations are owned synthetic fixtures.” |
| 0:50–1:15 | Show `High`, `checkout-api`, the suspect commit, changed NetworkPolicy, forbidden path, actual data access `Unknown`, and named evidence IDs. Do not claim actual access or exfiltration. |
| 1:15–1:40 | Show the real Daytona sandbox event and four-state verifier: suspect exposed, deny-all secure but operationally rejected, Guardian repair secure and functional. State that this is static fixture-contract analysis, not live-cluster proof. |
| 1:40–2:05 | Show the exact diff and proposal hash in the stock OpenUI card. Keep the evidence and limitations visible long enough to read. |
| 2:05–2:32 | Open preserved TrueForge session `01m0t4mkp2ymgmaqkpnj55kq01`. Show the actual approval-required pauses and the three separately approved official GitHub MCP writes: branch approval `01m0t4pemj8vpsserj0rrjk1y6`, file approval `01m0t4qk0spnxxx46z9jpjeks6`, and PR approval `01m0t4s6ps11t73f8vx68jy71g`. Explain that this accepted historical trace created the currently open remediation PR; do not replay or manufacture writes. |
| 2:32–2:50 | Open preserved retry session `01m0t4trxnjdcm26t1mt601m5e`. Show its official GitHub MCP verification, `PR_REUSED`, six reads, zero writes, and zero approval events. Open `https://github.com/jayesh9747/guardian-demo-checkout/pull/1`. |
| 2:50–3:00 | “TrueForge is essential: bounded subagents gather two evidence sources, Daytona carries the proof, persistence makes retry safe, stock OpenUI keeps it readable, and approval retains human control. Guardian never merges, deploys, or accesses a cluster.” |

## Backup recording

Record a second complete take from a clean stock TrueForge session using the same public fixture state and prompt. Prefer the deterministic `PR_REUSED` outcome; do not reset the fixture to manufacture `PR_CREATED`.

If OpenUI fails during the backup take:

1. Keep the real trace visible.
2. Rerun or display the complete Markdown recovery output.
3. Narrate the same information hierarchy and real PR URL.
4. State that the fallback is the recovery path; do not describe it as a successful card render.

## Recording acceptance check

- Duration is approximately three minutes and normal playback is readable.
- The two child threads, both MCP sources, Daytona sandbox, a real human approval pause, and GitHub result are visible.
- The preserved approved trace is clearly identified as historical, and the current retry is clearly identified as read-only reuse.
- The full proposal hash and real PR URL are legible.
- Synthetic/static boundaries and actual-data-access `Unknown` are spoken or visible.
- No secret, authorization header, provider settings screen, private data, model reasoning, notification, or local absolute path appears.
- No edit disguises a failed tool call as live success.
- Primary and backup video permissions are tested signed out before submission.

Recording, upload, visibility selection, and final signed-out video validation remain operator-only actions.
