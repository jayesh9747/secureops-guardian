import type { ProposalBinding } from './binding.js';
import { PHASE_FOUR_TARGET } from './constants.js';

export type ActionStatus = 'PR_CREATED' | 'PR_REUSED' | 'DENIED' | 'WRITE_CONFLICT';

export interface ActionReceipt {
  schema_version: 1;
  status: ActionStatus;
  repository: string;
  base_branch: string;
  remediation_branch: string;
  proposal_hash_sha256: string;
  remote_commit_sha?: string;
  pr_number?: number;
  pr_url?: string;
  approved_tool_call_references: string[];
  denied_tool_call_references: string[];
  github_result_references: string[];
  remote_candidate_verified: boolean;
  base_branch_unchanged: boolean;
  remaining_limitations: string[];
  guardian_did_not_merge_or_deploy: true;
}

interface ReceiptProof {
  status: ActionStatus;
  approvedToolCallReferences?: string[];
  deniedToolCallReferences?: string[];
  githubResultReferences: string[];
  remoteCandidateVerified: boolean;
  baseBranchUnchanged: boolean;
  deterministicBranchAbsent?: boolean;
  matchingPullRequestAbsent?: boolean;
  remoteCommitSha?: string;
  prNumber?: number;
  prUrl?: string;
}

export function buildActionReceipt(binding: ProposalBinding, proof: ReceiptProof): ActionReceipt {
  const approved = proof.approvedToolCallReferences ?? [];
  const denied = proof.deniedToolCallReferences ?? [];
  const hasPr = proof.prNumber !== undefined && proof.prUrl !== undefined;
  const hasRemoteCommit = proof.remoteCommitSha !== undefined;

  if (proof.status === 'DENIED') {
    if (
      denied.length === 0 ||
      approved.length > 0 ||
      hasPr ||
      hasRemoteCommit ||
      !proof.baseBranchUnchanged ||
      proof.deterministicBranchAbsent !== true ||
      proof.matchingPullRequestAbsent !== true ||
      proof.githubResultReferences.length === 0
    ) {
      throw new Error('DENIED receipt is not supported by a zero-write denial proof.');
    }
  } else if (proof.status === 'PR_CREATED') {
    if (
      approved.length !== 3 ||
      denied.length > 0 ||
      !proof.remoteCandidateVerified ||
      !proof.baseBranchUnchanged ||
      !hasPr ||
      !hasRemoteCommit
    ) {
      throw new Error('PR_CREATED receipt lacks approved GitHub mutation and verification proof.');
    }
  } else if (proof.status === 'PR_REUSED') {
    if (
      approved.length > 0 ||
      denied.length > 0 ||
      !proof.remoteCandidateVerified ||
      !proof.baseBranchUnchanged ||
      !hasPr ||
      !hasRemoteCommit
    ) {
      throw new Error('PR_REUSED receipt lacks matching read-only remote proof.');
    }
  } else if (hasPr) {
    throw new Error('WRITE_CONFLICT receipt must not claim a successful pull request.');
  }

  return {
    schema_version: 1,
    status: proof.status,
    repository: PHASE_FOUR_TARGET.repository,
    base_branch: PHASE_FOUR_TARGET.baseBranch,
    remediation_branch: PHASE_FOUR_TARGET.remediationBranch,
    proposal_hash_sha256: binding.proposal.proposal_hash_sha256,
    ...(proof.remoteCommitSha === undefined ? {} : { remote_commit_sha: proof.remoteCommitSha }),
    ...(proof.prNumber === undefined ? {} : { pr_number: proof.prNumber }),
    ...(proof.prUrl === undefined ? {} : { pr_url: proof.prUrl }),
    approved_tool_call_references: approved,
    denied_tool_call_references: denied,
    github_result_references: proof.githubResultReferences,
    remote_candidate_verified: proof.remoteCandidateVerified,
    base_branch_unchanged: proof.baseBranchUnchanged,
    remaining_limitations: [
      ...binding.proposal.limitations,
      'Official GitHub MCP writes are separately approved and are not one atomic transaction.',
      'Remote byte identity is verified with the expected Git blob SHA; no cluster behavior is inferred.',
    ],
    guardian_did_not_merge_or_deploy: true,
  };
}
