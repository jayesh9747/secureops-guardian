import type { ProposalBinding } from './binding.js';
import { PHASE_FOUR_TARGET } from './constants.js';

export function buildPreMutationPresentation(binding: ProposalBinding): string {
  const matrix = binding.proposal.four_state_verifier_result.states
    .map(
      ({ state, result }) =>
        `| ${state} | ${result.classification} | ${result.secure ? 'Yes' : 'No'} | ${result.functional ? 'Yes' : 'No'} |`,
    )
    .join('\n');
  return `# Pending GitHub remediation

- Repository: \`${PHASE_FOUR_TARGET.repository}\`
- Base branch: \`${PHASE_FOUR_TARGET.baseBranch}\`
- Remediation branch: \`${PHASE_FOUR_TARGET.remediationBranch}\`
- Target file: \`${PHASE_FOUR_TARGET.file}\`
- Proposal hash: \`${binding.proposal.proposal_hash_sha256}\`
- Displayed/verified candidate SHA-256: \`${binding.candidateSha256}\`
- Expected remote Git blob SHA: \`${binding.candidateGitBlobSha}\`

## Full canonical diff

\`\`\`diff
${binding.proposal.canonical_diff}\`\`\`

## Exact verified candidate bytes

\`\`\`yaml
${binding.candidateYaml}\`\`\`

## Supporting evidence IDs

${binding.proposal.supporting_evidence_ids.map((id) => `- \`${id}\``).join('\n')}

## Four-state verifier matrix

| State | Classification | Secure | Functional |
| --- | --- | --- | --- |
${matrix}

## Limitations

${binding.proposal.limitations.map((limitation) => `- ${limitation}`).join('\n')}

## Expected GitHub write sequence

1. Read/search for the deterministic branch and matching open PR.
2. Create \`${PHASE_FOUR_TARGET.remediationBranch}\` from \`${PHASE_FOUR_TARGET.baseBranch}\` only when absent.
3. Update only \`${PHASE_FOUR_TARGET.file}\` with the verified candidate.
4. Read the remote file/commit and verify content identity before PR creation.
5. Create one remediation PR only when a matching PR is absent.
6. On retry, return the matching existing PR without mutation.

Every write has a separate human approval. The sequence is retry-safe, not atomic. Guardian will not merge, deploy, roll back, delete branches, or access a Kubernetes cluster.`;
}
