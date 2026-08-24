# Phase 1 — demo target and incident evidence

Timebox: 5 hours.

## Goal

Create a small, owned, internally consistent incident whose causal answer can be derived only by joining exact GitHub history with read-only operational/security observations.

## Prerequisite

[Phase 0](./PHASE_0_PLATFORM_GATE.md) has passed. Use its established repositories, MCP transport, and schemas rather than creating parallel infrastructure.

## Deliverables

- Real Git history for last-good and suspect NetworkPolicy states in `guardian-demo-checkout`.
- Full commit SHAs and deployment fixture referencing the suspect SHA.
- Owned synthetic alert, reachability, dependency, and optional noise observations.
- Four read-only Fixture MCP tools with minimal schemas.
- Fixture consistency and missing-evidence tests.
- A short threat/scenario statement that bounds every security claim.

## Fixed scenario

- Asset: `checkout-api` in an owned synthetic Kubernetes checkout service.
- Last-good policy: DNS and `payments-data/postgres` TCP/5432 are allowed; unrestricted egress is denied.
- Suspect change: an egress rule admits `0.0.0.0/0` while legitimate DB traffic remains possible.
- Alert: a synthetic policy/reachability system reports access to a declared forbidden external test destination.
- Obvious containment: deny all egress, which also breaks DNS and PostgreSQL.
- Intended repair: DNS plus PostgreSQL:5432 only.
- Severity: `High`.
- Actual exfiltration/data access: `Unknown`.

## Execution steps

### 1.1 Build auditable Git history

Commit the last-good manifest, then commit the suspect change as a separate authored event. Use meaningful commit messages and timestamps inside the hackathon build window. Preserve full SHAs in generated fixture data rather than hard-coding a fake short identifier.

Completion criterion: GitHub MCP can retrieve both commits, the suspect diff, and `k8s/checkout-networkpolicy.yaml`; the suspect diff contains exactly the intended security regression.

### 1.2 Define the evidence schema

Use one shared Zod schema for all evidence returned to the agent:

- `evidence_id`
- `kind`
- `source`
- `source_ref`
- `observed_at`
- `fact`
- `supports`
- `refutes`
- `limitations`

Keep source-native fields in a typed `details` object only when the agent needs them.

Completion criterion: every fixture validates at startup and evidence IDs are unique and stable.

### 1.3 Implement the read-only Fixture MCP

Implement exactly these competition-core tools:

1. `get_security_alert(case_id)`
2. `get_deployment(case_id)`
3. `get_reachability_observations(case_id)`
4. `get_service_dependencies(case_id)`

Mark every tool read-only in MCP annotations. Return structured content. Reject unknown case IDs and malformed inputs with deterministic errors.

Completion criterion: tool listing exposes only the four intended investigation tools plus an optional health/metadata tool; tests prove none can mutate fixture state or call a model.

### 1.4 Join the deployment to GitHub truth

Set the synthetic deployment revision to the real suspect commit SHA. Ensure alert and reachability timestamps fall after that deployment. Keep causal interpretation out of the MCP; the server returns observations, not conclusions.

Completion criterion: an independent test can join deployment revision to the GitHub commit and can distinguish observation facts from the intended answer.

### 1.5 Add adversarial and missing-evidence variants

Create fixture variants without changing the normal tool contract:

- Missing deployment revision.
- Missing reachability observation.
- Conflicting timestamp or commit revision.
- Optional unrelated analytics CPU observation for Phase 7.

Completion criterion: tests select each case deterministically and the normal case remains internally consistent.

### 1.6 Document evidence boundaries

State that the fixture represents an owned simulation, the verifier is static, and no cluster, packet capture, user data, or production credential is involved.

Completion criterion: repository documentation never describes fixture observations as live telemetry.

## Exit gate

Phase 1 passes when TrueForge can use GitHub MCP and the Fixture MCP to retrieve independently sourced facts that join on the same full commit SHA, and every returned fact has a stable evidence ID and explicit limitation.

## Recovery route

- If the Fixture MCP transport consumes the timebox, serve the same four contracts from the Phase 0 skeleton with in-memory typed fixtures; defer persistence and deployment.
- If Kubernetes selector semantics become ambiguous, narrow the fixture until the intended DNS and PostgreSQL paths are unambiguous rather than expanding the verifier.
- If the red herring causes schema or narrative complexity, keep its fixture file but promote its investigation behavior only in Phase 7.

## Excluded from this phase

The MCP never determines severity, root cause, remediation, or approval. Those decisions belong to the TrueForge root agent and deterministic verifier.

