import { canonicalJson, type EligibleProposal } from '@guardian/policy-verifier';
import { fullGitShaSchema } from '@guardian/shared';
import { z } from 'zod';

import { bindEligibleProposal, type ProposalBinding } from './binding.js';
import { PHASE_FOUR_TARGET, SUSPECT_CANDIDATE_GIT_BLOB_SHA } from './constants.js';

export type GitHubWriteTool = 'create_branch' | 'create_or_update_file' | 'create_pull_request';
export type WriteStep = 'CREATE_BRANCH' | 'UPDATE_FILE' | 'CREATE_PR';

export interface WriteToolCall {
  tool: GitHubWriteTool;
  arguments: Record<string, unknown>;
}

export const remoteSnapshotSchema = z.object({
  base: z.object({
    commitSha: fullGitShaSchema,
    targetFileGitBlobSha: fullGitShaSchema,
  }),
  branch: z
    .object({
      commitSha: fullGitShaSchema,
      targetFileGitBlobSha: fullGitShaSchema,
      commitMessage: z.string().min(1),
    })
    .nullable(),
  pullRequest: z
    .object({
      number: z.number().int().positive(),
      url: z.url(),
      title: z.string().min(1),
      base: z.string().min(1),
      head: z.string().min(1),
      body: z.string(),
    })
    .nullable(),
});

export type RemoteSnapshot = z.infer<typeof remoteSnapshotSchema>;

export type RemoteDecision =
  | { status: 'WRITE_REQUIRED'; step: WriteStep }
  | { status: 'PR_REUSED'; remoteCommitSha: string; prNumber: number; prUrl: string }
  | { status: 'WRITE_CONFLICT'; reason: string };

function exactRecord(actual: Record<string, unknown>, expected: Record<string, unknown>): boolean {
  return canonicalJson(actual) === canonicalJson(expected);
}

export function expectedWriteCall(binding: ProposalBinding, step: WriteStep): WriteToolCall {
  switch (step) {
    case 'CREATE_BRANCH':
      return {
        tool: 'create_branch',
        arguments: {
          owner: PHASE_FOUR_TARGET.owner,
          repo: PHASE_FOUR_TARGET.repo,
          branch: PHASE_FOUR_TARGET.remediationBranch,
          from_branch: PHASE_FOUR_TARGET.baseBranch,
        },
      };
    case 'UPDATE_FILE':
      return {
        tool: 'create_or_update_file',
        arguments: {
          owner: PHASE_FOUR_TARGET.owner,
          repo: PHASE_FOUR_TARGET.repo,
          branch: PHASE_FOUR_TARGET.remediationBranch,
          path: PHASE_FOUR_TARGET.file,
          content: binding.candidateYaml,
          message: binding.commitMessage,
          sha: SUSPECT_CANDIDATE_GIT_BLOB_SHA,
        },
      };
    case 'CREATE_PR':
      return {
        tool: 'create_pull_request',
        arguments: {
          owner: PHASE_FOUR_TARGET.owner,
          repo: PHASE_FOUR_TARGET.repo,
          title: binding.pullRequestTitle,
          head: PHASE_FOUR_TARGET.remediationBranch,
          base: PHASE_FOUR_TARGET.baseBranch,
          body: binding.pullRequestBody,
          draft: false,
          maintainer_can_modify: false,
        },
      };
  }
}

export function writeCallMatchesProposal(
  binding: ProposalBinding,
  step: WriteStep,
  call: WriteToolCall,
): boolean {
  const expected = expectedWriteCall(binding, step);
  return call.tool === expected.tool && exactRecord(call.arguments, expected.arguments);
}

export function evaluateRemoteSnapshot(
  binding: ProposalBinding,
  untrustedSnapshot: RemoteSnapshot,
): RemoteDecision {
  const snapshot = remoteSnapshotSchema.parse(untrustedSnapshot);
  if (snapshot.base.targetFileGitBlobSha !== SUSPECT_CANDIDATE_GIT_BLOB_SHA) {
    return {
      status: 'WRITE_CONFLICT',
      reason: 'Base target file no longer matches the Phase 3 suspect.',
    };
  }
  if (snapshot.pullRequest !== null && snapshot.branch === null) {
    return {
      status: 'WRITE_CONFLICT',
      reason: 'Matching PR exists without the deterministic branch.',
    };
  }
  if (snapshot.branch === null) {
    return { status: 'WRITE_REQUIRED', step: 'CREATE_BRANCH' };
  }

  const branchHasCandidate =
    snapshot.branch.targetFileGitBlobSha === binding.candidateGitBlobSha &&
    snapshot.branch.commitMessage === binding.commitMessage;

  if (snapshot.pullRequest !== null) {
    const pullRequestMatches =
      snapshot.pullRequest.base === PHASE_FOUR_TARGET.baseBranch &&
      snapshot.pullRequest.head === PHASE_FOUR_TARGET.remediationBranch &&
      snapshot.pullRequest.title === binding.pullRequestTitle &&
      snapshot.pullRequest.body === binding.pullRequestBody;
    if (!branchHasCandidate || !pullRequestMatches) {
      return {
        status: 'WRITE_CONFLICT',
        reason: 'Existing branch or PR differs from the eligible proposal.',
      };
    }
    return {
      status: 'PR_REUSED',
      remoteCommitSha: snapshot.branch.commitSha,
      prNumber: snapshot.pullRequest.number,
      prUrl: snapshot.pullRequest.url,
    };
  }

  if (branchHasCandidate) return { status: 'WRITE_REQUIRED', step: 'CREATE_PR' };
  if (
    snapshot.branch.commitSha === snapshot.base.commitSha &&
    snapshot.branch.targetFileGitBlobSha === SUSPECT_CANDIDATE_GIT_BLOB_SHA
  ) {
    return { status: 'WRITE_REQUIRED', step: 'UPDATE_FILE' };
  }
  return {
    status: 'WRITE_CONFLICT',
    reason: 'Deterministic branch contains work that does not match the eligible proposal.',
  };
}

export function decideWrite(proposal: EligibleProposal, snapshot: RemoteSnapshot): RemoteDecision {
  const bindingResult = bindEligibleProposal(proposal);
  if (bindingResult.status === 'WRITE_CONFLICT') return bindingResult;
  return evaluateRemoteSnapshot(bindingResult.binding, snapshot);
}
