import { createHash } from 'node:crypto';

import {
  canonicalJson,
  canonicalizeYaml,
  fourStateProofPasses,
  type EligibleProposal,
} from '@guardian/policy-verifier';
import { DEMO_REPOSITORY, SUSPECT_COMMIT_SHA, TARGET_NETWORK_POLICY_FILE } from '@guardian/shared';

import {
  PHASE_FOUR_TARGET,
  PHASE_THREE_PROPOSAL_HASH,
  PHASE_THREE_PROPOSAL_ID,
  REMEDIATION_COMMIT_MESSAGE,
  REMEDIATION_PR_BODY,
  REMEDIATION_PR_TITLE,
  VERIFIED_CANDIDATE_GIT_BLOB_SHA,
  VERIFIED_CANDIDATE_SHA256,
  VERIFIED_CANDIDATE_YAML,
} from './constants.js';

type ProposalCore = Omit<EligibleProposal, 'proposal_id' | 'proposal_hash_sha256'>;

export interface ProposalBinding {
  proposal: EligibleProposal;
  candidateYaml: string;
  candidateSha256: typeof VERIFIED_CANDIDATE_SHA256;
  candidateGitBlobSha: typeof VERIFIED_CANDIDATE_GIT_BLOB_SHA;
  commitMessage: string;
  pullRequestTitle: string;
  pullRequestBody: string;
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function gitBlobSha(content: string): string {
  const bytes = Buffer.from(content);
  return createHash('sha1')
    .update(`blob ${String(bytes.byteLength)}\0`)
    .update(bytes)
    .digest('hex');
}

function proposalCore(proposal: EligibleProposal): ProposalCore {
  const { proposal_hash_sha256, proposal_id, ...core } = proposal;
  void proposal_hash_sha256;
  void proposal_id;
  return core;
}

export function bindEligibleProposal(proposal: EligibleProposal): ProposalBinding {
  const recomputedProposalHash = sha256(canonicalJson(proposalCore(proposal)));
  if (
    proposal.proposal_hash_sha256 !== PHASE_THREE_PROPOSAL_HASH ||
    proposal.proposal_id !== PHASE_THREE_PROPOSAL_ID ||
    recomputedProposalHash !== PHASE_THREE_PROPOSAL_HASH
  ) {
    throw new Error(
      'WRITE_CONFLICT: proposal hash or ID does not match the eligible Phase 3 proposal.',
    );
  }
  if (
    proposal.target.repository !== DEMO_REPOSITORY ||
    proposal.target.base_branch !== PHASE_FOUR_TARGET.baseBranch ||
    proposal.target.remediation_branch !== PHASE_FOUR_TARGET.remediationBranch ||
    proposal.target.file !== TARGET_NETWORK_POLICY_FILE ||
    proposal.target.suspect_commit_sha !== SUSPECT_COMMIT_SHA
  ) {
    throw new Error('WRITE_CONFLICT: proposal target is outside the fixed Phase 4 boundary.');
  }
  if (
    !proposal.candidate_verifier_result.eligible ||
    !fourStateProofPasses(proposal.four_state_verifier_result)
  ) {
    throw new Error('WRITE_CONFLICT: proposal does not contain an eligible four-state proof.');
  }
  if (canonicalizeYaml(VERIFIED_CANDIDATE_YAML) !== proposal.canonical_candidate_yaml) {
    throw new Error(
      'WRITE_CONFLICT: verified candidate does not canonicalize to the proposal candidate.',
    );
  }
  if (
    sha256(VERIFIED_CANDIDATE_YAML) !== VERIFIED_CANDIDATE_SHA256 ||
    gitBlobSha(VERIFIED_CANDIDATE_YAML) !== VERIFIED_CANDIDATE_GIT_BLOB_SHA
  ) {
    throw new Error(
      'WRITE_CONFLICT: verified candidate bytes do not match the pinned artifact hashes.',
    );
  }

  return {
    proposal,
    candidateYaml: VERIFIED_CANDIDATE_YAML,
    candidateSha256: VERIFIED_CANDIDATE_SHA256,
    candidateGitBlobSha: VERIFIED_CANDIDATE_GIT_BLOB_SHA,
    commitMessage: REMEDIATION_COMMIT_MESSAGE,
    pullRequestTitle: REMEDIATION_PR_TITLE,
    pullRequestBody: REMEDIATION_PR_BODY,
  };
}
