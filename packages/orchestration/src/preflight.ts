import {
  DEMO_REPOSITORY,
  LAST_GOOD_COMMIT_SHA,
  SUSPECT_COMMIT_SHA,
  TARGET_NETWORK_POLICY_FILE,
  fullGitShaSchema,
} from '@guardian/shared';
import { z } from 'zod';

import type { GuardianRunPlan } from './plan.js';
import { repositorySchema } from './scope.js';

export const REMEDIATION_REPOSITORY_ALLOWLIST = [DEMO_REPOSITORY] as const;

const observedSuspectSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('commit'),
      commit_sha: fullGitShaSchema,
      parent_sha: fullGitShaSchema.nullable(),
    })
    .strict(),
  z
    .object({
      kind: z.literal('comparison'),
      base_sha: fullGitShaSchema,
      head_sha: fullGitShaSchema,
    })
    .strict(),
]);

export const preflightObservationSchema = z
  .object({
    repository: repositorySchema,
    base_branch: z.string().min(1),
    suspect: observedSuspectSchema,
    resolved_target_file: z.string().min(1).nullable(),
    target_kind: z.enum(['KUBERNETES_NETWORK_POLICY', 'OTHER', 'MISSING']),
    verifier_subset: z.enum(['SUPPORTED', 'UNSUPPORTED', 'UNKNOWN']),
    incident_evidence: z.enum(['AVAILABLE', 'MISSING', 'CONFLICTING']),
    conflicts: z.array(z.string().min(1)),
    untrusted_repository_text: z.string().optional(),
  })
  .strict();

const UNKNOWN_RUNTIME_CLAIMS = {
  deployment: 'Unknown',
  runtime_exposure: 'Unknown',
  data_access: 'Unknown',
  exfiltration: 'Unknown',
  live_cluster_behavior: 'Unknown',
} as const;

function suspectMatchesScope(
  plan: GuardianRunPlan,
  suspect: z.infer<typeof observedSuspectSchema>,
): boolean {
  const expected = plan.scope.suspect;
  if (expected.kind !== suspect.kind) return false;
  if (expected.kind === 'commit' && suspect.kind === 'commit') {
    return expected.commit_sha === suspect.commit_sha;
  }
  if (expected.kind === 'comparison' && suspect.kind === 'comparison') {
    return expected.base_sha === suspect.base_sha && expected.head_sha === suspect.head_sha;
  }
  return false;
}

function fixtureRevisionMatches(suspect: z.infer<typeof observedSuspectSchema>): boolean {
  return suspect.kind === 'commit'
    ? suspect.commit_sha === SUSPECT_COMMIT_SHA && suspect.parent_sha === LAST_GOOD_COMMIT_SHA
    : suspect.base_sha === LAST_GOOD_COMMIT_SHA && suspect.head_sha === SUSPECT_COMMIT_SHA;
}

export function evaluatePreflight(plan: GuardianRunPlan, input: unknown) {
  const observation = preflightObservationSchema.parse(input);
  const requirements: string[] = [];

  if (observation.repository !== plan.scope.repository) {
    requirements.push('Observed repository does not match the requested scope.');
  }
  if (observation.base_branch !== plan.scope.base_branch) {
    requirements.push('Observed base branch does not match the requested scope.');
  }
  if (!suspectMatchesScope(plan, observation.suspect)) {
    requirements.push('Observed suspect revision does not match the requested scope.');
  }
  if (
    plan.scope.target_file !== undefined &&
    observation.resolved_target_file !== plan.scope.target_file
  ) {
    requirements.push('Observed target file does not match the requested scope.');
  }
  requirements.push(...observation.conflicts);

  if (plan.mode !== 'ANALYSIS_ONLY') {
    const repositorySupported = REMEDIATION_REPOSITORY_ALLOWLIST.includes(
      observation.repository as (typeof REMEDIATION_REPOSITORY_ALLOWLIST)[number],
    );
    if (!repositorySupported) {
      requirements.push(`Remediation is not supported for repository ${observation.repository}.`);
    }
    if (observation.base_branch !== 'main') {
      requirements.push('The supported remediation base branch is main.');
    }
    if (!fixtureRevisionMatches(observation.suspect)) {
      requirements.push('The revision is not the documented supported NetworkPolicy fixture.');
    }
    if (observation.resolved_target_file !== TARGET_NETWORK_POLICY_FILE) {
      requirements.push(`The supported remediation target is ${TARGET_NETWORK_POLICY_FILE}.`);
    }
    if (
      observation.target_kind !== 'KUBERNETES_NETWORK_POLICY' ||
      observation.verifier_subset !== 'SUPPORTED'
    ) {
      requirements.push(
        'The target is missing or outside the documented Kubernetes NetworkPolicy verifier subset.',
      );
    }
    if (observation.incident_evidence !== 'AVAILABLE') {
      requirements.push('Complete, non-conflicting incident evidence is required for remediation.');
    }
  }

  if (requirements.length > 0) {
    return {
      outcome: 'INCONCLUSIVE' as const,
      missing_or_unsupported_requirements: [...new Set(requirements)],
      sandbox_permitted: false,
      proposal_permitted: false,
      approval_permitted: false,
      github_writes_permitted: [] as string[],
      runtime_claims: UNKNOWN_RUNTIME_CLAIMS,
    };
  }

  const outcome = {
    ANALYSIS_ONLY: 'ANALYSIS_READY' as const,
    PREPARE_REMEDIATION: 'REMEDIATION_PREPARATION_READY' as const,
    OPEN_PR: 'OPEN_PR_READY' as const,
  }[plan.mode];

  return {
    outcome,
    sandbox_permitted: plan.capability_ceiling.daytona_sandbox,
    proposal_permitted: plan.capability_ceiling.proposal_creation,
    approval_permitted: plan.capability_ceiling.approval_request,
    github_writes_permitted: [...plan.capability_ceiling.github_writes],
    missing_or_unsupported_requirements: [] as string[],
    runtime_claims: UNKNOWN_RUNTIME_CLAIMS,
  };
}

export type PreflightObservation = z.infer<typeof preflightObservationSchema>;
export type PreflightEvaluation = ReturnType<typeof evaluatePreflight>;
