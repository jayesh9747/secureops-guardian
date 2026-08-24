# Phase 1 demo-evidence record

Date: 24 August 2026  
Branch: `phase-1/demo-evidence`  
Scope: Phase 1 only

## Result

Phase 1 passes its implementation and local evidence gates. The owned fixture repository contains separate last-good and suspect NetworkPolicy commits. The Fixture MCP exposes the four Phase 1 evidence tools as typed read-only operations, and a bounded TrueForge trace joined its synthetic deployment revision to the same full suspect SHA returned by the official GitHub MCP.

This record does not claim a causal finding, remediation, sandbox proof, approval flow, live-cluster access, or confirmed data access. Those behaviors are outside Phase 1.

## Expected and observed behavior

| Expected behavior | Observed behavior | Result |
| --- | --- | --- |
| Last-good policy permits DNS and `payments-data/postgres` TCP/5432 without unrestricted egress | Commit `a6d177b43396c7b4b45aa98cb2970d0489a7a4f9` adds only the two intended dependency rules | Pass |
| Suspect change is a separate auditable event | Commit `7b2f2ad51f9ef97334176fbfed3138465b62fcdb` adds only an `ipBlock` with `cidr: 0.0.0.0/0` | Pass |
| Every returned evidence item has the shared provenance fields, a typed `details` object, and limitations | Startup parsing uses the shared Zod discriminated union; tests cover invalid details and explicit synthetic boundaries | Pass |
| Evidence IDs are unique and stable | Startup rejects duplicate IDs across all cases; the normal case returns six named stable IDs | Pass |
| MCP exposes exactly the four evidence reads plus optional metadata | Tool listing returned `get_security_alert`, `get_deployment`, `get_reachability_observations`, `get_service_dependencies`, and `get_case_metadata` only | Pass |
| Tools are read-only, deterministic, and model-free | All five tools advertise read-only/non-destructive annotations; repeated reads are byte-identical; defensive-copy tests prevent state mutation; the package has no model client | Pass |
| Unknown and malformed inputs fail closed | Integration tests observe deterministic MCP errors for an unknown case and an empty `case_id` | Pass |
| Missing/conflicting variants preserve the normal tool contract | Deterministic cases cover a null deployment revision, no reachability observations, and conflicting ledger/annotation revisions | Pass |
| Alert and reachability observations occur after deployment | Consistency tests compare parsed timestamps; both reachability observations and the alert are later than deployment | Pass |
| TrueForge joins independent GitHub and fixture evidence on a full real SHA | One bounded run used the official GitHub MCP and Fixture MCP; deployment revision equalled the suspect GitHub commit SHA | Pass |

## Owned fixture Git history

Repository: `jayesh9747/guardian-demo-checkout`

| Role | Commit | Message | Relevant change |
| --- | --- | --- | --- |
| Last good | `a6d177b43396c7b4b45aa98cb2970d0489a7a4f9` | `feat: add last-good checkout egress policy` | Adds `k8s/checkout-networkpolicy.yaml` with DNS and PostgreSQL-only egress |
| Suspect | `7b2f2ad51f9ef97334176fbfed3138465b62fcdb` | `feat: reproduce unrestricted checkout egress regression` | Adds exactly `ipBlock.cidr: 0.0.0.0/0` |

Both commits were authored and committed by `Jayesh Savaliya <jsavaliya.tech@gmail.com>` on 24 August 2026 and are present on the owned fixture repository's public `main` branch.

## TrueForge path evidence

| Item | Safe reference |
| --- | --- |
| Pinned runtime | `6026509d905fe255bf493e3845b1fca237bdf0fd` |
| Saved agent | `phase-1-demo-evidence`; `01m0saj1swb31v1ms9afqqp1st` |
| Session | `01m0saj6q210kpamwxr88y28k1` |
| Turn | `01m0sak32k3c41a54t0skewhxf.336t3a` |
| Thread | `main` |
| Connectors initialized | `github` and `guardian-fixture`, both Streamable HTTP |
| Terminal state | `done`; no required actions |

The trace made exactly seven tool calls:

1. Official GitHub MCP `get_commit` for the last-good SHA with full patch detail.
2. Official GitHub MCP `get_commit` for the suspect SHA with full patch detail.
3. Official GitHub MCP `get_file_contents` for `k8s/checkout-networkpolicy.yaml` at the suspect SHA.
4. Fixture MCP `get_security_alert` for the normal case.
5. Fixture MCP `get_deployment` for the normal case.
6. Fixture MCP `get_reachability_observations` for the normal case.
7. Fixture MCP `get_service_dependencies` for the normal case.

Observed join:

```text
deployment.details.revision = 7b2f2ad51f9ef97334176fbfed3138465b62fcdb
GitHub suspect commit SHA     = 7b2f2ad51f9ef97334176fbfed3138465b62fcdb
```

The saved agent enabled only two GitHub read tools and the four Fixture MCP evidence tools. Sandbox, dynamic subagents, Generative UI, and approval/write tools were disabled. It accessed only `jayesh9747/guardian-demo-checkout`.

## Evidence inventory

Normal case: `checkout-networkpolicy-egress-exposure`

| Evidence ID | Source | Observed fact | Explicit limitation |
| --- | --- | --- | --- |
| `evidence:deployment:checkout-api:001` | Synthetic deployment ledger | Ledger and workload annotation report the suspect full SHA | Identifies a revision but does not determine cause |
| `evidence:reachability:checkout-forbidden:001` | Synthetic reachability probe | Checkout reached the forbidden documentation test destination on TCP/443 | Does not establish that data traversed the connection |
| `evidence:reachability:checkout-postgres:001` | Synthetic reachability probe | Checkout reached PostgreSQL on TCP/5432 | Not live telemetry or packet capture |
| `evidence:security-alert:checkout-egress:001` | Synthetic security sensor | Alert reports an allowed connection to the forbidden destination | Actual data access/exfiltration remains `Unknown` |
| `evidence:dependency:checkout-dns:001` | Synthetic service catalog | DNS on UDP/TCP 53 is declared required | Catalog declaration is not live availability measurement |
| `evidence:dependency:checkout-postgres:001` | Synthetic service catalog | `payments-data/postgres` TCP/5432 is declared required | Catalog declaration is not live availability measurement |

## Commands and results

| Command | Observed result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Pass; lockfile already up to date |
| `pnpm format:check` | Pass; all matched files use Prettier style |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass; 4 files and 16 tests |
| `pnpm build` | Pass |
| Changed-file secret scan | Pass; no credential/private-key patterns found |
| Changed-file absolute-path scan | Pass; no `/Users/`, `/home/`, or `file://` references found |

## Limitations and safety boundary

- Operational and security observations are owned static synthetic fixtures, not live telemetry.
- `forbidden.example.test` and `203.0.113.10` are a declared documentation-only destination, not a probed system.
- No Kubernetes cluster, packet capture, production data, user data, production credential, or model call exists in the Fixture MCP path.
- GitHub commit and manifest reads are real and come from the official GitHub MCP against the owned public fixture repository.
- Reachability does not prove data access. Actual data access and exfiltration remain `Unknown`.
- Initial severity is not returned by the MCP and no Phase 2 causal interpretation exists.
- The planned verifier is static NetworkPolicy contract validation and is not implemented in Phase 1.
- No merge, deployment, containment, remediation generation, GitHub write, approval workflow, UI, or persistence feature is implemented here.

## Review status

Pull request: `jayesh9747/secureops-guardian#2`

Qodo reviewed commit `f2f33245b1d45c8598d5d9fbf9a43722999c406c` after an explicit `/agentic_review` invocation. It reported zero bugs, zero rule violations, and one medium cross-repository reliability recommendation: replace the required full fixture SHAs with tags, a fixture-repository mapping, or runtime configuration.

The suggested indirection was not applied:

- Phase 1 explicitly requires real full SHAs in generated fixture data and a deployment fixture that names the suspect SHA.
- The official GitHub MCP trace proved both immutable commit objects exist and the deployment record joins to the suspect object.
- Advancing a Git branch does not change an existing commit object. Only an intentional history rewrite/replacement creates coordination work.
- Having the Fixture MCP resolve GitHub state would mix the independently sourced evidence paths and exceed its exact four-tool, model-free/static-fixture responsibility.
- A moving tag or environment override would be weaker and less deterministic than the checked-in full-SHA contract.

The applicable coordination concern was resolved in the scenario documentation: fixture history must not be rewritten, and any intentional replacement requires new commits, a fixture-version bump, synchronized constants/tests/docs, and a new TrueForge trace. An evidence-backed reply is posted on PR #2.

The final quality suite and both committed-file scans are rerun after this documentation resolution. The pull request remains open and unmerged.
