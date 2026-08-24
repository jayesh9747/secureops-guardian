# Phase 7 — retained prize-strengthening features

Timebox: only hours remaining after Phase 6 is submission-ready. This phase is outside the baseline 38-hour commitment.

## Goal

Retain the valuable intent of every deferred feature while promoting only one independently testable improvement at a time onto the frozen competition core.

## Entry gate

- Phase 6 is submission-ready.
- The protected buffer remains available for submission failures.
- The selected feature has a bounded estimate, named test, and rollback commit.
- The complete Phase 5 rehearsal matrix will run after the change.

If any condition is false, keep the feature documented and ship the frozen core.

## Promotion order

### 7.1 Red-herring discrimination

Add the unrelated analytics CPU observation to Fixture MCP output. Require the incident investigator to report it as a real observation but refute it as causal for checkout exposure because asset, timeline, and change evidence do not join.

Completion criterion: accepting CPU as the cause fails a deterministic evidence-association test; normal causal evidence remains unchanged.

### 7.2 Expanded terminal outcomes

Promote result variants in this order:

1. `NO_SAFE_REMEDIATION`
2. `WRITE_CONFLICT`
3. `PR_REUSED`
4. Richer denial reasons

`READY`, `INCONCLUSIVE`, `DENIED`, and the GitHub result states already exist where required by earlier phases. Add UI variants only after underlying behavior is tested.

Completion criterion: each state has one fixture/integration test and cannot be confused with successful mutation.

### 7.3 Richer evidence presentation

Add expandable evidence provenance, source timestamps, supported/refuted claim grouping, and proposal history to the result card. Keep the first screen concise.

Completion criterion: the three-minute demo remains within budget and core fields stay visible without expansion.

### 7.4 Broader adversarial verifier tests

Add namespace, selector, port, protocol, multi-rule, IPv6, and malformed-policy cases only within the documented static subset.

Completion criterion: new tests increase supported confidence without expanding product claims beyond the model.

### 7.5 Stronger retry recovery

Improve remote-branch/PR reconciliation using official GitHub MCP reads. Preserve the deterministic branch and fail on mismatched content. Do not introduce a custom GitHub client or claim atomicity.

Completion criterion: interrupted official-MCP sequences recover or stop with `WRITE_CONFLICT` without duplicate PRs.

### 7.6 Additional presentation polish

Improve copy, spacing, status color, evidence grouping, and responsive behavior inside Generative UI. Keep a Markdown fallback.

Completion criterion: improvements work in the stock TrueForge UI and do not require platform-core changes.

## Reframed original mechanisms

These intents are retained through correct mechanisms and are not reintroduced in their inaccurate form:

| Original mechanism | Retained implementation |
| --- | --- |
| Hidden expected answer in public/shared files | Transparent deterministic contract fixtures and tests |
| Hard per-subagent tool isolation | Focused instructions, trace disclosure, and post-hackathon upstream proposal |
| Native sandbox command allowlist | Minimal sandbox contents and one documented verifier entrypoint |
| Atomic custom PR transaction | Official GitHub MCP, approvals per write, deterministic lookup, and conflict fail-closed |
| Live reachability proof | Synthetic observation plus static policy-contract validation |
| Custom dashboard | TrueForge Generative UI result card |

## Feature completion protocol

For each promoted feature:

1. Open one isolated product PR.
2. Add or update the failing test first.
3. Implement only the selected behavior.
4. Run quality checks and the complete Phase 5 matrix.
5. Obtain Qodo review.
6. Compare the demo duration and trace legibility to the frozen core.
7. Merge only when every previous submission gate still passes.

## Exit gate

Phase 7 never blocks submission. Its output is either a fully tested promoted feature or an unchanged roadmap item with no partial code in the release branch.

