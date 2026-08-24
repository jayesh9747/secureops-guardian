# Phase 4 approval-bound GitHub-write evidence

Date: 24 August 2026

Branch: `phase-4/github-approval-write`

Scope: Phase 4 only

## Result

Phase 4 passes its proposal-binding, denial, approved-write, remote-verification, retry, conflict, and local-quality gates. TrueForge used only the official GitHub MCP against `jayesh9747/guardian-demo-checkout`. Each of the three writes paused for a separate approval, one earlier identical branch write was denied with zero mutation, and a fresh retry reused the same open remediation PR without a write or approval event.

Remediation pull request: [`jayesh9747/guardian-demo-checkout#1`](https://github.com/jayesh9747/guardian-demo-checkout/pull/1), open and unmerged.

Development pull request: [`jayesh9747/secureops-guardian#5`](https://github.com/jayesh9747/secureops-guardian/pull/5), open and unmerged.

Guardian did not merge, deploy, roll back, delete a branch, create an issue, access Actions or secrets, administer a repository, contact a Kubernetes cluster, or write to the product repository through the remediation credential.

## Entry-gate reconciliation

The operator explicitly accepted Claude review in place of unavailable Qodo/GitHub review and authorized Phase 4 to use the controlling merged Phase 3 proposal. Product PR #4 is merged as `382e57da8e2b6aae1ed6f0fee19ffd12c017cbac`; `origin/main` contains the originally named `dabc169b1c641d8827bb0d7591aeef30da0bc5cb` plus the later review-remediation commits.

The merged proposal artifact controls Phase 4:

| Item | Verified value |
| --- | --- |
| Proposal hash | `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` |
| Proposal ID | `proposal:sha256:2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` |
| Candidate SHA-256 | `c282434c506a45e93e39d2329b33c8466ba7a8a1d5d238817530678d975ad165` |
| Candidate Git blob SHA | `1eddb230ac7c05bae199e6b9162a42da3bf039fa` |
| Suspect Git blob SHA | `477c7db7edd61de10fce67713d52e442f2358318` |
| Base/remediation branches | `main` / `guardian/fix-checkout-egress` |
| Target file | `k8s/checkout-networkpolicy.yaml` |

The displayed candidate constant is byte-for-byte equal to `PHASE_3_CANDIDATE.yaml`; tests also require its SHA-256 and Git blob SHA and require it to canonicalize to the candidate bound inside `PHASE_3_PROPOSAL.json`.

Both immutable fixture commits remain available and ancestors of fixture `origin/main`:

- `a6d177b43396c7b4b45aa98cb2970d0489a7a4f9`
- `7b2f2ad51f9ef97334176fbfed3138465b62fcdb`

The product and fixture worktrees were clean before Phase 4 branching. The TrueForge worktree remained pinned at `6026509d905fe255bf493e3845b1fca237bdf0fd`; its operator-owned two-line `docker-compose.yml` change remains unstaged and untouched.

## Capability and authorization boundary

Saved TrueForge agent `secureops-guardian-phase-4`, ID `01m0t4gpvz34x60qz6fxqz214d`, attached only these official GitHub MCP tools:

- Reads: `list_branches`, `search_pull_requests`, `get_file_contents`, and `get_commit`.
- Writes: `create_branch`, `create_or_update_file`, and `create_pull_request`.
- Approval required separately for all three enabled writes.

Sandbox, dynamic subagents, Generative UI, and question tools were disabled. No merge, delete, issue, Actions, secrets, administration, product-repository, Kubernetes, deployment, or rollback tool was enabled. The fine-grained credential is the fixture-only credential established by the Phase 0 gate with only metadata plus the Contents/Pull Requests access required for this demo.

The repository implementation is a pure proposal/write-contract auditor. It does not contain a GitHub client or wrapper. TrueForge calls the official MCP directly.

## Denial proof

| Item | Trace reference |
| --- | --- |
| Session | `01m0t4hg5w5shn88202mpx8k7y` |
| Initial pending turn | `01m0t4hg6awj30p633q2hy9xyy.336t3a` |
| Denied write call | `call_8455492` — exact `create_branch` request |
| Denial/resume turn | `01m0t4k7hfcz6r82277hy34ehb.336t3a` |
| Denial input event | `01m0t4k7hy0s96aa0q01e84nvt` |
| Post-denial reads | `call_1209563`, `call_1209579`, `call_1209587`, `call_1209598` |

Before denial, official reads showed only `main`, no matching open PR, base commit `7b2f2ad51f9ef97334176fbfed3138465b62fcdb`, and suspect blob `477c7db7edd61de10fce67713d52e442f2358318`. The operator denied the first exact `create_branch` request. The four fresh reads afterward showed the identical state: only `main`, zero matching PRs, the same base commit, and the same blob. The denied call was not retried.

Receipt: [`PHASE_4_DENIED_RECEIPT.json`](./PHASE_4_DENIED_RECEIPT.json). It contains status `DENIED`, the denied call reference, no approved calls, no remote commit, no PR URL, and no mutation claim.

## Approved path

| Item | Trace reference/result |
| --- | --- |
| Session | `01m0t4mkp2ymgmaqkpnj55kq01` |
| Initial turn | `01m0t4mkq506j2mjekfqvadjw2.336t3a` |
| Branch write/approval | `call_5239399` / `01m0t4pemj8vpsserj0rrjk1y6` |
| File write/approval | `call_5722506` / `01m0t4qk0spnxxx46z9jpjeks6` |
| PR write/approval | `call_7149047` / `01m0t4s6ps11t73f8vx68jy71g` |
| Remote candidate commit | `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3` |
| Remediation PR | `jayesh9747/guardian-demo-checkout#1` |

The branch was created from the verified base only after approval. A branch read then proved the same base commit and suspect blob before the file update was requested. The file update arguments contained the exact target, exact candidate bytes, original blob SHA, deterministic branch, and commit message with the exact proposal hash.

Before PR creation, official reads proved:

- remediation blob `1eddb230ac7c05bae199e6b9162a42da3bf039fa`, matching the verified candidate bytes;
- remediation commit `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3`, with the exact proposal hash in its message;
- base blob still `477c7db7edd61de10fce67713d52e442f2358318`;
- base commit still `7b2f2ad51f9ef97334176fbfed3138465b62fcdb`;
- zero existing matching open PRs.

Only then did `create_pull_request` pause for its separate approval. The PR result and follow-up search returned one open PR whose body contains the proposal hash, evidence links and IDs, four-state results, limitations, and the explicit no-merge/no-deploy boundary.

Receipt: [`PHASE_4_PR_CREATED_RECEIPT.json`](./PHASE_4_PR_CREATED_RECEIPT.json).

## Retry proof

| Item | Trace reference |
| --- | --- |
| Session | `01m0t4trxnjdcm26t1mt601m5e` |
| Turn | `01m0t4try2apxc4x84a0tq8342.336t3a` |
| Read calls | `call_6791435`, `call_6791447`, `call_6791466`, `call_6791470`, `call_8972036`, `call_8972059` |
| Write calls | None |
| Approval events | None |
| Returned PR | `jayesh9747/guardian-demo-checkout#1` |

The fresh session read the branch, PR, base file/commit, and remediation file/commit. The candidate blob, commit proposal hash, PR base/head/body proposal hash, and base state all matched. It emitted `PR_REUSED` with the same commit and PR URL and made no write call.

Receipt: [`PHASE_4_PR_REUSED_RECEIPT.json`](./PHASE_4_PR_REUSED_RECEIPT.json).

## Conflict and permission tests

The pure contract tests cover mismatched proposal hash/ID, product-repository targeting, wrong file, wrong tool, changed base content, mismatched deterministic-branch content, missing proposal hash in the branch commit, and mismatched PR base/head/body. Every case returns or throws `WRITE_CONFLICT` before an overwrite.

Receipt factories reject unsupported claims: `PR_CREATED` requires three approved write references, verified remote content, an unchanged base, a remote commit, and a PR result; `PR_REUSED` permits no approval/write references; `DENIED` requires branch/PR absence and an unchanged base; `WRITE_CONFLICT` cannot include a successful PR claim.

## Quality gate

| Command/check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Pass |
| `pnpm format:check` | Pass |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass; 10 files and 73 tests |
| `pnpm build` | Pass |
| `pnpm bundle:verifier` | Pass |
| `git diff --check` | Pass |
| Working-tree secret pattern scan | Pass |
| Working-tree local absolute-path scan | Pass |
| GitGuardian Security Checks on PR #5 | Pass |
| Qodo review | Attempted; externally unavailable because reviews are paused for this user |

Qodo automatically attempted PR #5 at `2026-08-24T15:11:11Z` and posted that reviews are paused for this user. It produced no findings or completed review. This record does not infer a zero-finding Qodo result; the development PR remains open.

## Exit-gate conclusion

| Gate | Result |
| --- | --- |
| Denial proves zero GitHub writes | Pass |
| Approved sequence creates exact verified remediation PR | Pass |
| Remote content verified before PR creation | Pass |
| Base remains unchanged | Pass |
| Retry reuses the same PR without duplication | Pass |
| Proposal/content/target mismatches fail closed | Pass |
| Each write separately approval-gated; no atomic claim | Pass |
| No merge, deployment, rollback, branch deletion, issue creation, or cluster access | Pass |
| Phase 5 or later behavior | Not implemented |

The remediation PR remains open and unmerged. The Phase 4 development PR must also remain open and unmerged at handoff.
