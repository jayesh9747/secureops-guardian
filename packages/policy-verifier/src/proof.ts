import { createHash } from 'node:crypto';

import { DEMO_REPOSITORY, SUSPECT_COMMIT_SHA, TARGET_NETWORK_POLICY_FILE } from '@guardian/shared';

import { canonicalJson, canonicalUnifiedDiff, canonicalizeYaml } from './canonical.js';
import type { VerifierPackIdentity } from './pack.js';
import type { PolicyContract, VerificationResult } from './types.js';
import { verifyNetworkPolicy } from './verifier.js';

export type ProofState = 'last-good' | 'suspect' | 'deny-all' | 'candidate';

export const DETERMINISTIC_REMEDIATION_BRANCH = 'guardian/fix-checkout-egress' as const;

export interface ProofMatrixEntry {
  state: ProofState;
  result: VerificationResult;
}

export interface FourStateProof {
  schema_version: 1;
  verifier_pack: VerifierPackIdentity;
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
  verifier_pack: VerifierPackIdentity;
  verifier_pack_binding_sha256: string;
  target: {
    repository: string;
    base_branch: 'main';
    remediation_branch: typeof DETERMINISTIC_REMEDIATION_BRANCH;
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

type ProposalCore = Omit<
  EligibleProposal,
  | 'proposal_id'
  | 'proposal_hash_sha256'
  | 'verifier_pack'
  | 'verifier_pack_binding_sha256'
  | 'four_state_verifier_result'
> & {
  four_state_verifier_result: Omit<FourStateProof, 'verifier_pack'>;
};

function proposalCore(proposal: EligibleProposal): ProposalCore {
  const core = { ...proposal } as Partial<EligibleProposal>;
  delete core.proposal_id;
  delete core.proposal_hash_sha256;
  delete core.verifier_pack;
  delete core.verifier_pack_binding_sha256;
  const proof = { ...proposal.four_state_verifier_result } as Partial<FourStateProof>;
  delete proof.verifier_pack;
  return { ...core, four_state_verifier_result: proof } as ProposalCore;
}

export function recomputeProposalHash(proposal: EligibleProposal): string {
  return createHash('sha256')
    .update(canonicalJson(proposalCore(proposal)))
    .digest('hex');
}

export function recomputeVerifierPackBinding(proposal: EligibleProposal): string {
  return createHash('sha256')
    .update(
      canonicalJson({
        proposal_hash_sha256: proposal.proposal_hash_sha256,
        verifier_pack: proposal.verifier_pack,
      }),
    )
    .digest('hex');
}

export function verifyFourStates(
  inputs: {
    lastGoodYaml: string;
    suspectYaml: string;
    denyAllYaml: string;
    candidateYaml: string;
  },
  contract: PolicyContract,
  verifierPack: VerifierPackIdentity,
): FourStateProof {
  return {
    schema_version: 1,
    verifier_pack: verifierPack,
    states: [
      { state: 'last-good', result: verifyNetworkPolicy(inputs.lastGoodYaml, contract) },
      { state: 'suspect', result: verifyNetworkPolicy(inputs.suspectYaml, contract) },
      { state: 'deny-all', result: verifyNetworkPolicy(inputs.denyAllYaml, contract) },
      { state: 'candidate', result: verifyNetworkPolicy(inputs.candidateYaml, contract) },
    ],
  };
}

export function fourStateProofPasses(proof: FourStateProof): boolean {
  const outcomes = proof.states.map(({ state, result }) => [
    state,
    result.classification,
    result.secure,
    result.functional,
  ]);
  return (
    JSON.stringify(outcomes) ===
    JSON.stringify([
      ['last-good', 'SECURE_AND_FUNCTIONAL', true, true],
      ['suspect', 'EXPOSED', false, true],
      ['deny-all', 'SECURE_BUT_OPERATIONALLY_REJECTED', true, false],
      ['candidate', 'SECURE_AND_FUNCTIONAL', true, true],
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
      remediation_branch: DETERMINISTIC_REMEDIATION_BRANCH,
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
    four_state_verifier_result: {
      schema_version: input.proof.schema_version,
      states: input.proof.states,
    },
    candidate_verifier_result: candidateResult,
    limitations: PROPOSAL_LIMITATIONS,
    expected_phase_4_github_mcp_write_sequence: [
      'create_branch',
      'create_or_update_file',
      'create_pull_request',
    ],
  };
  const unhashedProposal: EligibleProposal = {
    proposal_id: '',
    proposal_hash_sha256: '',
    verifier_pack: input.proof.verifier_pack,
    verifier_pack_binding_sha256: '',
    ...core,
    four_state_verifier_result: input.proof,
  };
  const proposalHash = recomputeProposalHash(unhashedProposal);
  const proposal = {
    ...unhashedProposal,
    proposal_id: `proposal:sha256:${proposalHash}`,
    proposal_hash_sha256: proposalHash,
  };
  return {
    ...proposal,
    verifier_pack_binding_sha256: recomputeVerifierPackBinding(proposal),
  };
}
