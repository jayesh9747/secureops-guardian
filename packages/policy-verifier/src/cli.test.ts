import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { runVerifierCli } from './cli-runner.js';
import { REQUIRED_VERIFIER_PACK_FILES } from './pack.js';

const cliPath = fileURLToPath(new URL('./cli.ts', import.meta.url));
const fixturePath = (name: string) =>
  fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));
let packRoot = '';
let manifestSha256 = '';

function runCli(argumentsList: string[]) {
  return spawnSync(process.execPath, ['--import', 'tsx', cliPath, ...argumentsList], {
    encoding: 'utf8',
  });
}

function packArguments() {
  return ['--pack-root', packRoot, '--expected-manifest-sha256', manifestSha256];
}

async function runMountedCli(argumentsList: string[]) {
  const output: unknown[] = [];
  const exitCode = await runVerifierCli({
    argumentsList,
    requiredPackRoot: packRoot,
    emit: (value) => output.push(value),
  });
  return { exitCode, output };
}

beforeAll(async () => {
  packRoot = await mkdtemp(join(tmpdir(), 'guardian-cli-pack-'));
  await mkdir(join(packRoot, 'fixtures'));
  await writeFile(join(packRoot, 'SKILL.md'), 'known skill procedure\n', 'utf8');
  await writeFile(join(packRoot, 'verifier.bundle.cjs'), 'known verifier bundle\n', 'utf8');
  for (const name of [
    'expected-contract.json',
    'suspect.yaml',
    'deny-all.yaml',
    'last-good.yaml',
  ]) {
    await cp(fixturePath(name), join(packRoot, 'fixtures', name));
  }
  const files = await Promise.all(
    REQUIRED_VERIFIER_PACK_FILES.map(async (path) => ({
      path,
      sha256: createHash('sha256')
        .update(await readFile(join(packRoot, path)))
        .digest('hex'),
    })),
  );
  const manifestBytes = `${JSON.stringify(
    {
      schema_version: 1,
      pack_id: 'k8s-network-egress-v1',
      pack_version: '1.0.4',
      source_revision: 'guardian-network-egress-v1.0.4',
      supported_guardian_scope: {
        repository: 'jayesh9747/guardian-demo-checkout',
        base_branch: 'main',
        suspect_commit_sha: '7b2f2ad51f9ef97334176fbfed3138465b62fcdb',
        target_file: 'k8s/checkout-networkpolicy.yaml',
        api_version: 'networking.k8s.io/v1',
        kind: 'NetworkPolicy',
        verifier_subset: 'guardian-network-egress-v1',
      },
      files,
    },
    null,
    2,
  )}\n`;
  await writeFile(join(packRoot, 'manifest.json'), manifestBytes, 'utf8');
  manifestSha256 = createHash('sha256').update(manifestBytes).digest('hex');
});

afterAll(async () => {
  await rm(packRoot, { recursive: true, force: true });
});

describe('single stable JSON CLI', () => {
  it('reports the verified mounted pack before any candidate is supplied', async () => {
    const result = await runMountedCli(packArguments());

    expect(result).toMatchObject({
      exitCode: 0,
      output: [{ outcome: 'VERIFIER_PACK_READY' }],
    });
  });

  it.each([
    ['first rejected attempt', 'deny-all.yaml', '1', 1, 'CORRECTION_REQUIRED'],
    ['second rejected attempt', 'deny-all.yaml', '2', 1, 'NO_SAFE_REMEDIATION'],
    ['second corrected attempt', 'last-good.yaml', '2', 0, 'SECURITY_REMEDIATION_READY'],
  ])(
    'emits the bounded %s outcome',
    async (_label, candidateName, attempt, expectedExitCode, expectedOutcome) => {
      const result = await runMountedCli([
        ...packArguments(),
        '--candidate',
        fixturePath(candidateName),
        '--attempt',
        attempt,
      ]);

      expect(result.exitCode).toBe(expectedExitCode);
      expect(result.output).toHaveLength(1);
      expect(result.output[0]).toMatchObject({
        outcome: expectedOutcome,
        attempts_used: Number(attempt),
      });
    },
  );

  it('emits the four-state proof and writes the same eligible proposal', async () => {
    const proposalOutput = join(packRoot, 'proposal.json');
    const result = await runMountedCli([
      ...packArguments(),
      '--candidate',
      fixturePath('last-good.yaml'),
      '--attempt',
      '1',
      '--full-proof',
      'true',
      '--proposal-output',
      proposalOutput,
    ]);

    expect(result.exitCode).toBe(0);
    expect(result.output).toHaveLength(1);
    expect(result.output[0]).toMatchObject({
      outcome: 'SECURITY_REMEDIATION_READY',
      attempts_used: 1,
      four_state_verifier_result: {
        states: [
          { state: 'last-good', result: { eligible: true } },
          { state: 'suspect', result: { eligible: false } },
          { state: 'deny-all', result: { eligible: false } },
          { state: 'candidate', result: { eligible: true } },
        ],
      },
      proposal: {},
    });
    const emitted = result.output[0] as {
      proposal: { proposal_hash_sha256: string };
    };
    expect(emitted.proposal.proposal_hash_sha256).toMatch(/^[0-9a-f]{64}$/u);
    const writtenProposal = JSON.parse(await readFile(proposalOutput, 'utf8')) as unknown;
    expect(writtenProposal).toEqual(emitted.proposal);
  });

  it('maps a pack digest mismatch to VERIFIER_PACK_INVALID', async () => {
    const result = await runMountedCli([
      '--pack-root',
      packRoot,
      '--expected-manifest-sha256',
      '0'.repeat(64),
    ]);

    expect(result).toMatchObject({
      exitCode: 2,
      output: [{ outcome: 'VERIFIER_PACK_INVALID', code: 'PACK_MANIFEST_DIGEST_MISMATCH' }],
    });
  });

  it('rejects a generated substitute pack even when its self-computed digest is valid', () => {
    const result = runCli(packArguments());

    expect(result.status).toBe(2);
    expect(JSON.parse(result.stdout)).toMatchObject({
      outcome: 'CLI_ARGUMENT_ERROR',
    });
    expect(result.stdout).toContain('/opt/tf/skills/guardian-network-egress-v1');
  });

  it('rejects any third attempt at the CLI boundary', () => {
    const result = runCli([
      '--pack-root',
      '/opt/tf/skills/guardian-network-egress-v1',
      '--expected-manifest-sha256',
      manifestSha256,
      '--candidate',
      fixturePath('last-good.yaml'),
      '--attempt',
      '3',
    ]);
    expect(result.status).toBe(2);
    expect(JSON.parse(result.stdout)).toMatchObject({ outcome: 'CLI_ARGUMENT_ERROR' });
  });
});
