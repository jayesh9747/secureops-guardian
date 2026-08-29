import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { routeFindingPackAnalysis } from './finding-pack-routing.js';

const REPOSITORY = 'jayesh9747/guardian-demo-privileged-api';
const REVISION = '2c7bdb3e07714e08d9504b3504587fbf18847f29';
const FILE = 'k8s/api-deployment.yaml';
const BLOB_SHA = 'b1a60bb96fad7f93bc95536d08381e5629a6a7bd';
const manifest = readFileSync(
  new URL('../../investigation/fixtures/workload/privileged-deployment.yaml', import.meta.url),
  'utf8',
);
const manifestLines = (manifest.endsWith('\n') ? manifest.slice(0, -1) : manifest).split('\n');
const manifestPatch = `@@ -0,0 +1,${String(manifestLines.length)} @@\n${manifestLines
  .map((line) => `+${line}`)
  .join('\n')}`;

const naturalLanguageRequest = {
  source: 'NATURAL_LANGUAGE',
  user_text: `Analyze repository ${REPOSITORY}, base branch main, commit ${REVISION}, target file ${FILE}.`,
  draft: {
    schema_version: 1,
    intent: 'INVESTIGATION',
    requested_action: { kind: 'ANALYZE', evidence: 'Analyze' },
    repository: REPOSITORY,
    base_branch: 'main',
    suspect: { kind: 'commit', commit_sha: REVISION },
    target_file: FILE,
  },
} as const;

const changedFile = {
  repository: REPOSITORY,
  revision: REVISION,
  file: FILE,
  patch: manifestPatch,
  patch_sha256: createHash('sha256').update(manifestPatch).digest('hex'),
  content: manifest,
  git_blob_sha: BLOB_SHA,
  evidence_references: [
    {
      evidence_id: 'evidence:github:diff:privileged-api',
      source_ref: `github:${REPOSITORY}:commit:${REVISION}:file:${FILE}:patch`,
    },
    {
      evidence_id: 'evidence:github:manifest:privileged-api',
      source_ref: `github:${REPOSITORY}:blob:${BLOB_SHA}`,
    },
  ],
} as const;

describe('natural-language FindingPack routing', () => {
  it('routes exact changed-file evidence to workload analysis with no higher-capability route', () => {
    const result = routeFindingPackAnalysis(naturalLanguageRequest, [changedFile], {
      observed_at_ms: 2_500,
      children: [
        {
          child_id: 'child:github',
          agent: 'change-security-investigator',
          status: 'COMPLETED',
          started_at_ms: 1_000,
          completed_at_ms: 2_250,
          result: 'Collected the exact workload commit and manifest evidence.',
          tool_groups: [
            { provider: 'Official GitHub MCP', tools: ['get_commit', 'get_file_contents'] },
          ],
        },
      ],
      findings: ['Five deterministic workload findings require review.'],
      evidence: ['evidence:github:diff:privileged-api'],
      activity: ['The workload analysis child completed.'],
    });

    expect(result.request).toMatchObject({
      mode: 'ANALYSIS_ONLY',
      scope: { repository: REPOSITORY, target_file: FILE },
    });
    expect(result.analysis).toMatchObject({
      outcome: 'ANALYZED',
      pack: { pack_id: 'k8s-workload-security-v1' },
      capability: 'ANALYSIS_ONLY',
    });
    expect(result.capability_ceiling).toEqual({
      incident_fixture_reads: false,
      daytona_sandbox: false,
      proposal_creation: false,
      approval_request: false,
      github_writes: [],
    });
    expect(result.incident_brief).toMatchObject({
      terminal_status: 'FINDINGS',
      identity: {
        pack: { pack_id: 'k8s-workload-security-v1', capability: 'ANALYSIS_ONLY' },
      },
      disclosures: { verification: null, proposed_change: null },
      controls: [],
    });
    expect(result.openui).toContain('Tag("Pack: k8s-workload-security-v1@1.0.0"');
    expect(result.openui).not.toContain('TabItem("verification"');
    expect(result.openui).not.toContain('TabItem("proposed-change"');
    expect(result.artifacts?.verified_change).toBeNull();
    expect(result.investigation_rail).toMatchObject({
      child_rows: [
        {
          elapsed_ms: 1_250,
          tool_groups: [
            { provider: 'Official GitHub MCP', tools: ['get_commit', 'get_file_contents'] },
          ],
        },
      ],
    });
  });

  it('fails closed when changed-file evidence does not match the explicit target', () => {
    const result = routeFindingPackAnalysis(naturalLanguageRequest, [
      { ...changedFile, file: 'k8s/other.yaml' },
    ]);

    expect(result.analysis).toMatchObject({
      outcome: 'INCONCLUSIVE',
      routes: { verifier: false, proposal: false, approval: false, github_writes: [] },
    });
    expect(result.incident_brief).toMatchObject({
      terminal_status: 'INCONCLUSIVE',
      evidence_completeness: 'INCONCLUSIVE',
      disclosures: { verification: null, proposed_change: null },
      controls: [],
    });
    expect(result.artifacts?.verified_change).toBeNull();
    expect(result.openui).toContain('Tag("Status: Inconclusive"');
    expect(result.openui).not.toContain('TabItem("verification"');
    expect(result.openui).not.toContain('TabItem("proposed-change"');
  });

  it('returns a typed capability stop for an OPEN_PR workload request', () => {
    const result = routeFindingPackAnalysis(
      {
        mode: 'OPEN_PR',
        scope: {
          schema_version: 1,
          repository: REPOSITORY,
          base_branch: 'main',
          suspect: { kind: 'commit', commit_sha: REVISION },
          target_file: FILE,
        },
      },
      [changedFile],
    );

    expect(result.analysis).toMatchObject({
      outcome: 'INCONCLUSIVE',
      routes: { verifier: false, proposal: false, approval: false, github_writes: [] },
    });
    expect(result.capability_ceiling).toEqual({
      incident_fixture_reads: false,
      daytona_sandbox: false,
      proposal_creation: false,
      approval_request: false,
      github_writes: [],
    });
    expect(result.incident_brief).toMatchObject({
      terminal_status: 'INCONCLUSIVE',
      identity: { pack: { capability: 'ANALYSIS_ONLY' } },
      controls: [],
    });
  });
});
