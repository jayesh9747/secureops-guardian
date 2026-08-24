# Phase 4 — approval and GitHub write

Timebox: 5 hours.

## Goal

Bind a human-visible, verified proposal to scoped official GitHub MCP writes so denial changes nothing and approval creates or reuses one reviewable remediation PR.

## Prerequisite

[Phase 3](./PHASE_3_SANDBOX_PROOF.md) has emitted an eligible proposal with an exact canonical diff and hash.

## Deliverables

- Official GitHub MCP attached with minimum required tools and repository-scoped credentials.
- Approval-required policy for every GitHub write tool used.
- Deterministic remediation branch convention.
- Existing-branch and existing-PR lookup before writes.
- Denial/no-write proof.
- Approval path that updates the exact verified file and opens or reuses a PR.
- Final action receipt with repository, commit, proposal hash, and PR URL.

## Write contract

Use the official GitHub MCP rather than a custom GitHub wrapper. The expected lower-level operations are:

1. Read existing branch and PR state.
2. Create deterministic branch if it does not exist.
3. Update the one target file with the exact verified candidate.
4. Create the remediation PR if it does not exist.
5. Return the existing matching PR on retry.

Each write may produce its own TrueForge approval prompt. Describe the behavior as approval-gated and retry-safe, not atomic.

## Execution steps

### 4.1 Restrict GitHub capabilities

Attach only the read and write tools needed for repository metadata, commit/file inspection, branch creation, file update, PR search, and PR creation. Use the fine-grained credential from Phase 0, scoped to `guardian-demo-checkout`.

Completion criterion: the agent cannot use the credential to administer repositories, merge PRs, modify Actions/secrets, or write to the product repository.

### 4.2 Derive deterministic identifiers

Use branch `guardian/fix-checkout-egress` and include the proposal hash in the commit message, PR body, and machine-readable action receipt. Keep the base branch fixed in configuration.

Completion criterion: the same proposal deterministically searches for the same branch and PR; a different proposal hash is not silently treated as approved.

### 4.3 Present before mutation

Before the first write tool, render repository, branches, file, full diff, proposal hash, evidence IDs, verifier matrix, limitations, and expected write sequence. The displayed candidate must byte-match the sandbox-verified artifact.

Completion criterion: a reviewer can decide without opening hidden trace details, and a test compares displayed and verified candidate hashes.

### 4.4 Prove denial

Choose Deny on the first pending write. After the turn finishes, use GitHub reads to confirm the deterministic branch, commit, and PR were not created by that attempt.

Completion criterion: the action receipt is `DENIED`, cites the denied tool call, and contains no success URL or mutation claim.

### 4.5 Execute the approved sequence

Approve each required official GitHub MCP write only while its arguments match the eligible proposal. After file update, read the remote file or commit and verify its content hash before creating the PR.

Completion criterion: the target repository contains exactly the verified candidate on the deterministic branch, the base branch is unchanged, and the PR body links evidence and verifier results.

### 4.6 Reuse existing work

On a repeated request, search for the deterministic branch and open PR before attempting writes. If the remote candidate hash and proposal hash match, return the existing PR. If they differ, stop with a conflict requiring human resolution; do not overwrite.

Completion criterion: a retry produces no duplicate branch/PR and returns the original URL; a mismatched branch does not mutate.

### 4.7 Emit the action receipt

Return:

- Status: `PR_CREATED`, `PR_REUSED`, `DENIED`, or `WRITE_CONFLICT`.
- Repository and branches.
- Proposal hash and remote commit SHA.
- PR number and URL when applicable.
- Approved/denied tool-call references.
- Remaining limitations and explicit statement that Guardian did not merge or deploy.

Completion criterion: every status is truthful from GitHub tool results and TrueForge approval events.

## Exit gate

Phase 4 passes when one denial proves zero writes, one approval sequence creates the exact verified repair PR, and one retry returns that PR without duplication. The agent never merges, deploys, rolls back, or accesses a cluster.

## Recovery route

- If multiple approvals disrupt the demo, keep the official tools and shorten narration; a custom atomic wrapper remains outside the agreed build.
- If official GitHub MCP lacks a needed combined operation, use its available lower-level operations and update the displayed sequence truthfully.
- If retry detection is unreliable, make PR search and remote content-hash verification explicit root steps. Preserve conflict fail-closed behavior.
- If repository permissions are broader than intended, stop and replace the credential before continuing.

## Excluded from this phase

No automatic merge, deployment, branch deletion, issue creation, rollback, or custom GitHub API client belongs in the hackathon core.

