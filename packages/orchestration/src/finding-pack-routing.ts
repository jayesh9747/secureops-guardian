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
  if (plan.mode !== 'ANALYSIS_ONLY') {
    throw new Error('Finding-pack analysis routing accepts only ANALYSIS_ONLY requests.');
  }
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
    requested_capability: 'ANALYSIS_ONLY',
    changed_files: allEvidenceMatchesScope && targetResolved ? scopedFiles : [],
  });

  return {
    request: { mode: plan.mode, scope: plan.scope },
    capability_ceiling: plan.capability_ceiling,
    analysis,
  };
}
