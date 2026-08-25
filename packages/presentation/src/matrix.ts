import {
  bindEligibleProposal,
  buildActionReceipt,
  VERIFIED_CANDIDATE_YAML,
  type ActionReceipt,
} from '@guardian/github-write';
import { synthesizeSecurityFinding, type InvestigationOutcome } from '@guardian/investigation';
import {
  buildEligibleProposal,
  parsePolicyContract,
  verifyFourStates,
  type EligibleProposal,
} from '@guardian/policy-verifier';
import {
  DENY_ALL_NETWORK_POLICY_YAML,
  POLICY_CONTRACT_JSON,
  SUSPECT_NETWORK_POLICY_YAML,
  buildDeterministicChangeResult,
  buildDeterministicExposureResult,
  runPhaseFiveScenario,
} from '@guardian/reliability';
import {
  CONFLICTING_REVISION_CASE_ID,
  DEMO_CASE_ID,
  MISSING_DEPLOYMENT_REVISION_CASE_ID,
  MISSING_REACHABILITY_CASE_ID,
} from '@guardian/shared';

import {
  buildCreatedPresentation,
  buildReadyPresentation,
  buildRunRecordPresentation,
} from './build.js';
import type { GuardianPresentation } from './schema.js';

export type PhaseSixPresentationScenario =
  | 'remediation-ready'
  | 'denied'
  | 'pr-created'
  | 'pr-reused'
  | 'missing-deployment-inconclusive'
  | 'missing-reachability-inconclusive'
  | 'conflicting-revision-inconclusive'
  | 'write-conflict'
  | 'no-safe-remediation';

export interface PhaseSixPresentationCase {
  scenario: PhaseSixPresentationScenario;
  presentation: GuardianPresentation;
}

function findingForCase(caseId: Parameters<typeof buildDeterministicExposureResult>[0]) {
  return synthesizeSecurityFinding({
    change_result: buildDeterministicChangeResult(),
    exposure_result: buildDeterministicExposureResult(caseId),
  });
}

export function buildPhaseSixControllingArtifacts(): {
  finding: InvestigationOutcome;
  proposal: EligibleProposal;
  createdReceipt: ActionReceipt;
} {
  const finding = findingForCase(DEMO_CASE_ID);
  if (finding.outcome !== 'SUPPORTED_SECURITY_FINDING') {
    throw new Error('Phase 6 matrix could not reproduce the supported finding.');
  }
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
  if (proposal === undefined) throw new Error('Phase 6 matrix could not reproduce the proposal.');
  const bindingResult = bindEligibleProposal(proposal);
  if (bindingResult.status !== 'BOUND') throw new Error(bindingResult.reason);
  const createdReceipt = buildActionReceipt(bindingResult.binding, {
    status: 'PR_CREATED',
    approvedToolCallReferences: [
      'trueforge:github:create_branch:approved',
      'trueforge:github:create_or_update_file:approved',
      'trueforge:github:create_pull_request:approved',
    ],
    githubResultReferences: ['trueforge:github:create_pull_request:result'],
    remoteCandidateVerified: true,
    baseBranchUnchanged: true,
    remoteCommitSha: '44fb8c7f5e99f835c6779f5e7b777c1b016af5b3',
    prNumber: 1,
    prUrl: 'https://github.com/jayesh9747/guardian-demo-checkout/pull/1',
  });
  return { finding, proposal, createdReceipt };
}

export function buildPhaseSixPresentationMatrix(): PhaseSixPresentationCase[] {
  const { finding, proposal, createdReceipt } = buildPhaseSixControllingArtifacts();
  const cases: PhaseSixPresentationCase[] = [
    {
      scenario: 'remediation-ready',
      presentation: buildReadyPresentation({ finding, proposal }),
    },
    {
      scenario: 'denied',
      presentation: buildRunRecordPresentation({
        record: runPhaseFiveScenario('denied-first-write'),
        finding,
        proposal,
      }),
    },
    {
      scenario: 'pr-created',
      presentation: buildCreatedPresentation({ receipt: createdReceipt, finding, proposal }),
    },
    {
      scenario: 'pr-reused',
      presentation: buildRunRecordPresentation({
        record: runPhaseFiveScenario('existing-pr-reuse'),
        finding,
        proposal,
      }),
    },
    {
      scenario: 'missing-deployment-inconclusive',
      presentation: buildRunRecordPresentation({
        record: runPhaseFiveScenario('missing-deployment-evidence'),
        finding: findingForCase(MISSING_DEPLOYMENT_REVISION_CASE_ID),
        proposal: null,
      }),
    },
    {
      scenario: 'missing-reachability-inconclusive',
      presentation: buildRunRecordPresentation({
        record: runPhaseFiveScenario('missing-reachability-evidence'),
        finding: findingForCase(MISSING_REACHABILITY_CASE_ID),
        proposal: null,
      }),
    },
    {
      scenario: 'conflicting-revision-inconclusive',
      presentation: buildRunRecordPresentation({
        record: runPhaseFiveScenario('conflicting-deployment-revision'),
        finding: findingForCase(CONFLICTING_REVISION_CASE_ID),
        proposal: null,
      }),
    },
    {
      scenario: 'write-conflict',
      presentation: buildRunRecordPresentation({
        record: runPhaseFiveScenario('mismatched-remote-branch-content'),
        finding,
        proposal,
      }),
    },
    {
      scenario: 'no-safe-remediation',
      presentation: buildRunRecordPresentation({
        record: runPhaseFiveScenario('candidate-failure-two-attempts'),
        finding,
        proposal: null,
      }),
    },
  ];
  return cases;
}
