import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import {
  loadVerifierPack,
  REQUIRED_VERIFIER_PACK_FILES,
  VerifierPackValidationError,
} from './pack.js';

const roots: string[] = [];
const scope = {
  repository: 'jayesh9747/guardian-demo-checkout',
  base_branch: 'main',
  suspect_commit_sha: '7b2f2ad51f9ef97334176fbfed3138465b62fcdb',
  target_file: 'k8s/checkout-networkpolicy.yaml',
  api_version: 'networking.k8s.io/v1',
  kind: 'NetworkPolicy',
  verifier_subset: 'guardian-network-egress-v1',
} as const;

async function createPack(overrides: Record<string, unknown> = {}) {
  const root = await mkdtemp(join(tmpdir(), 'guardian-pack-'));
  roots.push(root);
  const files = Object.fromEntries(
    REQUIRED_VERIFIER_PACK_FILES.map((path) => [path, `known bytes for ${path}\n`]),
  );
  for (const [path, contents] of Object.entries(files)) {
    await mkdir(join(root, path, '..'), { recursive: true });
    await writeFile(join(root, path), contents, 'utf8');
  }
  const manifest = {
    schema_version: 1,
    pack_id: 'k8s-network-egress-v1',
    pack_version: '1.0.0',
    source_revision: 'guardian-network-egress-v1.0.0',
    supported_guardian_scope: scope,
    files: REQUIRED_VERIFIER_PACK_FILES.map((path) => ({
      path,
      sha256: createHash('sha256')
        .update(files[path] ?? '')
        .digest('hex'),
    })),
    ...overrides,
  };
  const manifestBytes = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(join(root, 'manifest.json'), manifestBytes, 'utf8');
  return {
    root,
    manifest,
    expected: {
      pack_id: 'k8s-network-egress-v1',
      pack_version: '1.0.0',
      source_revision: 'guardian-network-egress-v1.0.0',
      manifest_sha256: createHash('sha256').update(manifestBytes).digest('hex'),
      supported_guardian_scope: scope,
    },
  };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('pinned verifier pack staging', () => {
  it('returns the manifest-bound pack identity only after every exact file digest passes', async () => {
    const pack = await createPack();

    await expect(
      loadVerifierPack({ pack_root: pack.root, expected: pack.expected }),
    ).resolves.toEqual({
      pack_id: 'k8s-network-egress-v1',
      pack_version: '1.0.0',
      source_revision: 'guardian-network-egress-v1.0.0',
      manifest_sha256: pack.expected.manifest_sha256,
    });
  });

  it('fails closed when the manifest or a required pack file is missing', async () => {
    const pack = await createPack();
    await rm(join(pack.root, 'fixtures/last-good.yaml'));

    await expect(
      loadVerifierPack({ pack_root: pack.root, expected: pack.expected }),
    ).rejects.toMatchObject({ code: 'PACK_FILE_MISSING' });
  });

  it('fails closed on any payload digest mismatch before returning a usable identity', async () => {
    const pack = await createPack();
    await writeFile(join(pack.root, 'verifier.bundle.cjs'), 'tampered\n', 'utf8');

    await expect(
      loadVerifierPack({ pack_root: pack.root, expected: pack.expected }),
    ).rejects.toBeInstanceOf(VerifierPackValidationError);
    await expect(
      loadVerifierPack({ pack_root: pack.root, expected: pack.expected }),
    ).rejects.toMatchObject({ code: 'PACK_FILE_DIGEST_MISMATCH' });
  });

  it.each([
    ['PACK_VERSION_MISMATCH', { pack_version: '2.0.0' }],
    [
      'PACK_SCOPE_MISMATCH',
      { supported_guardian_scope: { ...scope, target_file: 'k8s/other.yaml' } },
    ],
  ])('rejects an unpinned version or unsupported scope with %s', async (code, overrides) => {
    const pack = await createPack(overrides);

    await expect(
      loadVerifierPack({ pack_root: pack.root, expected: pack.expected }),
    ).rejects.toMatchObject({
      code,
    });
  });
});
