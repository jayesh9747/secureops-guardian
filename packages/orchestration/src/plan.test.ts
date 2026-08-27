import { describe, expect, it } from 'vitest';

import { REQUIRED_VERIFIER_INPUTS } from './intent.js';
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
      proposal_creation: false,
      approval_request: false,
      github_writes: [],
    });
  });

  it('never gives PREPARE_REMEDIATION a GitHub write capability', () => {
    const plan = planGuardianRun({
      mode: 'PREPARE_REMEDIATION',
      scope: arbitraryScope,
      verifier_inputs: REQUIRED_VERIFIER_INPUTS,
    });

    expect(plan.capability_ceiling).toEqual({
      incident_fixture_reads: true,
      daytona_sandbox: true,
      proposal_creation: true,
      approval_request: false,
      github_writes: [],
    });
  });

  it('plans a comparison as an enumerated range instead of two point-commit patches', () => {
    const baseSha = 'a'.repeat(40);
    const headSha = 'b'.repeat(40);
    const plan = planGuardianRun({
      scope: {
        ...arbitraryScope,
        suspect: { kind: 'comparison', base_sha: baseSha, head_sha: headSha },
      },
    });

    expect(plan.preflight.github_reads).toContainEqual({
      tool: 'list_commits',
      arguments: {
        owner: 'octo-org',
        repo: 'arbitrary-repository',
        sha: headSha,
        perPage: 100,
      },
    });
    expect(
      plan.preflight.github_reads.some(
        (read) => read.tool === 'get_commit' && read.arguments.sha === baseSha,
      ),
    ).toBe(false);
    expect(plan.preflight.comparison_range).toEqual({
      base_sha: baseSha,
      head_sha: headSha,
      fetch_each_descendant_patch_with: {
        tool: 'get_commit',
        arguments: {
          owner: 'octo-org',
          repo: 'arbitrary-repository',
          detail: 'full_patch',
        },
      },
    });
  });
});
