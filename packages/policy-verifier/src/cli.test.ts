import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const cliPath = fileURLToPath(new URL('./cli.ts', import.meta.url));
const fixturePath = (name: string) =>
  fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

function runCli(argumentsList: string[]) {
  return spawnSync(process.execPath, ['--import', 'tsx', cliPath, ...argumentsList], {
    encoding: 'utf8',
  });
}

describe('single stable JSON CLI', () => {
  it('accepts explicit candidate and contract paths', () => {
    const argumentsList = [
      '--candidate',
      fixturePath('last-good.yaml'),
      '--contract',
      fixturePath('expected-contract.json'),
    ];
    const first = runCli(argumentsList);
    const second = runCli(argumentsList);
    expect(first.status).toBe(0);
    expect(first.stderr).toBe('');
    expect(first.stdout).toBe(second.stdout);
    expect(JSON.parse(first.stdout)).toMatchObject({
      outcome: 'SECURITY_REMEDIATION_READY',
      verifier_result: { classification: 'SECURE_AND_FUNCTIONAL', eligible: true },
    });
  });

  it('emits diagnostics and exits non-zero for a failed first candidate', () => {
    const result = runCli([
      '--candidate',
      fixturePath('deny-all.yaml'),
      '--contract',
      fixturePath('expected-contract.json'),
    ]);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      outcome: 'CORRECTION_REQUIRED',
      attempts_remaining: 1,
    });
  });

  it('emits terminal NO_SAFE_REMEDIATION on the second failure', () => {
    const result = runCli([
      '--candidate',
      fixturePath('deny-all.yaml'),
      '--contract',
      fixturePath('expected-contract.json'),
      '--attempt',
      '2',
    ]);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      outcome: 'NO_SAFE_REMEDIATION',
      attempts_remaining: 0,
    });
  });

  it('rejects any third attempt at the CLI boundary', () => {
    const result = runCli([
      '--candidate',
      fixturePath('last-good.yaml'),
      '--contract',
      fixturePath('expected-contract.json'),
      '--attempt',
      '3',
    ]);
    expect(result.status).toBe(2);
    expect(JSON.parse(result.stdout)).toMatchObject({ outcome: 'CLI_ARGUMENT_ERROR' });
  });

  it('emits the complete proof and proposal through the same command', () => {
    const result = runCli([
      '--candidate',
      fixturePath('last-good.yaml'),
      '--contract',
      fixturePath('expected-contract.json'),
      '--last-good',
      fixturePath('last-good.yaml'),
      '--suspect',
      fixturePath('suspect.yaml'),
      '--deny-all',
      fixturePath('deny-all.yaml'),
    ]);
    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout) as Record<string, unknown>;
    expect(output).toMatchObject({ outcome: 'SECURITY_REMEDIATION_READY' });
    expect(output).toHaveProperty('proposal.proposal_hash_sha256');
    expect(output).toHaveProperty('four_state_verifier_result.states');
  });
});
