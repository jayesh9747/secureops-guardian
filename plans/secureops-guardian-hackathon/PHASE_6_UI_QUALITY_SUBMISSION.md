# Phase 6 — UI, quality, and submission

Timebox: 4 hours plus the protected 2-hour emergency buffer when submission-critical.

## Goal

Turn the frozen, reliable trace into a judge-readable TrueForge experience and a reproducible public submission without introducing a second application or weakening the tested core.

## Prerequisite

[Phase 5](./PHASE_5_RELIABILITY_PERSISTENCE.md) has frozen a passing competition-core commit. UI work consumes structured outputs already produced by the core.

## Deliverables

- Guardian Generative UI result card rendered inside the stock TrueForge chat.
- Understandable tool/subagent/sandbox/approval trace labels.
- Public runnable README and architecture/safety documentation.
- Qodo-reviewed final PR history.
- Passing format, lint, typecheck, test, and build checks.
- Approximately three-minute primary demo plus a backup recording.
- Submission write-up and final link checklist.

## Result-card information hierarchy

Render one compact card with progressive detail:

1. Status and `High` severity.
2. Affected asset, causal commit, and changed file.
3. Exposure path and actual-data-access `Unknown` label.
4. Named evidence IDs grouped by GitHub and incident source.
5. Four-state verifier matrix.
6. Exact patch/proposal hash and limitations.
7. Approval/denial state and PR link when available.

Use TrueForge Generative UI/OpenUI blocks. Do not fork or modify TrueForge core frontend for Guardian branding.

## Execution steps

### 6.1 Stabilize structured presentation input

Validate the root's final result against one presentation schema. Keep trace/event data outside the result schema unless it is required on the card.

Completion criterion: normal, denied, reused, inconclusive, and conflict results each render without missing-field exceptions.

### 6.2 Implement the Generative UI card

Use built-in card, badge, table, code/diff, link, and disclosure components supported by TrueForge's OpenUI renderer. Provide a readable Markdown fallback if Generative UI parsing fails.

Completion criterion: the stock TrueForge UI renders the card in a clean session with no custom frontend build and the fallback remains understandable.

### 6.3 Improve trace legibility

Name the agent, subagent tasks, verifier command, evidence tools, and GitHub actions consistently. Keep the most judge-relevant events identifiable without renaming platform behavior inaccurately.

Completion criterion: a reviewer can point to two child threads, two MCP sources, sandbox execution, approval-required, and GitHub result within the trace.

### 6.4 Complete code-quality evidence

Keep modules narrow around fixture access, policy evaluation, proposal construction, and presentation. Run the repository's formatter, linter, type checker, test suite, and build. Resolve high-confidence Qodo findings or document why a finding does not apply.

Completion criterion: all required checks pass on the submission commit and meaningful implementation PRs show Qodo review.

### 6.5 Write the runnable README

The README must include:

- One-sentence product and primary user.
- Why this is not a generic incident summary.
- Architecture and exact TrueForge capabilities used.
- Prerequisites and reproducible setup for both repositories.
- Model, Daytona, GitHub MCP, and Fixture MCP configuration without secrets.
- Demo command/prompt and expected results.
- Permission and threat boundaries.
- Synthetic/static evidence disclosure.
- Tests and troubleshooting.
- AI-assistance disclosure.
- Known limitations and retained roadmap.

Completion criterion: a fresh-reader rehearsal follows the README without relying on private paths or unstated setup.

### 6.6 Record the three-minute demo

Narrative budget:

| Time | Proof |
| --- | --- |
| 0:00–0:20 | user, security alert, and risk of deny-all containment |
| 0:20–0:55 | two subagents and exact GitHub/incident evidence |
| 0:55–1:20 | `High` finding, causal commit, and explicit unknowns |
| 1:20–1:50 | candidate generated in sandbox and four-state proof |
| 1:50–2:25 | exact proposal and TrueForge approval pause |
| 2:25–2:48 | GitHub MCP PR result or deterministic reuse |
| 2:48–3:00 | why TrueForge is essential and safety boundary |

Record the primary path and one backup. Show the live trace; never substitute screenshots for a failed action while calling it live.

Completion criterion: the primary recording is clear at normal playback speed, approximately three minutes, contains no secrets, and shows a real PR URL.

### 6.7 Prepare and verify submission

Write a concise description of user impact, differentiation, TrueForge use, safety/control, sponsor-tool use, and limitations. Check repository visibility, licenses, README links, video permissions, AI disclosure, and submission deadline/time zone.

Completion criterion: every public link opens in a signed-out browser and the final checklist is captured before submission.

## Exit gate

Phase 6 passes when the frozen core renders clearly in stock TrueForge, all quality checks pass, documentation is reproducible, and both primary and backup demos truthfully show the complete judged path.

## Recovery route

- Generative UI issue: use the Markdown fallback with tables and code fences; preserve stock trace and approval UI.
- UI time overrun: prioritize information hierarchy, contrast, and legibility over branding or animation.
- Recording instability: use the already frozen passing commit and fixture state; stop feature work.
- Submission-link failure: spend the emergency buffer on access and reproducibility, not optional features.

## Excluded from this phase

No separate dashboard, custom TrueForge frontend fork, authentication layer, analytics, organization history, or new agent workflow belongs in the submission polish phase.

