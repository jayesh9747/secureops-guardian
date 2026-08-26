# Expansion Phase 1 — Natural-language request compiler

Date: 26 August 2026.

## Scope and entry gate

This is Phase 1 of the additive SecureOps Guardian expansion, not original product Phase 1. Implementation began from product `main` at `8c205b1ef3e526cdee6cf6072bd0f51798114036`, after fetching and verifying `origin/main`, plus planning commit `67a041c`. Original Phases 0-7 and the post-Phase-7 fixes through PR #12 were preserved.

The phase implements only natural-language input above the existing typed `GuardianRequest`. Automatic verifier assets, a `FindingPack` registry, Kubernetes workload-security analysis, Incident Brief changes, and downloadable artifacts remain excluded.

## Implemented seam

`@guardian/orchestration` now exposes one compiler interface before `planGuardianRun`:

```text
exact JSON -------------------------------> READY GuardianRequest

user-authored text + untrusted draft
  -> conversation only -------------------> CONVERSATION_ONLY
  -> missing or ungrounded scope ---------> NEEDS_INPUT + one question
  -> analysis scope complete -------------> READY GuardianRequest
  -> remediation/write scope complete ----> CONFIRMATION_REQUIRED
       -> matching request-digest confirm -> READY GuardianRequest
```

Only `READY` contains an executable request. Planning rejects every other compiler state before GitHub reads or a capability ceiling are constructed. Free-form text and draft data do not enter preflight or any retained investigation, verifier, proposal, approval, PR, receipt, or presentation module.

## Deterministic safety behavior

- The draft schema is strict and explicitly untrusted.
- Repository, base branch, full SHA/comparison endpoints, and optional target path must be present in the user-authored text and pass the retained typed validators.
- A GitHub commit URL contributes only its explicit `owner/repository` and full SHA. It does not imply `main`.
- Short SHAs, invented repositories, and draft-only scope values cannot produce an executable request.
- Natural-language `PREPARE_REMEDIATION` and `OPEN_PR` requests require confirmation bound to the SHA-256 of the exact generated request.
- Interpreted-request confirmation is distinct from the three existing TrueForge GitHub write approvals.
- Exact JSON requests retain their original direct-validation behavior.
- Conversation-only behavior and the existing five-file remediation verifier precondition remain intact.

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
12. portable saved-agent instruction synchronization.

The local phase gate passed with:

- `pnpm format:check`;
- `pnpm lint`;
- `pnpm typecheck`;
- `pnpm test` — 20 files and 199 tests;
- `pnpm build`;
- `pnpm bundle:verifier`;
- `pnpm phase5:matrix`;
- `pnpm phase6:matrix`;
- `pnpm phase7:matrix`;
- the retained bundled-verifier candidate replay; and
- `git diff --check`.

PR/review status is recorded in the pull request before merge. No live GitHub fixture mutation, sandbox run, or saved-agent update is required for the deterministic compiler gate; live saved-agent reconciliation waits for accepted merged code.

## Exit boundary

Expansion Phases 2-5 are not implemented in this branch. In particular, remediation still requires the existing five explicitly named verifier uploads. No verifier bundle/skill, pack registry, new finding rule, workload-security analyzer, Incident Brief redesign, or artifact exporter is present.
