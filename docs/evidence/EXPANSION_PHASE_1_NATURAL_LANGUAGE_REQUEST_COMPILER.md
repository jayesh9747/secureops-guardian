# Expansion Phase 1 — Natural-language request compiler

Date: 27 August 2026.

## Scope and entry gate

This is Phase 1 of the additive SecureOps Guardian expansion, not original product Phase 1. Initial implementation began from product `main` at `8c205b1ef3e526cdee6cf6072bd0f51798114036`, after fetching and verifying `origin/main`, plus planning commit `67a041c`. PR [#13](https://github.com/jayesh9747/secureops-guardian/pull/13) was subsequently merged as `dc056805934ff55d83e0756c5d91a722184309b1` with reviewed head `bb6d71035d4109a42bb13be561ea28c300834743`. The acceptance correction began from that merge on `fix/phase-8-acceptance-gaps`. Original Phases 0-7 and the post-Phase-7 fixes through PR #12 were preserved.

The phase implements only natural-language input above the existing typed `GuardianRequest`. Automatic verifier assets, a `FindingPack` registry, Kubernetes workload-security analysis, Incident Brief changes, and downloadable artifacts remain excluded.

## Implemented seam

`@guardian/orchestration` now exposes one compiler interface before `planGuardianRun`:

```text
exact JSON analysis ----------------------> READY GuardianRequest
exact JSON remediation + verifier inputs -> READY GuardianRequest

user-authored text + untrusted draft
  -> conversation only -------------------> CONVERSATION_ONLY
  -> missing or ungrounded scope ---------> NEEDS_INPUT + one question
  -> analysis scope complete -------------> READY GuardianRequest
  -> remediation/write scope complete ----> CONFIRMATION_REQUIRED
       -> matching request-digest confirm
          + verifier inputs --------------> READY GuardianRequest
```

Only `READY` contains an executable request. Planning rejects every other compiler state before GitHub reads or a capability ceiling are constructed. Free-form text and draft data do not enter preflight or any retained investigation, verifier, proposal, approval, PR, receipt, or presentation module.

## Deterministic safety behavior

- The draft schema is strict and explicitly untrusted.
- Repository, base branch, full SHA/comparison endpoints, and optional target path must be present in the user-authored text and pass the retained typed validators.
- A GitHub commit URL contributes only its explicit `owner/repository` and full SHA. It does not imply `main`.
- Short or uppercase SHAs, conflicting full SHAs, invented repositories, unsafe targets, and draft-only scope values cannot produce an executable request.
- Requested mode is derived from affirmative user-authored action evidence; an untrusted action kind cannot elevate analysis evidence, and negated or quoted action text does not elevate mode.
- Natural-language `PREPARE_REMEDIATION` and `OPEN_PR` requests require confirmation bound to the SHA-256 of the exact generated request.
- Interpreted-request confirmation is distinct from the three existing TrueForge GitHub write approvals.
- Exact JSON requests retain their direct-validation path subject to the existing remediation verifier-input gate.
- Both exact JSON and natural-language remediation require all five exact verifier inputs before planning.
- Conversation-only behavior remains intact.

## Acceptance correction

The takeover review reproduced six gaps against the public `compileGuardianRequest` and `planGuardianRun` seams before applying fixes:

1. an exact remediation request could bypass the existing verifier-input gate;
2. a commit URL was not deterministically supplying its explicit SHA;
3. uppercase or conflicting scope values, including full SHAs, repositories, and branches, were accepted;
4. an explicitly unsafe target could be silently omitted, broadening scope;
5. an untrusted action kind could elevate analysis evidence to a higher-capability mode; and
6. the required live saved-agent evidence had not been captured.

Regression tests failed for each deterministic gap before the implementation changed. The corrected compiler requires the exact verifier envelope and returns one question for missing or malformed inputs; rejects verifier inputs in analysis mode; parses only strict HTTPS GitHub commit URLs; rejects unsupported URLs and contradictory repository, branch, or SHA candidates; accepts only the expected count of lowercase full SHAs; requires contextual labels for branch and optional target roles; and requires action kind to match direct affirmative user-authored evidence. Invalid, ambiguous, negated, quoted, explanatory, or substring action evidence returns `NEEDS_INPUT` and cannot elevate the capability ceiling.

## Test evidence

The phase adds interface-level coverage for:

1. exact JSON backward compatibility;
2. ten analysis paraphrases normalizing to the same request;
3. explicit GitHub commit URL extraction without a guessed branch;
4. one concise question containing every missing scope fact;
5. fail-closed rejection of scope absent from user text;
6. digest-bound `OPEN_PR` confirmation;
7. planning rejection before confirmation;
8. confirmation-digest mismatch;
9. conversation-only classification without an executable request; and
10. full-SHA comparison endpoint preservation;
11. exact remediation-envelope compatibility with only `GuardianRequest` crossing the planning seam; and
12. portable saved-agent instruction synchronization;
13. exact and natural-language verifier-gate enforcement;
14. strict commit-URL SHA extraction plus unsupported-URL and uppercase/conflicting-SHA rejection;
15. contradictory repository/branch rejection, including slash-containing branch disambiguation;
16. unsafe or unlabeled target rejection without scope broadening;
17. action-evidence grounding, including untrusted-kind, indirect/standalone negation, quotation, explanation, and substring cases; and
18. missing, malformed, renamed, or mode-forbidden verifier-envelope handling through one `NEEDS_INPUT` result.

The local phase gate passed with:

- `pnpm format:check`;
- `pnpm lint`;
- `pnpm typecheck`;
- `pnpm test` — 20 files and 233 tests;
- `pnpm build`;
- `pnpm bundle:verifier`;
- `pnpm phase5:matrix`;
- `pnpm phase6:matrix`;
- `pnpm phase7:matrix`;
- the retained bundled-verifier candidate replay; and
- `git diff --check`.

## Live saved-agent evidence

The portable manifest was reconciled to saved agent `secureops-guardian_v0` (`01m0w6s2eyqtzyb6q4y6ppsta9`). A read-back of the saved manifest and the portable export produced the same canonical manifest SHA-256: `059f0ccbd25658d050d82262347fd3405ffe6666b0003421a7551fcfa8cf90c5`.

| Case | Session / turn | Observed result |
| --- | --- | --- |
| Conversation-only capability question | `01m10sw4s48q36ftbdttzbncb7` / `01m10sw51ycrmxc83gb6kwfas4.9ziser` | Direct answer; no model tool call. TrueForge recorded only its preloaded `mcp.initialize` lifecycle event. |
| Incomplete investigation | `01m10sw55wt4f54fdtd3db52tp` / `01m10sw56tpf6d67408zy04tqz.9ziser` | Exactly one `ask_user_question` requested repository, base branch, and revision; no other model tool call. |
| PREPARE confirmation | `01m10sw59tr9kp2s1s9v1pz668` / `01m10sw5ap2fb2r9whe881s4ww.9ziser` | Exactly one `ask_user_question` displayed the repository, branch, full SHA, target, PREPARE ceiling, and all five verifier filenames. It requested no approval and made no connector, fixture, sandbox, or write call. |
| Complete analysis | `01m10sw5bw9661kpvgnad1j30j` / `01m10sw5ckj8ymzzxxm78ws9ny.9ziser` | Completed with `get_commit`, `list_branches`, `get_file_contents`, and `get_openui_instructions`; no Fixture, sandbox, approval, or write event. Runtime and live-cluster claims remained Unknown. |

An earlier non-accepted PREPARE replay (`01m10saygtsdzjh508cym00kzm` / `01m10sayjppcg7ec65swb9zv9z.9ziser`) displayed a SHA-256 value that did not match the typed compiler's digest. The prompt-only saved agent does not execute the TypeScript compiler, so that value was not accepted as deterministic evidence. The final manifest states that only the typed compiler may calculate the digest. Prompt-only confirmation binds every visible canonical scope and mode field and must not invent or display a digest unless a deterministic integration supplies it. The final PREPARE replay above followed that boundary.

PR #13's GitGuardian check passed. Qodo's [automatic response](https://github.com/jayesh9747/secureops-guardian/pull/13#issuecomment-5425113187) says reviews are paused for this user; it contains no findings or approval. Its later merge is not a Qodo review. The acceptance corrections are delivered in non-draft follow-up PR [#14](https://github.com/jayesh9747/secureops-guardian/pull/14); operator acceptance remains required, PR #14 remains unmerged, and neither PR is represented as Qodo-approved.

No live GitHub fixture mutation, approval, write, sandbox execution, fixture mutation, or Kubernetes access was performed for the correction evidence.

## Exit boundary

Expansion Phases 2-5 are not implemented in this branch. In particular, remediation still requires the existing five explicitly named verifier uploads. No verifier bundle/skill, pack registry, new finding rule, workload-security analyzer, Incident Brief redesign, or artifact exporter is present.
