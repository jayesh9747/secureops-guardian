# Unified SecureOps Guardian architecture

Updated: 25 August 2026.

## User-facing system

`secureops-guardian_v0` is the only saved TrueForge agent a user selects for new sessions. The immutable predecessor remains registered only so existing reference sessions continue to resolve. Phase-named agent specifications remain repository test fixtures and reference configurations; they are not separate product entry points.

```text
User -> saved TrueForge agent secureops-guardian_v0
          |
          +-- scope preflight -> official GitHub MCP reads
          |
          +-- exact supported fixture in PREPARE_REMEDIATION or OPEN_PR only
          |     +-- change-security-investigator -> official GitHub MCP reads
          |     +-- exposure-evidence-investigator -> Fixture MCP reads
          |     +-- typed evidence validation + SEC-NET-001
          |
          +-- PREPARE_REMEDIATION or OPEN_PR only
          |     `-- Daytona -> bounded candidate + four-state static verifier
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
- `planGuardianRun`: parameterizes read-only preflight, including range enumeration plus descendant-patch reads for comparisons, and establishes the single mode capability ceiling.
- `evaluatePreflight`: compares observed source identities to scope and support requirements.
- `runCurrentFixtureJourney`: consumes an explicit validated observation/remote-state context and composes the existing investigation, verifier, proposal, remote, receipt, and presentation modules.
- `buildGuardianRunReceipt`: validates and hashes the cross-stage machine-readable receipt.
- `SECUREOPS_GUARDIAN_AGENT_SPEC`: the one exported TrueForge manifest.

The orchestration module calls the existing typed modules. It does not reimplement their evidence provenance, verifier, proposal binding, remote decision, receipt, persistence, or presentation gates.

## Stable request schema

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

`suspect` may instead be an exact comparison object with `base_sha` and `head_sha`, both full 40-character lowercase Git SHAs. Missing scope is the only reason ask-user support is enabled, and it must occur before every other tool call.

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
- Exact proposal identity binds repository, branches, file, suspect revision, candidate bytes, diff, evidence, proof, and limitations.
- `create_branch`, `create_or_update_file`, and `create_pull_request` require separate approvals and are retry-safe, not atomic.
- Guardian never merges, deploys, accesses a cluster, overwrites a conflict, or creates a new persistence database.
