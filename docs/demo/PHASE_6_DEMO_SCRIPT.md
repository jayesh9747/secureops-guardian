# SecureOps Guardian three-minute demo

Use the stock TrueForge UI at normal playback speed. Record the real trace and the public fixture PR URL. Hide browser bookmarks, notifications, provider settings, terminal paths, connector headers, tokens, and private identifiers before recording.

## Primary recording — deterministic reuse path

Target duration: 2:55–3:05.

| Time | Screen and narration |
| --- | --- |
| 0:00–0:20 | Show the public product README and enter the bounded prompt. “An on-call platform/security engineer has a post-deployment checkout egress alert. Deny-all would close the path but could also break checkout.” |
| 0:20–0:55 | In the real TrueForge trace, point to `change-security-investigator` and `exposure-evidence-investigator`. Point to official GitHub MCP reads and separate Fixture MCP reads. “GitHub change evidence is real; operational observations are owned synthetic fixtures.” |
| 0:55–1:20 | Show the result finding: `High`, `checkout-api`, full suspect commit, changed NetworkPolicy, forbidden path, and actual data access `Unknown`. Point to named evidence IDs. Do not claim actual access or exfiltration. |
| 1:20–1:50 | Point to the Daytona sandbox event and four-state verifier. Show suspect as exposed, deny-all as secure but operationally rejected, and Guardian repair as secure and functional. State that this is static fixture-contract analysis, not live-cluster proof. |
| 1:50–2:25 | Show the exact diff and proposal hash in the stock OpenUI card. Point to the TrueForge approval-required boundary and explain that each GitHub write is separately approved. With the preserved remote, no new approval should occur because the exact PR exists. |
| 2:25–2:48 | Point to the official GitHub MCP read-only verification and `PR_REUSED`. Open the real public URL: `https://github.com/jayesh9747/guardian-demo-checkout/pull/1`. State “six reads, zero writes, zero approval events.” |
| 2:48–3:00 | “TrueForge is essential here: bounded subagents gather two evidence sources, Daytona carries the proof, persistent state makes retry safe, stock OpenUI keeps the result readable, and approval retains human control. Guardian never merges, deploys, or accesses a cluster.” |

## Backup recording

Record a second complete take from a clean stock TrueForge session using the same public fixture state and prompt. Prefer the deterministic `PR_REUSED` outcome; do not reset the fixture to manufacture `PR_CREATED`.

If OpenUI fails during the backup take:

1. Keep the real trace visible.
2. Rerun or display the complete Markdown recovery output.
3. Narrate the same information hierarchy and real PR URL.
4. State that the fallback is the recovery path; do not describe it as a successful card render.

## Recording acceptance check

- Duration is approximately three minutes and normal playback is readable.
- The two child threads, both MCP sources, Daytona sandbox, approval boundary, and GitHub result are visible.
- The full proposal hash and real PR URL are legible.
- Synthetic/static boundaries and actual-data-access `Unknown` are spoken or visible.
- No secret, authorization header, provider settings screen, private data, model reasoning, notification, or local absolute path appears.
- No edit disguises a failed tool call as live success.
- Primary and backup video permissions are tested signed out before submission.

Recording, upload, visibility selection, and final signed-out video validation remain operator-only actions.
