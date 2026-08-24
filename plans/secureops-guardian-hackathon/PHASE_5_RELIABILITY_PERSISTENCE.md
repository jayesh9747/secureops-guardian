# Phase 5 — reliability and persistence

Timebox: 4 hours.

## Goal

Demonstrate that Guardian fails closed when evidence or remote state is unsafe, resumes the same TrueForge session after reconnect, and repeats the core trace without hidden manual repair.

## Prerequisite

[Phase 4](./PHASE_4_APPROVAL_GITHUB_WRITE.md) has passed denial, creation, and PR-reuse tests once.

## Deliverables

- Integration-test matrix for normal, denied, missing-evidence, conflicting-state, and retry paths.
- Native TrueForge reconnect proof at a judge-visible checkpoint.
- Remote content/proposal conflict behavior.
- Three consecutive scripted rehearsal records.
- Frozen competition-core commit candidate.

## Reliability matrix

| Scenario | Expected terminal state | Required proof |
| --- | --- | --- |
| Complete evidence, passing candidate, approved writes | `PR_CREATED` or `PR_REUSED` | exact remote content and PR URL |
| First write denied | `DENIED` | no new branch, commit, or PR |
| Deployment or reachability evidence missing | `INCONCLUSIVE` | no candidate or write call |
| Candidate fails a required contract twice | `NO_SAFE_REMEDIATION` | no approval prompt |
| Existing branch content conflicts with proposal | `WRITE_CONFLICT` | no overwrite |
| Session reconnects while case/proposal exists | same case state | same evidence/proposal IDs and pending action |

## Execution steps

### 5.1 Build an integration harness

Provide deterministic fixture selection and record the agent/session ID, case ID, tool events, verifier artifact, proposal hash, and final status for each run. Keep secrets and raw tokens out of logs.

Completion criterion: a developer can start each scenario from documented fixture state and compare expected to observed terminal status.

### 5.2 Exercise missing and conflicting evidence

Run Phase 1's missing deployment, missing observation, and conflicting revision fixtures. Verify `INCONCLUSIVE` appears before sandbox generation.

Completion criterion: zero sandbox proposal files and zero GitHub write approvals occur for all three scenarios.

### 5.3 Exercise failed remediation

Use an incompatible service dependency or deliberately constrained candidate case. Let the bounded correction attempt finish, then verify `NO_SAFE_REMEDIATION`.

Completion criterion: verifier diagnostics are cited and no GitHub write is requested.

### 5.4 Exercise GitHub conflict and reuse

Run the matching existing-PR case and a mismatched deterministic-branch case. The matching case returns `PR_REUSED`; the mismatch returns `WRITE_CONFLICT`.

Completion criterion: neither case creates a duplicate PR, and the mismatch performs no content update.

### 5.5 Prove native persistence

Use a saved TrueForge session. Refresh or reconnect after the exact proposal is displayed and before approving the first write. Resume from the same session and inspect evidence IDs, proposal hash, and pending action.

Completion criterion: the session resumes with the same identifiers and cannot accept an approval for a different proposal. Describe this as TrueForge session persistence rather than a Guardian database.

### 5.6 Rehearse three consecutive times

Rehearsal sequence:

1. Clean/conclusive case with first write denied.
2. Conclusive case with approval and initial PR creation.
3. Fresh TrueForge session with the same case, approval, and existing-PR reuse.

Record elapsed time and any manual intervention. Reset only through documented fixture controls; do not edit output between tool calls.

Completion criterion: all three runs produce expected results, each judged-path run fits the intended three-minute narrative, and no unplanned manual correction occurs.

### 5.7 Freeze the competition core

Tag or otherwise record the passing product and fixture commits. Later work lands through isolated PRs and must rerun the reliability matrix before replacing the frozen candidate.

Completion criterion: both pinned commit SHAs and the passing evidence bundle are recorded in the release checklist.

## Exit gate

Phase 5 passes when all reliability scenarios return their expected safe terminal states, reconnect preserves the exact case/proposal, and the three-run rehearsal sequence succeeds without manual data repair.

## Recovery route

- If reconnect at pending approval is unstable, demonstrate reconnect immediately before proposal creation and preserve approval in the uninterrupted judged path. Document the narrower proven boundary.
- If full agent integration is nondeterministic, keep deterministic fixture/MCP/verifier tests and harden prompts only where a recorded trace proves the variance.
- If rehearsal duration exceeds three minutes, shorten narration and card content; preserve tool, sandbox, and approval evidence.

## Excluded from this phase

Do not add new product branches during reliability work. Phase 7 owns new feature promotion.

