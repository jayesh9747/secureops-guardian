import { z } from 'zod';

import type { ProposalBinding } from './binding.js';
import { PHASE_FOUR_TARGET } from './constants.js';

export type ActionStatus = 'PR_CREATED' | 'PR_REUSED' | 'DENIED' | 'WRITE_CONFLICT';

const referenceSchema = z.string().min(1);
const githubResultReferencesSchema = z.array(referenceSchema).min(1);

export const actionReceiptSchema = z
  .object({
    schema_version: z.literal(1),
    status: z.enum(['PR_CREATED', 'PR_REUSED', 'DENIED', 'WRITE_CONFLICT']),
    repository: z.string().min(1),
    base_branch: z.string().min(1),
    remediation_branch: z.string().min(1),
    proposal_hash_sha256: z.string().regex(/^[0-9a-f]{64}$/u),
    remote_commit_sha: z
      .string()
      .regex(/^[0-9a-f]{40}$/u)
      .optional(),
    pr_number: z.number().int().positive().optional(),
    pr_url: z.url().optional(),
    write_conflict_reason: z.string().min(1).optional(),
    approved_tool_call_references: z.array(referenceSchema),
    denied_tool_call_references: z.array(referenceSchema),
    github_result_references: githubResultReferencesSchema,
    remote_candidate_verified: z.boolean(),
    base_branch_unchanged: z.boolean(),
    remaining_limitations: z.array(z.string().min(1)).min(1),
    guardian_did_not_merge_or_deploy: z.literal(true),
  })
  .strict()
  .superRefine((receipt, context) => {
    const remotePrFieldCount = [
      receipt.remote_commit_sha,
      receipt.pr_number,
      receipt.pr_url,
    ].filter((value) => value !== undefined).length;
    const hasRemotePr = remotePrFieldCount === 3;
    if (receipt.status === 'PR_CREATED' || receipt.status === 'PR_REUSED') {
      const approvedCount = receipt.status === 'PR_CREATED' ? 3 : 0;
      if (
        !hasRemotePr ||
        !receipt.remote_candidate_verified ||
        receipt.approved_tool_call_references.length !== approvedCount ||
        receipt.denied_tool_call_references.length !== 0 ||
        receipt.write_conflict_reason !== undefined
      ) {
        context.addIssue({ code: 'custom', message: `${receipt.status} receipt is inconsistent.` });
      }
    }
    if (
      receipt.status === 'DENIED' &&
      (remotePrFieldCount > 0 ||
        receipt.remote_candidate_verified ||
        receipt.approved_tool_call_references.length !== 0 ||
        receipt.denied_tool_call_references.length === 0 ||
        receipt.write_conflict_reason !== undefined)
    ) {
      context.addIssue({ code: 'custom', message: 'DENIED receipt is inconsistent.' });
    }
    if (
      receipt.status === 'WRITE_CONFLICT' &&
      (remotePrFieldCount > 0 ||
        receipt.approved_tool_call_references.length !== 0 ||
        receipt.denied_tool_call_references.length !== 0 ||
        receipt.write_conflict_reason === undefined)
    ) {
      context.addIssue({ code: 'custom', message: 'WRITE_CONFLICT receipt is inconsistent.' });
    }
  });

export type ActionReceipt = z.infer<typeof actionReceiptSchema>;

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

  return actionReceiptSchema.parse({
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
  });
}
