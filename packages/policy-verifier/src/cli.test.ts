import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

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
      pack_version: '1.0.0',
      source_revision: 'guardian-network-egress-v1.0.0',
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
  it('validates the complete pinned pack without reading or generating a candidate', () => {
    const result = runCli(packArguments());

    expect(result.status).toBe(0);
    expect(JSON.parse(result.stdout)).toMatchObject({
      outcome: 'VERIFIER_PACK_READY',
      verifier_pack: { pack_id: 'k8s-network-egress-v1', manifest_sha256: manifestSha256 },
    });
  });

  it('accepts an explicit candidate only through the validated pack contract', () => {
    const argumentsList = [...packArguments(), '--candidate', fixturePath('last-good.yaml')];
    const first = runCli(argumentsList);
    const second = runCli(argumentsList);
    expect(first.status).toBe(0);
    expect(first.stderr).toBe('');
    expect(first.stdout).toBe(second.stdout);
    expect(JSON.parse(first.stdout)).toMatchObject({
      outcome: 'SECURITY_REMEDIATION_READY',
      verifier_pack: { pack_id: 'k8s-network-egress-v1' },
      verifier_result: { classification: 'SECURE_AND_FUNCTIONAL', eligible: true },
    });
  });

  it('emits diagnostics and exits non-zero for a failed first candidate', () => {
    const result = runCli([...packArguments(), '--candidate', fixturePath('deny-all.yaml')]);
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout)).toMatchObject({
      outcome: 'CORRECTION_REQUIRED',
      attempts_remaining: 1,
    });
  });

  it('emits terminal NO_SAFE_REMEDIATION on the second failure', () => {
    const result = runCli([
      ...packArguments(),
      '--candidate',
      fixturePath('deny-all.yaml'),
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
      ...packArguments(),
      '--candidate',
      fixturePath('last-good.yaml'),
      '--attempt',
      '3',
    ]);
    expect(result.status).toBe(2);
    expect(JSON.parse(result.stdout)).toMatchObject({ outcome: 'CLI_ARGUMENT_ERROR' });
  });

  it('emits the pack-bound complete proof and proposal through the same command', () => {
    const result = runCli([
      ...packArguments(),
      '--candidate',
      fixturePath('last-good.yaml'),
      '--full-proof',
      'true',
    ]);
    expect(result.status).toBe(0);
    const output = JSON.parse(result.stdout) as Record<string, unknown>;
    expect(output).toMatchObject({ outcome: 'SECURITY_REMEDIATION_READY' });
    expect(output).toHaveProperty('proposal.proposal_hash_sha256');
    expect(output).toHaveProperty('proposal.verifier_pack_binding_sha256');
    expect(output).toHaveProperty('four_state_verifier_result.verifier_pack');
    expect(output).toHaveProperty('four_state_verifier_result.states');
  });
});
