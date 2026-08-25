import { parseGuardianRequest, type GuardianMode, type GuardianRequest } from './scope.js';

export const GITHUB_WRITE_TOOLS = [
  'create_branch',
  'create_or_update_file',
  'create_pull_request',
] as const;

type GitHubReadTool = 'list_branches' | 'list_commits' | 'get_commit' | 'get_file_contents';

export interface PlannedGitHubRead {
  tool: GitHubReadTool;
  arguments: Record<string, string | number>;
}

function capabilityCeiling(mode: GuardianMode) {
  return {
    incident_fixture_reads: mode !== 'ANALYSIS_ONLY',
    daytona_sandbox: mode !== 'ANALYSIS_ONLY',
    proposal_creation: mode !== 'ANALYSIS_ONLY',
    approval_request: mode === 'OPEN_PR',
    github_writes: mode === 'OPEN_PR' ? [...GITHUB_WRITE_TOOLS] : [],
  };
}

export function planGuardianRun(input: unknown) {
  const request = parseGuardianRequest(input);
  const [owner, repo] = request.scope.repository.split('/') as [string, string];
  const headSha =
    request.scope.suspect.kind === 'commit'
      ? request.scope.suspect.commit_sha
      : request.scope.suspect.head_sha;
  const githubReads: PlannedGitHubRead[] = [{ tool: 'list_branches', arguments: { owner, repo } }];
  const comparisonRange =
    request.scope.suspect.kind === 'comparison'
      ? {
          base_sha: request.scope.suspect.base_sha,
          head_sha: request.scope.suspect.head_sha,
          fetch_each_descendant_patch_with: {
            tool: 'get_commit' as const,
            arguments: { owner, repo, detail: 'full_patch' },
          },
        }
      : null;
  if (request.scope.suspect.kind === 'commit') {
    githubReads.push({
      tool: 'get_commit',
      arguments: { owner, repo, sha: request.scope.suspect.commit_sha, detail: 'full_patch' },
    });
  } else {
    githubReads.push({
      tool: 'list_commits',
      arguments: { owner, repo, sha: request.scope.suspect.head_sha, perPage: 100 },
    });
  }
  if (request.scope.target_file !== undefined) {
    githubReads.push({
      tool: 'get_file_contents',
      arguments: {
        owner,
        repo,
        path: request.scope.target_file,
        sha: headSha,
      },
    });
  }

  return {
    mode: request.mode,
    scope: request.scope,
    preflight: { github_reads: githubReads, comparison_range: comparisonRange },
    capability_ceiling: capabilityCeiling(request.mode),
  };
}

export type GuardianRunPlan = ReturnType<typeof planGuardianRun>;
export type { GuardianRequest };
