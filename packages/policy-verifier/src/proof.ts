import { createHash } from 'node:crypto';

import { DEMO_REPOSITORY, SUSPECT_COMMIT_SHA, TARGET_NETWORK_POLICY_FILE } from '@guardian/shared';

import { canonicalJson, canonicalUnifiedDiff, canonicalizeYaml } from './canonical.js';
import type { PolicyContract, VerificationResult } from './types.js';
import { verifyNetworkPolicy } from './verifier.js';

export type ProofState = 'last-good' | 'suspect' | 'deny-all' | 'candidate';

export interface ProofMatrixEntry {
  state: ProofState;
  result: VerificationResult;
}

export interface FourStateProof {
  schema_version: 1;
  states: ProofMatrixEntry[];
}

export const SUPPORTING_EVIDENCE_IDS = [
  'evidence:github:commit:suspect',
  'evidence:github:diff:checkout-networkpolicy',
  'evidence:github:manifest:checkout-networkpolicy:suspect',
  'evidence:rule:SEC-NET-001:checkout-networkpolicy',
  'evidence:deployment:checkout-api:001',
  'evidence:security-alert:checkout-egress:001',
  'evidence:reachability:checkout-forbidden:001',
  'evidence:dependency:checkout-dns:001',
  'evidence:dependency:checkout-postgres:001',
] as const;

export const PROPOSAL_LIMITATIONS = [
  'GitHub evidence is real; deployment, alert, reachability, and dependency observations are owned synthetic fixtures.',
  'The proof is deterministic static NetworkPolicy analysis, not Kubernetes admission, CNI enforcement, live reachability, data access, or exfiltration evidence.',
  'This proposal authorizes presentation only. It does not authorize a branch, pull request, merge, deployment, or cluster action.',
] as const;

export interface EligibleProposal {
  schema_version: 1;
  proposal_id: string;
  proposal_hash_sha256: string;
  target: {
    repository: string;
    base_branch: 'main';
    remediation_branch: 'remediation/sec-net-001-checkout-egress';
    file: string;
    suspect_commit_sha: string;
  };
  canonical_candidate_yaml: string;
  canonical_diff: string;
  supporting_evidence_ids: readonly string[];
  four_state_verifier_result: FourStateProof;
  candidate_verifier_result: VerificationResult;
  limitations: readonly string[];
  expected_phase_4_github_mcp_write_sequence: readonly [
    'create_branch',
    'create_or_update_file',
    'create_pull_request',
  ];
}

type ProposalCore = Omit<EligibleProposal, 'proposal_id' | 'proposal_hash_sha256'>;

export function verifyFourStates(
  inputs: {
    lastGoodYaml: string;
    suspectYaml: string;
    denyAllYaml: string;
    candidateYaml: string;
  },
  contract: PolicyContract,
): FourStateProof {
  return {
    schema_version: 1,
    states: [
      { state: 'last-good', result: verifyNetworkPolicy(inputs.lastGoodYaml, contract) },
      { state: 'suspect', result: verifyNetworkPolicy(inputs.suspectYaml, contract) },
      { state: 'deny-all', result: verifyNetworkPolicy(inputs.denyAllYaml, contract) },
      { state: 'candidate', result: verifyNetworkPolicy(inputs.candidateYaml, contract) },
    ],
  };
}

export function fourStateProofPasses(proof: FourStateProof): boolean {
  const classifications = proof.states.map(({ state, result }) => [state, result.classification]);
  return (
    JSON.stringify(classifications) ===
    JSON.stringify([
      ['last-good', 'SECURE_AND_FUNCTIONAL'],
      ['suspect', 'EXPOSED'],
      ['deny-all', 'SECURE_BUT_OPERATIONALLY_REJECTED'],
      ['candidate', 'SECURE_AND_FUNCTIONAL'],
    ])
  );
}

export function buildEligibleProposal(input: {
  candidateYaml: string;
  suspectYaml: string;
  proof: FourStateProof;
}): EligibleProposal | undefined {
  const candidateResult = input.proof.states.find(({ state }) => state === 'candidate')?.result;
  if (
    candidateResult === undefined ||
    !candidateResult.eligible ||
    !fourStateProofPasses(input.proof)
  ) {
    return undefined;
  }

  const canonicalCandidateYaml = canonicalizeYaml(input.candidateYaml);
  const canonicalSuspectYaml = canonicalizeYaml(input.suspectYaml);
  const core: ProposalCore = {
    schema_version: 1,
    target: {
      repository: DEMO_REPOSITORY,
      base_branch: 'main',
      remediation_branch: 'remediation/sec-net-001-checkout-egress',
      file: TARGET_NETWORK_POLICY_FILE,
      suspect_commit_sha: SUSPECT_COMMIT_SHA,
    },
    canonical_candidate_yaml: canonicalCandidateYaml,
    canonical_diff: canonicalUnifiedDiff(
      canonicalSuspectYaml,
      canonicalCandidateYaml,
      TARGET_NETWORK_POLICY_FILE,
    ),
    supporting_evidence_ids: SUPPORTING_EVIDENCE_IDS,
    four_state_verifier_result: input.proof,
    candidate_verifier_result: candidateResult,
    limitations: PROPOSAL_LIMITATIONS,
    expected_phase_4_github_mcp_write_sequence: [
      'create_branch',
      'create_or_update_file',
      'create_pull_request',
    ],
  };
  const proposalHash = createHash('sha256').update(canonicalJson(core)).digest('hex');
  return {
    proposal_id: `proposal:sha256:${proposalHash}`,
    proposal_hash_sha256: proposalHash,
    ...core,
  };
}
