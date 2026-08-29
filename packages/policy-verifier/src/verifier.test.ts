import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { VERIFIER_PACK_IDENTITY } from '@guardian/shared';
import { describe, expect, it } from 'vitest';

import { parsePolicyContract } from './contract.js';
import { verifyFourStates } from './proof.js';
import { verifyNetworkPolicy } from './verifier.js';

const fixture = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url)), 'utf8');
const contract = parsePolicyContract(fixture('expected-contract.json'));
const lastGood = fixture('last-good.yaml');
const suspect = fixture('suspect.yaml');
const denyAll = fixture('deny-all.yaml');

function replaceOrThrow(source: string, search: string, replacement: string): string {
  expect(source).toContain(search);
  return source.replace(search, replacement);
}

function failedCheckIds(candidate: string): string[] {
  return verifyNetworkPolicy(candidate, contract)
    .checks.filter((check) => !check.passed)
    .map((check) => check.id);
}

describe('pure deterministic NetworkPolicy verifier', () => {
  it('classifies the required four states from manifest content', () => {
    const proof = verifyFourStates(
      {
        lastGoodYaml: lastGood,
        suspectYaml: suspect,
        denyAllYaml: denyAll,
        candidateYaml: lastGood,
      },
      contract,
      VERIFIER_PACK_IDENTITY,
    );
    expect(proof.states.map(({ state, result }) => [state, result.classification])).toEqual([
      ['last-good', 'SECURE_AND_FUNCTIONAL'],
      ['suspect', 'EXPOSED'],
      ['deny-all', 'SECURE_BUT_OPERATIONALLY_REJECTED'],
      ['candidate', 'SECURE_AND_FUNCTIONAL'],
    ]);
  });

  it('does not infer a classification from a fixture label or file name', () => {
    const result = verifyNetworkPolicy(suspect, contract);
    expect(result.classification).toBe('EXPOSED');
    expect(verifyNetworkPolicy(lastGood, contract).classification).toBe('SECURE_AND_FUNCTIONAL');
  });

  it('returns byte-for-byte stable structured output', () => {
    expect(JSON.stringify(verifyNetworkPolicy(lastGood, contract))).toBe(
      JSON.stringify(verifyNetworkPolicy(lastGood, contract)),
    );
  });

  it('rejects an unrestricted CIDR', () => {
    expect(failedCheckIds(suspect)).toEqual(
      expect.arrayContaining(['NO_UNRESTRICTED_EGRESS', 'FORBIDDEN_DESTINATION_EXCLUDED']),
    );
  });

  it('rejects missing DNS while recognizing secure containment', () => {
    const firstRuleStart = lastGood.indexOf('    - to:');
    const secondRuleStart = lastGood.indexOf('    - to:', firstRuleStart + 1);
    expect(firstRuleStart).toBeGreaterThan(-1);
    expect(secondRuleStart).toBeGreaterThan(firstRuleStart);
    const missingDns = `${lastGood.slice(0, firstRuleStart)}${lastGood.slice(secondRuleStart)}`;
    const result = verifyNetworkPolicy(missingDns, contract);
    expect(result.classification).toBe('SECURE_BUT_OPERATIONALLY_REJECTED');
    expect(failedCheckIds(missingDns)).toContain('DNS_REQUIRED_PATH');
  });

  it('rejects the wrong PostgreSQL namespace selector', () => {
    const candidate = replaceOrThrow(lastGood, 'payments-data', 'wrong-namespace');
    expect(failedCheckIds(candidate)).toContain('POSTGRES_REQUIRED_PATH');
  });

  it('rejects target selector semantics outside the supported matchLabels subset', () => {
    const candidate = replaceOrThrow(
      lastGood,
      '      app: checkout-api\n  policyTypes:',
      [
        '      app: checkout-api',
        '    matchExpressions:',
        '      - key: app',
        '        operator: DoesNotExist',
        '  policyTypes:',
      ].join('\n'),
    );
    const result = verifyNetworkPolicy(candidate, contract);
    expect(result.classification).toBe('INVALID');
    expect(result.eligible).toBe(false);
    expect(failedCheckIds(candidate)).toContain('NETWORK_POLICY_STRUCTURE');
  });

  it.each([
    ['port', 'port: 5432', 'port: 5433'],
    ['protocol', 'protocol: TCP\n          port: 5432', 'protocol: UDP\n          port: 5432'],
  ])('rejects the wrong PostgreSQL %s', (_label, search, replacement) => {
    const candidate = replaceOrThrow(lastGood, search, replacement);
    expect(failedCheckIds(candidate)).toContain('POSTGRES_REQUIRED_PATH');
  });

  it('rejects an additional PostgreSQL port outside the exact dependency contract', () => {
    const candidate = replaceOrThrow(
      lastGood,
      '        - protocol: TCP\n          port: 5432',
      [
        '        - protocol: TCP',
        '          port: 5432',
        '        - protocol: TCP',
        '          port: 22',
      ].join('\n'),
    );
    expect(verifyNetworkPolicy(candidate, contract).eligible).toBe(false);
    expect(failedCheckIds(candidate)).toContain('POSTGRES_REQUIRED_PATH');
  });

  it('rejects an additional peer beside the exact PostgreSQL dependency', () => {
    const candidate = replaceOrThrow(
      lastGood,
      '          podSelector:\n            matchLabels:\n              app: postgres\n      ports:',
      [
        '          podSelector:',
        '            matchLabels:',
        '              app: postgres',
        '        - namespaceSelector:',
        '            matchLabels:',
        '              kubernetes.io/metadata.name: observability',
        '          podSelector:',
        '            matchLabels:',
        '              app: metrics',
        '      ports:',
      ].join('\n'),
    );
    expect(verifyNetworkPolicy(candidate, contract).eligible).toBe(false);
    expect(failedCheckIds(candidate)).toContain('POSTGRES_REQUIRED_PATH');
  });

  it('finds an unrestricted rule hidden beside the intended peer', () => {
    const candidate = replaceOrThrow(
      lastGood,
      '        - namespaceSelector:\n            matchLabels:\n              kubernetes.io/metadata.name: payments-data',
      '        - namespaceSelector:\n            matchLabels:\n              kubernetes.io/metadata.name: payments-data\n        - ipBlock:\n            cidr: 0.0.0.0/0',
    );
    expect(failedCheckIds(candidate)).toEqual(
      expect.arrayContaining(['NO_UNRESTRICTED_EGRESS', 'FORBIDDEN_DESTINATION_EXCLUDED']),
    );
  });

  it('fails closed for malformed YAML', () => {
    const result = verifyNetworkPolicy('apiVersion: [unterminated', contract);
    expect(result.classification).toBe('INVALID');
    expect(failedCheckIds('apiVersion: [unterminated')).toContain('MANIFEST_VALID');
  });

  it('fails closed for the wrong Kubernetes kind', () => {
    const candidate = replaceOrThrow(lastGood, 'kind: NetworkPolicy', 'kind: ConfigMap');
    expect(verifyNetworkPolicy(candidate, contract).classification).toBe('INVALID');
    expect(failedCheckIds(candidate)).toContain('NETWORK_POLICY_KIND');
  });

  it('fails closed for an invalid ipBlock CIDR in an additional peer', () => {
    const candidate = `${lastGood}    - to:\n        - ipBlock:\n            cidr: not-a-cidr\n`;
    const result = verifyNetworkPolicy(candidate, contract);
    expect(result.classification).toBe('INVALID');
    expect(result.eligible).toBe(false);
    expect(failedCheckIds(candidate)).toContain('NETWORK_POLICY_STRUCTURE');
  });

  it('rejects a bounded CIDR containing the declared forbidden IPv4 address', () => {
    const candidate = `${lastGood}    - to:\n        - ipBlock:\n            cidr: 203.0.113.0/24\n`;
    const result = verifyNetworkPolicy(candidate, contract);
    expect(result.checks.find(({ id }) => id === 'NO_UNRESTRICTED_EGRESS')?.passed).toBe(true);
    expect(result.checks.find(({ id }) => id === 'FORBIDDEN_DESTINATION_EXCLUDED')?.passed).toBe(
      false,
    );
  });
});
