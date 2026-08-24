# Incident Change Guardian

Incident Change Guardian helps an accountable responder evaluate a post-deployment failure and prepare a security-preserving remediation without giving the agent production control.

## Language

**Incident**:
A service degradation that begins within the investigation window and requires an evidence-backed response.
_Avoid_: Alert, outage

**Incident Fixture**:
An owned, reproducible representation of an Incident with observations and a hidden expected explanation.
_Avoid_: Mock production incident, production data

**Evidence Item**:
A sourced observation that can support or refute a Claim.
_Avoid_: Agent finding, model opinion

**Claim**:
A statement about the Incident whose relationship to the available Evidence Items is explicit.
_Avoid_: Conclusion, fact

**Validated Claim**:
A Claim supported by named Evidence Items and any required counterfactual proof.
_Avoid_: Certain claim, guaranteed cause

**Refuted Claim**:
A plausible Claim contradicted by named Evidence Items.
_Avoid_: Ignored signal, false data

**Unknown Claim**:
A Claim that available Evidence Items neither validate nor refute.
_Avoid_: Assumption, probable fact

**Causal Chain**:
An ordered explanation connecting a deployed change to a runtime mechanism and an observed Incident symptom.
_Avoid_: Correlation, timeline

**Availability Contract**:
A condition that must hold for the affected service dependency path to be considered restored.
_Avoid_: Health check, uptime guarantee

**Security Invariant**:
A condition that every acceptable remediation must preserve even during an Incident.
_Avoid_: Security score, recommendation

**Candidate Remediation**:
A proposed change evaluated against the Availability Contract and Security Invariant.
_Avoid_: Fix, solution

**Unsafe Quick Fix**:
A Candidate Remediation that satisfies the Availability Contract by violating the Security Invariant.
_Avoid_: Bad patch, insecure suggestion

**Safe Remediation**:
A Candidate Remediation that satisfies both the Availability Contract and Security Invariant.
_Avoid_: Guaranteed fix, approved change

**Proof-Carrying Remediation**:
A Safe Remediation accompanied by its Causal Chain, supporting Evidence Items, counterfactual results, and known limitations.
_Avoid_: AI-generated patch, SecureOps scan

**Remediation Proposal**:
An exact, reviewable Proof-Carrying Remediation awaiting a human decision.
_Avoid_: Pending fix, approval request

**Controlled External Write**:
A change to a shared external system that the agent may attempt only after a human authorizes its exact content.
_Avoid_: Irreversible action, autonomous remediation
