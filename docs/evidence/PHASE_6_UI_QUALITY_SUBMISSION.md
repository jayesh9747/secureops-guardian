# Phase 6 UI, quality, and submission evidence

Updated: 25 August 2026

Branch: `phase-6/ui-quality-submission`

Scope: Phase 6 only

## Entry reconciliation

| Item | Verified value |
| --- | --- |
| Product PR #6 | Merged as `fce4424be5461b2272dfbdd15c3d545d0c1e06e1` |
| Frozen Phase 5 core | `263e6a27307a667f08bfa832b436a754c0848a2e` |
| Phase 5 documentation | `1777bfd070ac1ebd34e23a604767ae2e703c36ad` |
| Fixture PR #1 | Open and unmerged at `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3` |
| Proposal SHA-256 | `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` |
| TrueForge runtime | `6026509d905fe255bf493e3845b1fca237bdf0fd` |
| Preserved operator change | TrueForge `docker-compose.yml` retains the uncommitted `HOST: 0.0.0.0` binding |

The product and fixture GitHub state were read before implementation. No fixture mutation, merge, close, edit, reset, force-push, deployment, or cluster access occurred.

## Presentation implementation

`@guardian/presentation` is a presentation-only package. It consumes the existing typed investigation outcome, four-state proof, exact eligible proposal, Phase 4 action receipt, and Phase 5 run record. It calls the existing proposal binding gate and never owns evidence collection, policy verification, approval, receipt, remote mutation, or persistence logic.

The strict public schema supports:

- `SECURITY_REMEDIATION_READY`
- `DENIED`
- `PR_CREATED`
- `PR_REUSED`
- `INCONCLUSIVE`
- `WRITE_CONFLICT`
- `NO_SAFE_REMEDIATION`

Schema refinements prevent inconclusive results from claiming `High`, cause, verifier, proposal, or approval; prevent no-safe results from carrying a proposal or reaching approval; and require the bound exact proposal plus four-state proof for actionable results.

The renderer produces one compact stock OpenUI card using built-in components and a separate complete Markdown recovery rendering. The first OpenUI statement is always `root = Stack(...)` for streaming. The card hierarchy preserves status/severity, asset/commit/file, exposure/Unknown, source-grouped evidence IDs, verifier, exact patch/hash, limitations, approval state, and PR URL.

## Trace legibility

The presentation instructions preserve real platform names and use explanatory captions for:

1. `change-security-investigator — official GitHub MCP evidence`
2. `exposure-evidence-investigator — Fixture MCP evidence`
3. `Daytona sandbox — deterministic four-state policy verification`
4. `TrueForge approval required — official GitHub MCP write`
5. `Official GitHub MCP result or deterministic PR reuse`

The Phase 6 saved-agent manifest inherits the Phase 4 MCP server, enabled tools, and approval list. Tests compare those structures exactly and prove only Generative UI presentation is enabled.

## Rendering matrix

`pnpm phase6:matrix` covers nine cases: ready, denied, created, reused, missing-deployment inconclusive, missing-reachability inconclusive, conflicting-revision inconclusive, write conflict, and no-safe-remediation. Each output includes a streaming-safe OpenUI root plus deterministic hashes for the OpenUI response and separate Markdown recovery rendering.

### Stock TrueForge visual verification

The final renderer was exercised through seven clean inline TrueForge sessions with Generative UI enabled and no tools. Each model output matched the expected renderer response byte-for-byte. Browser DOM inspection confirmed the terminal status, Guardian heading, actual-data-access `Unknown`, all three evidence groups, proposal/limitations tabs, severity gate, and applicable PR link. It also confirmed that evidence is visible before the verifier, exact-proposal tabs contain the hash and patch, absent-proposal tabs say `No proposal`, and no literal `<details>` or duplicated Markdown fallback appears.

| Terminal status | TrueForge session | Visual evidence |
| --- | --- | --- |
| `SECURITY_REMEDIATION_READY` | `01m0vwe2p8xx04mh0aa0ypzf59` | [PNG](phase-6-visual/remediation-ready.png) |
| `DENIED` | `01m0vwe2q7f5cshxagwc530hnz` | [PNG](phase-6-visual/denied.png) |
| `PR_CREATED` | `01m0vwe2q4dx32cga305p50ars` | [PNG](phase-6-visual/pr-created.png) |
| `PR_REUSED` | `01m0vwe2q9n8heksej3ketedpz` | [PNG](phase-6-visual/pr-reused.png) |
| `INCONCLUSIVE` | `01m0vwe2pkjm6w89f9sqn1r95h` | [PNG](phase-6-visual/inconclusive.png) |
| `WRITE_CONFLICT` | `01m0vwe2q80rwvt6zrj9edk7vw` | [PNG](phase-6-visual/write-conflict.png) |
| `NO_SAFE_REMEDIATION` | `01m0vwe2pnrhpbkte4hvy8yhqp` | [PNG](phase-6-visual/no-safe-remediation.png) |

The three distinct inconclusive fixtures remain covered in the nine-case automated matrix; one representative inconclusive card is captured because they share the same terminal presentation contract. A rendering failure must be reported as recovery-rendering use, not as a successful card.

## Public documentation and demo artifacts

- Public runnable [`README.md`](../../README.md)
- Three-minute primary and backup [demo script](../demo/PHASE_6_DEMO_SCRIPT.md)
- [Submission description](../submission/PHASE_6_SUBMISSION_DESCRIPTION.md)
- [Submission/link checklist](PHASE_6_SUBMISSION_LINK_CHECKLIST.md)

Recording, upload, video visibility, submission-form access, final signed-out video validation, and submission remain operator-only.

## Official rules reconciliation

The current [TrueForge event page](https://www.wemakedevs.org/hackathons/trueforge) and [official rules](https://www.wemakedevs.org/hackathons/trueforge/rules) were rechecked on 25 August 2026. The published deadline is 30 August 2026 at 20:00 London time. Submission requires the event-site form, a public source repository with a clear README, an approximately three-minute demo, and a short TrueForge write-up.

The rules also require Qodo use and an exact `## Qodo Code Review Evidence` README section linking a representative merged PR, summarizing findings and changes, and preserving review/follow-up history. The README now points to merged product PR #3, its two completed Qodo review passes, all five remediated findings, and the visible follow-up record. It separately records that Phase 6's official `/agentic_review` request was paused and claims no Qodo approval.

The primary demo sequence now visibly includes the preserved real Phase 4 approval pauses and three separately approved GitHub writes, followed by the current read-only retry trace. This truthfully demonstrates the human approval boundary without mutating or resetting the fixture merely for recording.

## Verification

Reviewed implementation head: `71835c282406d001e945243717c37068c441ed01`.

| Command or gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Pass |
| `pnpm format:check` | Pass |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass — 12 files, 126 tests |
| `pnpm build` | Pass |
| `pnpm bundle:verifier` plus candidate replay | Pass — `SECURITY_REMEDIATION_READY` |
| `pnpm phase5:matrix` | Pass — eight expected/actual matches |
| `pnpm phase6:matrix` | Pass — nine schema/render/fallback hashes |
| Markdown recovery tests | Pass for all nine presentation cases |
| `git diff --check` | Pass |
| Committed-content secret scan | Pass |
| Committed-content local absolute-path scan | Pass |
| Stock TrueForge visual verification | Pass — seven terminal states |
| Signed-out public links available at handoff | Pass — product repo, PR #7, fixture repo, and fixture PR #1 |
| GitGuardian PR check | Pass |

## Review

Development PR [#7](https://github.com/jayesh9747/secureops-guardian/pull/7) is open, non-draft, and unmerged. Qodo's automatic attempt, the earlier manual [`/review` request](https://github.com/jayesh9747/secureops-guardian/pull/7#issuecomment-5407056420), and the official [`/agentic_review` request](https://github.com/jayesh9747/secureops-guardian/pull/7#issuecomment-5407199824) all received the result that reviews are paused for this user. The official command's [paused response](https://github.com/jayesh9747/secureops-guardian/pull/7#issuecomment-5407200657) contains no findings or approval, so none is claimed.

The alternate two-axis review found no hard standards violations. Its actionable spec finding was that presentation adapters needed to cross-check the receipt/record proposal hash and fixed GitHub target against the bound proposal. Commit `33b9e51282f73dce0a8afeb07bd20dd0a53edc74` adds those fail-closed checks and adversarial hash, target, and PR-URL tests. It also removes duplicated verified-presentation assembly and consolidates display metadata.

A follow-up executable review reproduced seven presentation-boundary failures. Their common root cause was that individually valid Phase 2, Phase 4, and Phase 5 objects were not relationally bound before rendering; investigation synthesis also discarded fixture-case identity. Commit `71835c282406d001e945243717c37068c441ed01` retains and checks the case ID, requires the recorded four-state proof to equal the proposal proof, rejects missing proof and unclassified evidence, produces an explicit empty-diagnostics error, deep-clones inherited agent configuration, escapes Markdown table cells, centralizes boundary literals, and makes the fallback CLI gate content-based. Six adversarial tests reproduce those boundary and rendering defects, bringing the suite to 126 tests.

The suggested custom typed OpenUI AST was not applied: TrueForge's stock OpenUI interface is a textual DSL, and adding a parallel component framework would expand Phase 6 scope. The renderer instead retains an exhaustive status table, a stock-component allowlist test, a streaming-safe root test, byte-exact session output checks, and live stock-TrueForge visual verification. The repository-wide identity instruction predates the Phase 6 implementation commits and is preserved as an operator-owned workflow constraint. Explicit operator acceptance of this alternate review remains required before merge.

## Safety and scope conclusion

Phase 6 adds presentation, tests, public documentation, and submission preparation only. It does not add a dashboard, frontend fork, authentication, analytics, organization history, new agent workflow, merge/deploy behavior, production access, or Phase 7 behavior.
