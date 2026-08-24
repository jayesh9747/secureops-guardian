import { z } from 'zod';

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
  write_conflict_reason?: string;
  approved_tool_call_references: string[];
  denied_tool_call_references: string[];
  github_result_references: string[];
  remote_candidate_verified: boolean;
  base_branch_unchanged: boolean;
  remaining_limitations: string[];
  guardian_did_not_merge_or_deploy: true;
}

const referenceSchema = z.string().min(1);
const githubResultReferencesSchema = z.array(referenceSchema).min(1);

export const receiptProofSchema = z.discriminatedUnion('status', [
  z
    .object({
      status: z.literal('DENIED'),
      deniedToolCallReferences: z.array(referenceSchema).min(1),
      githubResultReferences: githubResultReferencesSchema,
      remoteCandidateVerified: z.literal(false),
      baseBranchUnchanged: z.literal(true),
      deterministicBranchAbsent: z.literal(true),
      matchingPullRequestAbsent: z.literal(true),
    })
    .strict(),
  z
    .object({
      status: z.literal('PR_CREATED'),
      approvedToolCallReferences: z.tuple([referenceSchema, referenceSchema, referenceSchema]),
      githubResultReferences: githubResultReferencesSchema,
      remoteCandidateVerified: z.literal(true),
      baseBranchUnchanged: z.literal(true),
      remoteCommitSha: z.string().regex(/^[0-9a-f]{40}$/u),
      prNumber: z.number().int().positive(),
      prUrl: z.url(),
    })
    .strict(),
  z
    .object({
      status: z.literal('PR_REUSED'),
      githubResultReferences: githubResultReferencesSchema,
      remoteCandidateVerified: z.literal(true),
      baseBranchUnchanged: z.literal(true),
      remoteCommitSha: z.string().regex(/^[0-9a-f]{40}$/u),
      prNumber: z.number().int().positive(),
      prUrl: z.url(),
    })
    .strict(),
  z
    .object({
      status: z.literal('WRITE_CONFLICT'),
      reason: z.string().min(1),
      githubResultReferences: githubResultReferencesSchema,
      remoteCandidateVerified: z.boolean(),
      baseBranchUnchanged: z.literal(true),
    })
    .strict(),
]);

export type ReceiptProof = z.infer<typeof receiptProofSchema>;

export function buildActionReceipt(
  binding: ProposalBinding,
  untrustedProof: unknown,
): ActionReceipt {
  const proof = receiptProofSchema.parse(untrustedProof);
  const statusEvidence: Pick<
    ActionReceipt,
    | 'approved_tool_call_references'
    | 'denied_tool_call_references'
    | 'github_result_references'
    | 'remote_candidate_verified'
    | 'base_branch_unchanged'
  > &
    Partial<
      Pick<ActionReceipt, 'remote_commit_sha' | 'pr_number' | 'pr_url' | 'write_conflict_reason'>
    > = (() => {
    switch (proof.status) {
      case 'DENIED':
        return {
          approved_tool_call_references: [],
          denied_tool_call_references: proof.deniedToolCallReferences,
          github_result_references: proof.githubResultReferences,
          remote_candidate_verified: false,
          base_branch_unchanged: true,
        };
      case 'PR_CREATED':
        return {
          remote_commit_sha: proof.remoteCommitSha,
          pr_number: proof.prNumber,
          pr_url: proof.prUrl,
          approved_tool_call_references: [...proof.approvedToolCallReferences],
          denied_tool_call_references: [],
          github_result_references: proof.githubResultReferences,
          remote_candidate_verified: true,
          base_branch_unchanged: true,
        };
      case 'PR_REUSED':
        return {
          remote_commit_sha: proof.remoteCommitSha,
          pr_number: proof.prNumber,
          pr_url: proof.prUrl,
          approved_tool_call_references: [],
          denied_tool_call_references: [],
          github_result_references: proof.githubResultReferences,
          remote_candidate_verified: true,
          base_branch_unchanged: true,
        };
      case 'WRITE_CONFLICT':
        return {
          write_conflict_reason: proof.reason,
          approved_tool_call_references: [],
          denied_tool_call_references: [],
          github_result_references: proof.githubResultReferences,
          remote_candidate_verified: proof.remoteCandidateVerified,
          base_branch_unchanged: true,
        };
    }
  })();

  return {
    schema_version: 1,
    status: proof.status,
    repository: PHASE_FOUR_TARGET.repository,
    base_branch: PHASE_FOUR_TARGET.baseBranch,
    remediation_branch: PHASE_FOUR_TARGET.remediationBranch,
    proposal_hash_sha256: binding.proposal.proposal_hash_sha256,
    ...statusEvidence,
    remaining_limitations: [
      ...binding.proposal.limitations,
      'Official GitHub MCP writes are separately approved and are not one atomic transaction.',
      ...(proof.remoteCandidateVerified
        ? [
            'Remote byte identity is verified with the expected Git blob SHA; no cluster behavior is inferred.',
          ]
        : []),
    ],
    guardian_did_not_merge_or_deploy: true,
  };
}
