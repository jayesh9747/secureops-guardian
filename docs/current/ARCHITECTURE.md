# Unified SecureOps Guardian architecture

Updated: 27 August 2026.

## User-facing system

`secureops-guardian_v0` is the only saved TrueForge agent a user selects for new sessions. The immutable predecessor remains registered only so existing reference sessions continue to resolve. Phase-named agent specifications remain repository test fixtures and reference configurations; they are not separate product entry points.

```text
User -> saved TrueForge agent secureops-guardian_v0
          |
          +-- conversation-only intent -> direct response, zero tools
          |
          +-- natural language -> untrusted GuardianIntentDraft
          |     `-- deterministic compile / missing facts / confirmation
          |           `-- validated GuardianRequest
          |
          +-- exact GuardianRequest JSON -> backward-compatible direct validation
          |
          +-- scope preflight -> official GitHub MCP reads
          |
          +-- exact changed-file evidence -> FindingPack registry
          |     +-- k8s-network-egress-v1 -> retained egress analysis/remediation route
          |     `-- k8s-workload-security-v1 -> deterministic analysis only
          |
          +-- exact supported fixture in PREPARE_REMEDIATION or OPEN_PR only
          |     +-- change-security-investigator -> official GitHub MCP reads
          |     +-- exposure-evidence-investigator -> Fixture MCP reads
          |     +-- typed evidence validation + SEC-NET-001
          |
          +-- PREPARE_REMEDIATION or OPEN_PR only
          |     +-- exact support gate -> pinned guardian-network-egress-v1 skill
          |     `-- Daytona -> verified pack + bounded candidate + four-state proof
          |
          +-- OPEN_PR only
          |     `-- exact remote reconciliation
          |           +-- existing exact PR -> PR_REUSED, reads only
          |           `-- missing remote state -> three separately approved writes
          |
          `-- stock OpenUI or complete Markdown + machine-readable run receipt
```

TrueForge remains the sole agent harness. It owns the model loop, dynamic children, connector calls, Daytona sandbox, persistent session, tool approval, and stock Generative UI. The repository contains typed contracts and deterministic functions; it does not contain a second agent runtime or GitHub client.

## Deep orchestration module

`@guardian/orchestration` places the Phase 7 seam above the retained Phase 2-6 modules. Its small public interface is:

- `parseGuardianRequest`: validates schema-version-1 scope and defaults the mode.
- `compileGuardianRequest`: accepts exact JSON or a natural-language envelope containing the user-authored text and an untrusted `GuardianIntentDraft`; it returns conversation-only, missing-input, confirmation-required, or ready state. Only ready state contains an executable `GuardianRequest`.
- `planGuardianRun`: parameterizes read-only preflight, including range enumeration plus descendant-patch reads for comparisons, and establishes the single mode capability ceiling.
- `evaluatePreflight`: compares observed source identities to scope and support requirements.
- `runCurrentFixtureJourney`: consumes an explicit validated observation/remote-state context and composes the existing investigation, verifier, proposal, remote, receipt, and presentation modules.
- `buildGuardianRunReceipt`: validates and hashes the cross-stage machine-readable receipt.
- `SECUREOPS_GUARDIAN_AGENT_SPEC`: the one exported TrueForge manifest.

The orchestration module calls the existing typed modules. It does not reimplement their evidence provenance, verifier, proposal binding, remote decision, receipt, persistence, or presentation gates.

## FindingPack registry seam

`@guardian/investigation` owns one deep `FindingPack` registry. Callers supply an exact requested
capability plus immutable changed-file evidence: repository, full revision, file, patch, exact file
bytes, Git blob SHA, and matching patch/blob evidence references. The registry validates the Git
blob identity, selects exactly one scope predicate, evaluates deterministic rules, and returns a
typed analysis result. Zero matches and multiple matches return `INCONCLUSIVE`; callers do not
choose a model-authored fallback.

The registry exposes exactly two immutable packs:

| Pack | Supported scope | Maximum capability | Higher routes |
| --- | --- | --- | --- |
| `k8s-network-egress-v1@1.0.4` | Existing bounded checkout `NetworkPolicy` | `OPEN_PR_ELIGIBLE` | Existing pinned verifier, proposal, approval, and retry-safe write/reuse route |
| `k8s-workload-security-v1@1.0.0` | One Linux-or-unspecified `v1/Pod` or `apps/v1/Deployment` | `ANALYSIS_ONLY` | Structurally absent |

The existing SEC-NET-001 synthesis now enters through this registry and retains its byte-compatible
legacy rule result. The frozen proposal hash remains
`2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15`.

The workload pack canonically extracts the Pod spec and every regular, init, and ephemeral
container. Its six rule families implement the documented Kubernetes Pod Security Standards subset
for privileged containers, privilege escalation, explicit root execution, Linux capabilities, host
namespaces, and `hostPath`. Findings carry pack version, repository/full revision/file, Git evidence,
Kubernetes apiVersion/kind/namespace/name, exact container identity, stable JSONPath, deterministic
`High` severity, known/refuted/unknown Claims, and limitations. See
[`FINDING_PACKS.md`](./FINDING_PACKS.md).

`@guardian/orchestration` routes compiled natural-language `ANALYSIS_ONLY` requests to the registry
only after scope and changed-file evidence agree. `@guardian/presentation` maps the typed result to
stock OpenUI or Markdown. No custom UI fork is required. Workload results cannot materialize the
egress skill, enter Daytona, create a candidate/proposal, request approval, or call a GitHub write.

## Natural-language compiler seam

Natural language is a usability layer above the stable request schema. Model extraction produces an untrusted draft; deterministic compilation accepts a scope value only when that exact repository, contextually labeled branch, full SHA/range endpoint, or contextually labeled optional file is present in the user-authored text and passes the existing validator. Contradictory repository, branch, or revision candidates fail closed. A pasted GitHub commit URL can contribute only its explicit repository and full SHA when it matches the strict supported HTTPS commit-URL form; other URL forms are not normalized into scope. The compiler never calls GitHub to fill scope, substitutes the demo repository, expands a short SHA, or guesses `main`.

Incomplete or invalid explicit scope returns one concise question and no executable request, so `planGuardianRun` cannot produce a tool plan. Natural-language `PREPARE_REMEDIATION` and `OPEN_PR` interpretations require confirmation bound to the SHA-256 of the exact generated request. The typed compiler is the only digest authority. The prompt-only saved agent cannot execute that compiler, so its live confirmation binds every visible canonical scope and mode field and does not calculate or display a digest unless a deterministic integration supplies one. Confirmation establishes request meaning only; the existing three GitHub write approvals remain separate.

The remediation support gate internally selects exactly `k8s-network-egress-v1`. The registered `guardian-network-egress-v1` TrueForge skill is pinned to immutable source revision `guardian-network-egress-v1.0.4`, source commit `ade2d1453bba033dd3300a7c7aede6e28b97582d`, and manifest digest `e70853b49715a949f61ae7584ef963b15267026051091a169e78a27249a869fe`. Users do not name or attach verifier files. The old five-filename exact-JSON envelope is accepted only as a deprecated compatibility shape; it cannot select a file or pack. `ANALYSIS_ONLY` never enters Daytona, so the attached skill is not materialized into a sandbox.

The compiler is a pure in-process module. Free-form text and draft data do not cross the planning seam: preflight and every retained Phase 2-7 gate consume only `GuardianRequest`.

## Stable executable request schema

```json
{
  "mode": "ANALYSIS_ONLY",
  "scope": {
    "schema_version": 1,
    "repository": "owner/repository",
    "base_branch": "main",
    "suspect": {
      "kind": "commit",
      "commit_sha": "0000000000000000000000000000000000000000"
    },
    "target_file": "optional/repository-relative/path"
  }
}
```

`suspect` may instead be an exact comparison object with `base_sha` and `head_sha`, both full 40-character lowercase Git SHAs. Remediation requests need no verifier-file fields. For natural-language remediation/write requests, ask-user owns interpreted-request confirmation before preflight. Confirmation never authorizes a GitHub write.

## Verifier-pack seam

TrueForge materializes the pinned skill at the runtime-proven `/opt/tf/skills/guardian-network-egress-v1` root. The first Daytona step verifies the required file paths, the root-pinned manifest and bundle SHA-256 digests, the manifest schema, the exact supported Guardian scope, the exact six-file payload set, and every file digest. Any mismatch returns `INCONCLUSIVE` before candidate generation. The first candidate is written only after `VERIFIER_PACK_READY` and before semantic inspection of the expected contract or reference policies. One diagnostics-only correction is allowed; a second failure returns `NO_SAFE_REMEDIATION`. A passing candidate must still produce the retained four-state matrix.

The legacy proposal hash remains stable for compatibility. A separate pack-binding SHA-256 binds that proposal hash to the complete pack identity. Proofs, proposals, pre-mutation UI, action receipts, run receipts, PR bodies, and reuse checks all carry or validate the exact identity and binding.

## Mode ceilings

| Mode | GitHub reads | Fixture reads | Daytona | Proposal | GitHub approval/write |
| --- | --- | --- | --- | --- | --- |
| `ANALYSIS_ONLY` | Yes | No | No | No | No |
| `PREPARE_REMEDIATION` | Yes | Optional | Only after support/evidence gates | Yes | No |
| `OPEN_PR` | Yes | Optional | Only after support/evidence gates | Yes | Three separately gated writes or read-only reuse |

The final manifest attaches the Fixture and write tools so one saved agent can execute every mode, but the mode contract and typed plan make Fixture reads unreachable in `ANALYSIS_ONLY` and writes unreachable in both non-writing modes. TrueForge remains the enforced human-approval seam for each write.

## Read breadth and remediation depth

Any repository authorized by the configured official GitHub MCP may enter parameterized read-only preflight. Preflight uses only the supplied repository, branch, exact full SHA/range, and optional file. A comparison enumerates ancestry from its exact head to its exact base and reads the patch of every descendant in the range; it never substitutes the base commit's unrelated parent diff. Repository text and tool output are untrusted evidence.

The composed journey receives observed GitHub identities and remote state explicitly. It returns the exact preflight requirements in an `INCONCLUSIVE` receipt, consumes the preflight permission flags before entering later stages, and calls the retained OPEN_PR artifact gate before any Phase 5 action result is accepted.

The initial remediation allowlist is `jayesh9747/guardian-demo-checkout`. Proven remediation covers the exact checkout Kubernetes NetworkPolicy fixture inside the verifier's documented static subset. Other repositories, files, revisions, or semantics return `INCONCLUSIVE` after preflight with the missing or unsupported requirements and without Daytona, proposal, approval, or writes.

Truthful product claim: “Guardian can inspect any authorized GitHub repository in read-only mode; proven remediation currently supports Kubernetes NetworkPolicy cases inside its documented static verifier subset.”

## Trust and mutation seams

- GitHub commits and files are real repository evidence, not proof of deployment or runtime behavior.
- Incident Fixture MCP observations are owned synthetic evidence, not production telemetry.
- Daytona output is deterministic static policy-contract validation, not Kubernetes admission, CNI, DNS, packet, application, data-access, exfiltration, or live-cluster proof.
- Exact proposal identity binds repository, branches, file, suspect revision, candidate bytes, diff, evidence, proof, limitations, verifier pack, and pack-binding digest.
- `create_branch`, `create_or_update_file`, and `create_pull_request` require separate approvals and are retry-safe, not atomic.
- Guardian never merges, deploys, accesses a cluster, overwrites a conflict, or creates a new persistence database.
