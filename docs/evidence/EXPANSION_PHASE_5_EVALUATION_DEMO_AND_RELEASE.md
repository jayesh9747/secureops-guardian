# Expansion Phase 5 evaluation, demo, and release evidence

Date: 29 August 2026.

Status: release gate passed for the agent-executable scope; exact-candidate verification, clean public setup, independent reviews, paused Qodo attempts, and non-draft release PR [#18](https://github.com/jayesh9747/secureops-guardian/pull/18) are recorded below. Operator approval, merge, recording upload, signed-out validation, and submission remain outside this implementation handoff.

## Scope and entry gate

This release gate began on `expansion-phase-5/evaluation-demo-release` from current `origin/main` commit `3cd6d8e046fba93dde8921ae5c4bb955f7fbdc2c`, after Expansion Phase 4 PR [#17](https://github.com/jayesh9747/secureops-guardian/pull/17) merged. It adds no product breadth. The only code changes are saved-agent release-blocker corrections reproduced in live TrueForge sessions, regression assertions for those corrections, and one focused Phase 12 matrix command.

No live Kubernetes connector, second remediation pack, Dockerfile/Terraform/GitHub Actions breadth, dashboard, destructive fixture reset, TrueForge upstream change, merge, deployment, or submission was performed.

The release revalidated, rather than rebuilt, the four merged expansion gates: [natural-language compilation](./EXPANSION_PHASE_1_NATURAL_LANGUAGE_REQUEST_COMPILER.md), [immutable verifier delivery](./EXPANSION_PHASE_2_VERIFIER_SKILL_BUNDLE.md), [FindingPack/workload analysis](./EXPANSION_PHASE_3_FINDING_PACKS_AND_WORKLOAD_SECURITY.md), and [Incident Brief/artifacts](./EXPANSION_PHASE_4_INCIDENT_BRIEF_AND_ARTIFACTS.md). Their typed contracts remain controlling; live prompt behavior is accepted only where its observable event trace agrees with those contracts.

## Frozen release identities

| Item | Frozen identity |
| --- | --- |
| Product release base | `3cd6d8e046fba93dde8921ae5c4bb955f7fbdc2c` |
| Saved agent | `secureops-guardian_v0`, immutable ID `01m0w6s2eyqtzyb6q4y6ppsta9` |
| Canonical saved/export manifest SHA-256 | `e2c628d1233ba355f690b39be6e556c94c27b000662dd57d47fe32edb27183d0` |
| Verifier tag object | `783d75dcb057f004263a5f93b24dbd36dc4a1b72` |
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

Accepted final-manifest [session `01m16j0267dqrsv34j5npgr8zm`](http://localhost:8791/sessions/01m16j0267dqrsv34j5npgr8zm), turn `01m16j0270qb18jh45sb3p1yh8.ueyhrn`, reconstructed an offloaded GitHub blob from the exact parent and suspect full-patch responses and matched the cited blob identity. Its exact tool-call references were `call_767598` (`get_commit` suspect), `call_767617` (`get_file_contents`), `call_786958` (`list_commits`), `call_917154` (`get_commit` parent), and presentation-only `call_563409` (`get_openui_instructions`). It returned these exact paths:

- `$.spec.template.spec.containers[0].securityContext.privileged`
- `$.spec.template.spec.containers[0].securityContext.allowPrivilegeEscalation`
- `$.spec.template.spec.securityContext.runAsUser`
- `$.spec.template.spec.containers[0].securityContext.capabilities.drop`
- `$.spec.template.spec.containers[0].securityContext.capabilities.add[0]`

The trace made four official GitHub reads and no sandbox, Fixture, approval, proposal, or write call. Deployment, admission, runtime Pod state, exploitability, reachability, data access, and exfiltration remain `Unknown`. The earlier otherwise-correct workload session `01m16cd5dtc76v5djytwmsz71b` is historical only because it predates the final saved-manifest freeze; it is not used as release evidence.

### Benign analysis

Accepted final-manifest [session `01m16fewfgxz7r5a0c9e7fvt0e`](http://localhost:8791/sessions/01m16fewfgxz7r5a0c9e7fvt0e), turn `01m16ff2b7zhdae6wy5w1mv7gb.ueyhrn`, made exactly three GitHub reads—`call_695486` (`get_commit`), `call_695495` (`get_file_contents`), and `call_695503` (`list_branches`)—then requested stock OpenUI instructions in `call_993036`. It emitted the exact terminal status `NO_DETERMINISTIC_FINDING`, limited the conclusion to `k8s-network-egress-v1`'s static subset for the exact file and revision, made no general security or vulnerability claim, emitted valid assignment-form OpenUI, and produced no sandbox, Fixture, approval, or write event.

An earlier session with the correct finding status is excluded because its pre-fix manifest created one presentation sandbox. The final replay above is the controlling benign proof.

## Consecutive primary rehearsals

All three rehearsals used the same natural-language request, a new session, and the frozen saved/export manifest:

> Open a pull request for the security regression at https://github.com/jayesh9747/guardian-demo-checkout/commit/7b2f2ad51f9ef97334176fbfed3138465b62fcdb using base branch main and target file k8s/checkout-networkpolicy.yaml.

Each interpretation turn called only `ask_user_question`; confirmation did not authorize a GitHub write. Each execution created exactly the two expected child threads, one sandbox, completed the pinned four-state proof, performed exact remote reconciliation, emitted valid stock OpenUI beginning with `root = Stack(`, and returned `PR_REUSED` for [fixture PR #1](https://github.com/jayesh9747/guardian-demo-checkout/pull/1). Each preserved proposal and pack-binding hashes, kept actual access/exfiltration `Unknown`, and emitted zero GitHub write calls and zero approval events.

| Rehearsal | Session | Interpretation turn | Execution turn | Result |
| --- | --- | --- | --- | --- |
| 1 — fresh post-freeze session | [`01m16fj42n0gctgty8s1bg7sb4`](http://localhost:8791/sessions/01m16fj42n0gctgty8s1bg7sb4) | `01m16fjbt9sjan7vwr5kpp9t24.ueyhrn` | `01m16fk5q5jp323ky8g03wfr3b.ueyhrn` | Pass; two children, one sandbox, `PR_REUSED`, no approval/write |
| 2 | [`01m16fzxwk9pt3h39bt2rqg9x0`](http://localhost:8791/sessions/01m16fzxwk9pt3h39bt2rqg9x0) | `01m16g04nyfd8gmpgvpd73fwy5.ueyhrn` | `01m16g0t308zgtfrw1bmc4fyxx.ueyhrn` | Pass; two children, one sandbox, `PR_REUSED`, no approval/write |
| 3 — controlling demo | [`01m16gdxzf8vhg5jmx2dwjesmd`](http://localhost:8791/sessions/01m16gdxzf8vhg5jmx2dwjesmd) | `01m16ge4yxdmnhr3sq55wmcnpg.ueyhrn` | `01m16gewmy41sny03awcvd1858.ueyhrn` | Pass; two children, one sandbox, `PR_REUSED`, no approval/write |

Exact event anchors make the persisted trace auditable without relying on screenshots alone:

| Rehearsal | Confirmation call | Child-created events | Sandbox-created event | Execution tool-call references |
| --- | --- | --- | --- | --- |
| 1 | `call_733242` | `01m16fkxna4ghcmp1j9rx6z9fe`, `01m16frfey792bw9abcv9exqn8` | `01m16fsxam850tpwq7978vths9` | GitHub `call_722264`, `call_723352`, `call_715546`, `call_834407`, `call_819383`, `call_763668`, `call_688546`, `call_727441`, `call_588641`, `call_773947`, `call_672386`, `call_583280`; Fixture `call_581998`, `call_582006`, `call_582010`, `call_582014`; child creation `call_931689`, `call_668674`; sandbox exec `call_615033`, `call_935560`, `call_672727`, `call_968728`, `call_733326`, `call_979940`; OpenUI `call_690370` |
| 2 | `call_733967` | `01m16g1js2b64m3mk8rknq9zk7`, `01m16g51xht6nz6zg7j21d79t4` | `01m16g6w15avredvp23s6xkxz7` | child creation `call_697130`, `call_640316`; GitHub `call_897408`, `call_492613`, `call_949473`, `call_477553`, `call_728433`, `call_699527`, `call_621651`, `call_90296`, `call_940044`, `call_704223`, `call_644454`, `call_107889`; Fixture `call_925530`, `call_925538`, `call_925544`, `call_925554`; sandbox exec `call_681406`, `call_791443`, `call_658235`, `call_965138`, `call_706572`, `call_882760`; OpenUI `call_886391`, `call_662484` |
| 3 | `call_645014` | `01m16gfp7r84808n3xkfrkb7mp`, `01m16gkjns94rtqr8snm3g8vkv` | `01m16gnf2qd53m12tps7b2ybmz` | child creation `call_505274`, `call_446552`; GitHub `call_627922`, `call_898097`, `call_446166`, `call_894516`, `call_999950`, `call_806798`, `call_697637`, `call_611029`, `call_704332`, `call_653368`, `call_732105`, `call_903976`; Fixture `call_670681`, `call_670693`, `call_670697`, `call_670701`; sandbox exec `call_1004691`, `call_886069`, `call_886583`, `call_689157`, `call_767761`, `call_985942`, `call_707668`; OpenUI `call_964842`, `call_772399` |

The live wall-clock model runs took approximately six to seven minutes after confirmation. On 29 August 2026, an interactive browser walkthrough of the controlling completed session first missed the presentation gate at `184.2` seconds; that attempt is rejected, not rounded down. The immediate rerun traversed the request/summary, evidence, causal chain, verification, proposed change/PR, run receipt, and limitations in `168.3` seconds, ending at `2026-08-29T10:37:13.789Z`; it is the accepted timing rehearsal. The submission script therefore uses the completed canonical session at normal playback and does not claim that a cold model run completes in three minutes. Final human recording, upload, public visibility, and signed-out playback validation remain operator-only.

## Cancellation and no-write proof

[Session `01m16gwfhkthfsx159xdkd5x7n`](http://localhost:8791/sessions/01m16gwfhkthfsx159xdkd5x7n) asked the same natural-language `OPEN_PR` request. Interpretation turn `01m16gwqpwkbgfsty9ncy3nx5z.ueyhrn` emitted only `ask_user_question` call `call_901247`. The response `Cancel request` resumed turn `01m16gxg7nyzdz5ag19xqseyxk.ueyhrn`, which made no tool call and ended: “The request to open a pull request has been cancelled. No investigation, verification, or GitHub modifications were performed.” Across both turns there were zero GitHub/Fixture calls, children, sandboxes, approval events, and writes.

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
5. A benign Incident Brief broadened a pack-specific no-finding result to “no security vulnerabilities,” which was not supported by static repository evidence.

Each failure was rejected as evidence, first captured by a failing saved-agent contract assertion, corrected in the portable prompt, exported/reconciled, and replayed. The final prompt requires exact terminal vocabulary; keeps no-finding language scoped to the selected pack, static subset, file, and revision; prohibits sandbox/Fixture/proposal/approval/write in `ANALYSIS_ONLY`; gives a bounded GitHub-only blob reconstruction route; requires exact workload JSONPaths; and validates OpenUI syntax before returning it. No finding-pack, verifier, proposal, write, UI, or upstream feature was added.

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

Final exact-candidate verification passed after the review corrections:

- `pnpm install --frozen-lockfile`, `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm build`, and `git diff --check` passed.
- `pnpm test` passed 27 files / 290 tests.
- `pnpm phase12:matrix` passed 9 focused files / 181 tests.
- `pnpm phase5:matrix`, `phase6:matrix`, `phase7:matrix`, `phase10:matrix`, and `phase11:matrix` passed, covering denial/no-mutation, reuse, conflict, inconclusive/adversarial states, pack behavior, and all presentation/artifact terminal mappings.
- `pnpm bundle:verifier` reproduced exact SHA-256 `028172c2b937dc95e1d406db49d5801d5742a5636b5360dc99bd1d6b4c0049f9`.
- Canonically sorted saved and exported manifests byte-matched at SHA-256 `e2c628d1233ba355f690b39be6e556c94c27b000662dd57d47fe32edb27183d0`.
- The changed-artifact secret/local-path scan, relative-link check, and added-public-link check passed.
- A clean clone of the pushed public branch at `e8bb6665702fb64f6917a870e656386fcd81b7a9` passed frozen install, formatting, lint, typecheck, all 290 tests, build, and the 181-test Phase 12 matrix from `/private/tmp`, with a clean worktree.
- Independent Standards and Phase 12 Spec reviews initially found the overbroad benign claim, stale tag-object SHA, and pre-final workload trace. Those findings were reproduced and corrected. Both axes reported no remaining findings at `e8bb666`; Standards retained only a non-blocking future refactor judgment about centralized prompt size, which is intentionally not widened into this release gate.

## Qodo and release PR

Non-draft release PR [#18](https://github.com/jayesh9747/secureops-guardian/pull/18) is open and unmerged from `expansion-phase-5/evaluation-demo-release` into `main`. Qodo's [automatic attempt](https://github.com/jayesh9747/secureops-guardian/pull/18#issuecomment-5461905572) reported that reviews are paused for this user. The official [`/agentic_review` request](https://github.com/jayesh9747/secureops-guardian/pull/18#issuecomment-5461906267) received the same [paused response](https://github.com/jayesh9747/secureops-guardian/pull/18#issuecomment-5461906533). These responses contain no findings, completed review, or approval; none is claimed. The independent Standards/Spec reviews above are the controlling release reviews.

The only external product-repository writes were pushing the release branch, opening PR #18, and posting the official Qodo command. The fixture repositories were not mutated. This implementation session does not merge or submit.

## Release decision

The code and live agent evidence satisfy the agent-executable Phase 12 release gate: three repositories under the final manifest, three consecutive primary rehearsals, a fresh session, cancellation/no-write proof, presentation/artifact evidence, a `168.3`-second walkthrough, exact-candidate verification, clean public setup, and independent reviews. PR #18 is deliberately left open. Promotion remains contingent on operator acceptance, final recording/upload and signed-out playback validation, merge, and submission.
