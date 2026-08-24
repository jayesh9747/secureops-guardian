# Phase 2 agent-investigation evidence

Date: 24 August 2026

Branch: `phase-2/agent-investigation`

Pull request: `jayesh9747/secureops-guardian#3`

Scope: Phase 2 only

## Result

Phase 2 passes its implementation, deterministic-test, TrueForge trace, and Qodo review gates. The saved SecureOps Guardian root created exactly two bounded dynamic child investigations, waited for both, validated their structured results, and produced the supported `High` finding only after all four causal links were present.

The three Phase 1 defect variants return `INCONCLUSIVE`, preserve actual data access and exfiltration as `Unknown`, and contain no candidate patch, sandbox request, approval prompt, or GitHub write. No remediation generation, candidate validation, sandbox proof, approval flow, GitHub write, cluster access, or Phase 3 behavior exists in this phase.

## Immutable scope and revisions

| Item | Value |
| --- | --- |
| Repository | `jayesh9747/guardian-demo-checkout` |
| Case | `checkout-networkpolicy-egress-exposure` |
| Asset | `checkout-api` |
| Rule | `SEC-NET-001` |
| File | `k8s/checkout-networkpolicy.yaml` |
| Last-good/parent commit | `a6d177b43396c7b4b45aa98cb2970d0489a7a4f9` |
| Suspect commit | `7b2f2ad51f9ef97334176fbfed3138465b62fcdb` |
| Product implementation head before this evidence record | `9b95dfb024d4408c057c9afa1138e500f5d5f7fc` |
| Pinned TrueForge runtime | `6026509d905fe255bf493e3845b1fca237bdf0fd` |

Product PR #2 was verified merged at `c8fe85b929f27d675a26cf6fb990eb624988874c`, and product `main` contains Phase 1 implementation commit `913474c9cbd53bcecb5a4794d8625549ac5a332f`. Both fixture commits above were retrieved from the owned fixture repository's remote `main` before implementation.

## Expected and observed behavior

| Expected behavior | Observed behavior | Result |
| --- | --- | --- |
| Saved root is bounded to one repository, case, file, rule, and asset | Saved agent `secureops-guardian-phase-2` contains only the immutable scope above | Pass |
| Root creates exactly two dynamic children | Trace contains `change-security-investigator` and `exposure-evidence-investigator`, with no third child | Pass |
| GitHub child uses only official GitHub MCP reads | Child made six bounded GitHub reads and no writes | Pass |
| Exposure child uses only Fixture MCP reads | Child called the four Phase 1 evidence tools and no other source | Pass |
| Root waits for both results before synthesis | Both `thread.done` events precede root finding output | Pass |
| Child results validate before synthesis | Both captured JSON results pass the checked-in Zod/cross-evidence validators | Pass |
| Deterministic rule detects only exact unrestricted IPv4 CIDR | `SEC-NET-001` reports `FAIL` for `0.0.0.0/0`; restricted selector reports `PASS`; unrelated metadata is irrelevant | Pass |
| Complete evidence chain produces bounded finding | Deterministic synthesis returns `SUPPORTED_SECURITY_FINDING`, severity `High` | Pass |
| Missing/conflicting links fail closed | All three required defect variants return `INCONCLUSIVE` | Pass |
| Inconclusive cases stop before later-phase work | Tests verify absence of patch, sandbox, approval, and write output | Pass |

## Saved root agent and accepted TrueForge trace

| Item | Safe identifier |
| --- | --- |
| Saved agent | `secureops-guardian-phase-2`; `01m0sp174jfxmqt61kb4vh0be8` |
| Session | `01m0srsx28bg2vfa7wvn9me2dn` |
| Turn | `01m0srsx3prre1779j20jb0taw.336t3a` |
| Change/security child thread | `5d742a83-b9bc-4b5b-8b82-862d2f9540dc` |
| Exposure-evidence child thread | `ba3348c3-ae0c-4c2a-993f-fcc6635365fe` |
| Terminal state | `done`; no required actions |

The root had both connectors attached because TrueForge child roles share the root's resources. The child task contracts restricted their behavior by instruction; this is not claimed as enforced per-child authorization isolation. Sandbox, Generative UI, clarifying questions, and approval/write tools were disabled for the saved agent.

### Trace calls

| Thread | Call ID | Tool | Source/result boundary |
| --- | --- | --- | --- |
| Root | `call_6733127` | `create_sub_agent` | Created change/security child |
| Root | `call_5065197` | `create_sub_agent` | Created exposure-evidence child |
| Change/security | `call_5995223` | `get_commit` | Suspect commit and exact patch |
| Change/security | `call_6136688` | `list_commits` | Full suspect/parent ordering |
| Change/security | `call_2826551` | `get_commit` | Parent full-file addition patch |
| Change/security | `call_8487426` | `get_file_contents` | Suspect file/blob identity |
| Change/security | `call_8099013` | `list_branches` | Existing branch evidence |
| Change/security | `call_6511868` | `search_pull_requests` | Existing bounded PR evidence |
| Exposure-evidence | `call_7196079` | `get_security_alert` | Synthetic alert observation |
| Exposure-evidence | `call_7196083` | `get_deployment` | Synthetic deployment revision |
| Exposure-evidence | `call_7196087` | `get_reachability_observations` | Synthetic forbidden/dependency paths |
| Exposure-evidence | `call_7196102` | `get_service_dependencies` | Synthetic DNS/PostgreSQL dependencies |

The official file-content transport returned the suspect blob identity rather than inline text. The GitHub child reconstructed the suspect YAML only from two official full-patch reads: the parent commit's complete added file plus the suspect commit's three added lines. Validation recomputes the Git blob SHA over that manifest and requires `477c7db7edd61de10fce67713d52e442f2358318`, requires the exact suspect patch and exact evidence/source/tool tuples, and compares the complete bounded NetworkPolicy identity and parsed facts. Fixture validation compares every source-native item field-for-field with the canonical checked-in case payload. Both captured child outputs pass these validators without substitution.

## Stable evidence inventory

### GitHub and deterministic evidence

- `evidence:github:commit:suspect`
- `evidence:github:commit:parent`
- `evidence:github:commit-history:checkout-networkpolicy`
- `evidence:github:diff:checkout-networkpolicy`
- `evidence:github:manifest:checkout-networkpolicy:suspect`
- `evidence:github:remediation-branches`
- `evidence:github:remediation-pull-requests`
- `evidence:rule:SEC-NET-001:checkout-networkpolicy`

### Owned synthetic observations

- `evidence:deployment:checkout-api:001`
- `evidence:security-alert:checkout-egress:001`
- `evidence:reachability:checkout-forbidden:001`
- `evidence:reachability:checkout-postgres:001`
- `evidence:dependency:checkout-dns:001`
- `evidence:dependency:checkout-postgres:001`

## Deterministic rule output

```json
{
  "rule_id": "SEC-NET-001",
  "status": "FAIL",
  "file": "k8s/checkout-networkpolicy.yaml",
  "manifest_field": "spec.egress[*].to[*].ipBlock.cidr",
  "observed_value": "0.0.0.0/0",
  "evidence_id": "evidence:rule:SEC-NET-001:checkout-networkpolicy",
  "source_ref": "static-rule:SEC-NET-001:k8s/checkout-networkpolicy.yaml:spec.egress[*].to[*].ipBlock.cidr",
  "limitation": "Deterministic static manifest analysis only; this is not live-cluster reachability proof."
}
```

Replacing the unrestricted block with the intended restricted namespace/pod selector returns `PASS` with `observed_value: null`. Adding unrelated metadata or prose leaves the `FAIL` result unchanged.

## Normal finding output

```json
{
  "outcome": "SUPPORTED_SECURITY_FINDING",
  "severity": "High",
  "asset": "checkout-api",
  "rule_id": "SEC-NET-001",
  "repository": "jayesh9747/guardian-demo-checkout",
  "suspect_commit_sha": "7b2f2ad51f9ef97334176fbfed3138465b62fcdb",
  "changed_file": "k8s/checkout-networkpolicy.yaml",
  "exposure_path": "checkout-api -> forbidden.example.test:443/TCP",
  "affected_scope": "checkout-api pod identity in the owned synthetic payments namespace",
  "actual_data_access": "Unknown",
  "validation_boundary": "Real GitHub evidence, owned synthetic operational observations, and deterministic static policy analysis."
}
```

The full result contains four cited claims: deployed revision, suspect target-file change, deterministic unrestricted-egress rule result, and post-deployment forbidden reachability. Every claim has at least one evidence ID and source reference.

## Fail-closed evidence

| Case | Outcome | Evidence defect | Later-phase output |
| --- | --- | --- | --- |
| `checkout-networkpolicy-egress-exposure-missing-deployment-revision` | `INCONCLUSIVE` | Missing deployment revision in `evidence:deployment:checkout-api:001:missing-deployment-revision` | None |
| `checkout-networkpolicy-egress-exposure-missing-reachability` | `INCONCLUSIVE` | Missing post-deployment forbidden reachability from `checkout-api` | None |
| `checkout-networkpolicy-egress-exposure-conflicting-revision` | `INCONCLUSIVE` | Ledger reports `7b2f2ad51f9ef97334176fbfed3138465b62fcdb`; annotation reports `a6d177b43396c7b4b45aa98cb2970d0489a7a4f9` | None |

Every result sets severity and actual data access to `Unknown`, leaves the causal claim unresolved, and has no `candidate_patch`, `sandbox_request`, `approval_prompt`, or `github_write` field. These outcomes are deterministic test evidence; no extra TrueForge sessions are required for the defect variants.

## Commands and results

| Command | Observed result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Pass; lockfile already up to date |
| `pnpm format:check` | Pass |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass; 5 files and 36 tests |
| `pnpm test` with all package `dist` directories absent | Pass; 5 files and 36 tests |
| `pnpm build` | Pass |
| Captured-child schema/cross-evidence validation | Pass for both accepted child results |
| Captured-child deterministic synthesis | `SUPPORTED_SECURITY_FINDING`; no later-phase fields |
| Post-Qodo-fix full quality suite | Pass; 5 files and 36 tests |
| Post-Qodo committed-file scans | Pass; no secret or local absolute path match |

Tests cover valid child results, missing source references, invented evidence IDs, unsupported parsed facts, arbitrary diffs and unrelated target references, fabricated GitHub source references, wrong manifest identity, fabricated fixture payloads under valid IDs, child conclusions outside the strict fact contract, exact `SEC-NET-001` detection including implicit egress policy type, restricted-selector pass behavior, metadata/prose irrelevance, clean-checkout source resolution, the complete four-link chain, all three defect variants, and absence of later-phase output.

## Limitations and safety boundary

- Operational, security, deployment, reachability, and dependency observations are owned static synthetic fixtures, not live telemetry.
- GitHub commit, diff, file/blob, branch, and pull-request evidence is real and was read through the official GitHub MCP in the accepted trace.
- Policy analysis is deterministic and static. It does not prove Kubernetes admission, enforcement, or live reachability.
- `forbidden.example.test` and `203.0.113.10` are documentation-only fixture destinations; no network probe was performed.
- Reachability does not establish actual data movement. Data access and exfiltration remain `Unknown`.
- Dynamic child roles share attached resources and are instruction-scoped, not hard authorization boundaries.
- No credential, authorization header, model reasoning, or local absolute path is recorded here.

## Qodo review

Qodo's deep review of product head `5d3dde5b114e1b8f25b2f01eb7b3e5f8e6804bc0` reported three applicable `High` findings and no rule violations or cross-repository conflicts:

1. Target-file change evidence did not require the exact diff or target evidence records. Commit `2fa5749e4b07f09f131dd2f9f7ce4f3d4470edd0` requires the exact patch, exact target evidence/source tuples, and the real manifest blob SHA; regression tests reject arbitrary diffs and unrelated references.
2. Manifest identity was not tied to the reconstructed YAML. The fix parses and validates the complete bounded NetworkPolicy identity and structure before rule evaluation; a wrong-object regression test fails closed.
3. Child-supplied evidence labels could front fabricated payloads. The fix recomputes the Git blob digest, constrains GitHub provenance, and compares fixture results field-for-field with canonical checked-in payloads; fabricated GitHub and fixture tests return `INCONCLUSIVE`.

All three inline threads received evidence-backed replies and were resolved. The preliminary zero-finding PR note was explicitly corrected. Qodo's re-review of `2fa5749e4b07f09f131dd2f9f7ce4f3d4470edd0` confirmed those three findings resolved and reported two new applicable `Medium` findings:

4. Clean-checkout tests could depend on ignored fixture `dist` output. Commit `9b95dfb024d4408c057c9afa1138e500f5d5f7fc` aliases workspace packages to source for Vitest. The full test suite passes with every package `dist` directory moved aside.
5. Requiring explicit `policyTypes: [Egress]` created a false-negative path despite an exact unrestricted CIDR. The fix retains bounded identity and egress-structure checks but evaluates the CIDR regardless of explicit policy type; a new regression test covers implicit egress policy type.

Both new inline threads received evidence-backed replies and were resolved. A final Qodo re-review was requested on the fixed head, but Qodo reported that reviews are paused for this user. This record therefore does not infer a third zero-finding review. Two deep reviews completed, every one of their five applicable findings was addressed, and the complete quality suite plus clean-output test and repository scans passed after the latest fixes.

## Exit-gate conclusion

| Gate | Result |
| --- | --- |
| Saved bounded root-agent specification | Pass |
| Two distinct dynamic child threads and task contracts | Pass |
| Correct official GitHub and Fixture MCP source calls | Pass |
| Valid structured child results | Pass |
| Root waits for both before validation/synthesis | Pass |
| Deterministic `SEC-NET-001` evidence | Pass |
| Bounded evidence-linked `High` finding | Pass |
| Missing/conflicting evidence fails closed | Pass |
| Qodo review and post-review verification | Pass; five findings resolved, with final re-review unavailable because Qodo paused further reviews |
| Phase 3 or later behavior implemented | No |

Phase 2 has passed its implementation, trace, review, and post-review quality gates. Product PR #3 remains open and unmerged; this record does not claim Phase 2 is merged.
