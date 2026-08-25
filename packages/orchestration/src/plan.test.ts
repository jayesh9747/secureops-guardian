import { describe, expect, it } from 'vitest';

import { planGuardianRun } from './plan.js';

const arbitraryScope = {
  schema_version: 1 as const,
  repository: 'octo-org/arbitrary-repository',
  base_branch: 'stable',
  suspect: {
    kind: 'commit' as const,
    commit_sha: 'c'.repeat(40),
  },
  target_file: 'deploy/network-policy.yaml',
};

describe('Guardian run planning', () => {
  it('parameterizes arbitrary-repository ANALYSIS_ONLY preflight and permits reads only', () => {
    const plan = planGuardianRun({ scope: arbitraryScope });

    expect(plan.mode).toBe('ANALYSIS_ONLY');
    expect(plan.preflight.github_reads).toEqual([
      {
        tool: 'list_branches',
        arguments: { owner: 'octo-org', repo: 'arbitrary-repository' },
      },
      {
        tool: 'get_commit',
        arguments: {
          owner: 'octo-org',
          repo: 'arbitrary-repository',
          sha: 'c'.repeat(40),
          detail: 'full_patch',
        },
      },
      {
        tool: 'get_file_contents',
        arguments: {
          owner: 'octo-org',
          repo: 'arbitrary-repository',
          path: 'deploy/network-policy.yaml',
          sha: 'c'.repeat(40),
        },
      },
    ]);
    expect(plan.capability_ceiling).toEqual({
      incident_fixture_reads: false,
      daytona_sandbox: false,
      github_writes: [],
    });
  });

  it('never gives PREPARE_REMEDIATION a GitHub write capability', () => {
    const plan = planGuardianRun({ mode: 'PREPARE_REMEDIATION', scope: arbitraryScope });

    expect(plan.capability_ceiling).toEqual({
      incident_fixture_reads: true,
      daytona_sandbox: true,
      github_writes: [],
    });
  });
});
