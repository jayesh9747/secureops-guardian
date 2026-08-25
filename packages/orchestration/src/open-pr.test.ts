import {
  PHASE_FOUR_TARGET,
  SUSPECT_CANDIDATE_GIT_BLOB_SHA,
  VERIFIED_CANDIDATE_GIT_BLOB_SHA,
  bindEligibleProposal,
  type RemoteSnapshot,
} from '@guardian/github-write';
import { buildPhaseSixControllingArtifacts } from '@guardian/presentation';
import { DEMO_REPOSITORY, SUSPECT_COMMIT_SHA, TARGET_NETWORK_POLICY_FILE } from '@guardian/shared';
import { describe, expect, it } from 'vitest';

import { evaluateOpenPrArtifacts } from './open-pr.js';

const scope = {
  schema_version: 1 as const,
  repository: DEMO_REPOSITORY,
  base_branch: 'main',
  suspect: { kind: 'commit' as const, commit_sha: SUSPECT_COMMIT_SHA },
  target_file: TARGET_NETWORK_POLICY_FILE,
};

const artifacts = buildPhaseSixControllingArtifacts();
const binding = (() => {
  const result = bindEligibleProposal(artifacts.proposal);
  if (result.status !== 'BOUND') throw new Error(result.reason);
  return result.binding;
})();

function exactRemoteSnapshot(): RemoteSnapshot {
  return {
    base: {
      commitSha: SUSPECT_COMMIT_SHA,
      targetFileGitBlobSha: SUSPECT_CANDIDATE_GIT_BLOB_SHA,
    },
    branch: {
      commitSha: '44fb8c7f5e99f835c6779f5e7b777c1b016af5b3',
      targetFileGitBlobSha: VERIFIED_CANDIDATE_GIT_BLOB_SHA,
      commitMessage: binding.commitMessage,
    },
    pullRequest: {
      number: 1,
      url: 'https://github.com/jayesh9747/guardian-demo-checkout/pull/1',
      title: binding.pullRequestTitle,
      base: PHASE_FOUR_TARGET.baseBranch,
      head: PHASE_FOUR_TARGET.remediationBranch,
      body: binding.pullRequestBody,
    },
  };
}

describe('unified OPEN_PR artifact gate', () => {
  it('fails closed for a wrong proposal', () => {
    const result = evaluateOpenPrArtifacts({
      scope,
      proposal: { ...artifacts.proposal, proposal_hash_sha256: '0'.repeat(64) },
      remote_snapshot: exactRemoteSnapshot(),
    });

    expect(result.status).toBe('WRITE_CONFLICT');
  });

  it('fails closed for mismatched remote content', () => {
    const remote = exactRemoteSnapshot();
    if (remote.branch === null) throw new Error('Expected exact remediation branch fixture.');
    remote.branch.targetFileGitBlobSha = 'f'.repeat(40);
    const result = evaluateOpenPrArtifacts({
      scope,
      proposal: artifacts.proposal,
      remote_snapshot: remote,
    });

    expect(result.status).toBe('WRITE_CONFLICT');
  });

  it('accepts the exact reusable PR when target_file is resolved from the proposal', () => {
    const result = evaluateOpenPrArtifacts({
      scope: { ...scope, target_file: undefined },
      proposal: artifacts.proposal,
      remote_snapshot: exactRemoteSnapshot(),
    });

    expect(result.status).toBe('PR_REUSED');
  });

  it('returns a typed conflict for malformed remote input but propagates programming errors', () => {
    expect(
      evaluateOpenPrArtifacts({
        scope,
        proposal: artifacts.proposal,
        remote_snapshot: {} as RemoteSnapshot,
      }),
    ).toEqual({ status: 'WRITE_CONFLICT', reason: 'Remote snapshot failed typed validation.' });

    const programmingError = new TypeError('remote probe exploded');
    const explosiveSnapshot = new Proxy(
      {},
      {
        get() {
          throw programmingError;
        },
      },
    ) as RemoteSnapshot;
    expect(() =>
      evaluateOpenPrArtifacts({
        scope,
        proposal: artifacts.proposal,
        remote_snapshot: explosiveSnapshot,
      }),
    ).toThrow(programmingError);
  });
});
