# SecureOps Guardian implementation status

Updated: 24 August 2026.

## Purpose

Read this snapshot first when starting implementation or preparing a phase handoff. It records the current repository state and routes agents to the live contract without requiring old phase plans or evidence bundles by default.

This file is navigation and handoff state, not a product specification. The active product plan, current phase plan, and development workflow remain authoritative. Verify Git and GitHub state when a value here controls an entry gate.

## Current state

- Completed and merged: Phase 0, Phase 1, Phase 2, and Phase 3.
- Phase 4 implementation, local gates, denial proof, approved official-GitHub-MCP sequence, remote verification, and read-only retry proof pass. Development PR `jayesh9747/secureops-guardian#5` is open and unmerged; Qodo attempted review but reviews remain paused for this user.
- Current product branch: `phase-4/github-approval-write`, created from updated `main` at `382e57da8e2b6aae1ed6f0fee19ffd12c017cbac`.
- Product `main`: `382e57da8e2b6aae1ed6f0fee19ffd12c017cbac` after Phase 3 merge and contains the final Phase 3 branch head `3c1a5a503821e21f2301ed7fa2f633648d4ede84`.
- Controlling proposal hash: `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15`.
- Remediation PR `jayesh9747/guardian-demo-checkout#1` is open and unmerged at commit `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3`.
- TrueForge runtime pin: `6026509d905fe255bf493e3845b1fca237bdf0fd`.
- The TrueForge worktree has an operator-owned `docker-compose.yml` change. Preserve it and keep it out of product commits.

## Completed gates

| Phase | Pull request | Reviewed implementation head | Merge commit | Evidence |
| --- | --- | --- | --- | --- |
| 0 — platform gate | `jayesh9747/secureops-guardian#1` | `5097f16806363edb45db8531691390e2cab10a63` | `9b1c7436ef3a32b9c274d9eaa5e51ed6b58dd4e0` | [`PHASE_0_PLATFORM_GATE.md`](../evidence/PHASE_0_PLATFORM_GATE.md) |
| 1 — demo evidence | `jayesh9747/secureops-guardian#2` | `913474c9cbd53bcecb5a4794d8625549ac5a332f` | `c8fe85b929f27d675a26cf6fb990eb624988874c` | [`PHASE_1_DEMO_EVIDENCE.md`](../evidence/PHASE_1_DEMO_EVIDENCE.md) |
| 2 — agent investigation | `jayesh9747/secureops-guardian#3` | `fec1463146a8bceb233e4e126acca4acb68e14cb` | `05a07dc812b3b7e7ae7dce5534311f7f26f3ad1b` | [`PHASE_2_AGENT_INVESTIGATION.md`](../evidence/PHASE_2_AGENT_INVESTIGATION.md) |
| 3 — sandbox proof | `jayesh9747/secureops-guardian#4` | Operator accepted Claude review after Qodo remained unavailable; review-remediated head `ae6e75236bbc8ccfb17fe563837b944d9d5fdb2c` | `382e57da8e2b6aae1ed6f0fee19ffd12c017cbac` | [`PHASE_3_SANDBOX_PROOF.md`](../evidence/PHASE_3_SANDBOX_PROOF.md) |

Read a completed phase's plan or evidence only when verifying its prerequisite, reproducing its trace, or diagnosing a regression.

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

The repository does not contain merge/deployment behavior, cluster access, later-phase UI, or Phase 5 persistence/reliability behavior.

## Immutable fixture references

Repository: `jayesh9747/guardian-demo-checkout`

| Role | Full commit SHA |
| --- | --- |
| Last-good NetworkPolicy | `a6d177b43396c7b4b45aa98cb2970d0489a7a4f9` |
| Suspect unrestricted-egress regression | `7b2f2ad51f9ef97334176fbfed3138465b62fcdb` |

These SHAs are evidence identifiers, not moving aliases. Advancing the fixture branch does not change them. Replacing the scenario requires new commits, a fixture-version bump, synchronized product constants/tests/docs, and a new TrueForge GitHub-MCP join trace. Do not rewrite the owned fixture history.

## Phase 4 entry check

Verified before Phase 4 implementation:

1. Product PR #4 is merged at `382e57da8e2b6aae1ed6f0fee19ffd12c017cbac`; the operator explicitly accepted Claude review in place of unavailable Qodo/GitHub review.
2. Updated `main` contains `dabc169b1c641d8827bb0d7591aeef30da0bc5cb` and the later merged review-remediation head `3c1a5a503821e21f2301ed7fa2f633648d4ede84`.
3. The merged Phase 3 proof, candidate, and proposal artifacts exist. Review remediation changed the controlling proposal from the obsolete pre-remediation hash to `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` and branch `guardian/fix-checkout-egress`.
4. The displayed candidate byte-matches the merged sandbox candidate artifact at SHA-256 `c282434c506a45e93e39d2329b33c8466ba7a8a1d5d238817530678d975ad165`.
5. Both immutable fixture commits remain present and ancestors of fixture `origin/main`.
6. The product, fixture, and TrueForge worktrees were inspected; the operator-owned TrueForge `docker-compose.yml` change remains preserved.
7. `phase-4/github-approval-write` was created from updated product `main`.

The Phase 4 entry, implementation, tests, local quality, denial, approval, and retry trace gates pass. Qodo automatically attempted PR #5 but reported that reviews are paused for this user, so no findings or completed Qodo review are inferred and the development PR remains open.

## Known risks and limits

- Fixture incident evidence is owned and synthetic; GitHub commit evidence is real.
- Phase 3 verification is a narrow deterministic static manifest/contract check. It does not simulate Kubernetes admission, CNI behavior, DNS resolution, packets, application behavior, live reachability, data access, or exfiltration.
- The official GitHub file-content transport exposed a blob/download reference in the accepted trace. The GitHub child reconstructed the suspect manifest from the official parent and suspect full-patch responses; validation recomputed and matched the cited Git blob SHA.
- Actual data access and exfiltration remain `Unknown`.
- Dynamic subagent roles are instruction-scoped, not enforced authorization boundaries.
- Full-SHA coordination depends on preserving the owned fixture history.
- The accepted Daytona sandbox retrieved only pinned public runtime packages without credentials. It received no GitHub, cloud, cluster, SSH, model, or other service credentials.
- GitHub remediation writes are separately approval-gated, retry-safe, and not atomic. The exact remediation branch, commit, and PR now exist only in the owned fixture repository and remain open/unmerged.
- Remote candidate byte identity is proven by matching the expected Git blob SHA exposed by the official GitHub MCP. The transport does not provide an independent SHA-256 digest.
- Two Qodo deep reviews completed and all five findings were resolved. A final confirmation review was requested, but Qodo reported reviews paused for this user; do not infer a third zero-finding review.
- Qodo automatically attempted Phase 3 PR #4 and reported reviews paused for this user. The operator explicitly accepted Claude review before merging Phase 3; do not recast that as a Qodo review.
- Qodo automatically attempted Phase 4 PR #5 and again reported reviews paused for this user. No Phase 4 Qodo findings exist; keep the PR open unless the operator explicitly accepts another review route.

## Handoff update protocol

The implementation agent for every phase updates this file in that phase's product PR:

1. Reconcile the snapshot with Git and GitHub before editing it.
2. Record the phase as in progress or gate-passed; use merged only after GitHub confirms the merge.
3. Update the current product revision, next phase/branch, immutable cross-repository references, implemented boundary, and live risks.
4. Link the phase evidence record instead of copying trace details into this snapshot.
5. Keep credentials, private data, model reasoning, and local absolute paths out of the file.

The handoff update is complete when a fresh agent can identify the current phase, verify its entry gate, and locate deeper evidence without reading superseded phase material.
