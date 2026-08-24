import { createHash } from 'node:crypto';

import {
  PHASE_FOUR_TARGET,
  PHASE_THREE_PROPOSAL_HASH,
  SUSPECT_CANDIDATE_GIT_BLOB_SHA,
  VERIFIED_CANDIDATE_GIT_BLOB_SHA,
  VERIFIED_CANDIDATE_YAML,
  bindEligibleProposal,
  buildActionReceipt,
  evaluateRemoteSnapshot,
  type RemoteSnapshot,
} from '@guardian/github-write';
import { synthesizeSecurityFinding } from '@guardian/investigation';
import {
  buildEligibleProposal,
  canonicalJson,
  evaluateCandidateAttempt,
  parsePolicyContract,
  verifyFourStates,
  type CandidateAttemptOutcome,
  type FourStateProof,
} from '@guardian/policy-verifier';
import {
  CONFLICTING_REVISION_CASE_ID,
  DEMO_CASE_ID,
  MISSING_DEPLOYMENT_REVISION_CASE_ID,
  MISSING_REACHABILITY_CASE_ID,
} from '@guardian/shared';

import {
  DENY_ALL_NETWORK_POLICY_YAML,
  POLICY_CONTRACT_JSON,
  SUSPECT_NETWORK_POLICY_YAML,
  buildDeterministicChangeResult,
  buildDeterministicExposureResult,
} from './inputs.js';
import {
  checkpointValuesSchema,
  phaseFiveRunRecordSchema,
  type PhaseFiveRunRecord,
  type PhaseFiveScenarioId,
  type PhaseFiveTerminalStatus,
} from './records.js';

const BASE_COMMIT_SHA = '7b2f2ad51f9ef97334176fbfed3138465b62fcdb';
const CANDIDATE_COMMIT_SHA = '44fb8c7f5e99f835c6779f5e7b777c1b016af5b3';
const FIXTURE_PR_URL = 'https://github.com/jayesh9747/guardian-demo-checkout/pull/1';

const scenarioOrder = [
  'existing-pr-reuse',
  'denied-first-write',
  'missing-deployment-evidence',
  'missing-reachability-evidence',
  'conflicting-deployment-revision',
  'candidate-failure-two-attempts',
  'mismatched-remote-branch-content',
  'reconnect-pending-action',
] as const satisfies readonly PhaseFiveScenarioId[];

const expectedStatus: Record<PhaseFiveScenarioId, PhaseFiveTerminalStatus> = {
  'existing-pr-reuse': 'PR_REUSED',
  'denied-first-write': 'DENIED',
  'missing-deployment-evidence': 'INCONCLUSIVE',
  'missing-reachability-evidence': 'INCONCLUSIVE',
  'conflicting-deployment-revision': 'INCONCLUSIVE',
  'candidate-failure-two-attempts': 'NO_SAFE_REMEDIATION',
  'mismatched-remote-branch-content': 'WRITE_CONFLICT',
  'reconnect-pending-action': 'DENIED',
};

function caseIdForScenario(
  scenarioId: PhaseFiveScenarioId,
): Parameters<typeof buildDeterministicExposureResult>[0] {
  switch (scenarioId) {
    case 'missing-deployment-evidence':
      return MISSING_DEPLOYMENT_REVISION_CASE_ID;
    case 'missing-reachability-evidence':
      return MISSING_REACHABILITY_CASE_ID;
    case 'conflicting-deployment-revision':
      return CONFLICTING_REVISION_CASE_ID;
    default:
      return DEMO_CASE_ID;
  }
}

function evidenceToolReferences(
  change: ReturnType<typeof buildDeterministicChangeResult>,
  exposure: ReturnType<typeof buildDeterministicExposureResult>,
): string[] {
  return [
    ...change.evidence_records.map(
      (record) => `deterministic:tool:${record.tool}:${record.evidence_id}`,
    ),
    `deterministic:tool:get_security_alert:${exposure.alert.evidence_id}`,
    `deterministic:tool:get_deployment:${exposure.deployment.evidence_id}`,
    `deterministic:tool:get_reachability_observations:${exposure.case_id}`,
    `deterministic:tool:get_service_dependencies:${exposure.case_id}`,
  ];
}

function allEvidenceIds(
  change: ReturnType<typeof buildDeterministicChangeResult>,
  exposure: ReturnType<typeof buildDeterministicExposureResult>,
): string[] {
  return [
    ...change.evidence_records.map((record) => record.evidence_id),
    exposure.alert.evidence_id,
    exposure.deployment.evidence_id,
    ...exposure.reachability_observations.map((item) => item.evidence_id),
    ...exposure.service_dependencies.map((item) => item.evidence_id),
  ];
}

function attemptRecord(attempt: CandidateAttemptOutcome) {
  return {
    attempt: attempt.attempts_used,
    outcome: attempt.outcome,
    classification: attempt.verifier_result.classification,
    eligible: attempt.verifier_result.eligible,
    diagnostics: 'diagnostics' in attempt ? attempt.diagnostics : [],
  };
}

function proofRows(proof: FourStateProof) {
  return proof.states.map(({ state, result }) => ({
    state,
    classification: result.classification,
    eligible: result.eligible,
    secure: result.secure,
    functional: result.functional,
  }));
}

function baseSnapshot(): RemoteSnapshot {
  return {
    base: {
      commitSha: BASE_COMMIT_SHA,
      targetFileGitBlobSha: SUSPECT_CANDIDATE_GIT_BLOB_SHA,
    },
    branch: null,
    pullRequest: null,
  };
}

function pureHarnessMutationProof(detail: string) {
  return {
    confirmed_absent: true as const,
    observed_mutation_events: [],
    verification: `Pure deterministic harness has no network or GitHub client; ${detail}`,
  };
}

function inconclusiveRecord(input: {
  scenarioId: PhaseFiveScenarioId;
  caseId: ReturnType<typeof caseIdForScenario>;
  evidenceIds: string[];
  toolReferences: string[];
}): PhaseFiveRunRecord {
  return phaseFiveRunRecordSchema.parse({
    schema_version: 1,
    scenario_id: input.scenarioId,
    fixture_case_id: input.caseId,
    execution_mode: 'DETERMINISTIC_INTEGRATION',
    trueforge_agent_id: null,
    trueforge_session_id: null,
    evidence_ids: input.evidenceIds,
    tool_event_references: input.toolReferences,
    approval_event_references: [],
    verifier_output: null,
    proposal_hash_sha256: null,
    expected_terminal_status: 'INCONCLUSIVE',
    actual_terminal_status: 'INCONCLUSIVE',
    sandbox_started: false,
    write_approval_requested: false,
    persistence: null,
    unsupported_github_mutation: pureHarnessMutationProof(
      'the evidence gate returned before candidate or write construction.',
    ),
  });
}

export function runPhaseFiveScenario(scenarioId: PhaseFiveScenarioId): PhaseFiveRunRecord {
  const caseId = caseIdForScenario(scenarioId);
  const change = buildDeterministicChangeResult();
  const exposure = buildDeterministicExposureResult(caseId);
  const toolReferences = evidenceToolReferences(change, exposure);
  const evidenceIds = allEvidenceIds(change, exposure);
  const finding = synthesizeSecurityFinding({
    change_result: change,
    exposure_result: exposure,
  });

  if (finding.outcome === 'INCONCLUSIVE') {
    if (expectedStatus[scenarioId] !== 'INCONCLUSIVE') {
      throw new Error(`Unexpected INCONCLUSIVE result for ${scenarioId}.`);
    }
    return inconclusiveRecord({ scenarioId, caseId, evidenceIds, toolReferences });
  }

  const contract = parsePolicyContract(POLICY_CONTRACT_JSON);
  if (scenarioId === 'candidate-failure-two-attempts') {
    const firstAttempt = evaluateCandidateAttempt(DENY_ALL_NETWORK_POLICY_YAML, contract, 1);
    const secondAttempt = evaluateCandidateAttempt(DENY_ALL_NETWORK_POLICY_YAML, contract, 2);
    if (
      firstAttempt.outcome !== 'CORRECTION_REQUIRED' ||
      secondAttempt.outcome !== 'NO_SAFE_REMEDIATION'
    ) {
      throw new Error('Bounded candidate workflow did not terminate after two failed attempts.');
    }
    return phaseFiveRunRecordSchema.parse({
      schema_version: 1,
      scenario_id: scenarioId,
      fixture_case_id: caseId,
      execution_mode: 'DETERMINISTIC_INTEGRATION',
      trueforge_agent_id: null,
      trueforge_session_id: null,
      evidence_ids: evidenceIds,
      tool_event_references: [
        ...toolReferences,
        'deterministic:verifier:attempt-1',
        'deterministic:verifier:attempt-2',
      ],
      approval_event_references: [],
      verifier_output: {
        attempts: [attemptRecord(firstAttempt), attemptRecord(secondAttempt)],
        four_state: null,
      },
      proposal_hash_sha256: null,
      expected_terminal_status: 'NO_SAFE_REMEDIATION',
      actual_terminal_status: 'NO_SAFE_REMEDIATION',
      sandbox_started: true,
      write_approval_requested: false,
      persistence: null,
      unsupported_github_mutation: pureHarnessMutationProof(
        'two failed verifier attempts produced no eligible proposal or write request.',
      ),
    });
  }

  const candidateAttempt = evaluateCandidateAttempt(VERIFIED_CANDIDATE_YAML, contract, 1);
  if (candidateAttempt.outcome !== 'SECURITY_REMEDIATION_READY') {
    throw new Error('Pinned Phase 3 candidate unexpectedly failed verification.');
  }
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
    throw new Error('Integration harness did not reproduce the controlling Phase 3 proposal.');
  }
  const bindingResult = bindEligibleProposal(proposal);
  if (bindingResult.status !== 'BOUND') throw new Error(bindingResult.reason);
  const binding = bindingResult.binding;
  const verifierOutput = {
    attempts: [attemptRecord(candidateAttempt)],
    four_state: proofRows(proof),
  };
  const verifierTools = [
    ...toolReferences,
    'deterministic:verifier:attempt-1',
    'deterministic:verifier:four-state',
  ];

  if (scenarioId === 'existing-pr-reuse') {
    const remoteSnapshot: RemoteSnapshot = {
      ...baseSnapshot(),
      branch: {
        commitSha: CANDIDATE_COMMIT_SHA,
        targetFileGitBlobSha: VERIFIED_CANDIDATE_GIT_BLOB_SHA,
        commitMessage: binding.commitMessage,
      },
      pullRequest: {
        number: 1,
        url: FIXTURE_PR_URL,
        title: binding.pullRequestTitle,
        base: PHASE_FOUR_TARGET.baseBranch,
        head: PHASE_FOUR_TARGET.remediationBranch,
        body: binding.pullRequestBody,
      },
    };
    const decision = evaluateRemoteSnapshot(binding, remoteSnapshot);
    if (decision.status !== 'PR_REUSED') throw new Error('Expected exact PR reuse decision.');
    buildActionReceipt(binding, {
      status: 'PR_REUSED',
      githubResultReferences: ['deterministic:github:exact-open-base-head-pr-1'],
      remoteCandidateVerified: true,
      baseBranchUnchanged: true,
      remoteCommitSha: decision.remoteCommitSha,
      prNumber: decision.prNumber,
      prUrl: decision.prUrl,
    });
    return phaseFiveRunRecordSchema.parse({
      schema_version: 1,
      scenario_id: scenarioId,
      fixture_case_id: caseId,
      execution_mode: 'DETERMINISTIC_INTEGRATION',
      trueforge_agent_id: null,
      trueforge_session_id: null,
      evidence_ids: proposal.supporting_evidence_ids,
      tool_event_references: [
        ...verifierTools,
        'deterministic:github:list_branches',
        'deterministic:github:list_pull_requests:open:main:guardian/fix-checkout-egress',
        'deterministic:github:get_file_contents:main',
        'deterministic:github:get_commit:main',
        'deterministic:github:get_file_contents:remediation',
        'deterministic:github:get_commit:remediation',
      ],
      approval_event_references: [],
      verifier_output: verifierOutput,
      proposal_hash_sha256: proposal.proposal_hash_sha256,
      expected_terminal_status: 'PR_REUSED',
      actual_terminal_status: 'PR_REUSED',
      sandbox_started: true,
      write_approval_requested: false,
      persistence: null,
      unsupported_github_mutation: pureHarnessMutationProof(
        'exact existing branch and PR returned PR_REUSED without constructing a write call.',
      ),
    });
  }

  if (scenarioId === 'mismatched-remote-branch-content') {
    const decision = evaluateRemoteSnapshot(binding, {
      ...baseSnapshot(),
      branch: {
        commitSha: 'd'.repeat(40),
        targetFileGitBlobSha: 'f'.repeat(40),
        commitMessage: 'unrelated remote work',
      },
    });
    if (decision.status !== 'WRITE_CONFLICT') throw new Error('Expected WRITE_CONFLICT.');
    buildActionReceipt(binding, {
      status: 'WRITE_CONFLICT',
      reason: decision.reason,
      githubResultReferences: ['deterministic:github:mismatched-branch-read'],
      remoteCandidateVerified: false,
      baseBranchUnchanged: true,
    });
    return phaseFiveRunRecordSchema.parse({
      schema_version: 1,
      scenario_id: scenarioId,
      fixture_case_id: caseId,
      execution_mode: 'DETERMINISTIC_INTEGRATION',
      trueforge_agent_id: null,
      trueforge_session_id: null,
      evidence_ids: proposal.supporting_evidence_ids,
      tool_event_references: [
        ...verifierTools,
        'deterministic:github:list_branches',
        'deterministic:github:get_file_contents:mismatched-remediation',
        'deterministic:github:get_commit:mismatched-remediation',
      ],
      approval_event_references: [],
      verifier_output: verifierOutput,
      proposal_hash_sha256: proposal.proposal_hash_sha256,
      expected_terminal_status: 'WRITE_CONFLICT',
      actual_terminal_status: 'WRITE_CONFLICT',
      sandbox_started: true,
      write_approval_requested: false,
      persistence: null,
      unsupported_github_mutation: pureHarnessMutationProof(
        'mismatched deterministic-branch content returned WRITE_CONFLICT without overwrite.',
      ),
    });
  }

  if (scenarioId !== 'denied-first-write' && scenarioId !== 'reconnect-pending-action') {
    throw new Error(`No conclusive scenario handler exists for ${scenarioId}.`);
  }
  const initialSnapshot = baseSnapshot();
  const decision = evaluateRemoteSnapshot(binding, initialSnapshot);
  if (decision.status !== 'WRITE_REQUIRED' || decision.step !== 'CREATE_BRANCH') {
    throw new Error('Expected the first deterministic write to be CREATE_BRANCH.');
  }
  const deniedCallReference = `deterministic:github:create_branch:${scenarioId}:denied`;
  buildActionReceipt(binding, {
    status: 'DENIED',
    deniedToolCallReferences: [deniedCallReference],
    githubResultReferences: [
      `deterministic:github:${scenarioId}:pre-denial-read`,
      `deterministic:github:${scenarioId}:post-denial-read`,
    ],
    remoteCandidateVerified: false,
    baseBranchUnchanged: true,
    deterministicBranchAbsent: true,
    matchingPullRequestAbsent: true,
  });

  let persistence = null;
  if (scenarioId === 'reconnect-pending-action') {
    const beforeReconnect = checkpointValuesSchema.parse({
      case_id: caseId,
      evidence_ids: proposal.supporting_evidence_ids,
      proposal_hash_sha256: proposal.proposal_hash_sha256,
      pending_action: decision.step,
    });
    const serialized = canonicalJson(beforeReconnect);
    const afterReconnect = checkpointValuesSchema.parse(JSON.parse(serialized) as unknown);
    persistence = {
      before_reconnect: beforeReconnect,
      after_reconnect: afterReconnect,
      serialized_checkpoint_sha256: createHash('sha256').update(serialized).digest('hex'),
      same_case_id: true as const,
      same_evidence_ids: true as const,
      same_proposal_hash: true as const,
      same_pending_action: true as const,
    };
    if (canonicalJson(beforeReconnect) !== canonicalJson(afterReconnect)) {
      throw new Error('Reconnect changed the persisted checkpoint.');
    }
  }

  if (canonicalJson(initialSnapshot) !== canonicalJson(baseSnapshot())) {
    throw new Error('Denied write mutated the deterministic remote snapshot.');
  }
  return phaseFiveRunRecordSchema.parse({
    schema_version: 1,
    scenario_id: scenarioId,
    fixture_case_id: caseId,
    execution_mode: 'DETERMINISTIC_INTEGRATION',
    trueforge_agent_id: null,
    trueforge_session_id: null,
    evidence_ids: proposal.supporting_evidence_ids,
    tool_event_references: [
      ...verifierTools,
      'deterministic:github:list_branches',
      'deterministic:github:list_pull_requests:open:main:guardian/fix-checkout-egress',
      'deterministic:github:get_file_contents:main',
      'deterministic:github:get_commit:main',
      deniedCallReference,
      `deterministic:github:${scenarioId}:post-denial-read`,
    ],
    approval_event_references: [`deterministic:approval:${scenarioId}:create_branch:denied`],
    verifier_output: verifierOutput,
    proposal_hash_sha256: proposal.proposal_hash_sha256,
    expected_terminal_status: 'DENIED',
    actual_terminal_status: 'DENIED',
    sandbox_started: true,
    write_approval_requested: true,
    persistence,
    unsupported_github_mutation: pureHarnessMutationProof(
      'the denied first-write request left the pre/post remote snapshots byte-identical.',
    ),
  });
}

export function runPhaseFiveMatrix(): PhaseFiveRunRecord[] {
  const records = scenarioOrder.map((scenarioId) => runPhaseFiveScenario(scenarioId));
  if (new Set(records.map((record) => record.scenario_id)).size !== scenarioOrder.length) {
    throw new Error('Phase 5 matrix must contain every scenario exactly once.');
  }
  return records;
}
