import {
  PHASE_FOUR_TARGET,
  PHASE_THREE_PROPOSAL_HASH,
  SUSPECT_CANDIDATE_GIT_BLOB_SHA,
  VERIFIED_CANDIDATE_GIT_BLOB_SHA,
  bindEligibleProposal,
  type RemoteSnapshot,
} from '@guardian/github-write';
import {
  buildPhaseSixControllingArtifacts,
  buildGuardianInvestigationRail,
  buildReadyPresentation,
  buildRunRecordPresentation,
  renderGuardianIncidentBriefResponse,
  type GuardianPresentation,
} from '@guardian/presentation';
import {
  buildDeterministicChangeResult,
  buildDeterministicExposureResult,
  runPhaseFiveScenario,
} from '@guardian/reliability';
import {
  DEMO_CASE_ID,
  DEMO_REPOSITORY,
  LAST_GOOD_COMMIT_SHA,
  SUSPECT_COMMIT_SHA,
  TARGET_NETWORK_POLICY_FILE,
} from '@guardian/shared';
import { z } from 'zod';

import { buildIncidentBriefArtifacts } from './incident-brief-artifacts.js';
import { buildGuardianIncidentBrief } from './incident-brief.js';

import {
  evaluatePreflight,
  preflightObservationSchema,
  type PreflightEvaluation,
} from './preflight.js';
import { planGuardianRun } from './plan.js';
import { evaluateOpenPrArtifacts } from './open-pr.js';
import {
  buildGuardianRunReceipt,
  githubReadToolEventReferenceSchema,
  type GuardianRunReceipt,
} from './receipt.js';
import type { GuardianRequest } from './scope.js';

const githubAnalysisEvidenceSchema = z
  .object({
    evidence_ids: z.array(z.string().startsWith('evidence:github:')),
    tool_event_references: z.array(githubReadToolEventReferenceSchema),
    limitations: z.array(z.string().min(1)).min(1),
  })
  .strict();

const journeyContextSchema = z
  .object({
    preflight_observation: preflightObservationSchema,
    github_analysis: githubAnalysisEvidenceSchema,
    investigation_rail: z.unknown().optional(),
    remote_snapshot: z.unknown().optional(),
  })
  .strict();

export type GuardianJourneyContext = z.input<typeof journeyContextSchema>;

function buildCurrentFixtureArtifacts() {
  const { finding, proposal } = buildPhaseSixControllingArtifacts();
  if (finding.outcome !== 'SUPPORTED_SECURITY_FINDING') {
    throw new Error('The current fixture did not reproduce the supported finding.');
  }
  if (proposal.proposal_hash_sha256 !== PHASE_THREE_PROPOSAL_HASH) {
    throw new Error('The current fixture did not reproduce the exact eligible proposal.');
  }
  const change = buildDeterministicChangeResult();
  const exposure = buildDeterministicExposureResult(DEMO_CASE_ID);
  const evidenceIds = [
    ...change.evidence_records.map((record) => record.evidence_id),
    exposure.alert.evidence_id,
    exposure.deployment.evidence_id,
    ...exposure.reachability_observations.map((item) => item.evidence_id),
    ...exposure.service_dependencies.map((item) => item.evidence_id),
  ];
  const toolEventReferences = [
    ...change.evidence_records.map(
      (record) => `deterministic:tool:${record.tool}:${record.evidence_id}`,
    ),
    `deterministic:tool:get_security_alert:${exposure.alert.evidence_id}`,
    `deterministic:tool:get_deployment:${exposure.deployment.evidence_id}`,
    `deterministic:tool:get_reachability_observations:${exposure.case_id}`,
    `deterministic:tool:get_service_dependencies:${exposure.case_id}`,
  ];
  return { finding, proposal, evidenceIds, toolEventReferences };
}

function exactFixtureRemoteSnapshot(): RemoteSnapshot {
  const { proposal } = buildPhaseSixControllingArtifacts();
  const binding = bindEligibleProposal(proposal);
  if (binding.status !== 'BOUND') {
    throw new Error(binding.reason);
  }
  return {
    base: {
      commitSha: SUSPECT_COMMIT_SHA,
      targetFileGitBlobSha: SUSPECT_CANDIDATE_GIT_BLOB_SHA,
    },
    branch: {
      commitSha: '44fb8c7f5e99f835c6779f5e7b777c1b016af5b3',
      targetFileGitBlobSha: VERIFIED_CANDIDATE_GIT_BLOB_SHA,
      commitMessage: binding.binding.commitMessage,
    },
    pullRequest: {
      number: 1,
      url: 'https://github.com/jayesh9747/guardian-demo-checkout/pull/1',
      title: binding.binding.pullRequestTitle,
      base: PHASE_FOUR_TARGET.baseBranch,
      head: PHASE_FOUR_TARGET.remediationBranch,
      body: binding.binding.pullRequestBody,
    },
  };
}

function presentJourneyResult(input: {
  request: GuardianRequest;
  receipt: GuardianRunReceipt;
  presentation: GuardianPresentation | null;
  proposal: ReturnType<typeof buildPhaseSixControllingArtifacts>['proposal'] | null;
  investigation_rail?: unknown;
}) {
  const incidentBrief = buildGuardianIncidentBrief(input);
  const artifacts = buildIncidentBriefArtifacts({
    brief: incidentBrief,
    receipt: input.receipt,
    proposal: input.proposal,
  });
  return {
    receipt: input.receipt,
    presentation: input.presentation,
    incident_brief: incidentBrief,
    investigation_rail:
      input.investigation_rail === undefined
        ? null
        : buildGuardianInvestigationRail(input.investigation_rail),
    artifacts,
    openui: renderGuardianIncidentBriefResponse(incidentBrief),
    markdown: artifacts.markdown.content,
  };
}

export function buildCurrentFixtureJourneyContext(input: unknown): GuardianJourneyContext {
  const plan = planGuardianRun(input);
  if (plan.scope.repository !== DEMO_REPOSITORY) {
    throw new Error('Current-fixture context is only valid for the owned demo repository.');
  }
  const observedSuspect =
    plan.scope.suspect.kind === 'commit'
      ? {
          kind: 'commit' as const,
          commit_sha: plan.scope.suspect.commit_sha,
          parent_sha:
            plan.scope.suspect.commit_sha === SUSPECT_COMMIT_SHA ? LAST_GOOD_COMMIT_SHA : null,
        }
      : {
          kind: 'comparison' as const,
          base_sha: plan.scope.suspect.base_sha,
          head_sha: plan.scope.suspect.head_sha,
        };
  const resolvedTargetFile =
    plan.scope.target_file ??
    (plan.scope.suspect.kind === 'commit' && plan.scope.suspect.commit_sha === SUSPECT_COMMIT_SHA
      ? TARGET_NETWORK_POLICY_FILE
      : plan.scope.suspect.kind === 'comparison' &&
          plan.scope.suspect.base_sha === LAST_GOOD_COMMIT_SHA &&
          plan.scope.suspect.head_sha === SUSPECT_COMMIT_SHA
        ? TARGET_NETWORK_POLICY_FILE
        : null);
  const targetIsSupported = resolvedTargetFile === TARGET_NETWORK_POLICY_FILE;
  const change = buildDeterministicChangeResult();
  return {
    preflight_observation: {
      repository: plan.scope.repository,
      base_branch: plan.scope.base_branch,
      suspect: observedSuspect,
      resolved_target_file: resolvedTargetFile,
      target_kind: targetIsSupported ? 'KUBERNETES_NETWORK_POLICY' : 'MISSING',
      verifier_subset: targetIsSupported ? 'SUPPORTED' : 'UNKNOWN',
      incident_evidence: plan.mode === 'ANALYSIS_ONLY' ? 'MISSING' : 'AVAILABLE',
      conflicts: [],
    },
    github_analysis: {
      evidence_ids: change.evidence_records.map((record) => record.evidence_id),
      tool_event_references: change.evidence_records.map(
        (record) => `deterministic:tool:${record.tool}:${record.evidence_id}`,
      ),
      limitations: change.limitations,
    },
    remote_snapshot: plan.mode === 'OPEN_PR' ? exactFixtureRemoteSnapshot() : undefined,
  };
}

function buildInconclusiveResult(options: {
  plan: ReturnType<typeof planGuardianRun>;
  preflight: Extract<PreflightEvaluation, { outcome: 'INCONCLUSIVE' }>;
  context: z.output<typeof journeyContextSchema>;
  additionalRequirements?: string[];
}) {
  const requirements = [
    ...options.preflight.missing_or_unsupported_requirements,
    ...(options.additionalRequirements ?? []),
  ];
  const isAnalysisOnly = options.plan.mode === 'ANALYSIS_ONLY';
  const receipt = buildGuardianRunReceipt({
    schema_version: 1,
    execution_basis: 'DETERMINISTIC_INTEGRATION',
    mode: options.plan.mode,
    terminal_status: 'INCONCLUSIVE',
    scope: options.plan.scope,
    stages: {
      scope_preflight: 'INCONCLUSIVE',
      github_investigation: 'COMPLETED',
      incident_evidence_join: isAnalysisOnly
        ? 'NOT_RUN'
        : options.context.preflight_observation.incident_evidence === 'AVAILABLE'
          ? 'COMPLETED'
          : 'MISSING',
      deterministic_rule: 'NOT_RUN',
      daytona_proof: isAnalysisOnly ? 'NOT_PERMITTED' : 'NOT_RUN',
      proposal: 'ABSENT',
      github_action: 'NOT_REACHED',
      presentation: 'OPENUI_WITH_MARKDOWN_FALLBACK',
    },
    evidence_ids: options.context.github_analysis.evidence_ids,
    tool_event_references: options.context.github_analysis.tool_event_references,
    approval_event_references: [],
    missing_or_unsupported_requirements: requirements,
    proposal_id: null,
    proposal_hash_sha256: null,
    finding_pack:
      options.context.preflight_observation.resolved_target_file === TARGET_NETWORK_POLICY_FILE
        ? {
            pack_id: 'k8s-network-egress-v1',
            pack_version: '1.0.4',
            capability: 'OPEN_PR_ELIGIBLE',
          }
        : {
            pack_id: 'no-matching-pack',
            pack_version: 'not-applicable',
            capability: 'ANALYSIS_ONLY',
          },
    verifier_pack: null,
    verifier_pack_binding_sha256: null,
    action_receipt: null,
    runtime_claims: options.preflight.runtime_claims,
    limitations: [
      ...options.context.github_analysis.limitations,
      'Preflight failed closed before sandbox, proposal, approval, or GitHub action.',
    ],
    guardian_did_not_merge_deploy_or_access_cluster: true,
  });
  return presentJourneyResult({
    request: { mode: options.plan.mode, scope: options.plan.scope },
    receipt,
    presentation: null,
    proposal: null,
    investigation_rail: options.context.investigation_rail,
  });
}

function stopReadyPreflight(
  preflight: Exclude<PreflightEvaluation, { outcome: 'INCONCLUSIVE' }>,
): Extract<PreflightEvaluation, { outcome: 'INCONCLUSIVE' }> {
  return {
    ...preflight,
    outcome: 'INCONCLUSIVE',
    missing_or_unsupported_requirements: [],
    sandbox_permitted: false,
    proposal_permitted: false,
    approval_permitted: false,
    github_writes_permitted: [],
    verifier_pack: null,
  };
}

export function runCurrentFixtureJourney(input: unknown, untrustedContext: GuardianJourneyContext) {
  const plan = planGuardianRun(input);
  const context = journeyContextSchema.parse(untrustedContext);
  const preflight = evaluatePreflight(plan, context.preflight_observation);
  if (preflight.outcome === 'INCONCLUSIVE') {
    return buildInconclusiveResult({ plan, preflight, context });
  }

  if (preflight.outcome === 'ANALYSIS_READY') {
    if (
      preflight.sandbox_permitted ||
      preflight.proposal_permitted ||
      preflight.approval_permitted ||
      preflight.github_writes_permitted.length > 0
    ) {
      throw new Error('ANALYSIS_READY contradicts the plan capability ceiling.');
    }
    const receipt = buildGuardianRunReceipt({
      schema_version: 1,
      execution_basis: 'DETERMINISTIC_INTEGRATION',
      mode: plan.mode,
      terminal_status: 'ANALYSIS_COMPLETE',
      scope: plan.scope,
      stages: {
        scope_preflight: 'COMPLETED',
        github_investigation: 'COMPLETED',
        incident_evidence_join: 'NOT_RUN',
        deterministic_rule: 'COMPLETED',
        daytona_proof: 'NOT_PERMITTED',
        proposal: 'ABSENT',
        github_action: 'NOT_PERMITTED',
        presentation: 'OPENUI_WITH_MARKDOWN_FALLBACK',
      },
      evidence_ids: context.github_analysis.evidence_ids,
      tool_event_references: context.github_analysis.tool_event_references,
      approval_event_references: [],
      missing_or_unsupported_requirements: [],
      proposal_id: null,
      proposal_hash_sha256: null,
      finding_pack:
        context.preflight_observation.resolved_target_file === TARGET_NETWORK_POLICY_FILE
          ? {
              pack_id: 'k8s-network-egress-v1',
              pack_version: '1.0.4',
              capability: 'OPEN_PR_ELIGIBLE',
            }
          : {
              pack_id: 'no-matching-pack',
              pack_version: 'not-applicable',
              capability: 'ANALYSIS_ONLY',
            },
      verifier_pack: null,
      verifier_pack_binding_sha256: null,
      action_receipt: null,
      runtime_claims: preflight.runtime_claims,
      limitations: [
        ...context.github_analysis.limitations,
        'ANALYSIS_ONLY permits official GitHub reads only.',
      ],
      guardian_did_not_merge_deploy_or_access_cluster: true,
    });
    return presentJourneyResult({
      request: { mode: plan.mode, scope: plan.scope },
      receipt,
      presentation: null,
      proposal: null,
      investigation_rail: context.investigation_rail,
    });
  }

  if (!preflight.sandbox_permitted || !preflight.proposal_permitted) {
    throw new Error('Remediation readiness contradicts the plan capability ceiling.');
  }

  const { finding, proposal, evidenceIds, toolEventReferences } = buildCurrentFixtureArtifacts();
  const sharedReceipt = {
    schema_version: 1 as const,
    execution_basis: 'DETERMINISTIC_INTEGRATION' as const,
    mode: plan.mode,
    scope: plan.scope,
    evidence_ids: evidenceIds,
    tool_event_references: toolEventReferences,
    approval_event_references: [] as string[],
    missing_or_unsupported_requirements: [] as string[],
    proposal_id: proposal.proposal_id,
    verifier_pack: proposal.verifier_pack,
    finding_pack: {
      pack_id: proposal.verifier_pack.pack_id,
      pack_version: proposal.verifier_pack.pack_version,
      capability: 'OPEN_PR_ELIGIBLE' as const,
    },
    verifier_pack_binding_sha256: proposal.verifier_pack_binding_sha256,
    runtime_claims: {
      deployment: 'SupportedByOwnedSyntheticEvidence' as const,
      runtime_exposure: 'SupportedByOwnedSyntheticEvidence' as const,
      data_access: 'Unknown' as const,
      exfiltration: 'Unknown' as const,
      live_cluster_behavior: 'Unknown' as const,
    },
    guardian_did_not_merge_deploy_or_access_cluster: true as const,
  };

  if (preflight.outcome === 'REMEDIATION_PREPARATION_READY') {
    if (preflight.approval_permitted || preflight.github_writes_permitted.length > 0) {
      throw new Error('PREPARE_REMEDIATION contradicts the plan capability ceiling.');
    }
    const receipt = buildGuardianRunReceipt({
      ...sharedReceipt,
      terminal_status: 'SECURITY_REMEDIATION_READY',
      stages: {
        scope_preflight: 'COMPLETED',
        github_investigation: 'COMPLETED',
        incident_evidence_join: 'COMPLETED',
        deterministic_rule: 'COMPLETED',
        daytona_proof: 'COMPLETED',
        proposal: 'CREATED',
        github_action: 'NOT_PERMITTED',
        presentation: 'OPENUI_WITH_MARKDOWN_FALLBACK',
      },
      proposal_hash_sha256: proposal.proposal_hash_sha256,
      action_receipt: null,
      limitations: [
        ...proposal.limitations,
        'PREPARE_REMEDIATION produces a proposal but cannot request approval or write to GitHub.',
      ],
    });
    const presentation = buildReadyPresentation({ finding, proposal });
    return presentJourneyResult({
      request: { mode: plan.mode, scope: plan.scope },
      receipt,
      presentation,
      proposal,
      investigation_rail: context.investigation_rail,
    });
  }

  if (
    !preflight.approval_permitted ||
    preflight.github_writes_permitted.length !== plan.capability_ceiling.github_writes.length
  ) {
    throw new Error('OPEN_PR_READY contradicts the plan capability ceiling.');
  }
  if (context.remote_snapshot === undefined) {
    return buildInconclusiveResult({
      plan,
      preflight: stopReadyPreflight(preflight),
      context,
      additionalRequirements: ['A validated remote snapshot is required before OPEN_PR action.'],
    });
  }
  const remoteSnapshot = context.remote_snapshot as RemoteSnapshot;
  const artifactDecision = evaluateOpenPrArtifacts({
    scope: plan.scope,
    proposal,
    remote_snapshot: remoteSnapshot,
  });
  if (artifactDecision.status === 'WRITE_REQUIRED') {
    return buildInconclusiveResult({
      plan,
      preflight: stopReadyPreflight(preflight),
      context,
      additionalRequirements: [
        `The deterministic integration journey stopped before live approval step ${artifactDecision.step}.`,
      ],
    });
  }
  const scenario =
    artifactDecision.status === 'PR_REUSED'
      ? ('existing-pr-reuse' as const)
      : ('mismatched-remote-branch-content' as const);
  const record = runPhaseFiveScenario(scenario, { remoteSnapshot });
  if (record.actual_terminal_status !== artifactDecision.status || record.action_receipt === null) {
    throw new Error('The retained Phase 5 result disagrees with the OPEN_PR artifact gate.');
  }
  const presentation = buildRunRecordPresentation({ record, finding, proposal });
  const receipt = buildGuardianRunReceipt({
    ...sharedReceipt,
    terminal_status: artifactDecision.status,
    stages: {
      scope_preflight: 'COMPLETED',
      github_investigation: 'COMPLETED',
      incident_evidence_join: 'COMPLETED',
      deterministic_rule: 'COMPLETED',
      daytona_proof: 'COMPLETED',
      proposal: 'CREATED',
      github_action: artifactDecision.status,
      presentation: 'OPENUI_WITH_MARKDOWN_FALLBACK',
    },
    evidence_ids: record.evidence_ids,
    tool_event_references: record.tool_event_references,
    approval_event_references: record.approval_event_references,
    proposal_hash_sha256: proposal.proposal_hash_sha256,
    action_receipt: record.action_receipt,
    limitations: [
      ...presentation.limitations,
      'This receipt is deterministic integration evidence; a live TrueForge receipt must identify its session separately.',
    ],
  });
  return presentJourneyResult({
    request: { mode: plan.mode, scope: plan.scope },
    receipt,
    presentation,
    proposal,
    investigation_rail: context.investigation_rail,
  });
}
