import {
  FINDING_PACK_REGISTRY,
  type FindingPackChangedFileEvidence,
} from '@guardian/investigation';
import {
  buildGuardianInvestigationRail,
  renderGuardianIncidentBriefMarkdown,
  renderGuardianIncidentBriefResponse,
  type GuardianInvestigationRailInput,
} from '@guardian/presentation';

import {
  buildFindingPackIncidentBrief,
  buildFindingPackInconclusiveIncidentBrief,
} from './incident-brief.js';
import { buildIncidentBriefArtifacts } from './incident-brief-artifacts.js';
import { planGuardianRun } from './plan.js';

export function routeFindingPackAnalysis(
  input: unknown,
  changedFiles: readonly FindingPackChangedFileEvidence[],
  investigationRail?: GuardianInvestigationRailInput,
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
  const incidentBrief = (() => {
    if (analysis.outcome === 'INCONCLUSIVE') {
      return buildFindingPackInconclusiveIncidentBrief({
        request: { mode: plan.mode, scope: plan.scope },
        analysis,
      });
    }
    if (analysis.capability === 'ANALYSIS_ONLY') {
      return buildFindingPackIncidentBrief({
        request: { mode: plan.mode, scope: plan.scope },
        analysis,
      });
    }
    return null;
  })();
  const artifacts =
    incidentBrief === null
      ? null
      : buildIncidentBriefArtifacts({
          brief: incidentBrief,
          receipt: incidentBrief.disclosures.run_receipt,
          proposal: null,
        });

  return {
    request: { mode: plan.mode, scope: plan.scope },
    capability_ceiling: effectiveCapabilityCeiling,
    analysis,
    incident_brief: incidentBrief,
    investigation_rail:
      investigationRail === undefined ? null : buildGuardianInvestigationRail(investigationRail),
    artifacts,
    openui: incidentBrief === null ? null : renderGuardianIncidentBriefResponse(incidentBrief),
    markdown: incidentBrief === null ? null : renderGuardianIncidentBriefMarkdown(incidentBrief),
  };
}
