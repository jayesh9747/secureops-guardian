# Phase 3 — sandbox remediation proof

Timebox: 7 hours.

## Goal

Turn the supported finding into one exact candidate repair and use the TrueForge sandbox to prove, for the owned static fixture, that it closes unrestricted egress without breaking required DNS and PostgreSQL paths.

## Prerequisite

[Phase 2](./PHASE_2_AGENT_INVESTIGATION.md) has produced a conclusive finding. `INCONCLUSIVE` cases cannot enter this phase.

## Deliverables

- Deterministic TypeScript NetworkPolicy verifier.
- Checked-in last-good, suspect, deny-all, and expected-contract fixtures.
- Sandbox workflow that writes model-proposed YAML to a candidate file.
- Four-state proof matrix with machine-readable results.
- Exact proposal artifact containing candidate content, canonical diff, hash, evidence IDs, limitations, and verifier result.
- Tests that distinguish valid, secure-but-broken, exposed, and malformed candidates.

## Static contract

The verifier answers only questions represented by the owned policy model:

1. Does the YAML parse as the intended Kubernetes `NetworkPolicy`?
2. Does it select `checkout-api`?
3. Does it retain the required DNS path?
4. Does it retain `payments-data/postgres` on TCP/5432?
5. Does it exclude unrestricted external egress and the declared forbidden destination?

It does not simulate a cluster, CNI implementation, DNS resolution, packets, application behavior, or data exfiltration.

## Execution steps

### 3.1 Implement the verifier as a pure module

Parse YAML into a narrow internal policy model. Return structured checks with identifiers, observed fields, pass/fail status, and diagnostic messages. Keep file IO and CLI formatting outside the evaluator.

Completion criterion: unit tests invoke the evaluator without a shell or network and cover every contract branch.

### 3.2 Add a single CLI entrypoint

Expose one command that accepts explicit paths for candidate and contract fixtures and emits stable JSON. It exits non-zero for malformed YAML or failed required contracts.

Completion criterion: the same checked-in command runs locally and inside Daytona with identical fixture results.

### 3.3 Establish the four states

Evaluate:

| State | DNS/DB contract | Forbidden-egress contract | Expected classification |
| --- | --- | --- | --- |
| Last good | Pass | Pass | secure and functional baseline |
| Suspect deployment | Pass | Fail | exposure reproduced |
| Deny-all containment | Fail | Pass | secure but operationally rejected |
| Guardian candidate | Pass | Pass | eligible remediation |

Completion criterion: the verifier produces these classifications from manifest content, not file names or expected labels.

### 3.4 Generate the candidate in the sandbox

Give the model the finding, legitimate dependency contract, suspect YAML, and target outcome. Require it to write only `/workspace/candidate/checkout-networkpolicy.yaml` before validation. Do not place GitHub credentials in the sandbox.

Completion criterion: the trace shows sandbox file creation after the finding and before verifier execution; the candidate is not copied from a hidden answer.

### 3.5 Validate and iterate within a bound

Run the verifier. Permit at most one model correction attempt using verifier diagnostics. If the second candidate fails, return `NO_SAFE_REMEDIATION` as a retained terminal result and stop before approval.

Completion criterion: a failed candidate cannot reach Phase 4, and the trace remains short enough for the demo.

### 3.6 Canonicalize the exact proposal

Construct a proposal from:

- Target repository, base branch, deterministic remediation branch, and file.
- Canonical candidate YAML and canonical diff from the suspect state.
- SHA-256 proposal hash.
- Supporting evidence IDs.
- Four-state verifier result.
- Static/synthetic limitations.
- Expected GitHub MCP write sequence.

Any change to candidate content creates a new hash and requires a new approval sequence.

Completion criterion: hashing the same canonical proposal twice yields the same value; changing one byte of candidate content changes it.

### 3.7 Test adversarial candidates

At minimum, test:

- Reintroduced `0.0.0.0/0`.
- DNS removed.
- Wrong namespace selector.
- Wrong PostgreSQL port or protocol.
- Additional unrestricted rule hidden beside the intended rule.
- Malformed or wrong-kind YAML.

Completion criterion: each candidate fails the intended named check and cannot produce an eligible proposal.

## Exit gate

Phase 3 passes when the TrueForge trace shows the model writing candidate YAML inside Daytona, the deterministic command producing the correct four-state matrix, and the exact eligible proposal hash being created only for a passing candidate.

## Recovery route

- If Kubernetes semantics expand beyond the timebox, narrow the fixture and explicitly document the supported policy subset.
- If four-state rendering is unstable, preserve machine-readable JSON and let Phase 6 render it; do not weaken the verifier.
- If model iteration is unreliable, use a stricter candidate schema and one correction attempt rather than embedding an expected answer in the prompt.

## Excluded from this phase

Passing static validation authorizes only presentation of a proposal. GitHub mutation still requires Phase 4 approval.

