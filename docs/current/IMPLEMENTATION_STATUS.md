# SecureOps Guardian implementation status

Updated: 25 August 2026.

## Purpose

Read this snapshot first when starting implementation or preparing a phase handoff. It records the current repository state and routes agents to the live contract without requiring old phase plans or evidence bundles by default.

This file is navigation and handoff state, not a product specification. The active product plan, current phase plan, and development workflow remain authoritative. Verify Git and GitHub state when a value here controls an entry gate.

## Current state

- Completed and merged: Phase 0 through Phase 4.
- Phase 5 deterministic integration, safe-state TrueForge persistence/retry rehearsals, and local gates pass. Development PR [#6](https://github.com/jayesh9747/secureops-guardian/pull/6) is open, non-draft, and unmerged.
- Current product branch: `phase-5/reliability-persistence`, created from updated `main` at `12cafa71769fd180afbaa246508cf4d74ac38902`.
- Product `main`: `12cafa71769fd180afbaa246508cf4d74ac38902` after Phase 4 merge and contains reviewed Phase 4 head `b442a9d3765a4063bf98e7f429b8272686dac645`.
- Frozen Phase 5 review-remediated core: `fce34f3ac80a989591e061079d944e6b3a6f62d5`.
- Controlling proposal hash: `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15`.
- Remediation PR `jayesh9747/guardian-demo-checkout#1` is open and unmerged at commit `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3`.
- TrueForge runtime pin: `6026509d905fe255bf493e3845b1fca237bdf0fd`.
- Saved TrueForge agent `01m0t4gpvz34x60qz6fxqz214d` now byte-matches the merged Phase 4 instructions, enables direct `list_pull_requests`, and separately approval-gates all three writes.
- The TrueForge worktree has an operator-owned `docker-compose.yml` change. Preserve it and keep it out of product commits.

## Completed gates

| Phase | Pull request | Reviewed implementation head | Merge commit | Evidence |
| --- | --- | --- | --- | --- |
| 0 — platform gate | `jayesh9747/secureops-guardian#1` | `5097f16806363edb45db8531691390e2cab10a63` | `9b1c7436ef3a32b9c274d9eaa5e51ed6b58dd4e0` | [`PHASE_0_PLATFORM_GATE.md`](../evidence/PHASE_0_PLATFORM_GATE.md) |
| 1 — demo evidence | `jayesh9747/secureops-guardian#2` | `913474c9cbd53bcecb5a4794d8625549ac5a332f` | `c8fe85b929f27d675a26cf6fb990eb624988874c` | [`PHASE_1_DEMO_EVIDENCE.md`](../evidence/PHASE_1_DEMO_EVIDENCE.md) |
| 2 — agent investigation | `jayesh9747/secureops-guardian#3` | `fec1463146a8bceb233e4e126acca4acb68e14cb` | `05a07dc812b3b7e7ae7dce5534311f7f26f3ad1b` | [`PHASE_2_AGENT_INVESTIGATION.md`](../evidence/PHASE_2_AGENT_INVESTIGATION.md) |
| 3 — sandbox proof | `jayesh9747/secureops-guardian#4` | Operator accepted Claude review after Qodo remained unavailable; review-remediated head `ae6e75236bbc8ccfb17fe563837b944d9d5fdb2c` | `382e57da8e2b6aae1ed6f0fee19ffd12c017cbac` | [`PHASE_3_SANDBOX_PROOF.md`](../evidence/PHASE_3_SANDBOX_PROOF.md) |
| 4 — approval and GitHub write | `jayesh9747/secureops-guardian#5` | `b442a9d3765a4063bf98e7f429b8272686dac645` | `12cafa71769fd180afbaa246508cf4d74ac38902` | [`PHASE_4_APPROVAL_GITHUB_WRITE.md`](../evidence/PHASE_4_APPROVAL_GITHUB_WRITE.md) |

Read a completed phase's plan or evidence only when verifying its prerequisite, reproducing its trace, or diagnosing a regression.

## Active Phase 5 gate

The Phase 5 branch adds one deterministic integration package and no Phase 6 behavior. Its eight-case matrix covers existing-PR reuse, first-write denial, missing deployment, missing reachability, conflicting revision, two failed candidate attempts, mismatched remote content, and reconnect with a pending action. See [`PHASE_5_RELIABILITY_PERSISTENCE.md`](../evidence/PHASE_5_RELIABILITY_PERSISTENCE.md).

Three consecutive live TrueForge runs against preserved fixture PR #1 returned `PR_REUSED` with six reads, zero write calls, and zero approvals. The middle run reloaded the running session through a fresh connection and preserved the proposal/evidence input and pending reuse-verification instruction. The exact approval-pending reconnect is deterministic integration proof because the current safe remote state already contains the branch and PR.

Qodo's automatic and manual `/review` attempts on PR #6 both reported reviews paused. Qodo supplied no findings or approval. An alternate two-axis standards/spec review completed; applicable findings were resolved in `fce34f3ac80a989591e061079d944e6b3a6f62d5`. Explicit operator acceptance of that alternate review remains required before merge. See the [Phase 5 release checklist](../evidence/PHASE_5_RELEASE_CHECKLIST.md).

## Implemented capability boundary

The repository currently contains:

- Phase 0 TrueForge proofs for the model path, official GitHub MCP, Fixture MCP transport, Daytona sandbox, dynamic subagent primitive, and approval/reconnect primitive.
- Phase 1 owned Git history, typed synthetic evidence, deterministic failure variants, and four read-only Fixture MCP evidence tools.
- Phase 2 bounded root/child contracts, exact GitHub evidence and Git-blob provenance validation, canonical fixture-payload validation, complete bounded NetworkPolicy identity parsing, deterministic `SEC-NET-001` evaluation, four-link causal synthesis, the cited `High` finding, and fail-closed evidence-defect behavior.
- A successful TrueForge trace with two child threads joining real GitHub evidence to owned synthetic observations. See [`PHASE_2_AGENT_INVESTIGATION.md`](../evidence/PHASE_2_AGENT_INVESTIGATION.md).
- Phase 3 pure deterministic NetworkPolicy evaluation, one explicit-path stable-JSON CLI, exact contract and three policy fixtures, content-derived four-state proof, a two-attempt fail-closed candidate workflow, canonical proposal/diff/hash construction, and adversarial tests. The verifier rejects selector, peer, port, and CIDR semantics outside its exact owned subset and requires exact dependency-path rules.
- A successful post-review TrueForge/Daytona trace in which the supported Phase 2 finding precedes sandbox creation, the model writes the candidate at the exact required path before verification, and the eligible proposal is created only after both candidate and four-state verification pass. The canonical proposal targets the Phase 4 contract branch `guardian/fix-checkout-egress`. See [`PHASE_3_SANDBOX_PROOF.md`](../evidence/PHASE_3_SANDBOX_PROOF.md).
- Phase 4 exact proposal and candidate-byte binding, deterministic write-call construction, remote-state conflict/reuse decisions, pre-mutation presentation, truthful machine-readable receipts, and minimum-tool TrueForge agent configuration. The repository contains no GitHub client; TrueForge calls the official GitHub MCP directly.
- Accepted TrueForge denial, approved, and retry traces. Denial writes nothing; approval creates the exact fixture remediation branch, commit, and open PR through three separately approved calls; retry uses reads only and returns the same PR. See [`PHASE_4_APPROVAL_GITHUB_WRITE.md`](../evidence/PHASE_4_APPROVAL_GITHUB_WRITE.md).
- Phase 5 strict audit records and deterministic orchestration across the evidence, candidate, proposal, remote decision, receipt, and persistence boundaries. Unsafe evidence stops before verifier/proposal/approval, two failed candidates terminate, remote mismatch cannot overwrite, and checkpoint restoration requires the same case, evidence IDs, proposal hash, and pending action. Typed remote results and independently computed before/after snapshot hashes make no-mutation claims schema-checkable; reconnect approval is rejected for a different proposal or pending action.
- Three safe-state live retry rehearsals plus one native running-session reconnect proof. All use direct exact-head PR listing and preserve the fixture remote state.

The repository does not contain merge/deployment behavior, cluster access, a Guardian persistence database, later-phase UI, or Phase 6 behavior.

## Immutable fixture references

Repository: `jayesh9747/guardian-demo-checkout`

| Role | Full commit SHA |
| --- | --- |
| Last-good NetworkPolicy | `a6d177b43396c7b4b45aa98cb2970d0489a7a4f9` |
| Suspect unrestricted-egress regression | `7b2f2ad51f9ef97334176fbfed3138465b62fcdb` |
| Open remediation candidate | `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3` |

These SHAs are evidence identifiers, not moving aliases. Advancing the fixture branch does not change them. Replacing the scenario requires new commits, a fixture-version bump, synchronized product constants/tests/docs, and a new TrueForge GitHub-MCP join trace. Do not rewrite the owned fixture history.

## Phase 5 entry and exit check

Verified before Phase 5 implementation:

1. Product PR #5 is merged at `12cafa71769fd180afbaa246508cf4d74ac38902` and contains reviewed Phase 4 head `b442a9d3765a4063bf98e7f429b8272686dac645`.
2. Fixture PR #1 is the sole exact open base/head match, remains unmerged, and retains exact title/body/content at `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3`.
3. The product and fixture worktrees were clean. The operator-owned TrueForge compose modification remained preserved.
4. `phase-5/reliability-persistence` was created from updated product `main`.
5. Before live retry, saved Phase 4 agent `01m0t4gpvz34x60qz6fxqz214d` was reconciled from `search_pull_requests` to merged-source `list_pull_requests`, exact open base/head validation, exact title/body/content validation, and separate approval gates for all writes.

The Phase 5 integration matrix and three safe-state live rehearsals pass. A new live denial/creation sequence was not attempted because it would require deleting or rewriting the protected fixture branch/PR. The evidence record distinguishes deterministic proof from live TrueForge proof.

## Known risks and limits

- Fixture incident evidence is owned and synthetic; GitHub commit evidence is real.
- Phase 3 verification is a narrow deterministic static manifest/contract check. It does not simulate Kubernetes admission, CNI behavior, DNS resolution, packets, application behavior, live reachability, data access, or exfiltration.
- The official GitHub file-content transport exposed a blob/download reference in the accepted trace. The GitHub child reconstructed the suspect manifest from the official parent and suspect full-patch responses; validation recomputed and matched the cited Git blob SHA.
- Actual data access and exfiltration remain `Unknown`.
- Dynamic subagent roles are instruction-scoped, not enforced authorization boundaries.
- Full-SHA coordination depends on preserving the owned fixture history.
- The accepted Daytona sandbox retrieved only pinned public runtime packages without credentials. It received no GitHub, cloud, cluster, SSH, model, or other service credentials.
- GitHub remediation writes are separately approval-gated, retry-safe, and not atomic. The exact remediation branch, commit, and PR now exist only in the owned fixture repository and remain open/unmerged. The fixture review approved the patch content and recommended a separate verifier-CI hardening change; adding that workflow to the approval-bound branch would invalidate the exact proposal, so PR #1 remains the one-file candidate.
- Remote candidate byte identity is proven by matching the expected Git blob SHA exposed by the official GitHub MCP. The transport does not provide an independent SHA-256 digest.
- Two Qodo deep reviews completed and all five findings were resolved. A final confirmation review was requested, but Qodo reported reviews paused for this user; do not infer a third zero-finding review.
- Qodo automatically attempted Phase 3 PR #4 and reported reviews paused for this user. The operator explicitly accepted Claude review before merging Phase 3; do not recast that as a Qodo review.
- Qodo automatically attempted Phase 4 PR #5 and reported reviews paused for this user. No Phase 4 Qodo findings or approval exist; do not recast its later merge as Qodo approval.
- The live Phase 5 remote is intentionally not clean: exact fixture PR #1 must remain open. Live rehearsals can prove reuse and running-session persistence, but cannot reach first-write approval or creation without a destructive reset. Do not claim a new live denial/creation proof.
- Deterministic reconnect proves an approval-pending `CREATE_BRANCH` checkpoint. The live reconnect proves the narrower preserved running-session input and pending reuse-verification action. Do not recast the live run as an approval pause.
- Qodo's automatic and manual Phase 5 PR #6 attempts reported reviews paused. No Qodo findings or approval exist. The alternate review is complete and remediated, but explicit operator acceptance remains a merge blocker.

## Handoff update protocol

The implementation agent for every phase updates this file in that phase's product PR:

1. Reconcile the snapshot with Git and GitHub before editing it.
2. Record the phase as in progress or gate-passed; use merged only after GitHub confirms the merge.
3. Update the current product revision, next phase/branch, immutable cross-repository references, implemented boundary, and live risks.
4. Link the phase evidence record instead of copying trace details into this snapshot.
5. Keep credentials, private data, model reasoning, and local absolute paths out of the file.

The handoff update is complete when a fresh agent can identify the current phase, verify its entry gate, and locate deeper evidence without reading superseded phase material.
