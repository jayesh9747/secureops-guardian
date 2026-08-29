import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import {
  SUSPECT_COMMIT_SHA,
  TARGET_NETWORK_POLICY_FILE,
  VERIFIER_PACK_IDENTITY,
} from '@guardian/shared';
import { describe, expect, expectTypeOf, it } from 'vitest';

import { FINDING_PACK_REGISTRY } from './finding-packs.js';
import { SUSPECT_NETWORK_POLICY_BLOB_SHA, SUSPECT_NETWORK_POLICY_PATCH } from './contracts.js';
import { evaluateSecNet001 } from './rule.js';

const suspectNetworkPolicy = readFileSync(
  new URL('../../policy-verifier/fixtures/suspect.yaml', import.meta.url),
  'utf8',
);
const privilegedDeployment = readFileSync(
  new URL('../fixtures/workload/privileged-deployment.yaml', import.meta.url),
  'utf8',
);
const missingAllowPrivilegeEscalationPod = readFileSync(
  new URL('../fixtures/workload/allow-privilege-escalation-missing-pod.yaml', import.meta.url),
  'utf8',
);
const falseAllowPrivilegeEscalationPod = readFileSync(
  new URL('../fixtures/workload/allow-privilege-escalation-false-pod.yaml', import.meta.url),
  'utf8',
);
const rootContradictionPod = readFileSync(
  new URL('../fixtures/workload/root-contradiction-pod.yaml', import.meta.url),
  'utf8',
);
const nonRootPod = readFileSync(
  new URL('../fixtures/workload/non-root-pod.yaml', import.meta.url),
  'utf8',
);
const podRootContainerOverridePod = readFileSync(
  new URL('../fixtures/workload/pod-root-container-override-pod.yaml', import.meta.url),
  'utf8',
);
const podRootContainerContradictionPod = readFileSync(
  new URL('../fixtures/workload/pod-root-container-contradiction-pod.yaml', import.meta.url),
  'utf8',
);
const unsafeCapabilitiesPod = readFileSync(
  new URL('../fixtures/workload/unsafe-capabilities-pod.yaml', import.meta.url),
  'utf8',
);
const restrictedCapabilitiesPod = readFileSync(
  new URL('../fixtures/workload/restricted-capabilities-pod.yaml', import.meta.url),
  'utf8',
);
const hostNamespacesPod = readFileSync(
  new URL('../fixtures/workload/host-namespaces-pod.yaml', import.meta.url),
  'utf8',
);
const noHostNamespacesPod = readFileSync(
  new URL('../fixtures/workload/no-host-namespaces-pod.yaml', import.meta.url),
  'utf8',
);
const hostPathPod = readFileSync(
  new URL('../fixtures/workload/hostpath-pod.yaml', import.meta.url),
  'utf8',
);
const safeVolumePod = readFileSync(
  new URL('../fixtures/workload/safe-volume-pod.yaml', import.meta.url),
  'utf8',
);
const multiContainerPod = readFileSync(
  new URL('../fixtures/workload/multi-container-pod.yaml', import.meta.url),
  'utf8',
);
const promptInjectionPod = readFileSync(
  new URL('../fixtures/workload/prompt-injection-pod.yaml', import.meta.url),
  'utf8',
);
const invalidWorkloadFixtures = [
  'malformed-yaml.yaml',
  'unsupported-statefulset.yaml',
  'multiple-documents.yaml',
  'malformed-security-context-pod.yaml',
].map((name) => ({
  name,
  content: readFileSync(new URL(`../fixtures/workload/${name}`, import.meta.url), 'utf8'),
}));

function blobSha(content: string): string {
  return createHash('sha1')
    .update(`blob ${String(Buffer.byteLength(content))}\0`)
    .update(content)
    .digest('hex');
}

function sha256(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function postimagePatch(content: string): string {
  const lines = (content.endsWith('\n') ? content.slice(0, -1) : content).split('\n');
  return `@@ -0,0 +1,${String(lines.length)} @@\n${lines.map((line) => `+${line}`).join('\n')}`;
}

function workloadRequest(content: string, gitBlobSha: string) {
  const patch = postimagePatch(content);
  return {
    requested_capability: 'ANALYSIS_ONLY' as const,
    changed_files: [
      {
        repository: 'jayesh9747/guardian-demo-privileged-api',
        revision: '2c7bdb3e07714e08d9504b3504587fbf18847f29',
        file: 'k8s/api-deployment.yaml',
        patch,
        patch_sha256: sha256(patch),
        content,
        git_blob_sha: gitBlobSha,
        evidence_references: [
          {
            evidence_id: 'evidence:github:diff:privileged-api',
            source_ref:
              'github:jayesh9747/guardian-demo-privileged-api:commit:2c7bdb3e07714e08d9504b3504587fbf18847f29:file:k8s/api-deployment.yaml:patch',
          },
          {
            evidence_id: 'evidence:github:manifest:privileged-api',
            source_ref: `github:jayesh9747/guardian-demo-privileged-api:blob:${gitBlobSha}`,
          },
        ],
      },
    ],
  };
}

describe('FindingPack registry contract', () => {
  it('exposes exactly the egress and workload packs with capability-bound routes', () => {
    expectTypeOf(FINDING_PACK_REGISTRY.packs[0].identity).toEqualTypeOf<{
      readonly pack_id: 'k8s-network-egress-v1';
      readonly pack_version: '1.0.4';
    }>();
    expectTypeOf(FINDING_PACK_REGISTRY.packs[0].deterministic_rules).toEqualTypeOf<
      readonly 'SEC-NET-001'[]
    >();
    expectTypeOf(FINDING_PACK_REGISTRY.packs[1].identity).toEqualTypeOf<{
      readonly pack_id: 'k8s-workload-security-v1';
      readonly pack_version: '1.0.0';
    }>();
    expectTypeOf(FINDING_PACK_REGISTRY.packs[1].deterministic_rules).toEqualTypeOf<
      readonly (
        | 'K8S-WORKLOAD-001'
        | 'K8S-WORKLOAD-002'
        | 'K8S-WORKLOAD-003'
        | 'K8S-WORKLOAD-004'
        | 'K8S-WORKLOAD-005'
        | 'K8S-WORKLOAD-006'
      )[]
    >();
    expect(
      FINDING_PACK_REGISTRY.packs.map((pack) => ({
        identity: pack.identity,
        capability: pack.capability,
        verifier_pack: pack.verifier_pack,
        routes: pack.routes,
      })),
    ).toEqual([
      {
        identity: { pack_id: 'k8s-network-egress-v1', pack_version: '1.0.4' },
        capability: 'OPEN_PR_ELIGIBLE',
        verifier_pack: VERIFIER_PACK_IDENTITY,
        routes: {
          analysis: true,
          verifier: true,
          proposal: true,
          approval: true,
          github_writes: ['create_branch', 'create_or_update_file', 'create_pull_request'],
        },
      },
      {
        identity: { pack_id: 'k8s-workload-security-v1', pack_version: '1.0.0' },
        capability: 'ANALYSIS_ONLY',
        verifier_pack: null,
        routes: {
          analysis: true,
          verifier: false,
          proposal: false,
          approval: false,
          github_writes: [],
        },
      },
    ]);
    expect(Object.isFrozen(FINDING_PACK_REGISTRY.packs)).toBe(true);
    for (const pack of FINDING_PACK_REGISTRY.packs) {
      expect(Object.isFrozen(pack)).toBe(true);
      expect(Object.isFrozen(pack.identity)).toBe(true);
      expect(Object.isFrozen(pack.routes)).toBe(true);
      expect(pack.required_evidence).toEqual({
        schema_version: 1,
        required_fields: [
          'repository',
          'revision',
          'file',
          'patch',
          'patch_sha256',
          'content',
          'git_blob_sha',
          'evidence_references',
        ],
        exact_git_blob_required: true,
        patch_and_blob_references_required: true,
      });
    }
  });

  it('adapts the existing egress rule without changing its deterministic output', () => {
    const result = FINDING_PACK_REGISTRY.analyze({
      requested_capability: 'OPEN_PR_ELIGIBLE',
      changed_files: [
        {
          repository: 'jayesh9747/guardian-demo-checkout',
          revision: SUSPECT_COMMIT_SHA,
          file: TARGET_NETWORK_POLICY_FILE,
          patch: SUSPECT_NETWORK_POLICY_PATCH,
          patch_sha256: sha256(SUSPECT_NETWORK_POLICY_PATCH),
          content: suspectNetworkPolicy,
          git_blob_sha: SUSPECT_NETWORK_POLICY_BLOB_SHA,
          evidence_references: [
            {
              evidence_id: 'evidence:github:diff:checkout-networkpolicy',
              source_ref: `github:jayesh9747/guardian-demo-checkout:commit:${SUSPECT_COMMIT_SHA}:file:${TARGET_NETWORK_POLICY_FILE}:patch`,
            },
            {
              evidence_id: 'evidence:github:manifest:checkout-networkpolicy:suspect',
              source_ref: `github:jayesh9747/guardian-demo-checkout:blob:${SUSPECT_NETWORK_POLICY_BLOB_SHA}`,
            },
          ],
        },
      ],
    });

    expect(result.outcome).toBe('ANALYZED');
    if (result.outcome !== 'ANALYZED') return;
    expect(result.pack).toEqual({
      pack_id: 'k8s-network-egress-v1',
      pack_version: '1.0.4',
    });
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]?.legacy_rule_result).toEqual(evaluateSecNet001(suspectNetworkPolicy));
  });

  it('extracts the live Deployment template and cites a privileged container exactly', () => {
    const result = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(privilegedDeployment, 'b1a60bb96fad7f93bc95536d08381e5629a6a7bd'),
    );

    expect(result.outcome).toBe('ANALYZED');
    if (result.outcome !== 'ANALYZED') return;
    expect(result.pack).toEqual({
      pack_id: 'k8s-workload-security-v1',
      pack_version: '1.0.0',
    });
    expect(result.object_identity).toEqual({
      api_version: 'apps/v1',
      kind: 'Deployment',
      namespace: 'commerce',
      name: 'catalog-api',
    });
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        rule_id: 'K8S-WORKLOAD-001',
        container_identity: { container_type: 'container', name: 'catalog-api' },
        json_path: '$.spec.template.spec.containers[0].securityContext.privileged',
        observed_value: true,
      }),
    );
  });

  it('reports missing allowPrivilegeEscalation and accepts an explicit false value', () => {
    const positive = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(
        missingAllowPrivilegeEscalationPod,
        blobSha(missingAllowPrivilegeEscalationPod),
      ),
    );
    const negative = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(falseAllowPrivilegeEscalationPod, blobSha(falseAllowPrivilegeEscalationPod)),
    );
    expect(positive.outcome).toBe('ANALYZED');
    expect(negative.outcome).toBe('ANALYZED');
    if (positive.outcome !== 'ANALYZED' || negative.outcome !== 'ANALYZED') return;

    expect(positive.findings).toContainEqual(
      expect.objectContaining({
        rule_id: 'K8S-WORKLOAD-002',
        container_identity: { container_type: 'container', name: 'app' },
        json_path: '$.spec.containers[0].securityContext.allowPrivilegeEscalation',
        observed_value: null,
      }),
    );
    expect(negative.findings.map((finding) => finding.rule_id)).not.toContain('K8S-WORKLOAD-002');
    expect(negative.findings.map((finding) => finding.rule_id)).not.toContain('K8S-WORKLOAD-001');
  });

  it('reports explicit root execution with its pod-level contradiction', () => {
    const positive = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(rootContradictionPod, blobSha(rootContradictionPod)),
    );
    const negative = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(nonRootPod, blobSha(nonRootPod)),
    );
    expect(positive.outcome).toBe('ANALYZED');
    expect(negative.outcome).toBe('ANALYZED');
    if (positive.outcome !== 'ANALYZED' || negative.outcome !== 'ANALYZED') return;

    expect(positive.findings).toContainEqual(
      expect.objectContaining({
        rule_id: 'K8S-WORKLOAD-003',
        container_identity: null,
        json_path: '$.spec.securityContext.runAsUser',
        observed_value: { runAsUser: 0, runAsNonRoot: true },
      }),
    );
    expect(negative.findings.map((finding) => finding.rule_id)).not.toContain('K8S-WORKLOAD-003');
  });

  it('reports Pod-level UID 0 even when a container overrides its effective user', () => {
    const overridden = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(podRootContainerOverridePod, blobSha(podRootContainerOverridePod)),
    );
    const contradiction = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(podRootContainerContradictionPod, blobSha(podRootContainerContradictionPod)),
    );
    expect(overridden.outcome).toBe('ANALYZED');
    expect(contradiction.outcome).toBe('ANALYZED');
    if (overridden.outcome !== 'ANALYZED' || contradiction.outcome !== 'ANALYZED') return;

    expect(overridden.findings.filter((finding) => finding.rule_id === 'K8S-WORKLOAD-003')).toEqual(
      [
        expect.objectContaining({
          container_identity: null,
          json_path: '$.spec.securityContext.runAsUser',
          observed_value: { runAsUser: 0, runAsNonRoot: null },
        }),
      ],
    );
    expect(
      contradiction.findings.filter((finding) => finding.rule_id === 'K8S-WORKLOAD-003'),
    ).toEqual([
      expect.objectContaining({
        container_identity: null,
        json_path: '$.spec.securityContext.runAsUser',
        observed_value: { runAsUser: 0, runAsNonRoot: null },
      }),
    ]);
  });

  it('reports unsafe added capabilities and a missing drop ALL independently', () => {
    const positive = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(unsafeCapabilitiesPod, blobSha(unsafeCapabilitiesPod)),
    );
    const negative = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(restrictedCapabilitiesPod, blobSha(restrictedCapabilitiesPod)),
    );
    expect(positive.outcome).toBe('ANALYZED');
    expect(negative.outcome).toBe('ANALYZED');
    if (positive.outcome !== 'ANALYZED' || negative.outcome !== 'ANALYZED') return;

    expect(
      positive.findings
        .filter((finding) => finding.rule_id === 'K8S-WORKLOAD-004')
        .map((finding) => [finding.json_path, finding.observed_value]),
    ).toEqual([
      ['$.spec.containers[0].securityContext.capabilities.drop', null],
      ['$.spec.containers[0].securityContext.capabilities.add[0]', 'SYS_ADMIN'],
    ]);
    expect(negative.findings.map((finding) => finding.rule_id)).not.toContain('K8S-WORKLOAD-004');
  });

  it('reports each enabled host namespace at its exact pod-spec path', () => {
    const positive = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(hostNamespacesPod, blobSha(hostNamespacesPod)),
    );
    const negative = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(noHostNamespacesPod, blobSha(noHostNamespacesPod)),
    );
    expect(positive.outcome).toBe('ANALYZED');
    expect(negative.outcome).toBe('ANALYZED');
    if (positive.outcome !== 'ANALYZED' || negative.outcome !== 'ANALYZED') return;

    expect(
      positive.findings
        .filter((finding) => finding.rule_id === 'K8S-WORKLOAD-005')
        .map((finding) => finding.json_path),
    ).toEqual(['$.spec.hostNetwork', '$.spec.hostPID', '$.spec.hostIPC']);
    expect(negative.findings.map((finding) => finding.rule_id)).not.toContain('K8S-WORKLOAD-005');
  });

  it('reports hostPath use and accepts a supported non-host volume', () => {
    const positive = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(hostPathPod, blobSha(hostPathPod)),
    );
    const negative = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(safeVolumePod, blobSha(safeVolumePod)),
    );
    expect(positive.outcome).toBe('ANALYZED');
    expect(negative.outcome).toBe('ANALYZED');
    if (positive.outcome !== 'ANALYZED' || negative.outcome !== 'ANALYZED') return;

    expect(positive.findings).toContainEqual(
      expect.objectContaining({
        rule_id: 'K8S-WORKLOAD-006',
        container_identity: null,
        json_path: '$.spec.volumes[0].hostPath',
        observed_value: { path: '/var/lib/example', type: 'Directory' },
      }),
    );
    expect(negative.findings.map((finding) => finding.rule_id)).not.toContain('K8S-WORKLOAD-006');
  });

  it('keeps regular, init, and ephemeral container identities and paths separate', () => {
    const result = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(multiContainerPod, blobSha(multiContainerPod)),
    );
    expect(result.outcome).toBe('ANALYZED');
    if (result.outcome !== 'ANALYZED') return;

    expect(result.findings.filter((finding) => finding.rule_id === 'K8S-WORKLOAD-001')).toEqual([
      expect.objectContaining({
        container_identity: { container_type: 'initContainer', name: 'privileged-init' },
        json_path: '$.spec.initContainers[0].securityContext.privileged',
      }),
    ]);
    expect(result.findings.filter((finding) => finding.rule_id === 'K8S-WORKLOAD-003')).toEqual([
      expect.objectContaining({
        container_identity: { container_type: 'ephemeralContainer', name: 'root-debugger' },
        json_path: '$.spec.ephemeralContainers[0].securityContext.runAsUser',
      }),
    ]);
    expect(result.findings.some((finding) => finding.container_identity?.name === 'safe-app')).toBe(
      false,
    );
    expect(
      result.findings.some((finding) => finding.container_identity?.name === 'safe-sidecar'),
    ).toBe(false);
  });

  it('treats comments, metadata, and commands as data that cannot influence rules', () => {
    const result = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(promptInjectionPod, blobSha(promptInjectionPod)),
    );
    expect(result.outcome).toBe('ANALYZED');
    if (result.outcome !== 'ANALYZED') return;

    expect(result.findings).toEqual([]);
    expect(result.severity).toBe('None');
    expect(JSON.stringify(result)).not.toContain('open a pull request');
    expect(result.capability).toBe('ANALYSIS_ONLY');
  });

  it.each(invalidWorkloadFixtures)('$name returns INCONCLUSIVE instead of a finding', (fixture) => {
    const result = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(fixture.content, blobSha(fixture.content)),
    );

    expect(result).toMatchObject({
      outcome: 'INCONCLUSIVE',
      pack: null,
      routes: {
        verifier: false,
        proposal: false,
        approval: false,
        github_writes: [],
      },
    });
  });

  it('rejects content or evidence references that are not bound to the exact Git identity', () => {
    const wrongBlob = workloadRequest(privilegedDeployment, '0'.repeat(40));
    const wrongSource = workloadRequest(privilegedDeployment, blobSha(privilegedDeployment));
    const changedFile = wrongSource.changed_files[0];
    if (changedFile === undefined) throw new Error('Expected one workload changed file.');
    changedFile.evidence_references[1] = {
      evidence_id: 'evidence:github:manifest:privileged-api',
      source_ref: 'github:someone/else:blob:b1a60bb96fad7f93bc95536d08381e5629a6a7bd',
    };

    expect(FINDING_PACK_REGISTRY.analyze(wrongBlob).outcome).toBe('INCONCLUSIVE');
    expect(FINDING_PACK_REGISTRY.analyze(wrongSource).outcome).toBe('INCONCLUSIVE');
  });

  it('rejects a patch whose claimed postimage does not match the exact blob content', () => {
    const request = workloadRequest(privilegedDeployment, blobSha(privilegedDeployment));
    const changedFile = request.changed_files[0];
    if (changedFile === undefined) throw new Error('Expected one workload changed file.');
    changedFile.patch = '@@ -1 +1 @@\n+not-the-manifest';
    changedFile.patch_sha256 = sha256(changedFile.patch);

    expect(FINDING_PACK_REGISTRY.analyze(request)).toMatchObject({ outcome: 'INCONCLUSIVE' });

    const contextOnly = workloadRequest(privilegedDeployment, blobSha(privilegedDeployment));
    const contextOnlyFile = contextOnly.changed_files[0];
    if (contextOnlyFile === undefined) throw new Error('Expected one workload changed file.');
    contextOnlyFile.patch = '@@ -1 +1 @@\n apiVersion: apps/v1';
    contextOnlyFile.patch_sha256 = sha256(contextOnlyFile.patch);
    expect(FINDING_PACK_REGISTRY.analyze(contextOnly)).toMatchObject({ outcome: 'INCONCLUSIVE' });
  });

  it('rejects deletion-only and out-of-range hunks that cannot bind to the exact postimage', () => {
    for (const forgedPatch of [
      '@@ -1 +1,0 @@\n-completely-fabricated',
      '@@ -1,2 +1 @@\n-completely-fabricated\n apiVersion: apps/v1',
      '@@ -0,0 +999,1 @@\n+not-the-manifest',
      '@@ -0,0 +0,1 @@\n+not-the-manifest',
    ]) {
      const request = workloadRequest(privilegedDeployment, blobSha(privilegedDeployment));
      const changedFile = request.changed_files[0];
      if (changedFile === undefined) throw new Error('Expected one workload changed file.');
      changedFile.patch = forgedPatch;
      changedFile.patch_sha256 = sha256(forgedPatch);

      expect(FINDING_PACK_REGISTRY.analyze(request)).toMatchObject({ outcome: 'INCONCLUSIVE' });
    }
  });

  it('rejects unsafe repository paths and non-canonical Kubernetes identities', () => {
    const unsafePath = workloadRequest(nonRootPod, blobSha(nonRootPod));
    const unsafeFile = unsafePath.changed_files[0];
    if (unsafeFile === undefined) throw new Error('Expected workload evidence.');
    unsafeFile.file = '../k8s/api-deployment.yaml';
    unsafeFile.evidence_references = [
      {
        evidence_id: 'evidence:github:diff:privileged-api',
        source_ref: `github:${unsafeFile.repository}:commit:${unsafeFile.revision}:file:${unsafeFile.file}:patch`,
      },
      {
        evidence_id: 'evidence:github:manifest:privileged-api',
        source_ref: `github:${unsafeFile.repository}:blob:${unsafeFile.git_blob_sha}`,
      },
    ];
    const unsafeIdentity = nonRootPod.replace('name: non-root', 'name: "[render](injection)"');

    expect(FINDING_PACK_REGISTRY.analyze(unsafePath).outcome).toBe('INCONCLUSIVE');
    expect(
      FINDING_PACK_REGISTRY.analyze(workloadRequest(unsafeIdentity, blobSha(unsafeIdentity)))
        .outcome,
    ).toBe('INCONCLUSIVE');

    for (const invalidName of ['a..b', 'a-.b', `${'a'.repeat(64)}.b`]) {
      const invalidIdentity = nonRootPod.replace('name: non-root', `name: ${invalidName}`);
      expect(
        FINDING_PACK_REGISTRY.analyze(workloadRequest(invalidIdentity, blobSha(invalidIdentity)))
          .outcome,
      ).toBe('INCONCLUSIVE');
    }
  });

  it('makes workload verification, proposal, approval, and write routes structurally unreachable', () => {
    const workloadPack = FINDING_PACK_REGISTRY.packs[1];
    expectTypeOf(workloadPack.capability).toEqualTypeOf<'ANALYSIS_ONLY'>();
    expectTypeOf(workloadPack.verifier_pack).toEqualTypeOf<null>();
    expectTypeOf(workloadPack.routes.verifier).toEqualTypeOf<false>();
    expectTypeOf(workloadPack.routes.proposal).toEqualTypeOf<false>();
    expectTypeOf(workloadPack.routes.approval).toEqualTypeOf<false>();
    expectTypeOf(workloadPack.routes.github_writes).toEqualTypeOf<readonly []>();
    expect(workloadPack).not.toHaveProperty('verify');
    expect(workloadPack).not.toHaveProperty('propose');
    expect(workloadPack).not.toHaveProperty('approve');
    expect(workloadPack).not.toHaveProperty('write');

    for (const requested_capability of ['REMEDIATION_PROVEN', 'OPEN_PR_ELIGIBLE'] as const) {
      const request = workloadRequest(privilegedDeployment, blobSha(privilegedDeployment));
      const result = FINDING_PACK_REGISTRY.analyze({ ...request, requested_capability });
      expect(result).toMatchObject({
        outcome: 'INCONCLUSIVE',
        pack: null,
        routes: {
          verifier: false,
          proposal: false,
          approval: false,
          github_writes: [],
        },
      });
    }
  });

  it('returns no invented finding for a benign workload and keeps live claims Unknown', () => {
    const result = FINDING_PACK_REGISTRY.analyze(workloadRequest(nonRootPod, blobSha(nonRootPod)));
    expect(result.outcome).toBe('ANALYZED');
    if (result.outcome !== 'ANALYZED') return;

    expect(result.findings).toEqual([]);
    expect(result.claims.unknown).toEqual([
      'deployment',
      'Pod Security Admission outcome',
      'runtime Pod state',
      'exploitability',
      'reachability',
      'data access',
      'exfiltration',
      'live-cluster behavior',
    ]);
    expect(result.limitations).toContain(
      'Deterministic repository manifest analysis only; no live Kubernetes cluster was accessed.',
    );
  });

  it('maps every live-repository finding to High severity and exact evidence', () => {
    const result = FINDING_PACK_REGISTRY.analyze(
      workloadRequest(privilegedDeployment, 'b1a60bb96fad7f93bc95536d08381e5629a6a7bd'),
    );
    expect(result.outcome).toBe('ANALYZED');
    if (result.outcome !== 'ANALYZED') return;

    expect(result.findings.length).toBeGreaterThan(0);
    expect(result.severity).toBe('High');
    for (const finding of result.findings) {
      expect(finding.severity).toBe('High');
      expect(finding.object_identity).toEqual(result.object_identity);
      expect(finding.json_path).toMatch(/^\$\./u);
      expect(finding.evidence_references).toEqual(result.evidence_references);
    }
  });

  it('returns the same INCONCLUSIVE route for ambiguous multi-pack remediation', () => {
    const egressFile = {
      repository: 'jayesh9747/guardian-demo-checkout',
      revision: SUSPECT_COMMIT_SHA,
      file: TARGET_NETWORK_POLICY_FILE,
      patch: SUSPECT_NETWORK_POLICY_PATCH,
      patch_sha256: sha256(SUSPECT_NETWORK_POLICY_PATCH),
      content: suspectNetworkPolicy,
      git_blob_sha: SUSPECT_NETWORK_POLICY_BLOB_SHA,
      evidence_references: [
        {
          evidence_id: 'evidence:github:diff:checkout-networkpolicy',
          source_ref: `github:jayesh9747/guardian-demo-checkout:commit:${SUSPECT_COMMIT_SHA}:file:${TARGET_NETWORK_POLICY_FILE}:patch`,
        },
        {
          evidence_id: 'evidence:github:manifest:checkout-networkpolicy:suspect',
          source_ref: `github:jayesh9747/guardian-demo-checkout:blob:${SUSPECT_NETWORK_POLICY_BLOB_SHA}`,
        },
      ],
    };
    const workloadFile = workloadRequest(
      privilegedDeployment,
      'b1a60bb96fad7f93bc95536d08381e5629a6a7bd',
    ).changed_files[0];
    if (workloadFile === undefined) throw new Error('Expected workload evidence.');

    const forward = FINDING_PACK_REGISTRY.analyze({
      requested_capability: 'OPEN_PR_ELIGIBLE',
      changed_files: [egressFile, workloadFile],
    });
    const reverse = FINDING_PACK_REGISTRY.analyze({
      requested_capability: 'OPEN_PR_ELIGIBLE',
      changed_files: [workloadFile, egressFile],
    });
    expect(forward).toEqual(reverse);
    expect(forward).toMatchObject({
      outcome: 'INCONCLUSIVE',
      missing_or_unsupported_requirements: [
        'Changed-file evidence matches more than one finding pack; select one exact target file.',
      ],
      routes: { verifier: false, proposal: false, approval: false, github_writes: [] },
    });
  });
});
