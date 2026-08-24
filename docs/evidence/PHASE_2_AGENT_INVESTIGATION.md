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
| Product implementation head before this evidence record | `c71618be33b3f184a58de9c22adc64b45456c04f` |
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
| Session | `01m0spnj0w3jfqf9pgeaj0qb2h` |
| Turn | `01m0spnzqwrs3j81x32aem2x1b.336t3a` |
| Change/security child thread | `06fc873d-008b-4736-a7f3-eb1e4bed39e3` |
| Exposure-evidence child thread | `628bffb6-6bc2-4fd9-9cae-c29af50d9448` |
| Terminal state | `done`; no required actions |

The root had both connectors attached because TrueForge child roles share the root's resources. The child task contracts restricted their behavior by instruction; this is not claimed as enforced per-child authorization isolation. Sandbox, Generative UI, clarifying questions, and approval/write tools were disabled for the saved agent.

### Trace calls

| Thread | Call ID | Tool | Source/result boundary |
| --- | --- | --- | --- |
| Root | `call_4546124` | `create_sub_agent` | Created change/security child |
| Root | `call_4546187` | `create_sub_agent` | Created exposure-evidence child |
| Change/security | `call_6617971` | `get_commit` | Suspect commit and exact patch |
| Change/security | `call_6617995` | `list_commits` | Full suspect/parent ordering |
| Change/security | `call_6618003` | `get_commit` | Parent full-file addition patch |
| Change/security | `call_6618024` | `get_file_contents` | Suspect file/blob identity |
| Change/security | `call_6618040` | `list_branches` | Existing branch evidence |
| Change/security | `call_6618052` | `search_pull_requests` | Existing bounded PR evidence |
| Exposure-evidence | `call_2839454` | `get_security_alert` | Synthetic alert observation |
| Exposure-evidence | `call_2839462` | `get_deployment` | Synthetic deployment revision |
| Exposure-evidence | `call_2839474` | `get_reachability_observations` | Synthetic forbidden/dependency paths |
| Exposure-evidence | `call_2839486` | `get_service_dependencies` | Synthetic DNS/PostgreSQL dependencies |

The official file-content transport returned the suspect blob identity rather than inline text. The GitHub child reconstructed the suspect YAML only from two official full-patch reads: the parent commit's complete added file plus the suspect commit's three added lines. The resulting child JSON includes the full reconstructed manifest, exact diff, parsed NetworkPolicy facts, evidence records, source references, unknowns, and limitations. Both child outputs pass the checked-in validators without substitution.

## Stable evidence inventory

### GitHub and deterministic evidence

- `evidence:github:commit:suspect`
- `evidence:github:commit:parent`
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
| `pnpm test` | Pass; 5 files and 31 tests |
| `pnpm build` | Pass |
| Captured-child schema/cross-evidence validation | Pass for both accepted child results |
| Captured-child deterministic synthesis | `SUPPORTED_SECURITY_FINDING`; no later-phase fields |
| Post-Qodo full quality suite | Pass; 5 files and 31 tests |
| Post-Qodo committed-file scans | Pass; no secret or local absolute path match |

Tests cover valid child results, missing source references, invented evidence IDs, unsupported parsed facts, child conclusions outside the strict fact contract, exact `SEC-NET-001` detection, restricted-selector pass behavior, metadata/prose irrelevance, the complete four-link chain, all three defect variants, and absence of later-phase output.

## Limitations and safety boundary

- Operational, security, deployment, reachability, and dependency observations are owned static synthetic fixtures, not live telemetry.
- GitHub commit, diff, file/blob, branch, and pull-request evidence is real and was read through the official GitHub MCP in the accepted trace.
- Policy analysis is deterministic and static. It does not prove Kubernetes admission, enforcement, or live reachability.
- `forbidden.example.test` and `203.0.113.10` are documentation-only fixture destinations; no network probe was performed.
- Reachability does not establish actual data movement. Data access and exfiltration remain `Unknown`.
- Dynamic child roles share attached resources and are instruction-scoped, not hard authorization boundaries.
- No credential, authorization header, model reasoning, or local absolute path is recorded here.

## Qodo review

Qodo reviewed product head `f9de2a99c5153af63d0f7ff0d534c40ac4241fa7` on PR #3. Its high-level assessment explicitly recommended the current Zod, cross-evidence validation, and deterministic-rule approach for this bounded phase. It reported zero bugs, zero rule violations, and zero inline findings. No applicable or non-applicable finding required a code change or evidence-backed reply. The complete quality suite and committed-file scans passed after the review.

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
| Qodo review and post-review verification | Pass |
| Phase 3 or later behavior implemented | No |

Phase 2 has passed its implementation, trace, review, and post-review quality gates. Product PR #3 remains open and unmerged; this record does not claim Phase 2 is merged.
