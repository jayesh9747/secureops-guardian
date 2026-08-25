import { parseGuardianRequest, type GuardianMode, type GuardianRequest } from './scope.js';

export const GITHUB_WRITE_TOOLS = [
  'create_branch',
  'create_or_update_file',
  'create_pull_request',
] as const;

type GitHubReadTool = 'list_branches' | 'get_commit' | 'get_file_contents';

export interface PlannedGitHubRead {
  tool: GitHubReadTool;
  arguments: Record<string, string>;
}

function capabilityCeiling(mode: GuardianMode) {
  return {
    incident_fixture_reads: mode !== 'ANALYSIS_ONLY',
    daytona_sandbox: mode !== 'ANALYSIS_ONLY',
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
  const revisions =
    request.scope.suspect.kind === 'commit'
      ? [request.scope.suspect.commit_sha]
      : [request.scope.suspect.base_sha, request.scope.suspect.head_sha];
  const githubReads: PlannedGitHubRead[] = [
    { tool: 'list_branches', arguments: { owner, repo } },
    ...revisions.map((sha): PlannedGitHubRead => ({
      tool: 'get_commit',
      arguments: { owner, repo, sha, detail: 'full_patch' },
    })),
  ];
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
    preflight: { github_reads: githubReads },
    capability_ceiling: capabilityCeiling(request.mode),
  };
}

export type GuardianRunPlan = ReturnType<typeof planGuardianRun>;
export type { GuardianRequest };
