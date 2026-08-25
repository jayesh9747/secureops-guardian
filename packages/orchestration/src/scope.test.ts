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
});
