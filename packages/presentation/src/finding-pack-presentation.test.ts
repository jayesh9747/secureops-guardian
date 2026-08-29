import { readFileSync } from 'node:fs';

import { FINDING_PACK_REGISTRY } from '@guardian/investigation';
import { describe, expect, it } from 'vitest';

import {
  buildFindingPackAnalysisPresentation,
  renderFindingPackAnalysisMarkdown,
  renderFindingPackAnalysisOpenUi,
} from './finding-pack-presentation.js';

const repository = 'jayesh9747/guardian-demo-privileged-api';
const revision = '2c7bdb3e07714e08d9504b3504587fbf18847f29';
const file = 'k8s/api-deployment.yaml';
const blobSha = 'b1a60bb96fad7f93bc95536d08381e5629a6a7bd';
const content = readFileSync(
  new URL('../../investigation/fixtures/workload/privileged-deployment.yaml', import.meta.url),
  'utf8',
);
const analysis = FINDING_PACK_REGISTRY.analyze({
  requested_capability: 'ANALYSIS_ONLY',
  changed_files: [
    {
      repository,
      revision,
      file,
      patch: '@@ -14,19 +14,20 @@ spec:',
      content,
      git_blob_sha: blobSha,
      evidence_references: [
        {
          evidence_id: 'evidence:github:diff:privileged-api',
          source_ref: `github:${repository}:commit:${revision}:file:${file}:patch`,
        },
        {
          evidence_id: 'evidence:github:manifest:privileged-api',
          source_ref: `github:${repository}:blob:${blobSha}`,
        },
      ],
    },
  ],
});

describe('workload FindingPack presentation mapping', () => {
  it('maps exact identity, JSONPath evidence, unknown claims, and analysis-only action', () => {
    if (analysis.outcome !== 'ANALYZED') throw new Error('Expected workload analysis.');
    const presentation = buildFindingPackAnalysisPresentation(analysis);

    expect(presentation).toMatchObject({
      terminal_status: 'FINDINGS',
      pack: { pack_id: 'k8s-workload-security-v1', pack_version: '1.0.0' },
      capability: 'ANALYSIS_ONLY',
      repository,
      revision,
      file,
      object_identity: {
        api_version: 'apps/v1',
        kind: 'Deployment',
        namespace: 'commerce',
        name: 'catalog-api',
      },
      next_action: 'Review the cited repository evidence; no remediation route is available.',
    });
    expect(presentation.findings[0]).toMatchObject({
      severity: 'High',
      json_path: '$.spec.template.spec.containers[0].securityContext.privileged',
    });
    expect(presentation.unknown_claims).toContain('live-cluster behavior');

    const markdown = renderFindingPackAnalysisMarkdown(presentation);
    const openui = renderFindingPackAnalysisOpenUi(presentation);
    expect(markdown).toContain('k8s-workload-security-v1@1.0.0');
    expect(markdown).toContain('- Severity: `High`');
    expect(markdown).toContain('ANALYSIS_ONLY');
    expect(markdown).toContain(
      'No verifier, proposal, approval, branch, commit, or PR was reached.',
    );
    expect(openui).toContain('root = Stack(');
    expect(openui).toContain('TabItem("evidence", "Evidence"');
    expect(openui).not.toContain('Prepare remediation');
    expect(openui).not.toContain('Open PR');
  });
});
