# Phase 7 unified Guardian evidence

Updated: 25 August 2026

Branch: `phase-7/unified-guardian`

Scope: Phase 7 only

## Result

Phase 7 replaces the phase-named operator entry points with one saved TrueForge agent named `secureops-guardian_v0`. Its parameterized scope and three explicit modes preserve the Phase 2-6 evidence, verifier, proposal, remote, approval, receipt, and presentation gates:

- `ANALYSIS_ONLY` uses official GitHub MCP reads only and never calls the Fixture MCP, enters Daytona, creates a proposal, requests approval, or calls a GitHub write.
- `PREPARE_REMEDIATION` may enter Daytona and return an exact eligible proposal, but never requests approval or calls a GitHub write.
- `OPEN_PR` may proceed through the preserved remote decision and three separately approved write tools. An exact existing PR is reused with reads only and no approval.

Unsupported repositories, incomplete incident evidence, conflicting revisions, unsupported target semantics, stale base state, mismatched proposal or candidate content, and remote conflicts fail closed. Actual data access, exfiltration, and live workload behavior remain `Unknown`.

## Entry reconciliation

| Item | Verified value |
| --- | --- |
| Product PR #7 | Merged at `8fde66dfcd7f537f70192246ee3a7eb7173f53ba` |
| Phase 7 branch point | Updated product `main` after PR #7 |
| Fixture base | `7b2f2ad51f9ef97334176fbfed3138465b62fcdb` |
| Fixture remediation head | `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3` |
| Fixture PR | `jayesh9747/guardian-demo-checkout#1`, open and unmerged |
| Proposal SHA-256 | `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` |
| Preserved operator change | TrueForge `docker-compose.yml` host-binding change remained untouched |

No fixture reset, merge, close, edit, force-push, deployment, cluster access, or unsupported GitHub mutation was performed.

## Unified implementation

`@guardian/orchestration` is the public orchestration seam. It owns strict scope parsing, mode capability ceilings, parameterized read-only preflight, journey composition, remote reconciliation, and a hashed schema-version-1 run receipt. It reuses the existing Phase 2-6 modules rather than copying their security contracts.

The saved-agent manifest enables the combined official GitHub MCP read and write tools, the owned Fixture MCP, Daytona, dynamic subagents, Generative UI, and ask-user questions. The agent instructions enforce the narrower per-mode ceiling. Ask-user questions are permitted only for missing scope before any tool call. The only approval-required tools remain:

1. `create_branch`
2. `create_or_update_file`
3. `create_pull_request`

The attached tool inventory is not authorization. `ANALYSIS_ONLY` prohibits Fixture reads and every GitHub write; `PREPARE_REMEDIATION` prohibits every GitHub write. These exclusions are enforced in typed plans, receipts, tests, and instructions. `OPEN_PR` still requires fresh exact remote reads, proposal/candidate binding, and separate approval immediately before each genuinely necessary write.

## Saved agent and export

| Artifact | Value |
| --- | --- |
| Saved TrueForge name | `secureops-guardian_v0` |
| Saved TrueForge ID | `01m0w6s2eyqtzyb6q4y6ppsta9` |
| Portable export | [`exports/secureops-guardian.trueforge.json`](../../exports/secureops-guardian.trueforge.json) |
| Prompt templates | [`docs/current/PHASE_7_PROMPTS.md`](../current/PHASE_7_PROMPTS.md) |
| Migration guide | [`docs/current/PHASE_7_MIGRATION.md`](../current/PHASE_7_MIGRATION.md) |

TrueForge agent names are immutable, so the replacement record was created and read back from TrueForge. The response confirmed sandbox and file downloads enabled, dynamic subagents enabled, Generative UI enabled, ask-user questions enabled, the exact combined tool inventory, and approvals on exactly the three GitHub writes. The predecessor `secureops-guardian` remains saved so historical reference sessions continue to resolve; phase-named fixtures were not modified.

## Deterministic mode matrix

Run:

```text
pnpm phase7:matrix
```

The command emits one strict run receipt per mode. Tests prove the following ceilings and fail-closed transitions:

| Mode | GitHub reads | Fixture reads | Daytona | Proposal | Approval / GitHub write |
| --- | --- | --- | --- | --- | --- |
| `ANALYSIS_ONLY` | Yes | No | No | No | No |
| `PREPARE_REMEDIATION` | Yes | Yes for supported remediation | Yes | Yes when eligible | No |
| `OPEN_PR` | Yes | Yes for supported remediation | Yes | Yes when eligible | Only after exact remote gate; existing exact PR uses none |

The schemas reject internally inconsistent receipts, including analysis receipts that claim sandbox/proposal work, prepare receipts that claim approval/write work, PR reuse receipts with approval references, and actionable receipts without an exact bound proposal and Phase 4 action receipt.

## Live unified safe-state run

The current fixture prompt was exercised through the saved unified agent with the verifier bundle and four explicit verifier inputs attached to the same turn.

| Field | Value |
| --- | --- |
| Agent | `secureops-guardian` / `01m0vvphezaejvtcxgf9z972ed` |
| Session | `01m0w3vcq4bmzx7dax19d69cn6` |
| Turn | `01m0w3vct3cqb4kbt59xhnnxvy.336t3a` |
| Mode / scope | `OPEN_PR`; exact fixture repository, `main`, suspect commit, and target file |
| Terminal status | `PR_REUSED` |
| Proposal hash | `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` |
| Candidate SHA-256 / Git blob | `c282434c506a45e93e39d2329b33c8466ba7a8a1d5d238817530678d975ad165` / `1eddb230ac7c05bae199e6b9162a42da3bf039fa` |
| GitHub write calls | None |
| Approval events | None |

The trace created `change-security-investigator` and `exposure-evidence-investigator` as retained child investigations. The change investigator used official GitHub MCP reads; the exposure investigator made the four owned Fixture MCP reads. Only after both investigations completed did the main thread execute sandbox commands. Because the turn included file attachments, TrueForge automatically provisioned the sandbox at turn creation; no sandbox command ran before the investigations.

The candidate was written to `/workspace/candidate/checkout-networkpolicy.yaml` before the last-good input was used. The deterministic verifier returned:

| State | Classification | Secure | Functional |
| --- | --- | --- | --- |
| Last-known-good | `SECURE_AND_FUNCTIONAL` | Yes | Yes |
| Suspect | `EXPOSED` | No | Yes |
| Deny-all | `SECURE_BUT_OPERATIONALLY_REJECTED` | Yes | No |
| Candidate | `SECURE_AND_FUNCTIONAL` | Yes | Yes |

The final remote reconciliation used `list_branches`, exact open `list_pull_requests`, remediation and base `get_file_contents`, and remediation `get_commit`. It verified the existing PR's exact base/head, title/body proposal binding, candidate blob, remediation commit, and unchanged base, then returned `PR_REUSED`. The response included the stock OpenUI recovery view, complete Markdown, and schema-version-1 machine-readable receipt. It truthfully kept actual data access, actual exfiltration, and live workload behavior `Unknown` and stated that Guardian did not merge, deploy, or access a cluster.

## Verification

| Command or gate | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Pass |
| `pnpm format:check` | Pass |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass — 19 files, 172 tests |
| `pnpm build` | Pass |
| `pnpm bundle:verifier` plus candidate replay | Pass — `SECURITY_REMEDIATION_READY` |
| `pnpm phase5:matrix` | Pass — eight expected/actual matches |
| `pnpm phase6:matrix` | Pass — nine schema/render/fallback hashes |
| `pnpm phase7:matrix` | Pass — all three mode receipts |
| `git diff --check` | Pass |
| Secret and local absolute-path scans | Pass |

## Review

Development PR [#8](https://github.com/jayesh9747/secureops-guardian/pull/8) is open, non-draft, and unmerged. Qodo's automatic attempt and the official [`/agentic_review` request](https://github.com/jayesh9747/secureops-guardian/pull/8#issuecomment-5408513497) both received the result that reviews are paused for this user. The [paused response](https://github.com/jayesh9747/secureops-guardian/pull/8#issuecomment-5408513076) contains no findings or approval, so none is claimed.

The consolidated alternate review reported 15 findings (G-01 through G-15). The reproductions exposed four root causes: remediation-only checks were applied to every mode; fixture constants stood in for observed identities; computed capability and OPEN_PR gates were not load-bearing; and raw-string/error-boundary validation was incomplete.

Remediation now separates general analysis from remediation eligibility, enumerates full comparison ancestry and descendant patches, normalizes repository/path identities, validates observed repository identity, enforces receipt tool-reference/runtime invariants, emits fail-closed receipts, accepts an omitted target only when the exact proposal resolves it, renders the supplied scope, consumes the single capability ceiling and preflight flags, calls the OPEN_PR artifact gate, reuses the Phase 6 controlling artifact builder, and catches only typed remote-validation errors. All reported reproductions are regression tests. The follow-up Standards review also corrected stale saved-agent and review claims in this evidence record and the implementation status.

No standards- or spec-axis blocker remained after remediation. The package keeps the public orchestration seam above the retained Phase 2-6 modules, preserves strict schemas at trust boundaries, and contains no second runtime or custom GitHub client. Operator acceptance of this alternate review remains required before merge.

## Safety conclusion

Phase 7 adds the unified saved-agent entry point, mode-aware orchestration, portable export, migration and prompt documentation, and deterministic/live evidence. It does not add merge, deploy, cluster, Actions, secrets, issue, administration, force-push, delete, overwrite, or destructive fixture behavior. The fixture PR remains the protected safe state and the phase development PR must remain open, non-draft, and unmerged at handoff.
