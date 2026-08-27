# SecureOps Guardian implementation status

Updated: 27 August 2026.

## Purpose

Read this snapshot first when starting implementation or preparing a phase handoff. It records the current repository state and routes agents to the live contract without requiring old phase plans or evidence bundles by default.

This file is navigation and handoff state, not a product specification. The active product plan, current phase plan, and development workflow remain authoritative. Verify Git and GitHub state when a value here controls an entry gate.

## Current state

- Completed and merged: original Phase 0 through Phase 7. Phase 7 PR [#8](https://github.com/jayesh9747/secureops-guardian/pull/8) merged as `cfa65ef288d2ae615c1dd2d58d1086655177420c` after the operator's alternate-review remediation and acceptance.
- Post-Phase-7 reliability and UI-contract fixes are merged through PR [#12](https://github.com/jayesh9747/secureops-guardian/pull/12): conversation-only greeting routing, separation of result from execution trace, decision-first results, and fail-closed verifier-input handling.
- Product `main`: `08684b89ef97d5487b236ea94e894bdda77e5c4c` after the Phase 8 acceptance-gap correction PR #14 merged.
- Expansion Phase 1 — Natural-language request compiler was implemented in PR [#13](https://github.com/jayesh9747/secureops-guardian/pull/13) and its six acceptance gaps were corrected in merged PR [#14](https://github.com/jayesh9747/secureops-guardian/pull/14), reviewed head `5baf52070bd0fc6652f63db540887f6a5228d1ca`, merge commit `08684b89ef97d5487b236ea94e894bdda77e5c4c`.
- Expansion Phase 2 — verifier skill bundle is implemented on `expansion-phase-2/verifier-skill-bundle` and remains unmerged. The separate public skill repository is pinned at commit `bdea775220c07c20bd7f433cb3e12793d105b266`, tag `guardian-network-egress-v1.0.2`, with skill PR [#1](https://github.com/jayesh9747/secureops-guardian-verifier-skill/pull/1) open. Product evidence is in [`EXPANSION_PHASE_2_VERIFIER_SKILL_BUNDLE.md`](../evidence/EXPANSION_PHASE_2_VERIFIER_SKILL_BUNDLE.md).
- Frozen Phase 5 review-remediated core: `263e6a27307a667f08bfa832b436a754c0848a2e`.
- Controlling proposal hash: `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15`.
- Remediation PR `jayesh9747/guardian-demo-checkout#1` is open and unmerged at commit `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3`.
- TrueForge runtime pin: `6026509d905fe255bf493e3845b1fca237bdf0fd`.
- Saved TrueForge agent `01m0t4gpvz34x60qz6fxqz214d` now byte-matches the merged Phase 4 instructions, enables direct `list_pull_requests`, and separately approval-gates all three writes.
- Saved TrueForge agent `secureops-guardian_v0`, ID `01m0w6s2eyqtzyb6q4y6ppsta9`, is reconciled to the Expansion Phase 2 portable manifest. Canonical saved/export manifest SHA-256 is `4517ec18384fd6a2fae17c33a977d1c2f24230e8f7a2aa9570cba733bd57829e`. The manifest attaches only the pinned `guardian-network-egress-v1` skill in addition to the retained official GitHub MCP, Fixture MCP, Daytona, dynamic children, all three write approvals, stock Generative UI, and ask-user behavior. Its immutable predecessor `secureops-guardian`, ID `01m0vvphezaejvtcxgf9z972ed`, remains saved so existing reference sessions keep resolving.
- Phase-named saved agents remain only as historical test fixtures/reference configurations.
- The TrueForge worktree has an operator-owned `docker-compose.yml` change. Preserve it and keep it out of product commits.

## Completed gates

| Phase | Pull request | Reviewed implementation head | Merge commit | Evidence |
| --- | --- | --- | --- | --- |
| 0 — platform gate | `jayesh9747/secureops-guardian#1` | `5097f16806363edb45db8531691390e2cab10a63` | `9b1c7436ef3a32b9c274d9eaa5e51ed6b58dd4e0` | [`PHASE_0_PLATFORM_GATE.md`](../evidence/PHASE_0_PLATFORM_GATE.md) |
| 1 — demo evidence | `jayesh9747/secureops-guardian#2` | `913474c9cbd53bcecb5a4794d8625549ac5a332f` | `c8fe85b929f27d675a26cf6fb990eb624988874c` | [`PHASE_1_DEMO_EVIDENCE.md`](../evidence/PHASE_1_DEMO_EVIDENCE.md) |
| 2 — agent investigation | `jayesh9747/secureops-guardian#3` | `fec1463146a8bceb233e4e126acca4acb68e14cb` | `05a07dc812b3b7e7ae7dce5534311f7f26f3ad1b` | [`PHASE_2_AGENT_INVESTIGATION.md`](../evidence/PHASE_2_AGENT_INVESTIGATION.md) |
| 3 — sandbox proof | `jayesh9747/secureops-guardian#4` | Operator accepted Claude review after Qodo remained unavailable; review-remediated head `ae6e75236bbc8ccfb17fe563837b944d9d5fdb2c` | `382e57da8e2b6aae1ed6f0fee19ffd12c017cbac` | [`PHASE_3_SANDBOX_PROOF.md`](../evidence/PHASE_3_SANDBOX_PROOF.md) |
| 4 — approval and GitHub write | `jayesh9747/secureops-guardian#5` | `b442a9d3765a4063bf98e7f429b8272686dac645` | `12cafa71769fd180afbaa246508cf4d74ac38902` | [`PHASE_4_APPROVAL_GITHUB_WRITE.md`](../evidence/PHASE_4_APPROVAL_GITHUB_WRITE.md) |
| 5 — reliability and persistence | `jayesh9747/secureops-guardian#6` | `263e6a27307a667f08bfa832b436a754c0848a2e` | `fce4424be5461b2272dfbdd15c3d545d0c1e06e1` | [`PHASE_5_RELIABILITY_PERSISTENCE.md`](../evidence/PHASE_5_RELIABILITY_PERSISTENCE.md) |
| 6 — UI, quality, submission | `jayesh9747/secureops-guardian#7` | `71835c282406d001e945243717c37068c441ed01` | `8fde66dfcd7f537f70192246ee3a7eb7173f53ba` | [`PHASE_6_UI_QUALITY_SUBMISSION.md`](../evidence/PHASE_6_UI_QUALITY_SUBMISSION.md) |
| 7 — unified Guardian | `jayesh9747/secureops-guardian#8` | `b0ca030524aad8f4227e29bae86a0dcc5f219229` | `cfa65ef288d2ae615c1dd2d58d1086655177420c` | [`PHASE_7_UNIFIED_GUARDIAN.md`](../evidence/PHASE_7_UNIFIED_GUARDIAN.md) |
| Expansion 1 — natural-language compiler | `jayesh9747/secureops-guardian#13` | `bb6d71035d4109a42bb13be561ea28c300834743` | `dc056805934ff55d83e0756c5d91a722184309b1` | [`EXPANSION_PHASE_1_NATURAL_LANGUAGE_REQUEST_COMPILER.md`](../evidence/EXPANSION_PHASE_1_NATURAL_LANGUAGE_REQUEST_COMPILER.md) |
| Phase 8 — Expansion 1 acceptance corrections | `jayesh9747/secureops-guardian#14` | `5baf52070bd0fc6652f63db540887f6a5228d1ca` | `08684b89ef97d5487b236ea94e894bdda77e5c4c` | [`EXPANSION_PHASE_1_NATURAL_LANGUAGE_REQUEST_COMPILER.md`](../evidence/EXPANSION_PHASE_1_NATURAL_LANGUAGE_REQUEST_COMPILER.md) |

Read a completed phase's plan or evidence only when verifying its prerequisite, reproducing its trace, or diagnosing a regression.

## Completed Phase 7 gate

Phase 7 replaces phase selection with one saved root agent. The new `@guardian/orchestration` package validates a stable repository scope, establishes the `ANALYSIS_ONLY`, `PREPARE_REMEDIATION`, and `OPEN_PR` capability ceilings, parameterizes arbitrary-repository read-only preflight, composes the frozen Phase 2-6 modules for the exact supported fixture, and emits a cross-stage machine-readable run receipt.

The current deterministic Phase 7 suite proves the three modes, arbitrary repository parameterization, complete comparison-range planning, normalized repository/path rejection, unsupported/missing-evidence fail-closed receipts, prompt-injection non-influence, source-identity mismatches, exact proposal and remote-content conflicts, exact PR reuse, retained approval selectors, and the current-fixture composed journey. See [`PHASE_7_UNIFIED_GUARDIAN.md`](../../plans/secureops-guardian-hackathon/PHASE_7_UNIFIED_GUARDIAN.md); the final evidence record is [`PHASE_7_UNIFIED_GUARDIAN.md`](../evidence/PHASE_7_UNIFIED_GUARDIAN.md).

The entry and exit gates passed: Phase 6 was merged, fixture PR #1 remained open/unmerged at the exact remediation head, updated `main` was used, and the operator-owned TrueForge compose change remained untouched. Full verification passed and Phase 7 PR [#8](https://github.com/jayesh9747/secureops-guardian/pull/8) merged as `cfa65ef288d2ae615c1dd2d58d1086655177420c`. Qodo was paused; all 15 findings from the consolidated alternate review were reproduced and remediated with regression coverage, and the operator accepted the alternate review.

After merge, live greeting replays exposed one prompt-routing regression: a message without scope was always treated as an incomplete run. The saved agent and portable export now classify conversation-only intent first. `hello` and capability questions produce direct responses with zero tool calls; an explicit but incomplete investigation request produces one ask-user call without substituting the demo fixture. The evidence and session IDs are recorded in [`PHASE_7_UNIFIED_GUARDIAN.md`](../evidence/PHASE_7_UNIFIED_GUARDIAN.md).

Post-Phase-7 live remediation replay also exposed a missing verifier-input gate and noisy sandbox fallback behavior. Remediation modes now require a visible five-file `verifier_inputs` declaration before tools, child investigators return JSON without sandbox formatting, and the verifier follows a bounded pinned command sequence. The accepted fail-closed and complete session traces are recorded in [`PHASE_7_HARNESS_RELIABILITY_FIX.md`](../evidence/PHASE_7_HARNESS_RELIABILITY_FIX.md).

## Expansion Phase 1 implementation gate

Expansion Phase 1 is additive above the existing `GuardianRequest`. The compiler accepts exact JSON directly or a natural-language envelope containing only the user-authored text plus an untrusted draft. Deterministic normalization requires explicit source text for repository, branch, full commit/range endpoints, and optional target file. It returns one of four states: conversation-only, needs input, confirmation required, or ready. Only ready contains the executable typed request, and `planGuardianRun` rejects every other state before it can construct MCP reads or a capability ceiling.

The corrected focused suite proves ten paraphrases normalize to one analysis request; exact JSON remains compatible behind the retained verifier gate; malformed or mode-forbidden verifier envelopes stop with one question; commit URLs supply only their exact repository/full lowercase SHA and never a missing branch; unsupported URLs, contradictory repository/branch/SHA candidates, and uppercase SHAs fail closed; branch and target roles require contextual labels; invalid or unlabeled targets cannot broaden scope; action kind must match direct affirmative user-authored evidence; missing facts produce one question; unconfirmed or digest-mismatched remediation/write intent cannot enter planning; and conversation-only input produces no request/question. The portable `secureops-guardian_v0` manifest carries the matching tool-free extraction and confirmation contract. Final live replays cover conversation-only, missing scope, PREPARE confirmation, and complete analysis without fixture mutation or GitHub writes. See [`EXPANSION_PHASE_1_NATURAL_LANGUAGE_REQUEST_COMPILER.md`](../evidence/EXPANSION_PHASE_1_NATURAL_LANGUAGE_REQUEST_COMPILER.md).

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
- Phase 5 strict audit records and deterministic orchestration across the evidence, candidate, proposal, remote decision, receipt, and persistence boundaries. Actual terminal status is observed independently from expected scenario policy; mismatches remain serializable and fail the CLI gate. Records retain all consumed evidence IDs, exact defects, Phase 4 receipts, typed remote results, and `ABSENT`/`OBSERVED` mutation artifacts. Unsafe evidence stops before verifier/proposal/approval, the tuple-bounded driver terminates after two failed candidates, remote mismatch cannot overwrite, and canonical checkpoint restoration requires the same case, evidence IDs, proposal hash, and pending action.
- Three safe-state live retry rehearsals plus one native running-session reconnect proof. All use direct exact-head PR listing and preserve the fixture remote state.
- Phase 6 strict presentation schema and adapters that consume the existing investigation, proof, proposal binding, receipt, and Phase 5 run records; receipt-to-proposal/target cross-checks; stock OpenUI and Markdown recovery renderers; a nine-case presentation matrix; exact trace captions; and public README/demo/submission artifacts.
- Phase 7 stable request/scope schemas, parameterized read-only preflight, hard mode ceilings, fail-closed support evaluation, exact OPEN_PR artifact composition, cross-stage receipt hashing/validation, a composed current-fixture journey, prompt templates, one unified exported/saved manifest, and migration documentation.
- Expansion Phase 1 natural-language compilation above the stable request: untrusted draft schema, explicit-source normalization, one-question missing-field outcome, digest-bound higher-capability confirmation, exact-JSON compatibility, and fail-closed planning integration.
- Expansion Phase 2 immutable verifier delivery: one separate registered TrueForge skill, exact runtime-root proof, manifest/file digest validation, support-gated staging, candidate-before-reference and two-attempt/four-state preservation, pack identity/binding propagation through proof/proposal/receipt/UI/write reuse, and a synchronized saved-agent export.
- The post-Phase 7 response contract keeps the security result in chat while assigning child-agent, MCP, sandbox, approval, timing, and failure visibility to TrueForge's Investigation rail. A successful OpenUI response contains its receipt in a progressive-disclosure tab and does not append the complete Markdown recovery rendering.

The repository does not contain merge/deployment behavior, cluster access, a Guardian persistence database, custom TrueForge frontend, separate dashboard, broad vulnerability remediation, or general incident response.

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
- Qodo's automatic and manual Phase 5 PR #6 attempts reported reviews paused. No Qodo findings or approval exist. Alternate reviews were completed and remediated; PR #6 later merged, but the merge and alternate reviews must not be recast as Qodo approval.
- Qodo's automatic, earlier manual, and official `/agentic_review` Phase 6 PR #7 attempts reported reviews paused. No Qodo findings or approval exist. Alternate review findings were remediated at `33b9e51282f73dce0a8afeb07bd20dd0a53edc74` and follow-up `71835c282406d001e945243717c37068c441ed01`; the operator subsequently merged PR #7.
- The unified saved manifest attaches Fixture and write tools because the later modes need them. `ANALYSIS_ONLY` Fixture/write exclusion and `PREPARE_REMEDIATION` write exclusion are enforced by the mode contract and typed planning/receipt gates, while TrueForge separately enforces approval if a write is reached. Dynamic roles remain instruction-scoped rather than hard per-mode tool isolation.
- Qodo's automatic and official `/agentic_review` attempts on Phase 7 PR #8 reported reviews paused. No Qodo findings or approval exist. The consolidated alternate review reported 15 findings; all were reproduced, root-caused, remediated, and covered by the 172-test suite. Operator acceptance remains required before merge.
- Qodo's automatic attempt on Expansion Phase 1 PR #13 reported reviews paused. The response contains no findings or approval; do not recast GitGuardian success or the subsequent merge as Qodo review.
- The old five-filename verifier envelope remains a deprecated exact-JSON compatibility shape only. It cannot select pack content; the primary flow uses the one pinned registered skill and requires no uploads.
- The typed compiler is the only authority for the interpreted-request digest. The prompt-only saved TrueForge agent does not execute the TypeScript compiler; it binds live confirmation to every visible canonical field and must not calculate or display a digest unless a deterministic integration supplies it.
- New saved-agent sessions resolve the reconciled manifest. Existing sessions retain their persisted prompt and event history.

## Handoff update protocol

The implementation agent for every phase updates this file in that phase's product PR:

1. Reconcile the snapshot with Git and GitHub before editing it.
2. Record the phase as in progress or gate-passed; use merged only after GitHub confirms the merge.
3. Update the current product revision, next phase/branch, immutable cross-repository references, implemented boundary, and live risks.
4. Link the phase evidence record instead of copying trace details into this snapshot.
5. Keep credentials, private data, model reasoning, and local absolute paths out of the file.

The handoff update is complete when a fresh agent can identify the current phase, verify its entry gate, and locate deeper evidence without reading superseded phase material.
