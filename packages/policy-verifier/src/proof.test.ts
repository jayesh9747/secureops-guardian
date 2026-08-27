import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { parsePolicyContract } from './contract.js';
import { buildEligibleProposal, recomputeProposalHash, verifyFourStates } from './proof.js';
import { evaluateCandidateAttempt } from './workflow.js';

const verifierPack = {
  pack_id: 'k8s-network-egress-v1',
  pack_version: '1.0.2',
  source_revision: 'guardian-network-egress-v1.0.2',
  manifest_sha256: '1'.repeat(64),
} as const;

const fixture = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), 'utf8');
const contract = parsePolicyContract(fixture('expected-contract.json'));
const lastGood = fixture('last-good.yaml');
const suspect = fixture('suspect.yaml');
const denyAll = fixture('deny-all.yaml');

describe('bounded candidate workflow', () => {
  it('permits one diagnostic correction and then terminates NO_SAFE_REMEDIATION', () => {
    const first = evaluateCandidateAttempt(denyAll, contract, 1);
    expect(first).toMatchObject({
      outcome: 'CORRECTION_REQUIRED',
      attempts_used: 1,
      attempts_remaining: 1,
    });
    if (first.outcome === 'CORRECTION_REQUIRED') {
      expect(first.diagnostics).toEqual(
        expect.arrayContaining([
          expect.stringContaining('DNS_REQUIRED_PATH'),
          expect.stringContaining('POSTGRES_REQUIRED_PATH'),
        ]),
      );
    }

    expect(evaluateCandidateAttempt(denyAll, contract, 2)).toMatchObject({
      outcome: 'NO_SAFE_REMEDIATION',
      attempts_used: 2,
      attempts_remaining: 0,
    });
    expect(evaluateCandidateAttempt(lastGood, contract, 2)).toMatchObject({
      outcome: 'SECURITY_REMEDIATION_READY',
      attempts_used: 2,
    });
  });

  it('constructs the same eligible proposal and hash twice', () => {
    const proof = verifyFourStates(
      {
        lastGoodYaml: lastGood,
        suspectYaml: suspect,
        denyAllYaml: denyAll,
        candidateYaml: lastGood,
      },
      contract,
      verifierPack,
    );
    const first = buildEligibleProposal({ candidateYaml: lastGood, suspectYaml: suspect, proof });
    const second = buildEligibleProposal({ candidateYaml: lastGood, suspectYaml: suspect, proof });
    expect(first).toEqual(second);
    expect(first?.proposal_hash_sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(first).toBeDefined();
    if (first === undefined) throw new Error('Expected an eligible proposal.');
    expect(first.proposal_id).toBe(`proposal:sha256:${first.proposal_hash_sha256}`);
    expect(recomputeProposalHash(first)).toBe(first.proposal_hash_sha256);
    expect(first.proposal_hash_sha256).toBe(
      '2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15',
    );
    expect(first.four_state_verifier_result.verifier_pack).toEqual(verifierPack);
    expect(first.verifier_pack).toEqual(verifierPack);
    expect(first.verifier_pack_binding_sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(first.target.remediation_branch).toBe('guardian/fix-checkout-egress');
    expect(first?.canonical_diff).toContain('-            cidr: 0.0.0.0/0');
  });

  it('changes the proposal hash when one canonical candidate byte changes', () => {
    const changed = lastGood.replace('name: checkout-egress', 'name: checkout-egresx');
    const changedContract = parsePolicyContract(
      fixture('expected-contract.json').replace('checkout-egress', 'checkout-egresx'),
    );
    const originalProof = verifyFourStates(
      {
        lastGoodYaml: lastGood,
        suspectYaml: suspect,
        denyAllYaml: denyAll,
        candidateYaml: lastGood,
      },
      contract,
      verifierPack,
    );
    const changedProof = verifyFourStates(
      {
        lastGoodYaml: changed,
        suspectYaml: suspect.replace('name: checkout-egress', 'name: checkout-egresx'),
        denyAllYaml: denyAll.replace('name: checkout-egress', 'name: checkout-egresx'),
        candidateYaml: changed,
      },
      changedContract,
      verifierPack,
    );
    const original = buildEligibleProposal({
      candidateYaml: lastGood,
      suspectYaml: suspect,
      proof: originalProof,
    });
    const changedProposal = buildEligibleProposal({
      candidateYaml: changed,
      suspectYaml: suspect.replace('name: checkout-egress', 'name: checkout-egresx'),
      proof: changedProof,
    });
    expect(original?.proposal_hash_sha256).not.toBe(changedProposal?.proposal_hash_sha256);
  });

  it('cannot create an eligible proposal for a failed candidate', () => {
    const proof = verifyFourStates(
      {
        lastGoodYaml: lastGood,
        suspectYaml: suspect,
        denyAllYaml: denyAll,
        candidateYaml: denyAll,
      },
      contract,
      verifierPack,
    );
    expect(
      buildEligibleProposal({ candidateYaml: denyAll, suspectYaml: suspect, proof }),
    ).toBeUndefined();
  });

  it('changes the pack binding without changing the legacy candidate proposal hash', () => {
    const proof = verifyFourStates(
      {
        lastGoodYaml: lastGood,
        suspectYaml: suspect,
        denyAllYaml: denyAll,
        candidateYaml: lastGood,
      },
      contract,
      verifierPack,
    );
    const original = buildEligibleProposal({
      candidateYaml: lastGood,
      suspectYaml: suspect,
      proof,
    });
    const changedProof = {
      ...proof,
      verifier_pack: { ...verifierPack, manifest_sha256: '2'.repeat(64) },
    };
    const changed = buildEligibleProposal({
      candidateYaml: lastGood,
      suspectYaml: suspect,
      proof: changedProof,
    });

    expect(changed?.proposal_hash_sha256).toBe(original?.proposal_hash_sha256);
    expect(changed?.verifier_pack_binding_sha256).not.toBe(original?.verifier_pack_binding_sha256);
  });
});
