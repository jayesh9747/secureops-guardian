import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { buildPhaseTenEvidenceMatrix } from './finding-pack-evidence.js';

const suspect = readFileSync(
  new URL('../../investigation/fixtures/workload/privileged-deployment.yaml', import.meta.url),
  'utf8',
);
const benign = readFileSync(
  new URL('../../investigation/fixtures/workload/benign-deployment.yaml', import.meta.url),
  'utf8',
);

describe('Phase 10 deterministic evidence matrix', () => {
  it('replays the live suspect, benign parent, capability stop, and frozen egress hash', () => {
    const matrix = buildPhaseTenEvidenceMatrix({ suspect, benign });

    expect(matrix.live_repository).toMatchObject({
      repository: 'jayesh9747/guardian-demo-privileged-api',
      revision: '2c7bdb3e07714e08d9504b3504587fbf18847f29',
      git_blob_sha: 'b1a60bb96fad7f93bc95536d08381e5629a6a7bd',
      pack_id: 'k8s-workload-security-v1',
      finding_count: 5,
      rule_ids: [
        'K8S-WORKLOAD-001',
        'K8S-WORKLOAD-002',
        'K8S-WORKLOAD-003',
        'K8S-WORKLOAD-004',
        'K8S-WORKLOAD-004',
      ],
    });
    expect(matrix.benign_parent).toMatchObject({
      revision: 'd2ee0cdc4e27cc8af671f4c0de15081d1c996e36',
      git_blob_sha: '3e8b0f62ef1ba0553b1b4b310444f9a207b9fc9a',
      finding_count: 0,
    });
    expect(matrix.workload_capability_stop).toEqual({
      outcome: 'INCONCLUSIVE',
      verifier: false,
      proposal: false,
      approval: false,
      github_writes: [],
    });
    expect(matrix.egress_proposal_hash).toBe(
      '2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15',
    );
  });
});
