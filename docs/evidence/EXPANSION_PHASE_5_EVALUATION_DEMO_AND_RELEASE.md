# Expansion Phase 5 evaluation, demo, and release evidence

Date: 29 August 2026.

Status: release candidate validated live; full candidate verification, final reviews, Qodo status, and release PR are recorded below when complete. Operator approval, merge, recording upload, and submission remain outside this implementation handoff.

## Scope and entry gate

This release gate began on `expansion-phase-5/evaluation-demo-release` from current `origin/main` commit `3cd6d8e046fba93dde8921ae5c4bb955f7fbdc2c`, after Expansion Phase 4 PR [#17](https://github.com/jayesh9747/secureops-guardian/pull/17) merged. It adds no product breadth. The only code changes are saved-agent release-blocker corrections reproduced in live TrueForge sessions, regression assertions for those corrections, and one focused Phase 12 matrix command.

No live Kubernetes connector, second remediation pack, Dockerfile/Terraform/GitHub Actions breadth, dashboard, destructive fixture reset, TrueForge upstream change, merge, deployment, or submission was performed.

The release revalidated, rather than rebuilt, the four merged expansion gates: [natural-language compilation](./EXPANSION_PHASE_1_NATURAL_LANGUAGE_REQUEST_COMPILER.md), [immutable verifier delivery](./EXPANSION_PHASE_2_VERIFIER_SKILL_BUNDLE.md), [FindingPack/workload analysis](./EXPANSION_PHASE_3_FINDING_PACKS_AND_WORKLOAD_SECURITY.md), and [Incident Brief/artifacts](./EXPANSION_PHASE_4_INCIDENT_BRIEF_AND_ARTIFACTS.md). Their typed contracts remain controlling; live prompt behavior is accepted only where its observable event trace agrees with those contracts.

## Frozen release identities

| Item | Frozen identity |
| --- | --- |
| Product release base | `3cd6d8e046fba93dde8921ae5c4bb955f7fbdc2c` |
| Saved agent | `secureops-guardian_v0`, immutable ID `01m0w6s2eyqtzyb6q4y6ppsta9` |
| Canonical saved/export manifest SHA-256 | `8a5c3eaff0e588e5b2ee6557c081378f7fee4cba55003b3813bfd877cc1c9d44` |
| Verifier tag object | `783d75b01820ea195d88146eda0ba09ae288b32f` |
| Verifier tag/payload | `guardian-network-egress-v1.0.4` / `ade2d1453bba033dd3300a7c7aede6e28b97582d` |
| Verifier skill review head | `c1b107cc3d3427a21eca51f8bb227bbd2d8a93b1` |
| Manifest SHA-256 | `e70853b49715a949f61ae7584ef963b15267026051091a169e78a27249a869fe` |
| Bundle SHA-256 | `028172c2b937dc95e1d406db49d5801d5742a5636b5360dc99bd1d6b4c0049f9` |
| Proposal SHA-256 | `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` |
| Pack-binding SHA-256 | `3afb251833539c6383a999c2255934c76648994505857e543bc5d3959b7c9e20` |
| TrueForge API/runtime image | `0.1.4` / `sha256:537ff42921d589f823d618fbdb255651830c1551868f74e4c83942a690bd1a27` |

The historical documented TrueForge source pin remains `6026509d905fe255bf493e3845b1fca237bdf0fd`. The local upstream worktree was not advanced or edited; its operator-owned compose change remained untouched.

## Three-repository live proof

| Repository | Exact evidence | Accepted live result | Capability proof |
| --- | --- | --- | --- |
| `jayesh9747/guardian-demo-checkout` | suspect `7b2f2ad51f9ef97334176fbfed3138465b62fcdb`; parent `a6d177b43396c7b4b45aa98cb2970d0489a7a4f9`; suspect blob `477c7db7edd61de10fce67713d52e442f2358318` | `High` `SEC-NET-001`, four-state proof, proposal binding, exact PR #1 reuse | GitHub + synthetic Fixture evidence, one Daytona sandbox, no reuse write/approval |
| `jayesh9747/guardian-demo-privileged-api` | suspect `2c7bdb3e07714e08d9504b3504587fbf18847f29`; parent `d2ee0cdc4e27cc8af671f4c0de15081d1c996e36`; blob `b1a60bb96fad7f93bc95536d08381e5629a6a7bd` | five exact `High` workload findings | GitHub-only `ANALYSIS_ONLY`; zero Fixture, sandbox, approval, proposal, or write |
| `jayesh9747/guardian-demo-orders-egress` | secure commit `cdf69ad291b2097f563a4915503405df063661f7`; blob `c691421469c9a372a5eb5d38d24f17bf25eccb0d` | `NO_DETERMINISTIC_FINDING` for explicit DNS/PostgreSQL egress | GitHub-only `ANALYSIS_ONLY`; zero Fixture, sandbox, approval, or write |

### Workload analysis

Accepted session `01m16cd5dtc76v5djytwmsz71b`, turn `01m16cd5gbmtc5wv17s6w7fms0.ueyhrn`, reconstructed an offloaded GitHub blob from the exact parent and suspect full-patch responses and matched the cited blob identity. It returned these exact paths:

- `$.spec.template.spec.containers[0].securityContext.privileged`
- `$.spec.template.spec.containers[0].securityContext.allowPrivilegeEscalation`
- `$.spec.template.spec.securityContext.runAsUser`
- `$.spec.template.spec.containers[0].securityContext.capabilities.drop`
- `$.spec.template.spec.containers[0].securityContext.capabilities.add[0]`

The trace made four official GitHub reads and no sandbox, Fixture, approval, proposal, or write call. Deployment, admission, runtime Pod state, exploitability, reachability, data access, and exfiltration remain `Unknown`.

### Benign analysis

Accepted final-manifest session `01m16epj331ec41djrb38xfvnr`, turn `01m16eprcpj67z74pb49f34380.ueyhrn`, made exactly `list_branches`, `get_commit`, and `get_file_contents` GitHub reads, then requested stock OpenUI instructions. It emitted the exact terminal status `NO_DETERMINISTIC_FINDING`, valid assignment-form OpenUI, and no sandbox, Fixture, approval, or write event.

An earlier session with the correct finding status is excluded because its pre-fix manifest created one presentation sandbox. The final replay above is the controlling benign proof.

## Consecutive primary rehearsals

All three rehearsals used the same natural-language request, a new session, and the frozen saved/export manifest:

> Open a pull request for the security regression at https://github.com/jayesh9747/guardian-demo-checkout/commit/7b2f2ad51f9ef97334176fbfed3138465b62fcdb using base branch main and target file k8s/checkout-networkpolicy.yaml.

Each interpretation turn called only `ask_user_question`; confirmation did not authorize a GitHub write. Each execution created exactly the two expected child threads, one sandbox, completed the pinned four-state proof, performed exact remote reconciliation, emitted valid stock OpenUI beginning with `root = Stack(`, and returned `PR_REUSED` for [fixture PR #1](https://github.com/jayesh9747/guardian-demo-checkout/pull/1). Each preserved proposal and pack-binding hashes, kept actual access/exfiltration `Unknown`, and emitted zero GitHub write calls and zero approval events.

| Rehearsal | Session | Interpretation turn | Execution turn | Result |
| --- | --- | --- | --- | --- |
| 1 — fresh post-freeze session | `01m16cztydbsxvyyqdkvctva3c` | `01m16czv0as3e60g08p7mtrajc.ueyhrn` | `01m16d0zr46x4ph0h7wenbf2aj.ueyhrn` | Pass; two children, one sandbox, `PR_REUSED`, no approval/write |
| 2 | `01m16dknygk9013rm7t6nens2w` | `01m16dkvjdjkd1pfnw2xdxh992.ueyhrn` | `01m16dmqfb6ak2zy9q3ga09tvk.ueyhrn` | Pass; two children, one sandbox, `PR_REUSED`, no approval/write |
| 3 | `01m16e0sej7ybprysty571k1qf` | `01m16e0yzhg9ybjkz517v61eg6.ueyhrn` | `01m16e296t3t2tdrhjddcq0nze.ueyhrn` | Pass; two children, one sandbox, `PR_REUSED`, no approval/write |

The live wall-clock model runs took approximately six to seven minutes after confirmation. The submission script therefore uses the completed canonical session at normal playback and allocates exactly three minutes to the visible request, interpretation, rail, evidence, proof, change, PR, and limitations. It does not claim that a cold model run completes in three minutes. Final human recording, upload, public visibility, and signed-out playback validation remain operator-only.

## Cancellation and no-write proof

Session `01m16ef7cw4nzwpygbfcrjdx2m` asked the same natural-language `OPEN_PR` request. Interpretation turn `01m16efd6r39cmq9qegrynpz3n.ueyhrn` emitted only `ask_user_question`. The response `Cancel request` resumed turn `01m16egn00k5ytb5qd2erapp1s.ueyhrn`, which made no tool call and ended: “The request to open a pull request has been cancelled. No investigation, verification, or GitHub modifications were performed.” Across both turns there were zero GitHub/Fixture calls, children, sandboxes, approval events, and writes.

Before and after the cancellation:

- checkout `main` was `7b2f2ad51f9ef97334176fbfed3138465b62fcdb`;
- `guardian/fix-checkout-egress` was `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3`;
- PR #1 was open and unmerged with exact base/head/title/body; and
- PR `updated_at` remained `2026-08-24T17:46:16Z`.

This is a live interpretation-cancellation proof, not a new first-write approval denial. The deterministic mutation-safety matrix separately proves that denial at the first actual write produces no mutation. A new live first-write denial would require a destructive fixture reset and was intentionally not attempted.

## Reproduced release blockers and fixes

Only blockers reproduced in live Phase 12 runs were fixed:

1. A benign result invented `NO_FINDING` instead of the registry terminal `NO_DETERMINISTIC_FINDING`.
2. An `ANALYSIS_ONLY` workload run entered a sandbox after GitHub returned an offloaded blob reference.
3. The workload report cited the parent capabilities object instead of the missing `.capabilities.drop` path.
4. The primary Incident Brief returned JSX instead of stock OpenUI assignment DSL.

Each failure was rejected as evidence, first captured by a failing saved-agent contract assertion, corrected in the portable prompt, exported/reconciled, and replayed. The final prompt requires exact terminal vocabulary; prohibits sandbox/Fixture/proposal/approval/write in `ANALYSIS_ONLY`; gives a bounded GitHub-only blob reconstruction route; requires exact workload JSONPaths; and validates OpenUI syntax before returning it. No finding-pack, verifier, proposal, write, UI, or upstream feature was added.

## Visual evidence

| View | Evidence |
| --- | --- |
| Primary Incident Brief and Investigation rail | [`incident-brief-summary.jpg`](./phase-12-visual/incident-brief-summary.jpg) |
| Primary evidence detail and completed rail | [`primary-pr-reused.jpg`](./phase-12-visual/primary-pr-reused.jpg) |
| Exact proposed change and completed rail | [`proposed-change.jpg`](./phase-12-visual/proposed-change.jpg) |
| Workload findings | [`workload-findings.jpg`](./phase-12-visual/workload-findings.jpg) |
| Benign no-finding, zero-sandbox rail | [`benign-no-finding.jpg`](./phase-12-visual/benign-no-finding.jpg) |
| Cancelled request, zero-agent/zero-MCP/zero-sandbox rail | [`cancelled-no-write.jpg`](./phase-12-visual/cancelled-no-write.jpg) |

Screenshots contain no connector headers, credentials, provider settings, local paths, or private data.

## Deterministic matrices and release verification

`pnpm phase12:matrix` is the focused release command. It runs the natural-language compiler, FindingPack, verifier, pack-delivery, GitHub-write, reliability, presentation, artifact, and saved-agent contract suites. The adversarial coverage in those suites includes contradictory scope, prompt injection, malformed/unsupported resources, pack/digest tampering, proposal/candidate/remote conflicts, denial, and representation identity mismatch.

Pre-review exact-candidate verification passed:

- `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `git diff --check` passed.
- `pnpm test` passed 27 files / 290 tests.
- `pnpm phase12:matrix` passed 9 focused files / 181 tests.
- `pnpm phase5:matrix`, `phase6:matrix`, `phase7:matrix`, `phase10:matrix`, and `phase11:matrix` passed, covering denial/no-mutation, reuse, conflict, inconclusive/adversarial states, pack behavior, and all presentation/artifact terminal mappings.
- `pnpm bundle:verifier` reproduced exact SHA-256 `028172c2b937dc95e1d406db49d5801d5742a5636b5360dc99bd1d6b4c0049f9`.
- Canonically sorted saved and exported manifests byte-matched at SHA-256 `8a5c3eaff0e588e5b2ee6557c081378f7fee4cba55003b3813bfd877cc1c9d44`.
- The changed-artifact secret/local-path scan and relative-link check passed. The public-link check found one stale pre-existing Phase 6 commit URL; the release documentation removed that dead link, and the checker is rerun before handoff.
- Clean public branch setup and the final post-review verification rerun remain pending until the candidate is committed and pushed.
- Standards and Phase 12 spec reviews are pending.

## Qodo and release PR

Qodo status and the non-draft release PR will be recorded after the exact candidate is pushed. A paused Qodo response will not be described as findings, approval, or a completed review. The PR remains open for operator review; this implementation session does not merge or submit.

## Release decision

The code and live agent evidence satisfy the three-repository, three-rehearsal, fresh-session, cancellation/no-write, presentation, and capability-boundary portions of the Phase 12 gate. Final promotion remains contingent on the exact-candidate verification/reviews recorded above and operator completion of the final recording, signed-out video validation, merge, and submission.
