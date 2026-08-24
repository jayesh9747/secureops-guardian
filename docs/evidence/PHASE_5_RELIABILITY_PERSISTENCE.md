# Phase 5 reliability and persistence evidence

Date: 24 August 2026

Branch: `phase-5/reliability-persistence`

Scope: Phase 5 only

## Result

Phase 5 passes the deterministic reliability matrix and every live proof permitted by the preserved remote state. The integration harness composes the Phase 2 evidence gate, Phase 3 bounded verifier/proposal flow, and Phase 4 remote decision/receipt contracts. All eight required scenarios return the expected safe state and record their case, evidence, tools, approvals, verifier result, proposal hash, and mutation proof.

Three consecutive live TrueForge rehearsals used the preserved open fixture PR and returned `PR_REUSED` in 38.029, 45.847, and 42.190 seconds. Every rehearsal used `list_pull_requests` with exact open base/head filtering, made six GitHub reads, emitted no write tool call, emitted no approval event, and returned fixture PR #1 at the unchanged remediation commit.

The current remote state cannot safely perform a fresh live first-write denial or `PR_CREATED` rehearsal: the deterministic branch and exact PR already exist. Removing or rewriting them would be a destructive fixture reset, which was not authorized. Those paths are therefore deterministic integration proofs, not claimed as new live TrueForge proofs.

Guardian did not merge, close, edit, delete, or force-push fixture PR #1 or its branch. It did not silently reset remote state, deploy, roll back, access a cluster, or perform an unsupported GitHub mutation.

## Entry reconciliation

| Item | Verified value |
| --- | --- |
| Product PR #5 | Merged as `12cafa71769fd180afbaa246508cf4d74ac38902` |
| Reviewed Phase 4 head | `b442a9d3765a4063bf98e7f429b8272686dac645` |
| Phase 5 branch point | Product `main` at `12cafa71769fd180afbaa246508cf4d74ac38902` |
| Fixture base | `7b2f2ad51f9ef97334176fbfed3138465b62fcdb` |
| Fixture remediation head | `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3` |
| Fixture PR | `jayesh9747/guardian-demo-checkout#1`, open and unmerged |
| Proposal hash | `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` |
| Candidate SHA-256 / Git blob | `c282434c506a45e93e39d2329b33c8466ba7a8a1d5d238817530678d975ad165` / `1eddb230ac7c05bae199e6b9162a42da3bf039fa` |
| TrueForge runtime | `6026509d905fe255bf493e3845b1fca237bdf0fd` |
| Preserved operator change | TrueForge `docker-compose.yml` two-line host-binding change remained unstaged and untouched |

The fixture PR was selected with the direct pull-request list endpoint using `state=open`, `base=main`, and exact head `jayesh9747:guardian/fix-checkout-egress`. Exactly one result was returned. Its title and body byte-match the merged renderer, its head is `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3`, its only changed file is `k8s/checkout-networkpolicy.yaml`, and the remote file remains SHA-256 `c282434c506a45e93e39d2329b33c8466ba7a8a1d5d238817530678d975ad165`.

## Saved-agent reconciliation before live retry

Saved TrueForge agent `secureops-guardian-phase-4`, ID `01m0t4gpvz34x60qz6fxqz214d`, still contained the historical `search_pull_requests` configuration even though merged Phase 4 source had replaced it.

Before any counted live retry, the saved manifest was replaced with the exact merged source configuration. A fresh read proved:

- instructions byte-match the merged `PHASE_FOUR_AGENT_SPEC`;
- enabled reads are `list_branches`, `list_pull_requests`, `get_file_contents`, and `get_commit`;
- `search_pull_requests` is not enabled;
- writes are limited to `create_branch`, `create_or_update_file`, and `create_pull_request`;
- all three writes remain separately listed in `require_approval_for_tools`;
- sandbox and dynamic subagents remain disabled.

This was a TrueForge saved-agent configuration update, not a GitHub mutation.

## Deterministic integration harness

Run:

```text
pnpm phase5:matrix
```

The command emits strict JSON records. The Zod record gate rejects mismatched expected/actual states, claimed mutation events, `INCONCLUSIVE` records that reached verifier/proposal/approval, `NO_SAFE_REMEDIATION` records without exactly two attempts, `PR_REUSED` records with approvals, and reconnect records without a persistence proof.

Deterministic records intentionally use `null` TrueForge agent/session IDs because no TrueForge run is claimed. The Phase 2 causal input retains its historical remediation-evidence tool name, `search_pull_requests`; every Phase 4 remote decision and every live retry uses direct exact-head `list_pull_requests`.

### Event-reference bundles

The table below uses these exact bundles to keep repeated records readable:

- `EVIDENCE-NORMAL`: `deterministic:tool:get_commit:evidence:github:commit:suspect`, `deterministic:tool:get_commit:evidence:github:commit:parent`, `deterministic:tool:list_commits:evidence:github:commit-history:checkout-networkpolicy`, `deterministic:tool:get_commit:evidence:github:diff:checkout-networkpolicy`, `deterministic:tool:get_file_contents:evidence:github:manifest:checkout-networkpolicy:suspect`, `deterministic:tool:list_branches:evidence:github:remediation-branches`, `deterministic:tool:search_pull_requests:evidence:github:remediation-pull-requests`, `deterministic:tool:get_security_alert:evidence:security-alert:checkout-egress:001`, `deterministic:tool:get_deployment:evidence:deployment:checkout-api:001`, `deterministic:tool:get_reachability_observations:checkout-networkpolicy-egress-exposure`, and `deterministic:tool:get_service_dependencies:checkout-networkpolicy-egress-exposure`.
- `VERIFY-PASS`: `deterministic:verifier:attempt-1` and `deterministic:verifier:four-state`.
- `REMOTE-INITIAL`: `deterministic:github:list_branches`, `deterministic:github:list_pull_requests:open:main:guardian/fix-checkout-egress`, `deterministic:github:get_file_contents:main`, and `deterministic:github:get_commit:main`.
- `REMOTE-REUSE`: `REMOTE-INITIAL` plus `deterministic:github:get_file_contents:remediation` and `deterministic:github:get_commit:remediation`.

### Scenario records

| Scenario | Fixture/case ID | Agent / session | Tool and approval references | Verifier output | Proposal hash | Expected / actual | Unsupported GitHub mutation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Existing PR reuse | `checkout-networkpolicy-egress-exposure` | `null` / `null` | `EVIDENCE-NORMAL`, `VERIFY-PASS`, `REMOTE-REUSE`; approvals `[]` | Attempt 1 `SECURITY_REMEDIATION_READY`; four-state pass | `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` | `PR_REUSED` / `PR_REUSED` | Confirmed absent; pure harness has no network client and constructed no write call |
| Denied first write | `checkout-networkpolicy-egress-exposure` | `null` / `null` | `EVIDENCE-NORMAL`, `VERIFY-PASS`, `REMOTE-INITIAL`, `deterministic:github:create_branch:denied-first-write:denied`, `deterministic:github:denied-first-write:post-denial-read`; approval `deterministic:approval:denied-first-write:create_branch:denied` | Attempt 1 ready; four-state pass | same controlling hash | `DENIED` / `DENIED` | Confirmed absent; pre/post remote snapshots are byte-identical |
| Missing deployment | `checkout-networkpolicy-egress-exposure-missing-deployment-revision` | `null` / `null` | GitHub evidence refs plus fixture refs suffixed `missing-deployment-revision`; approvals `[]` | `null`; verifier was not entered | `null` | `INCONCLUSIVE` / `INCONCLUSIVE` | Confirmed absent; stopped before candidate, sandbox, proposal, or approval |
| Missing reachability | `checkout-networkpolicy-egress-exposure-missing-reachability` | `null` / `null` | GitHub evidence refs plus fixture refs suffixed `missing-reachability`; approvals `[]` | `null`; verifier was not entered | `null` | `INCONCLUSIVE` / `INCONCLUSIVE` | Confirmed absent; stopped before candidate, sandbox, proposal, or approval |
| Conflicting revision | `checkout-networkpolicy-egress-exposure-conflicting-revision` | `null` / `null` | GitHub evidence refs plus fixture refs suffixed `conflicting-revision`; approvals `[]` | `null`; verifier was not entered | `null` | `INCONCLUSIVE` / `INCONCLUSIVE` | Confirmed absent; stopped before candidate, sandbox, proposal, or approval |
| Candidate failure twice | `checkout-networkpolicy-egress-exposure` | `null` / `null` | `EVIDENCE-NORMAL`, `deterministic:verifier:attempt-1`, `deterministic:verifier:attempt-2`; approvals `[]` | Attempt 1 `CORRECTION_REQUIRED`; attempt 2 `NO_SAFE_REMEDIATION`; both cite `DNS_REQUIRED_PATH` and `POSTGRES_REQUIRED_PATH` | `null` | `NO_SAFE_REMEDIATION` / `NO_SAFE_REMEDIATION` | Confirmed absent; no eligible proposal or write request |
| Mismatched branch/content | `checkout-networkpolicy-egress-exposure` | `null` / `null` | `EVIDENCE-NORMAL`, `VERIFY-PASS`, `deterministic:github:list_branches`, `deterministic:github:get_file_contents:mismatched-remediation`, `deterministic:github:get_commit:mismatched-remediation`; approvals `[]` | Attempt 1 ready; four-state pass | same controlling hash | `WRITE_CONFLICT` / `WRITE_CONFLICT` | Confirmed absent; no overwrite was constructed |
| Reconnect pending action | `checkout-networkpolicy-egress-exposure` | `null` / `null` | `EVIDENCE-NORMAL`, `VERIFY-PASS`, `REMOTE-INITIAL`, `deterministic:github:create_branch:reconnect-pending-action:denied`, `deterministic:github:reconnect-pending-action:post-denial-read`; approval `deterministic:approval:reconnect-pending-action:create_branch:denied` | Attempt 1 ready; four-state pass | same controlling hash | `DENIED` / `DENIED` | Confirmed absent; restored pending call was denied and snapshots stayed byte-identical |

The common four-state verifier output is:

| State | Classification | Secure | Functional |
| --- | --- | --- | --- |
| Last-known-good | `SECURE_AND_FUNCTIONAL` | Yes | Yes |
| Suspect | `EXPOSED` | No | Yes |
| Deny-all | `SECURE_BUT_OPERATIONALLY_REJECTED` | Yes | No |
| Candidate | `SECURE_AND_FUNCTIONAL` | Yes | Yes |

The reconnect checkpoint is canonicalized, serialized, parsed, and revalidated. Before and after values contain the same case ID, the same nine proposal evidence IDs, proposal hash `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15`, and pending action `CREATE_BRANCH`. The serialized checkpoint SHA-256 is `ca3b77fc2f9a5d4f85d5d62f028d9627abf658d3f6ca2583f8c25b81972dbafa`.

## Live TrueForge rehearsals

All counted runs used agent `01m0t4gpvz34x60qz6fxqz214d`, fixture case `checkout-networkpolicy-egress-exposure`, the same nine evidence IDs, the controlling proposal hash, and exact eligible write arguments. Because the matching remote PR already existed, the pending action in each live turn was remote reuse verification, not a write approval.

| Run | Session / turn | Tool calls | Approval events | Expected / actual | Elapsed | Mutation confirmation |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `01m0tfgtt9n0w7st7qfx6q4mgx` / `01m0tfh5mwk7tmh527xce70jjb.336t3a` | `call_1243417` `list_branches`; `call_1243421` `list_pull_requests`; `call_1243429` base file; `call_1243433` base commit; `call_5766660` remediation file; `call_5766668` remediation commit | None | `PR_REUSED` / `PR_REUSED` | 38.029 s | No write call; no approval event |
| 2 — reconnect | `01m0tfkaekaj655cchy5q7gr2s` / `01m0tfkmxef37f226azsbcd5yh.336t3a` | `call_9356452` `list_branches`; `call_9356456` `list_pull_requests`; `call_9356468` base file; `call_9356476` base commit; `call_5711599` remediation file; `call_5711611` remediation commit | None | `PR_REUSED` / `PR_REUSED` | 45.847 s | No write call; no approval event |
| 3 | `01m0tfnhmr8h6sy56k7s88z7ys` / `01m0tfnvq2grvprx9abjbsyjfg.336t3a` | `call_316444` `list_branches`; `call_316464` `list_pull_requests`; `call_316479` base file; `call_316483` base commit; `call_6188279` remediation file; `call_6188283` remediation commit | None | `PR_REUSED` / `PR_REUSED` | 42.190 s | No write call; no approval event |

Run 2's initial request connection was closed after creating the background turn. A fresh connection loaded the same session while it was running. Persisted `turn.created` event `01m0tfkmy3bdhzcfbjm6jj5ec4` retained the same proposal hash, the evidence IDs including `evidence:deployment:checkout-api:001`, and the pending instruction to verify and return `PR_REUSED`. The reconnected session then completed with the same proposal hash and PR. This is native TrueForge session persistence, not a Guardian database.

The safe live remote cannot reach a pending first-write approval because exact PR #1 is already present. The stronger approval-pending preservation claim is therefore deterministic integration proof only; it is not recast as a live TrueForge approval checkpoint.

One preliminary live session, `01m0tfefqrj2zqqkfxx7p5ss20`, is excluded from the three rehearsals because shell quoting omitted its exact eligible-write-call block. It made reads only, used `list_pull_requests`, emitted no approval, and caused no mutation. Excluding it avoids overstating a run whose input was incomplete.

## Post-run remote verification

After all live runs:

- fixture `origin/main` remained `7b2f2ad51f9ef97334176fbfed3138465b62fcdb`;
- remediation branch remained `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3`;
- the only branch diff remained the one target file with three deletions;
- candidate SHA-256 remained `c282434c506a45e93e39d2329b33c8466ba7a8a1d5d238817530678d975ad165`;
- exact open base/head listing still returned only PR #1;
- PR `updated_at` remained `2026-08-24T17:46:16Z`, predating the rehearsals.

## Frozen competition core

| Role | Frozen commit |
| --- | --- |
| Product Phase 5 integration core | `67049280f7fe0a011f4569b4571f36578e955d75` |
| Product merged Phase 4 base | `12cafa71769fd180afbaa246508cf4d74ac38902` |
| Fixture suspect base | `7b2f2ad51f9ef97334176fbfed3138465b62fcdb` |
| Fixture remediation candidate | `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3` |
| TrueForge runtime | `6026509d905fe255bf493e3845b1fca237bdf0fd` |

The documentation and review handoff commit follows the frozen product-core commit without changing its integration package.

## Exit-gate conclusion

| Gate | Result |
| --- | --- |
| Missing/incomplete evidence fails before sandbox and approval | Pass — three deterministic cases |
| Two failed candidate attempts return `NO_SAFE_REMEDIATION` | Pass — exact two-attempt deterministic proof |
| Mismatched remote work returns `WRITE_CONFLICT` without overwrite | Pass — deterministic remote snapshot proof |
| Reconnect preserves evidence IDs, proposal hash, and pending action | Pass — deterministic approval-pending checkpoint; narrower live running-session persistence proof |
| Retry returns existing PR without write or approval | Pass — deterministic plus three live TrueForge runs |
| Three rehearsals within three-minute narrative | Pass for safe live `PR_REUSED` path; 38.029–45.847 seconds |
| Fresh live denial/creation sequence | Not run; would require unauthorized destructive fixture reset |
| Fixture PR and development PR remain unmerged | Fixture confirmed; development PR is opened only after final local gates |
| Phase 6 behavior | Not implemented |
