import {
  canonicalJson,
  canonicalizeYaml,
  fourStateProofPasses,
  recomputeProposalHash,
  type EligibleProposal,
} from '@guardian/policy-verifier';

import {
  EXPECTED_PROPOSAL_TARGET,
  PHASE_THREE_PROPOSAL_HASH,
  PHASE_THREE_PROPOSAL_ID,
  REMEDIATION_COMMIT_MESSAGE,
  REMEDIATION_PR_TITLE,
  VERIFIED_CANDIDATE_GIT_BLOB_SHA,
  VERIFIED_CANDIDATE_SHA256,
  VERIFIED_CANDIDATE_YAML,
} from './constants.js';
import { buildRemediationPullRequestBody } from './presentation.js';

export interface ProposalBinding {
  proposal: EligibleProposal;
  candidateYaml: string;
  candidateSha256: typeof VERIFIED_CANDIDATE_SHA256;
  candidateGitBlobSha: typeof VERIFIED_CANDIDATE_GIT_BLOB_SHA;
  commitMessage: string;
  pullRequestTitle: string;
  pullRequestBody: string;
}

export type BindingResult =
  { status: 'BOUND'; binding: ProposalBinding } | { status: 'WRITE_CONFLICT'; reason: string };

function conflict(reason: string): BindingResult {
  return { status: 'WRITE_CONFLICT', reason };
}

export function bindEligibleProposal(proposal: EligibleProposal): BindingResult {
  const recomputedProposalHash = recomputeProposalHash(proposal);
  if (
    proposal.proposal_hash_sha256 !== PHASE_THREE_PROPOSAL_HASH ||
    proposal.proposal_id !== PHASE_THREE_PROPOSAL_ID ||
    recomputedProposalHash !== PHASE_THREE_PROPOSAL_HASH
  ) {
    return conflict('Proposal hash or ID does not match the eligible Phase 3 proposal.');
  }
  if (canonicalJson(proposal.target) !== canonicalJson(EXPECTED_PROPOSAL_TARGET)) {
    return conflict('Proposal target is outside the fixed Phase 4 boundary.');
  }
  if (
    !proposal.candidate_verifier_result.eligible ||
    !fourStateProofPasses(proposal.four_state_verifier_result)
  ) {
    return conflict('Proposal does not contain an eligible four-state proof.');
  }
  if (canonicalizeYaml(VERIFIED_CANDIDATE_YAML) !== proposal.canonical_candidate_yaml) {
    return conflict('Verified candidate does not canonicalize to the proposal candidate.');
  }

  return {
    status: 'BOUND',
    binding: {
      proposal,
      candidateYaml: VERIFIED_CANDIDATE_YAML,
      candidateSha256: VERIFIED_CANDIDATE_SHA256,
      candidateGitBlobSha: VERIFIED_CANDIDATE_GIT_BLOB_SHA,
      commitMessage: REMEDIATION_COMMIT_MESSAGE,
      pullRequestTitle: REMEDIATION_PR_TITLE,
      pullRequestBody: buildRemediationPullRequestBody(proposal),
    },
  };
}
