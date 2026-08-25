import {
  bindEligibleProposal,
  evaluateRemoteSnapshot,
  type RemoteDecision,
  type RemoteSnapshot,
} from '@guardian/github-write';
import type { EligibleProposal } from '@guardian/policy-verifier';
import { ZodError } from 'zod';
import {
  DEMO_REPOSITORY,
  LAST_GOOD_COMMIT_SHA,
  SUSPECT_COMMIT_SHA,
  TARGET_NETWORK_POLICY_FILE,
} from '@guardian/shared';

import { repositoryScopeSchema, type RepositoryScope } from './scope.js';

function exactSupportedScope(scope: RepositoryScope): boolean {
  const revisionMatches =
    scope.suspect.kind === 'commit'
      ? scope.suspect.commit_sha === SUSPECT_COMMIT_SHA
      : scope.suspect.base_sha === LAST_GOOD_COMMIT_SHA &&
        scope.suspect.head_sha === SUSPECT_COMMIT_SHA;
  return (
    scope.repository === DEMO_REPOSITORY &&
    scope.base_branch === 'main' &&
    (scope.target_file === undefined || scope.target_file === TARGET_NETWORK_POLICY_FILE) &&
    revisionMatches
  );
}

export function evaluateOpenPrArtifacts(input: {
  scope: unknown;
  proposal: EligibleProposal;
  remote_snapshot: RemoteSnapshot;
}): RemoteDecision {
  const scope = repositoryScopeSchema.parse(input.scope);
  if (!exactSupportedScope(scope)) {
    return { status: 'WRITE_CONFLICT', reason: 'OPEN_PR scope is outside the exact allowlist.' };
  }
  const binding = bindEligibleProposal(input.proposal);
  if (binding.status === 'WRITE_CONFLICT') return binding;
  try {
    return evaluateRemoteSnapshot(binding.binding, input.remote_snapshot);
  } catch (error) {
    if (error instanceof ZodError) {
      return { status: 'WRITE_CONFLICT', reason: 'Remote snapshot failed typed validation.' };
    }
    throw error;
  }
}
