import {
  FINDING_PACK_REGISTRY,
  type FindingPackChangedFileEvidence,
} from '@guardian/investigation';

import { planGuardianRun } from './plan.js';

export function routeFindingPackAnalysis(
  input: unknown,
  changedFiles: readonly FindingPackChangedFileEvidence[],
) {
  const plan = planGuardianRun(input);
  const requestedCapability = {
    ANALYSIS_ONLY: 'ANALYSIS_ONLY',
    PREPARE_REMEDIATION: 'REMEDIATION_PROVEN',
    OPEN_PR: 'OPEN_PR_ELIGIBLE',
  } as const;
  const revision =
    plan.scope.suspect.kind === 'commit'
      ? plan.scope.suspect.commit_sha
      : plan.scope.suspect.head_sha;
  const scopedFiles = changedFiles.filter(
    (file) =>
      file.repository === plan.scope.repository &&
      file.revision === revision &&
      (plan.scope.target_file === undefined || file.file === plan.scope.target_file),
  );
  const allEvidenceMatchesScope =
    scopedFiles.length === changedFiles.length || plan.scope.target_file !== undefined;
  const targetResolved =
    plan.scope.target_file === undefined ||
    scopedFiles.some((file) => file.file === plan.scope.target_file);
  const analysis = FINDING_PACK_REGISTRY.analyze({
    requested_capability: requestedCapability[plan.mode],
    changed_files: allEvidenceMatchesScope && targetResolved ? scopedFiles : [],
  });
  const effectiveCapabilityCeiling =
    analysis.outcome === 'ANALYZED' && analysis.capability !== 'ANALYSIS_ONLY'
      ? plan.capability_ceiling
      : {
          incident_fixture_reads: false,
          daytona_sandbox: false,
          proposal_creation: false,
          approval_request: false,
          github_writes: [],
        };

  return {
    request: { mode: plan.mode, scope: plan.scope },
    capability_ceiling: effectiveCapabilityCeiling,
    analysis,
  };
}
