# Post-hackathon — enforced subagent resource boundaries

Timing: after the TrueForge hackathon submission. This is open-source platform work, not a Guardian competition feature.

## Goal

Use evidence from Guardian's real trace to propose an upstream TrueForge capability that lets the root create a subagent with harness-enforced MCP-tool and sandbox permissions, and makes those effective permissions visible to users.

## Problem statement

Guardian has two conceptually separate investigators:

- A GitHub/change investigator intended to read repository evidence.
- An incident-evidence investigator intended to read owned security/operational fixtures.

Focused instructions guide this separation, but current dynamic subagents share the root agent's attached MCP tools and sandbox. Instruction separation improves behavior but is not an authorization boundary. Security-sensitive agents need the harness to enforce least privilege per delegated task.

## Evidence to collect during Guardian

- Pinned TrueForge commit and agent configuration.
- Root and child trace identifiers.
- Attached MCP servers and tools visible to each child.
- One harmless demonstration that a child can discover a tool outside its intended role, without accessing private or destructive data.
- Expected policy and actual behavior.
- Impact on Guardian's threat model and judge-facing limitation statement.

Collect only owned synthetic evidence. Do not deliberately invoke a write tool to prove discoverability.

## Proposed user contract

Conceptual creation request:

```json
{
  "task": "Inspect the deployed GitHub change",
  "resources": {
    "mcp": {
      "github": {
        "allowed_tools": [
          "get_commit",
          "get_file_contents",
          "list_pull_requests"
        ]
      }
    },
    "sandbox": "none"
  }
}
```

Required semantics:

- The root may delegate only a subset of resources it already possesses.
- The effective policy is enforced by the harness, not added only to the child prompt.
- Omitted resources are unavailable and undiscoverable to the child.
- A child cannot widen its own policy or delegate further.
- Approval policy remains at least as restrictive as the parent policy.
- Trace/UI displays effective MCP servers, allowed tools, sandbox access, and approval selectors.
- Existing agents retain a documented compatibility default.
- Resource denial produces a typed, auditable event.

## Issue preparation steps

### P1 Reproduce on current upstream

Pull the current upstream TrueForge revision after the event and reproduce the shared-resource behavior with the smallest owned example.

Completion criterion: the report distinguishes documented current behavior from a bug and references the exact revision.

### P2 Search for an existing proposal

Search upstream issues, discussions, roadmap, and active PRs for per-subagent resources, tool filters, capability delegation, or sandbox isolation.

Completion criterion: the new issue links related work or explains why none matches the required contract.

### P3 Write the use case and threat model

Explain how shared discovery allows an investigator to see unrelated sensitive tools, why prompting is insufficient, and how subset delegation preserves root control.

Completion criterion: the issue describes user impact without implying an exploit or vulnerability classification unsupported by maintainers.

### P4 Propose acceptance criteria

Include tests for:

- MCP server omitted.
- MCP server present with a tool subset.
- Sandbox absent, read-only, or shared according to supported policy.
- Child attempt to access denied resource.
- Parent with narrower resources than requested child.
- Approval selectors preserved or tightened.
- Effective permissions rendered in trace/UI.
- Backward compatibility.

Completion criterion: maintainers can judge and implement the proposal without reverse-engineering Guardian.

### P5 Open the upstream request

Open the issue against the official TrueForge repository only after checking its contribution template and conduct rules. Link the Guardian repository and sanitized trace when public.

Completion criterion: the issue is concise, evidence-backed, correctly categorized, and contains no credentials or private account information.

### P6 Offer implementation separately

Wait for maintainer direction on schema and compatibility before opening code. If invited, write an implementation plan based on the accepted contract and repository standards.

Completion criterion: no speculative platform patch is mixed into the Guardian submission or opened against a rejected interface.

## Out of scope

- Treating prompts as enforcement.
- Giving children resources absent from the root.
- Nested subagents.
- Bypassing tool approvals.
- Guardian-specific names or policies in TrueForge core.
- Opening the issue before the hackathon submission is safe.

## Completion gate

This task completes when upstream has an evidence-backed issue with a minimal reproducible example and explicit acceptance criteria. Implementation is a separate maintainer-aligned task.

