# Phase 0 platform-gate evidence

Date: 24 August 2026  
Branch: `phase-0/platform-gate`  
Pull request: `jayesh9747/secureops-guardian#1`

## Result

The Phase 0 platform gate passes. The stock TrueForge runtime demonstrated the model path, the official GitHub MCP, the custom Fixture MCP, Daytona execution with cross-turn persistence, one dynamic child thread, and denial/reconnect/approval behavior for one harmless fixture-repository write.

This evidence proves platform primitives only. It does not implement or claim incident investigation, policy analysis, remediation generation, live-cluster access, production evidence, or Phase 1 behavior.

## Evidence handling

- Trace references below are local TrueForge session and turn identifiers. They contain no credential values.
- Connector responses were inspected only through their redacted settings projections.
- API keys, authorization headers, provider secrets, model reasoning fields, and local absolute paths are intentionally omitted.
- The fixture data and setup write are owned, synthetic demo material.
- Pass/fail is based on observed events and outputs, not screenshots alone.

## Runtime and connector boundary

| Item | Observed configuration | Result |
| --- | --- | --- |
| TrueForge runtime | Commit `6026509d905fe255bf493e3845b1fca237bdf0fd`; stock server, UI, PostgreSQL, and Redis healthy | Pass |
| Saved test agent | `phase-0-platform-smoke`, ID `01m0s5fcmrxpkrbmcnvjym5hmj` | Pass |
| Model | `google-gemini/gemini-3-6-flash`, temperature `0` | Pass |
| Official GitHub MCP | Connector `github`; `https://api.githubcopilot.com/mcp/`; authenticated header credential; secret redacted by TrueForge | Pass |
| Fixture MCP | Connector `guardian-fixture`; Streamable HTTP; no authentication; one read-only tool | Pass |
| Daytona | Provider state `ready`; credential redacted by TrueForge | Pass |
| Qodo | Product and fixture repositories shown as Healthy with code review enabled; PR review recorded separately after the final quality run | Pending final PR gate |

The TrueForge checkout contained one operator-owned `docker-compose.yml` host-binding change used to expose the local UI. It was preserved and was not committed to the product repository.

## Primitive evidence

### 1. Saved agent and model path

Expected: a saved agent completes a plain response through the configured model and is visible in the stock UI.

Observed:

- Session: `01m0s5fjceg0nq3msyax9f7k49`
- Turn: `01m0s5fqqzqgc4x0589pkb6xdy.1vzzfx`
- Terminal state: `done`
- Exact output: `Phase 0 model path operational`
- The session appeared under the saved `phase-0-platform-smoke` agent in the stock TrueForge UI.

Result: **Pass**.

### 2. Official GitHub MCP read

Expected: the official connector performs one scoped read from the owned fixture repository with the fine-grained credential intended for the demo.

Observed:

- Session: `01m0s6x4eqq9racgfcf5e8bswa`
- Turn: `01m0s6xa1kqwacdw30812wejex.336t3a`
- `mcp.initialize`: connector `github`, transport `streamable-http`
- Exactly one tool call:

```json
{
  "name": "get_file_contents",
  "owner": "jayesh9747",
  "repo": "guardian-demo-checkout",
  "path": "README.md",
  "ref": "main"
}
```

- Tool response: `successfully downloaded text file (SHA: 1ea1742a08d5aea4d5dec8609a50708bfd655571)`
- Terminal state: `done`; no second tool call occurred in this evidence run.

Result: **Pass**.

Credential boundary: the operator created a fine-grained credential limited to `guardian-demo-checkout`, with repository metadata read and only the Contents/Pull Requests access required by the planned demo. This bounds authenticated private/write authority. GitHub's public-repository read surface remains publicly accessible and is not an isolation mechanism; agent instructions and enabled-tool selection supplied the run-level scope.

Excluded run: an earlier exploratory read completed the intended target read but then attempted an unrequested public-repository lookup. It was cancelled/excluded from pass evidence, and the saved agent was tightened to one enabled tool, one owned target, no dynamic subagents, and a four-iteration limit before the clean run above.

### 3. Custom Fixture MCP transport

Expected: TrueForge calls one typed, read-only `get_case_metadata` tool over Streamable HTTP and displays structured synthetic metadata.

Observed:

- Session: `01m0s5m35atjed6ejg6gv1t0az`
- Turn: `01m0s5m37vgqcbfwwkw5tjyfcp.1vzzfx`
- `mcp.initialize`: connector `guardian-fixture`, transport `streamable-http`
- Tool: `get_case_metadata`
- Input: `checkout-networkpolicy-egress-exposure`
- Structured result:

```json
{
  "caseId": "checkout-networkpolicy-egress-exposure",
  "fixtureVersion": "1",
  "synthetic": true,
  "summary": "Owned synthetic post-deployment NetworkPolicy exposure fixture."
}
```

- The stock UI showed `Agent steps · 1 tool call` and the result.
- Health response was `{"status":"ok","synthetic":true}`.
- The server is stateless, model-free, and exposes no incident answer loop. Host-header validation allows only the local/container names needed by this runtime and rejects an untrusted host with HTTP 403.

Result: **Pass**.

### 4. Dynamic subagent delegation

Expected: one bounded read-only metadata lookup executes in a child thread and returns to the root.

Observed:

- Session: `01m0s5pn22rdrpqzpzk6r183zx`
- Root turn: `01m0s5pn3s2fhaebj8sdxh0fad.1vzzfx`
- Root called `create_sub_agent` once with the name `metadata_fetcher`.
- Child thread: `54575a2e-2327-4195-a163-fca2bbf1e629`
- The child called `get_case_metadata` once for the owned synthetic case.
- `thread.done` returned case ID, fixture version `1`, and `synthetic: true`; the root displayed that result.

Result: **Pass**.

Boundary: child and root shared the agent's attached resources. The test proves instruction-scoped delegation and trace visibility, not enforced per-child tool or sandbox isolation.

### 5. Daytona execution and cross-turn persistence

Expected: `sandbox.created`, a deterministic command, and the same created file in a second turn of the same session.

Observed:

- Session: `01m0s7rseyfjs1h9gmpaftmaj1`
- Turn 1: `01m0s7s44ddt09sr7e9j2fx23p.336t3a`
- Safe sandbox suffix: `…dc4bed45`
- `sandbox.created` was emitted.
- One `exec` call wrote `guardian-phase0-sandbox-persistence-v1` to `/tmp/guardian-phase0-persistence.txt` and ran `sha256sum`.
- Exit code: `0`
- SHA-256: `59cf08fd8cfa37c5bf5af7328a24bd6b0f09ab45de10f4a8a4804718abffe760`
- Turn 2: `01m0s7tjdw08fdchwjp9tmmf82.336t3a`
- Turn 2 referenced Turn 1 as `previous_turn_id`, read the same path, and returned the exact content and identical hash with exit code `0`.

No repository, credential, network service, or secret path was made available to this bounded sandbox smoke agent.

Result: **Pass**.

### 6. Approval denial, reconnect, and one scoped write

Expected: deny the first identical request and observe no write; trigger again, refresh while pending, approve, and observe exactly one harmless fixture-repository write.

Requested write:

| Field | Exact value |
| --- | --- |
| Tool | `create_or_update_file` |
| Owner/repository | `jayesh9747/guardian-demo-checkout` |
| Branch | `main` |
| Path | `phase-0-approval-smoke.txt` |
| Content | `SecureOps Guardian Phase 0 approval smoke. Synthetic setup artifact; no production data.` plus one newline |
| Commit message | `chore: add Phase 0 approval smoke marker` |

Denial path:

- Session: `01m0s7x9r7yrke8ryaachknbbq`
- Pending turn: `01m0s7xg3m8fx34x45g8fmbmpn.336t3a`
- Approval event: `01m0s7xrzm4gp11rptrhzpnpjf`
- Human decision: `deny`
- Reason: `Phase 0 denial-path test — verifying that no write occurs without explicit human approval.`
- Resume turn: `01m0s84pm0753d7536kkqnj7rq.336t3a`
- Agent stopped without retrying.
- A GitHub contents lookup returned 404 for the target path after denial.

Reconnect and approval path:

- Session: `01m0s85tgzhy0tch9f1k0fazrc`
- Pending turn: `01m0s861q6df2e7dxpmnbhq22w.336t3a`
- Approval event: `01m0s868f39de8qqpd9636ft1a`
- The operator refreshed the session URL while the approval was pending; the request remained actionable.
- Human decision: `allow`
- Resume turn: `01m0s89784wpep1n0x2cnvb6jz.336t3a`
- GitHub commit: `cdd33814e3661bb01b4b6977781f017440e68b29`
- Resulting blob: `29c981ca131a77db6f74f4596b488f985cce31fc`
- Remote `main` contains the exact requested 89-byte synthetic marker and no second marker commit.

Result: **Pass**.

## Repository and quality evidence

- Product repository: `jayesh9747/secureops-guardian`
- Fixture repository: `jayesh9747/guardian-demo-checkout`
- Product work is confined to the Phase 0 branch and PR #1.
- The fixture repository contains only its boundary README/license plus the one approved setup marker at this phase.
- Baseline commands passed on 24 August 2026:

| Command | Observed result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Pass; lockfile already up to date |
| `pnpm format:check` | Pass; all checked files matched Prettier style |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass; 2 files and 4 tests |
| `pnpm build` | Pass |

## Exit-gate conclusion

| Gate | Result |
| --- | --- |
| Saved agent and real model response | Pass |
| Official GitHub MCP read | Pass |
| Custom Streamable HTTP Fixture MCP | Pass |
| Daytona command and cross-turn file persistence | Pass |
| One visible dynamic child thread | Pass |
| Approval required, denial/no-write, refresh/reconnect, and one approved write | Pass |
| Pinned runtime and connector names recorded | Pass |
| Phase 1 or later behavior implemented | No |

The Phase 0 platform primitives are operational with the limitations stated above. Qodo review and the final local quality run remain PR-promotion gates and are recorded in the PR description when complete.
