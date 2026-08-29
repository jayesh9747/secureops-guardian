import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  exactFileEvidenceIsBound,
  type FindingPackChangedFileEvidence,
} from './exact-file-evidence.js';

const repository = 'jayesh9747/guardian-demo-privileged-api';
const revision = '2c7bdb3e07714e08d9504b3504587fbf18847f29';
const file = 'k8s/api-deployment.yaml';
const content = 'apiVersion: v1\nkind: Pod\n';

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function gitBlobSha(value: string): string {
  return createHash('sha1')
    .update(`blob ${String(Buffer.byteLength(value))}\0`)
    .update(value)
    .digest('hex');
}

function evidence(patch: string): FindingPackChangedFileEvidence {
  const git_blob_sha = gitBlobSha(content);
  return {
    repository,
    revision,
    file,
    patch,
    patch_sha256: sha256(patch),
    content,
    git_blob_sha,
    evidence_references: [
      {
        evidence_id: 'evidence:github:diff:workload',
        source_ref: `github:${repository}:commit:${revision}:file:${file}:patch`,
      },
      {
        evidence_id: 'evidence:github:manifest:workload',
        source_ref: `github:${repository}:blob:${git_blob_sha}`,
      },
    ],
  };
}

describe('exact changed-file evidence', () => {
  it('accepts an added postimage that matches the exact Git blob', () => {
    expect(exactFileEvidenceIsBound(evidence('@@ -0,0 +1,2 @@\n+apiVersion: v1\n+kind: Pod'))).toBe(
      true,
    );
  });

  it.each([
    ['zero-line deletion', '@@ -1 +1,0 @@\n-completely-fabricated'],
    ['deletion with matching context', '@@ -1,2 +1 @@\n-completely-fabricated\n apiVersion: v1'],
    ['out-of-range addition', '@@ -0,0 +999,1 @@\n+not-the-manifest'],
    ['zero-coordinate addition', '@@ -0,0 +0,1 @@\n+not-the-manifest'],
    [
      'multi-hunk deletion hidden behind a valid addition',
      '@@ -0,0 +1,1 @@\n+apiVersion: v1\n@@ -99,2 +2,1 @@\n-completely-fabricated\n kind: Pod',
    ],
  ])('rejects an unverifiable %s hunk', (_name, patch) => {
    expect(exactFileEvidenceIsBound(evidence(patch))).toBe(false);
  });
});
