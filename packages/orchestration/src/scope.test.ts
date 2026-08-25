import { describe, expect, it } from 'vitest';

import { parseGuardianRequest } from './scope.js';

describe('repository scope', () => {
  it('defaults a full-SHA repository request to ANALYSIS_ONLY', () => {
    expect(
      parseGuardianRequest({
        scope: {
          schema_version: 1,
          repository: 'acme/payments',
          base_branch: 'release',
          suspect: {
            kind: 'commit',
            commit_sha: '1'.repeat(40),
          },
        },
      }),
    ).toEqual({
      mode: 'ANALYSIS_ONLY',
      scope: {
        schema_version: 1,
        repository: 'acme/payments',
        base_branch: 'release',
        suspect: {
          kind: 'commit',
          commit_sha: '1'.repeat(40),
        },
      },
    });
  });

  it('accepts an exact comparison range and optional target file', () => {
    expect(
      parseGuardianRequest({
        mode: 'PREPARE_REMEDIATION',
        scope: {
          schema_version: 1,
          repository: 'acme/payments',
          base_branch: 'main',
          suspect: {
            kind: 'comparison',
            base_sha: 'a'.repeat(40),
            head_sha: 'b'.repeat(40),
          },
          target_file: 'k8s/network-policy.yaml',
        },
      }).scope,
    ).toEqual({
      schema_version: 1,
      repository: 'acme/payments',
      base_branch: 'main',
      suspect: {
        kind: 'comparison',
        base_sha: 'a'.repeat(40),
        head_sha: 'b'.repeat(40),
      },
      target_file: 'k8s/network-policy.yaml',
    });

    expect(() =>
      parseGuardianRequest({
        scope: {
          schema_version: 1,
          repository: 'acme/payments',
          base_branch: 'main',
          suspect: { kind: 'commit', commit_sha: 'HEAD' },
        },
      }),
    ).toThrow('Expected a full Git commit SHA');
  });

  it.each(['../..', './repository', '-owner/repository', 'owner/..'])(
    'rejects unsafe repository identity %s',
    (repository) => {
      expect(() =>
        parseGuardianRequest({
          scope: {
            schema_version: 1,
            repository,
            base_branch: 'main',
            suspect: { kind: 'commit', commit_sha: 'c'.repeat(40) },
          },
        }),
      ).toThrow('Expected an owner/repository pair');
    },
  );

  it.each([
    '..\\..\\etc\\passwd',
    'k8s/%2e%2e/%2e%2e/secret',
    'k8s/%252e%252e/secret',
    'k8s/%252525252e%252525252e/secret',
    'k8s/a\nb.yaml',
  ])('rejects unsafe target path %s', (targetFile) => {
    expect(() =>
      parseGuardianRequest({
        scope: {
          schema_version: 1,
          repository: 'acme/payments',
          base_branch: 'main',
          suspect: { kind: 'commit', commit_sha: 'c'.repeat(40) },
          target_file: targetFile,
        },
      }),
    ).toThrow('Expected a repository-relative target file');
  });
});
