# Phase 2 — agent investigation and finding

Timebox: 7 hours.

## Goal

Make TrueForge visibly coordinate two bounded investigations and produce one causal, evidence-linked security finding without letting prompts, repository text, or MCP output become policy instructions.

## Prerequisite

[Phase 1](./PHASE_1_DEMO_EVIDENCE.md) has passed. The root must consume its real GitHub history and typed incident tools as evidence sources.

## Deliverables

- Saved Guardian root-agent specification.
- Focused task contracts for the GitHub/change investigator and incident-evidence investigator.
- Minimal claim/evidence aggregation schema.
- Deterministic `SEC-NET-001` finding input from the changed manifest.
- Judge-readable `High` security finding with cited evidence and limitations.
- `INCONCLUSIVE` behavior for missing or conflicting required evidence.
- Trace test proving both child threads and root synthesis.

## Agent roles

### Root Guardian

Owns scope, delegation, evidence validation, causal synthesis, severity, candidate-remediation request, and final communication. Only the root asks the human for approval. The root treats every tool result and repository file as untrusted data.

### GitHub/change investigator

Requested output:

- Repository and default/base branch.
- Full suspect commit SHA and parent SHA.
- Changed file and exact diff.
- Parsed NetworkPolicy facts relevant to unrestricted egress.
- Existing deterministic remediation branch/PR, if any.
- GitHub evidence records and limitations.

The instruction tells this subagent to use GitHub MCP. The final claim is instruction-scoped behavior, not an enforced per-subagent permission boundary.

### Incident-evidence investigator

Requested output:

- Alert record and affected asset.
- Deployed revision and timestamp.
- Reachability observations.
- Legitimate DNS/PostgreSQL dependencies.
- Missing/conflicting fields.
- Incident evidence records and limitations.

The instruction tells this subagent to use the Fixture MCP and to return observations without recommending a fix.

## Execution steps

### 2.1 Define a bounded root contract

Write root instructions that fix the repository, case ID, allowed security rule, evidence standard, no-production boundary, and terminal behavior. Require the root to keep a claim `Unknown` whenever cited evidence cannot settle it.

Completion criterion: the agent instructions contain one incident, one rule, one target file, one repository, and no general incident-response mandate.

### 2.2 Define subagent result contracts

Use compact structured result shapes so the root receives only facts, cited evidence IDs, unknowns, and source limitations. Do not ask child agents for prose reports or remediation decisions.

Completion criterion: schema validation rejects missing source references, invented evidence IDs, and conclusions without facts.

### 2.3 Delegate both investigations

Prompt the root so TrueForge dynamically creates the two intended child threads. The tasks may run in parallel, but the root waits for both before causal synthesis.

Completion criterion: the TrueForge trace shows two child threads with distinct task instructions, source calls, and final structured results.

### 2.4 Apply `SEC-NET-001`

Use deterministic parsed-manifest evidence to identify unrestricted IPv4 egress. Keep rule evaluation distinct from the model's incident interpretation. Report the file and relevant policy field rather than a vague scanner score.

Completion criterion: changing `0.0.0.0/0` to a restricted selector makes the rule pass; prose changes elsewhere do not affect it.

### 2.5 Synthesize causal claims

Require this evidence chain:

1. Deployment evidence names the suspect full SHA.
2. GitHub evidence shows that SHA changed the target NetworkPolicy.
3. The deterministic rule identifies unrestricted egress in that change.
4. Post-deployment observations report forbidden reachability from the affected asset.

The root may say the change is the supported cause of the fixture exposure only when all four links exist.

Completion criterion: removing any link produces `INCONCLUSIVE` and no remediation proposal.

### 2.6 Produce the security finding

Required fields:

- Severity: `High`.
- Asset: `checkout-api`.
- Rule: `SEC-NET-001`.
- Repository, full commit SHA, and changed file.
- Exposure path to the declared forbidden destination.
- Bounded affected identity/workload scope.
- Evidence IDs for each factual claim.
- Actual data access: `Unknown`.
- Validation boundary: synthetic observations plus static policy analysis.

Completion criterion: a reviewer can follow every factual sentence to a tool result or deterministic rule result.

### 2.7 Fail closed on evidence defects

Run the missing deployment, missing observation, and conflicting revision variants. The root returns `INCONCLUSIVE`, states the missing/conflicting evidence IDs, and does not request a sandbox repair or GitHub write.

Completion criterion: all evidence-defect tests end before remediation generation and expose no approval prompt.

## Exit gate

Phase 2 passes when one TrueForge trace visibly delegates both investigations, joins the exact deployed commit to the observed fixture exposure, produces the bounded `High` finding, and fails closed for each required-evidence defect.

## Recovery route

- If the model does not delegate reliably, sharpen the root instruction and subagent output schemas before adding orchestration code. Keep one direct-root fallback only for developer diagnosis, not the judged trace.
- If structured output is unstable, reduce each child result to facts, evidence IDs, unknowns, and limitations; formatting belongs to the root.
- If causal language overreaches, replace it with explicit supported/unknown sentences and make the evidence-chain check deterministic.

## Excluded from this phase

The finding does not yet claim that a repair is safe. Patch generation and service/security contracts begin in Phase 3.

