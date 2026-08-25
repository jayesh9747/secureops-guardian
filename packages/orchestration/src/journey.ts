import { PHASE_THREE_PROPOSAL_HASH, VERIFIED_CANDIDATE_YAML } from '@guardian/github-write';
import { synthesizeSecurityFinding } from '@guardian/investigation';
import {
  buildEligibleProposal,
  parsePolicyContract,
  verifyFourStates,
} from '@guardian/policy-verifier';
import {
  buildRunRecordPresentation,
  renderGuardianMarkdown,
  renderGuardianResponse,
} from '@guardian/presentation';
import {
  DENY_ALL_NETWORK_POLICY_YAML,
  POLICY_CONTRACT_JSON,
  SUSPECT_NETWORK_POLICY_YAML,
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

import { evaluatePreflight } from './preflight.js';
import { planGuardianRun } from './plan.js';
import { buildGuardianRunReceipt } from './receipt.js';

function buildCurrentFixtureFinding() {
  const change = buildDeterministicChangeResult();
  const exposure = buildDeterministicExposureResult(DEMO_CASE_ID);
  const finding = synthesizeSecurityFinding({
    change_result: change,
    exposure_result: exposure,
  });
  if (finding.outcome !== 'SUPPORTED_SECURITY_FINDING') {
    throw new Error('The current fixture did not reproduce the supported finding.');
  }
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
  return { finding, evidenceIds, toolEventReferences };
}

function buildCurrentFixtureProposal() {
  const contract = parsePolicyContract(POLICY_CONTRACT_JSON);
  const proof = verifyFourStates(
    {
      lastGoodYaml: VERIFIED_CANDIDATE_YAML,
      suspectYaml: SUSPECT_NETWORK_POLICY_YAML,
      denyAllYaml: DENY_ALL_NETWORK_POLICY_YAML,
      candidateYaml: VERIFIED_CANDIDATE_YAML,
    },
    contract,
  );
  const proposal = buildEligibleProposal({
    candidateYaml: VERIFIED_CANDIDATE_YAML,
    suspectYaml: SUSPECT_NETWORK_POLICY_YAML,
    proof,
  });
  if (proposal === undefined || proposal.proposal_hash_sha256 !== PHASE_THREE_PROPOSAL_HASH) {
    throw new Error('The current fixture did not reproduce the exact eligible proposal.');
  }
  return proposal;
}

export function runCurrentFixtureJourney(input: unknown) {
  const plan = planGuardianRun(input);
  const observedSuspect =
    plan.scope.suspect.kind === 'commit'
      ? {
          kind: 'commit' as const,
          commit_sha: SUSPECT_COMMIT_SHA,
          parent_sha: LAST_GOOD_COMMIT_SHA,
        }
      : {
          kind: 'comparison' as const,
          base_sha: LAST_GOOD_COMMIT_SHA,
          head_sha: SUSPECT_COMMIT_SHA,
        };
  const preflight = evaluatePreflight(plan, {
    repository: DEMO_REPOSITORY,
    base_branch: 'main',
    suspect: observedSuspect,
    resolved_target_file: TARGET_NETWORK_POLICY_FILE,
    target_kind: 'KUBERNETES_NETWORK_POLICY',
    verifier_subset: 'SUPPORTED',
    incident_evidence: 'AVAILABLE',
    conflicts: [],
  });
  if (preflight.outcome === 'INCONCLUSIVE') {
    throw new Error('The current-fixture journey requires an exact eligible scope.');
  }

  if (plan.mode === 'ANALYSIS_ONLY') {
    const change = buildDeterministicChangeResult();
    const evidenceIds = change.evidence_records.map((record) => record.evidence_id);
    const toolEventReferences = change.evidence_records.map(
      (record) => `deterministic:tool:${record.tool}:${record.evidence_id}`,
    );
    const markdown = `## SecureOps Guardian — GitHub-only analysis

- Terminal status: \`ANALYSIS_COMPLETE\`
- Repository: \`${plan.scope.repository}\`
- Suspect commit: \`${SUSPECT_COMMIT_SHA}\`
- Changed file: \`${TARGET_NETWORK_POLICY_FILE}\`
- Repository signal: unrestricted IPv4 egress was introduced in the inspected diff
- Deployment: **Unknown**
- Runtime exposure: **Unknown**
- Actual data access: **Unknown**
- Actual data exfiltration: **Unknown**
- Live-cluster behavior: **Unknown**

GitHub-only analysis does not establish deployment, runtime exposure, data access, exfiltration, or live-cluster behavior. No Fixture MCP read, Daytona sandbox, proposal, approval, or GitHub write is permitted in this mode.`;
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
        presentation: 'MARKDOWN',
      },
      evidence_ids: evidenceIds,
      tool_event_references: toolEventReferences,
      approval_event_references: [],
      missing_or_unsupported_requirements: [],
      proposal_hash_sha256: null,
      action_receipt: null,
      runtime_claims: {
        deployment: 'Unknown',
        runtime_exposure: 'Unknown',
        data_access: 'Unknown',
        exfiltration: 'Unknown',
        live_cluster_behavior: 'Unknown',
      },
      limitations: [...change.limitations, 'ANALYSIS_ONLY permits official GitHub reads only.'],
      guardian_did_not_merge_deploy_or_access_cluster: true,
    });
    return { receipt, presentation: null, openui: null, markdown };
  }

  const { finding, evidenceIds, toolEventReferences } = buildCurrentFixtureFinding();
  const sharedReceipt = {
    schema_version: 1 as const,
    execution_basis: 'DETERMINISTIC_INTEGRATION' as const,
    mode: plan.mode,
    scope: plan.scope,
    evidence_ids: evidenceIds,
    tool_event_references: toolEventReferences,
    approval_event_references: [] as string[],
    missing_or_unsupported_requirements: [] as string[],
    runtime_claims: {
      deployment: 'SupportedByOwnedSyntheticEvidence' as const,
      runtime_exposure: 'SupportedByOwnedSyntheticEvidence' as const,
      data_access: 'Unknown' as const,
      exfiltration: 'Unknown' as const,
      live_cluster_behavior: 'Unknown' as const,
    },
    guardian_did_not_merge_deploy_or_access_cluster: true as const,
  };

  const proposal = buildCurrentFixtureProposal();
  if (plan.mode === 'PREPARE_REMEDIATION') {
    const markdown = `## SecureOps Guardian — remediation prepared

- Terminal status: \`SECURITY_REMEDIATION_READY\`
- Proposal SHA-256: \`${proposal.proposal_hash_sha256}\`
- Repository: \`${proposal.target.repository}\`
- Base branch: \`${proposal.target.base_branch}\`
- Target file: \`${proposal.target.file}\`
- Actual data access: **Unknown**

No GitHub write or approval is permitted in this mode.

\`\`\`diff
${proposal.canonical_diff}\`\`\``;
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
        presentation: 'MARKDOWN',
      },
      proposal_hash_sha256: proposal.proposal_hash_sha256,
      action_receipt: null,
      limitations: [
        ...proposal.limitations,
        'PREPARE_REMEDIATION produces a proposal but cannot request approval or write to GitHub.',
      ],
    });
    return { receipt, presentation: null, openui: null, markdown };
  }

  const record = runPhaseFiveScenario('existing-pr-reuse');
  if (record.actual_terminal_status !== 'PR_REUSED' || record.action_receipt === null) {
    throw new Error('The current fixture did not produce the expected PR_REUSED receipt.');
  }
  const presentation = buildRunRecordPresentation({ record, finding, proposal });
  const receipt = buildGuardianRunReceipt({
    ...sharedReceipt,
    terminal_status: 'PR_REUSED',
    stages: {
      scope_preflight: 'COMPLETED',
      github_investigation: 'COMPLETED',
      incident_evidence_join: 'COMPLETED',
      deterministic_rule: 'COMPLETED',
      daytona_proof: 'COMPLETED',
      proposal: 'CREATED',
      github_action: 'PR_REUSED',
      presentation: 'OPENUI_AND_MARKDOWN',
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

  return {
    receipt,
    presentation,
    openui: renderGuardianResponse(presentation),
    markdown: renderGuardianMarkdown(presentation),
  };
}
