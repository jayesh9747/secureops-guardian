import type { ProposalBinding } from './binding.js';
import type { EligibleProposal, FourStateProof, ProofState } from '@guardian/policy-verifier';
import {
  PHASE_FOUR_TARGET,
  VERIFIED_CANDIDATE_GIT_BLOB_SHA,
  VERIFIED_CANDIDATE_SHA256,
} from './constants.js';

const proofStateLabels: Record<ProofState, string> = {
  'last-good': 'Last-known-good',
  suspect: 'Suspect',
  'deny-all': 'Deny-all',
  candidate: 'Guardian candidate',
};

export function renderBullets(items: readonly string[], code = false): string {
  return items.map((item) => `- ${code ? `\`${item}\`` : item}`).join('\n');
}

export function renderProofMatrix(proof: FourStateProof, friendlyLabels = false): string {
  return proof.states
    .map(({ state, result }) => {
      const label = friendlyLabels ? proofStateLabels[state] : state;
      return `| ${label} | ${result.classification} | ${result.secure ? 'Yes' : 'No'} | ${result.functional ? 'Yes' : 'No'} |`;
    })
    .join('\n');
}

function remediationPullRequestBody(proposal: EligibleProposal, includePackIdentity: boolean) {
  const packIdentity = includePackIdentity
    ? `- Verifier pack: \`${proposal.verifier_pack.pack_id}\` version \`${proposal.verifier_pack.pack_version}\`
- Verifier pack source revision: \`${proposal.verifier_pack.source_revision}\`
- Verifier pack manifest SHA-256: \`${proposal.verifier_pack.manifest_sha256}\`
- Verifier pack binding SHA-256: \`${proposal.verifier_pack_binding_sha256}\`
`
    : '';
  return `## SecureOps Guardian remediation

This pull request applies the exact Phase 3 sandbox-verified candidate for \`SEC-NET-001\`.

- Proposal hash: \`${proposal.proposal_hash_sha256}\`
- Proposal ID: \`${proposal.proposal_id}\`
${packIdentity}- Base branch: \`${proposal.target.base_branch}\`
- Remediation branch: \`${proposal.target.remediation_branch}\`
- Target file: \`${proposal.target.file}\`
- Verified candidate SHA-256: \`${VERIFIED_CANDIDATE_SHA256}\`
- Verified candidate Git blob SHA: \`${VERIFIED_CANDIDATE_GIT_BLOB_SHA}\`

### Four-state verifier

| State | Classification | Secure | Functional |
| --- | --- | --- | --- |
${renderProofMatrix(proposal.four_state_verifier_result, true)}

### Supporting evidence IDs

${renderBullets(proposal.supporting_evidence_ids, true)}

### Evidence records

- [Phase 3 sandbox proof](https://github.com/jayesh9747/secureops-guardian/blob/main/docs/evidence/PHASE_3_SANDBOX_PROOF.md)
- [Verified candidate artifact](https://github.com/jayesh9747/secureops-guardian/blob/main/docs/evidence/PHASE_3_CANDIDATE.yaml)
- [Canonical proposal artifact](https://github.com/jayesh9747/secureops-guardian/blob/main/docs/evidence/PHASE_3_PROPOSAL.json)

### Limitations

${renderBullets(proposal.limitations)}

Guardian created this reviewable pull request through separately approved official GitHub MCP writes. The sequence is retry-safe, not atomic. Guardian did not merge, deploy, roll back, delete a branch, or access a Kubernetes cluster.
`;
}

export function buildRemediationPullRequestBody(proposal: EligibleProposal): string {
  return remediationPullRequestBody(proposal, true);
}

export function buildLegacyRemediationPullRequestBody(proposal: EligibleProposal): string {
  return remediationPullRequestBody(proposal, false);
}

export function buildPreMutationPresentation(binding: ProposalBinding): string {
  return `# Pending GitHub remediation

- Repository: \`${PHASE_FOUR_TARGET.repository}\`
- Base branch: \`${PHASE_FOUR_TARGET.baseBranch}\`
- Remediation branch: \`${PHASE_FOUR_TARGET.remediationBranch}\`
- Target file: \`${PHASE_FOUR_TARGET.file}\`
- Proposal hash: \`${binding.proposal.proposal_hash_sha256}\`
- Verifier pack: \`${binding.proposal.verifier_pack.pack_id}\` version \`${binding.proposal.verifier_pack.pack_version}\`
- Verifier pack source revision: \`${binding.proposal.verifier_pack.source_revision}\`
- Verifier pack manifest SHA-256: \`${binding.proposal.verifier_pack.manifest_sha256}\`
- Verifier pack binding SHA-256: \`${binding.proposal.verifier_pack_binding_sha256}\`
- Displayed/verified candidate SHA-256: \`${binding.candidateSha256}\`
- Expected remote Git blob SHA: \`${binding.candidateGitBlobSha}\`

## Full canonical diff

\`\`\`diff
${binding.proposal.canonical_diff}\`\`\`

## Exact verified candidate bytes

\`\`\`yaml
${binding.candidateYaml}\`\`\`

## Supporting evidence IDs

${renderBullets(binding.proposal.supporting_evidence_ids, true)}

## Four-state verifier matrix

| State | Classification | Secure | Functional |
| --- | --- | --- | --- |
${renderProofMatrix(binding.proposal.four_state_verifier_result)}

## Limitations

${renderBullets(binding.proposal.limitations)}

## Expected GitHub write sequence

1. Read/search for the deterministic branch and matching open PR.
2. Create \`${PHASE_FOUR_TARGET.remediationBranch}\` from \`${PHASE_FOUR_TARGET.baseBranch}\` only when absent.
3. Update only \`${PHASE_FOUR_TARGET.file}\` with the verified candidate.
4. Read the remote file/commit and verify content identity before PR creation.
5. Create one remediation PR only when a matching PR is absent.
6. On retry, return the matching existing PR without mutation.

Every write has a separate human approval. The sequence is retry-safe, not atomic. Guardian will not merge, deploy, roll back, delete branches, or access a Kubernetes cluster.`;
}
