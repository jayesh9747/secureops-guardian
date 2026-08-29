import {
  buildPhaseSixControllingArtifacts,
  buildPhaseSixPresentationMatrix,
} from '@guardian/presentation';
import { runPhaseFiveScenario } from '@guardian/reliability';
import {
  DEMO_REPOSITORY,
  SUSPECT_COMMIT_SHA,
  TARGET_NETWORK_POLICY_FILE,
  VERIFIER_PACK_IDENTITY,
} from '@guardian/shared';

import { buildIncidentBriefArtifacts } from './incident-brief-artifacts.js';
import { buildGuardianIncidentBrief } from './incident-brief.js';
import { buildGuardianRunReceipt } from './receipt.js';

export function buildPhaseElevenIncidentBriefMatrix() {
  const request = {
    mode: 'OPEN_PR' as const,
    scope: {
      schema_version: 1 as const,
      repository: DEMO_REPOSITORY,
      base_branch: 'main',
      suspect: { kind: 'commit' as const, commit_sha: SUSPECT_COMMIT_SHA },
      target_file: TARGET_NETWORK_POLICY_FILE,
    },
  };
  const { proposal, createdReceipt } = buildPhaseSixControllingArtifacts();
  const records = {
    denied: runPhaseFiveScenario('denied-first-write'),
    'pr-reused': runPhaseFiveScenario('existing-pr-reuse'),
    'write-conflict': runPhaseFiveScenario('mismatched-remote-branch-content'),
  } as const;
  return buildPhaseSixPresentationMatrix().map(({ scenario, presentation }) => {
    const hasProposal =
      scenario !== 'missing-deployment-inconclusive' &&
      scenario !== 'missing-reachability-inconclusive' &&
      scenario !== 'conflicting-revision-inconclusive' &&
      scenario !== 'no-safe-remediation';
    const scenarioProposal = hasProposal ? proposal : null;
    const actionReceipt = (() => {
      if (scenario === 'pr-created') return createdReceipt;
      if (scenario === 'denied' || scenario === 'pr-reused' || scenario === 'write-conflict') {
        return records[scenario].action_receipt;
      }
      return null;
    })();
    const inconclusive = presentation.terminal_status === 'INCONCLUSIVE';
    const noSafe = presentation.terminal_status === 'NO_SAFE_REMEDIATION';
    const ready = presentation.terminal_status === 'SECURITY_REMEDIATION_READY';
    const githubAction = (() => {
      if (ready) return 'NOT_PERMITTED' as const;
      if (inconclusive || noSafe) return 'NOT_REACHED' as const;
      switch (presentation.terminal_status) {
        case 'DENIED':
        case 'PR_CREATED':
        case 'PR_REUSED':
        case 'WRITE_CONFLICT':
          return presentation.terminal_status;
        default:
          throw new Error(`Unsupported Phase 11 GitHub action: ${presentation.terminal_status}.`);
      }
    })();
    const evidenceIds = [
      ...presentation.evidence.official_github_mcp,
      ...presentation.evidence.incident_fixture_mcp,
      ...presentation.evidence.deterministic_rule,
    ];
    const receipt = buildGuardianRunReceipt({
      schema_version: 1,
      execution_basis: 'DETERMINISTIC_INTEGRATION',
      mode: ready ? 'PREPARE_REMEDIATION' : 'OPEN_PR',
      terminal_status: presentation.terminal_status,
      scope: request.scope,
      stages: {
        scope_preflight: inconclusive ? 'INCONCLUSIVE' : 'COMPLETED',
        github_investigation: 'COMPLETED',
        incident_evidence_join: inconclusive ? 'MISSING' : 'COMPLETED',
        deterministic_rule: inconclusive ? 'NOT_RUN' : 'COMPLETED',
        daytona_proof: inconclusive ? 'NOT_RUN' : 'COMPLETED',
        proposal: scenarioProposal === null ? 'ABSENT' : 'CREATED',
        github_action: githubAction,
        presentation: 'OPENUI_WITH_MARKDOWN_FALLBACK',
      },
      evidence_ids: evidenceIds,
      tool_event_references: evidenceIds.map((id) => `deterministic:phase11:${id}`),
      approval_event_references:
        actionReceipt?.status === 'DENIED'
          ? [...actionReceipt.denied_tool_call_references]
          : actionReceipt?.status === 'PR_CREATED'
            ? [...actionReceipt.approved_tool_call_references]
            : [],
      missing_or_unsupported_requirements: inconclusive
        ? ['Required incident evidence is incomplete or conflicting.']
        : [],
      proposal_id: scenarioProposal?.proposal_id ?? null,
      proposal_hash_sha256: scenarioProposal?.proposal_hash_sha256 ?? null,
      finding_pack: {
        pack_id: VERIFIER_PACK_IDENTITY.pack_id,
        pack_version: VERIFIER_PACK_IDENTITY.pack_version,
        capability: 'OPEN_PR_ELIGIBLE',
      },
      verifier_pack: scenarioProposal?.verifier_pack ?? null,
      verifier_pack_binding_sha256: scenarioProposal?.verifier_pack_binding_sha256 ?? null,
      action_receipt: actionReceipt,
      runtime_claims: {
        deployment: inconclusive ? 'Unknown' : 'SupportedByOwnedSyntheticEvidence',
        runtime_exposure: inconclusive ? 'Unknown' : 'SupportedByOwnedSyntheticEvidence',
        data_access: 'Unknown',
        exfiltration: 'Unknown',
        live_cluster_behavior: 'Unknown',
      },
      limitations: presentation.limitations,
      guardian_did_not_merge_deploy_or_access_cluster: true,
    });
    const effectiveRequest = {
      ...request,
      mode: ready ? ('PREPARE_REMEDIATION' as const) : request.mode,
    };
    const brief = buildGuardianIncidentBrief({
      request: effectiveRequest,
      receipt,
      presentation,
      proposal: scenarioProposal,
    });
    return {
      scenario,
      receipt,
      brief,
      artifacts: buildIncidentBriefArtifacts({ brief, receipt, proposal: scenarioProposal }),
    };
  });
}
