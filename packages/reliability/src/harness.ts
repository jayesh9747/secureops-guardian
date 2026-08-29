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
  parsePolicyContract,
  runBoundedCandidateWorkflow,
  verifyFourStates,
  type CandidateAttemptOutcome,
  type FourStateProof,
} from '@guardian/policy-verifier';
import { VERIFIER_PACK_IDENTITY } from '@guardian/shared';
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
  type MutationObservation,
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

const expectedEvidenceDefects: Partial<Record<PhaseFiveScenarioId, readonly string[]>> = {
  'missing-deployment-evidence': [
    'Missing deployment revision in evidence:deployment:checkout-api:001:missing-deployment-revision.',
  ],
  'missing-reachability-evidence': [
    'Missing post-deployment forbidden reachability observation from checkout-api.',
  ],
  'conflicting-deployment-revision': [
    'Conflicting deployment revisions in evidence:deployment:checkout-api:001:conflicting-revision: ledger 7b2f2ad51f9ef97334176fbfed3138465b62fcdb, annotation a6d177b43396c7b4b45aa98cb2970d0489a7a4f9.',
  ],
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

function stateSha256(snapshot: RemoteSnapshot): string {
  return createHash('sha256').update(canonicalJson(snapshot)).digest('hex');
}

class DeterministicRemoteState {
  readonly #snapshot: RemoteSnapshot;
  readonly #mutationEvents: string[] = [];

  constructor(snapshot: RemoteSnapshot) {
    this.#snapshot = structuredClone(snapshot);
  }

  readSnapshot(): RemoteSnapshot {
    return structuredClone(this.#snapshot);
  }

  readMutationEvents(): string[] {
    return [...this.#mutationEvents];
  }
}

export function observeMutation(input: {
  before: RemoteSnapshot | null;
  after: RemoteSnapshot | null;
  mutationEvents: string[];
  detail: string;
}): MutationObservation {
  const beforeStateSha256 = input.before === null ? null : stateSha256(input.before);
  const afterStateSha256 = input.after === null ? null : stateSha256(input.after);
  if (input.mutationEvents.length > 0 || beforeStateSha256 !== afterStateSha256) {
    return {
      status: 'OBSERVED',
      confirmed_absent: false,
      before_state_sha256: beforeStateSha256,
      after_state_sha256: afterStateSha256,
      observed_mutation_events: [...input.mutationEvents],
      verification: input.detail,
    };
  }
  return {
    status: 'ABSENT',
    confirmed_absent: true as const,
    confirmation_basis:
      input.before === null && input.after === null
        ? ('NO_MUTATION_CAPABILITY' as const)
        : ('PRE_POST_SNAPSHOT' as const),
    before_state_sha256: beforeStateSha256,
    after_state_sha256: afterStateSha256,
    observed_mutation_events: [],
    verification: input.detail,
  };
}

type RecordFields = Pick<
  PhaseFiveRunRecord,
  | 'evidence_ids'
  | 'evidence_defects'
  | 'tool_event_references'
  | 'approval_event_references'
  | 'verifier_output'
  | 'proposal_hash_sha256'
  | 'sandbox_started'
  | 'write_approval_requested'
  | 'persistence'
  | 'remote_result'
  | 'action_receipt'
  | 'unsupported_github_mutation'
>;

function buildRecord(
  scenarioId: PhaseFiveScenarioId,
  caseId: ReturnType<typeof caseIdForScenario>,
  actualStatus: PhaseFiveTerminalStatus,
  fields: RecordFields,
): PhaseFiveRunRecord {
  return phaseFiveRunRecordSchema.parse({
    schema_version: 1,
    scenario_id: scenarioId,
    fixture_case_id: caseId,
    execution_mode: 'DETERMINISTIC_INTEGRATION',
    trueforge_agent_id: null,
    trueforge_session_id: null,
    ...fields,
    expected_terminal_status: expectedStatus[scenarioId],
    actual_terminal_status: actualStatus,
  });
}

export function assertApprovalMatchesCheckpoint(
  untrustedCheckpoint: unknown,
  approval: { proposal_hash_sha256: string; pending_action: string },
) {
  const checkpoint = checkpointValuesSchema.parse(untrustedCheckpoint);
  if (approval.proposal_hash_sha256 !== checkpoint.proposal_hash_sha256) {
    throw new Error('Reconnect approval proposal hash does not match the persisted proposal.');
  }
  if (approval.pending_action !== checkpoint.pending_action) {
    throw new Error('Reconnect approval pending action does not match the persisted action.');
  }
  return checkpoint;
}

function inconclusiveRecord(input: {
  scenarioId: PhaseFiveScenarioId;
  caseId: ReturnType<typeof caseIdForScenario>;
  evidenceIds: string[];
  evidenceDefects: string[];
  toolReferences: string[];
}): PhaseFiveRunRecord {
  return buildRecord(input.scenarioId, input.caseId, 'INCONCLUSIVE', {
    evidence_ids: input.evidenceIds,
    evidence_defects: input.evidenceDefects,
    tool_event_references: input.toolReferences,
    approval_event_references: [],
    verifier_output: null,
    proposal_hash_sha256: null,
    sandbox_started: false,
    write_approval_requested: false,
    persistence: null,
    remote_result: null,
    action_receipt: null,
    unsupported_github_mutation: observeMutation({
      before: null,
      after: null,
      mutationEvents: [],
      detail:
        'The evidence gate returned before constructing any mutation-capable operation or client.',
    }),
  });
}

export function runPhaseFiveScenario(
  scenarioId: PhaseFiveScenarioId,
  options: { remoteSnapshot?: RemoteSnapshot } = {},
): PhaseFiveRunRecord {
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
    return inconclusiveRecord({
      scenarioId,
      caseId,
      evidenceIds,
      evidenceDefects: [...finding.evidence_defects],
      toolReferences,
    });
  }

  const contract = parsePolicyContract(POLICY_CONTRACT_JSON);
  if (scenarioId === 'candidate-failure-two-attempts') {
    const workflow = runBoundedCandidateWorkflow(
      [DENY_ALL_NETWORK_POLICY_YAML, DENY_ALL_NETWORK_POLICY_YAML],
      contract,
    );
    return buildRecord(scenarioId, caseId, workflow.outcome, {
      evidence_ids: evidenceIds,
      evidence_defects: [],
      tool_event_references: [
        ...toolReferences,
        'deterministic:verifier:attempt-1',
        'deterministic:verifier:attempt-2',
      ],
      approval_event_references: [],
      verifier_output: {
        verifier_pack: VERIFIER_PACK_IDENTITY,
        attempts: workflow.attempts.map(attemptRecord),
        four_state: null,
      },
      proposal_hash_sha256: null,
      sandbox_started: true,
      write_approval_requested: false,
      persistence: null,
      remote_result: null,
      action_receipt: null,
      unsupported_github_mutation: observeMutation({
        before: null,
        after: null,
        mutationEvents: [],
        detail:
          'The bounded verifier terminated without constructing any mutation-capable operation or client.',
      }),
    });
  }

  const candidateWorkflow = runBoundedCandidateWorkflow(
    [VERIFIED_CANDIDATE_YAML, VERIFIED_CANDIDATE_YAML],
    contract,
  );
  const candidateAttempt = candidateWorkflow.attempts[0];
  if (candidateAttempt === undefined) throw new Error('Candidate workflow emitted no attempt.');
  const proof = verifyFourStates(
    {
      lastGoodYaml: VERIFIED_CANDIDATE_YAML,
      suspectYaml: SUSPECT_NETWORK_POLICY_YAML,
      denyAllYaml: DENY_ALL_NETWORK_POLICY_YAML,
      candidateYaml: VERIFIED_CANDIDATE_YAML,
    },
    contract,
    VERIFIER_PACK_IDENTITY,
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
    verifier_pack: VERIFIER_PACK_IDENTITY,
    attempts: [attemptRecord(candidateAttempt)],
    four_state: proofRows(proof),
  };
  const verifierTools = [
    ...toolReferences,
    'deterministic:verifier:attempt-1',
    'deterministic:verifier:four-state',
  ];

  if (scenarioId === 'existing-pr-reuse' || scenarioId === 'mismatched-remote-branch-content') {
    const defaultSnapshot: RemoteSnapshot =
      scenarioId === 'existing-pr-reuse'
        ? {
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
          }
        : {
            ...baseSnapshot(),
            branch: {
              commitSha: 'd'.repeat(40),
              targetFileGitBlobSha: 'f'.repeat(40),
              commitMessage: 'unrelated remote work',
            },
          };
    const remoteState = new DeterministicRemoteState(options.remoteSnapshot ?? defaultSnapshot);
    const beforeSnapshot = remoteState.readSnapshot();
    const decision = evaluateRemoteSnapshot(binding, beforeSnapshot);
    const githubResultReferences = [
      'deterministic:github:list_branches',
      'deterministic:github:list_pull_requests:open:main:guardian/fix-checkout-egress',
      'deterministic:github:get_file_contents:main',
      'deterministic:github:get_commit:main',
      ...(beforeSnapshot.branch === null
        ? []
        : [
            'deterministic:github:get_file_contents:remediation',
            'deterministic:github:get_commit:remediation',
          ]),
    ];
    const afterSnapshot = remoteState.readSnapshot();
    const commonFields = {
      evidence_ids: evidenceIds,
      evidence_defects: [],
      tool_event_references: [...verifierTools, ...githubResultReferences],
      approval_event_references: [],
      verifier_output: verifierOutput,
      proposal_hash_sha256: proposal.proposal_hash_sha256,
      sandbox_started: true,
      write_approval_requested: false,
      persistence: null,
      unsupported_github_mutation: observeMutation({
        before: beforeSnapshot,
        after: afterSnapshot,
        mutationEvents: remoteState.readMutationEvents(),
        detail: `Independent reads of the deterministic remote-state probe surround the ${decision.status} decision; the probe recorded no mutation event and performed no overwrite.`,
      }),
    };
    if (decision.status === 'WRITE_REQUIRED') {
      return buildRecord(scenarioId, caseId, decision.status, {
        ...commonFields,
        remote_result: null,
        action_receipt: null,
      });
    }
    if (decision.status === 'PR_REUSED') {
      const branch = beforeSnapshot.branch;
      if (branch === null) throw new Error('PR_REUSED observation is missing its branch.');
      const receipt = buildActionReceipt(binding, {
        status: decision.status,
        githubResultReferences,
        remoteCandidateVerified: true,
        baseBranchUnchanged: true,
        remoteCommitSha: decision.remoteCommitSha,
        prNumber: decision.prNumber,
        prUrl: decision.prUrl,
      });
      return buildRecord(scenarioId, caseId, decision.status, {
        ...commonFields,
        remote_result: {
          status: decision.status,
          remote_commit_sha: decision.remoteCommitSha,
          candidate_git_blob_sha: branch.targetFileGitBlobSha,
          pr_number: decision.prNumber,
          pr_url: decision.prUrl,
        },
        action_receipt: receipt,
      });
    }
    const branch = beforeSnapshot.branch;
    if (branch === null) throw new Error('WRITE_CONFLICT observation is missing its branch.');
    const receipt = buildActionReceipt(binding, {
      status: decision.status,
      reason: decision.reason,
      githubResultReferences,
      remoteCandidateVerified: false,
      baseBranchUnchanged: true,
    });
    return buildRecord(scenarioId, caseId, decision.status, {
      ...commonFields,
      remote_result: {
        status: decision.status,
        reason: decision.reason,
        observed_remote_commit_sha: branch.commitSha,
        observed_git_blob_sha: branch.targetFileGitBlobSha,
      },
      action_receipt: receipt,
    });
  }

  if (scenarioId !== 'denied-first-write' && scenarioId !== 'reconnect-pending-action') {
    throw new Error(`No conclusive scenario handler exists for ${scenarioId}.`);
  }
  const remoteState = new DeterministicRemoteState(baseSnapshot());
  const initialSnapshot = remoteState.readSnapshot();
  const decision = evaluateRemoteSnapshot(binding, initialSnapshot);
  if (decision.status !== 'WRITE_REQUIRED' || decision.step !== 'CREATE_BRANCH') {
    throw new Error('Expected the first deterministic write to be CREATE_BRANCH.');
  }
  const deniedCallReference = `deterministic:github:create_branch:${scenarioId}:denied`;
  const preDenialReference = `deterministic:github:${scenarioId}:pre-denial-read`;
  const postDenialReference = `deterministic:github:${scenarioId}:post-denial-read`;
  const receipt = buildActionReceipt(binding, {
    status: 'DENIED',
    deniedToolCallReferences: [deniedCallReference],
    githubResultReferences: [preDenialReference, postDenialReference],
    remoteCandidateVerified: false,
    baseBranchUnchanged: true,
    deterministicBranchAbsent: true,
    matchingPullRequestAbsent: true,
  });
  if (receipt.status !== 'DENIED') throw new Error('Receipt status changed during parsing.');

  let persistence = null;
  if (scenarioId === 'reconnect-pending-action') {
    const beforeReconnect = checkpointValuesSchema.parse({
      case_id: caseId,
      evidence_ids: evidenceIds,
      proposal_hash_sha256: proposal.proposal_hash_sha256,
      pending_action: decision.step,
    });
    const serialized = canonicalJson(beforeReconnect);
    const afterReconnect = checkpointValuesSchema.parse(JSON.parse(serialized) as unknown);
    assertApprovalMatchesCheckpoint(afterReconnect, {
      proposal_hash_sha256: proposal.proposal_hash_sha256,
      pending_action: decision.step,
    });
    persistence = {
      before_reconnect: beforeReconnect,
      after_reconnect: afterReconnect,
      serialized_checkpoint_sha256: createHash('sha256').update(serialized).digest('hex'),
    };
  }

  const afterSnapshot = remoteState.readSnapshot();
  return buildRecord(scenarioId, caseId, receipt.status, {
    evidence_ids: evidenceIds,
    evidence_defects: [],
    tool_event_references: [
      ...verifierTools,
      'deterministic:github:list_branches',
      'deterministic:github:list_pull_requests:open:main:guardian/fix-checkout-egress',
      'deterministic:github:get_file_contents:main',
      'deterministic:github:get_commit:main',
      preDenialReference,
      deniedCallReference,
      postDenialReference,
    ],
    approval_event_references: [`deterministic:approval:${scenarioId}:create_branch:denied`],
    verifier_output: verifierOutput,
    proposal_hash_sha256: proposal.proposal_hash_sha256,
    sandbox_started: true,
    write_approval_requested: true,
    persistence,
    remote_result: null,
    action_receipt: receipt,
    unsupported_github_mutation: observeMutation({
      before: initialSnapshot,
      after: afterSnapshot,
      mutationEvents: remoteState.readMutationEvents(),
      detail:
        'Independent reads of the deterministic remote-state probe surround the denied call; the probe recorded no mutation event.',
    }),
  });
}

export function runPhaseFiveMatrix(): PhaseFiveRunRecord[] {
  return scenarioOrder.map((scenarioId) => runPhaseFiveScenario(scenarioId));
}

export function phaseFiveRecordPassed(record: PhaseFiveRunRecord): boolean {
  const expectedDefects = expectedEvidenceDefects[record.scenario_id] ?? [];
  return (
    record.actual_terminal_status === record.expected_terminal_status &&
    record.unsupported_github_mutation.status === 'ABSENT' &&
    canonicalJson(record.evidence_defects) === canonicalJson(expectedDefects)
  );
}
