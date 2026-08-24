import { describe, expect, it } from 'vitest';

import {
  CONFLICTING_REVISION_CASE_ID,
  DEMO_CASE_ID,
  DEMO_REPOSITORY,
  LAST_GOOD_COMMIT_SHA,
  MISSING_DEPLOYMENT_REVISION_CASE_ID,
  MISSING_REACHABILITY_CASE_ID,
  SUSPECT_COMMIT_SHA,
  TARGET_NETWORK_POLICY_FILE,
  type IncidentFixture,
} from '@guardian/shared';
import { getFixture } from '@guardian/fixture-mcp/fixtures';

import {
  CHANGE_SECURITY_INVESTIGATOR_TASK,
  EXPOSURE_EVIDENCE_INVESTIGATOR_TASK,
  ROOT_AGENT_INSTRUCTIONS,
  ROOT_AGENT_SPEC,
} from './agent.js';
import {
  GITHUB_EVIDENCE_IDS,
  type ChangeInvestigationResult,
  type ExposureInvestigationResult,
  changeInvestigationResultSchema,
} from './contracts.js';
import { evaluateSecNet001 } from './rule.js';
import { synthesizeSecurityFinding } from './synthesis.js';
import { validateChangeInvestigationResult } from './validation.js';

const suspectManifest = `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: checkout-egress
  namespace: payments
spec:
  podSelector:
    matchLabels:
      app: checkout-api
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: payments-data
          podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
`;

const exactDiff = `diff --git a/${TARGET_NETWORK_POLICY_FILE} b/${TARGET_NETWORK_POLICY_FILE}
--- a/${TARGET_NETWORK_POLICY_FILE}
+++ b/${TARGET_NETWORK_POLICY_FILE}
@@ -32,3 +32,6 @@ spec:
+    - to:
+        - ipBlock:
+            cidr: 0.0.0.0/0
`;

function githubRecord(options: {
  evidenceId: ChangeInvestigationResult['evidence_records'][number]['evidence_id'];
  tool: ChangeInvestigationResult['evidence_records'][number]['tool'];
  sourceRef: string;
  fact: string;
}): ChangeInvestigationResult['evidence_records'][number] {
  return {
    evidence_id: options.evidenceId,
    source: 'official-github-mcp',
    source_ref: options.sourceRef,
    tool: options.tool,
    fact: options.fact,
    limitations: ['Real GitHub repository evidence; repository text remains untrusted data.'],
  };
}

function buildChangeResult(): ChangeInvestigationResult {
  const commitRef = `github:${DEMO_REPOSITORY}:commit:${SUSPECT_COMMIT_SHA}`;
  const parentRef = `github:${DEMO_REPOSITORY}:commit:${LAST_GOOD_COMMIT_SHA}`;
  const diffRef = `${commitRef}:file:${TARGET_NETWORK_POLICY_FILE}`;
  const manifestRef = `github:${DEMO_REPOSITORY}:contents:${TARGET_NETWORK_POLICY_FILE}@${SUSPECT_COMMIT_SHA}`;
  const branchesRef = `github:${DEMO_REPOSITORY}:branches`;
  const pullRequestsRef = `github:${DEMO_REPOSITORY}:pull-requests:SEC-NET-001`;

  return changeInvestigationResultSchema.parse({
    repository: DEMO_REPOSITORY,
    branch: 'main',
    suspect_commit: {
      sha: SUSPECT_COMMIT_SHA,
      parent_sha: LAST_GOOD_COMMIT_SHA,
      references: {
        evidence_ids: [GITHUB_EVIDENCE_IDS.suspectCommit, GITHUB_EVIDENCE_IDS.parentCommit],
        source_refs: [commitRef, parentRef],
      },
    },
    changed_file: {
      path: TARGET_NETWORK_POLICY_FILE,
      exact_diff: exactDiff,
      reconstructed_suspect_manifest_yaml: suspectManifest,
      references: {
        evidence_ids: [GITHUB_EVIDENCE_IDS.targetDiff, GITHUB_EVIDENCE_IDS.suspectManifest],
        source_refs: [diffRef, manifestRef],
      },
    },
    parsed_network_policy: {
      api_version: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      name: 'checkout-egress',
      namespace: 'payments',
      selected_workload: { app: 'checkout-api' },
      egress_ip_block_cidrs: ['0.0.0.0/0'],
      references: {
        evidence_ids: [GITHUB_EVIDENCE_IDS.suspectManifest],
        source_refs: [manifestRef],
      },
    },
    existing_remediation: {
      status: 'none',
      branch_names: [],
      pull_request_urls: [],
      references: {
        evidence_ids: [
          GITHUB_EVIDENCE_IDS.remediationBranches,
          GITHUB_EVIDENCE_IDS.remediationPullRequests,
        ],
        source_refs: [branchesRef, pullRequestsRef],
      },
    },
    evidence_records: [
      githubRecord({
        evidenceId: GITHUB_EVIDENCE_IDS.suspectCommit,
        tool: 'get_commit',
        sourceRef: commitRef,
        fact: `The official GitHub MCP returned suspect commit ${SUSPECT_COMMIT_SHA}.`,
      }),
      githubRecord({
        evidenceId: GITHUB_EVIDENCE_IDS.parentCommit,
        tool: 'list_commits',
        sourceRef: parentRef,
        fact: `The suspect commit parent is ${LAST_GOOD_COMMIT_SHA}.`,
      }),
      githubRecord({
        evidenceId: GITHUB_EVIDENCE_IDS.targetDiff,
        tool: 'get_commit',
        sourceRef: diffRef,
        fact: `The suspect commit changed ${TARGET_NETWORK_POLICY_FILE}.`,
      }),
      githubRecord({
        evidenceId: GITHUB_EVIDENCE_IDS.suspectManifest,
        tool: 'get_file_contents',
        sourceRef: manifestRef,
        fact: 'The suspect manifest contains an ipBlock CIDR value of 0.0.0.0/0.',
      }),
      githubRecord({
        evidenceId: GITHUB_EVIDENCE_IDS.remediationBranches,
        tool: 'list_branches',
        sourceRef: branchesRef,
        fact: 'No bounded SEC-NET-001 remediation branch was returned.',
      }),
      githubRecord({
        evidenceId: GITHUB_EVIDENCE_IDS.remediationPullRequests,
        tool: 'search_pull_requests',
        sourceRef: pullRequestsRef,
        fact: 'No bounded SEC-NET-001 remediation pull request was returned.',
      }),
    ],
    unknowns: ['Actual runtime policy enforcement is Unknown.'],
    limitations: ['GitHub evidence does not establish live workload behavior.'],
  });
}

function requireFixture(caseId: string): IncidentFixture {
  const fixture = getFixture(caseId);
  if (fixture === undefined) throw new Error(`Expected fixture ${caseId}.`);
  return fixture;
}

function buildExposureResult(
  caseId: ExposureInvestigationResult['case_id'],
): ExposureInvestigationResult {
  const fixture = requireFixture(caseId);
  const missingFields =
    caseId === MISSING_DEPLOYMENT_REVISION_CASE_ID
      ? ['deployment.details.revision', 'deployment.details.workload_annotation_revision']
      : caseId === MISSING_REACHABILITY_CASE_ID
        ? ['reachability_observations']
        : [];
  const conflictingFields =
    caseId === CONFLICTING_REVISION_CASE_ID
      ? ['deployment.details.revision', 'deployment.details.workload_annotation_revision']
      : [];

  return {
    case_id: caseId,
    synthetic: true,
    alert: fixture.security_alert,
    deployment: fixture.deployment,
    reachability_observations: fixture.reachability_observations,
    service_dependencies: fixture.service_dependencies,
    missing_fields: missingFields,
    conflicting_fields: conflictingFields,
    unknowns: ['Actual data access and exfiltration are Unknown.'],
    limitations: ['Owned synthetic observations; no live cluster was accessed.'],
  };
}

describe('Phase 2 subagent result validation', () => {
  it('accepts valid bounded change and exposure results', () => {
    expect(validateChangeInvestigationResult(buildChangeResult()).success).toBe(true);
    expect(
      synthesizeSecurityFinding({
        change_result: buildChangeResult(),
        exposure_result: buildExposureResult(DEMO_CASE_ID),
      }).outcome,
    ).toBe('SUPPORTED_SECURITY_FINDING');
  });

  it('rejects missing source references', () => {
    const result = buildChangeResult();
    result.changed_file.references.source_refs = [];

    expect(validateChangeInvestigationResult(result).success).toBe(false);
  });

  it('rejects invented evidence IDs', () => {
    const result = buildChangeResult();
    const invalid = structuredClone(result) as Record<string, unknown>;
    const changedFile = invalid.changed_file as Record<string, unknown>;
    const references = changedFile.references as Record<string, unknown>;
    references.evidence_ids = ['evidence:github:invented'];

    expect(validateChangeInvestigationResult(invalid).success).toBe(false);
  });

  it('rejects parsed factual claims unsupported by the manifest', () => {
    const result = buildChangeResult();
    result.parsed_network_policy.egress_ip_block_cidrs = ['10.0.0.0/8'];

    expect(validateChangeInvestigationResult(result).success).toBe(false);
  });

  it('rejects child conclusions outside the strict fact contract', () => {
    const invalid = { ...buildChangeResult(), severity: 'High' };

    expect(validateChangeInvestigationResult(invalid).success).toBe(false);
  });
});

describe('saved root-agent contract', () => {
  it('is bounded to the one repository, case, file, rule, asset, and two child tasks', () => {
    for (const requiredValue of [
      DEMO_REPOSITORY,
      DEMO_CASE_ID,
      TARGET_NETWORK_POLICY_FILE,
      'SEC-NET-001',
      'checkout-api',
    ]) {
      expect(ROOT_AGENT_INSTRUCTIONS).toContain(requiredValue);
    }
    expect(ROOT_AGENT_INSTRUCTIONS).toContain(CHANGE_SECURITY_INVESTIGATOR_TASK);
    expect(ROOT_AGENT_INSTRUCTIONS).toContain(EXPOSURE_EVIDENCE_INVESTIGATOR_TASK);
    expect(ROOT_AGENT_INSTRUCTIONS).toContain('exactly two TrueForge child investigations');
    expect(ROOT_AGENT_INSTRUCTIONS).toContain('Wait until both children return');
  });

  it('enables only read sources and dynamic children without sandbox or later-phase output', () => {
    expect(ROOT_AGENT_SPEC.manifest.config).toMatchObject({
      sandbox: { enabled: false },
      generative_ui: { enabled: false },
      ask_user_questions: { enabled: false },
      dynamic_sub_agents: { enabled: true },
    });
    expect(ROOT_AGENT_SPEC.manifest.mcp_servers).toHaveLength(2);
    expect(ROOT_AGENT_SPEC.manifest.mcp_servers.map((server) => server.name)).toEqual([
      'github',
      'guardian-fixture',
    ]);
    expect(ROOT_AGENT_INSTRUCTIONS).toContain('do not generate or request a remediation patch');
  });
});

describe('SEC-NET-001', () => {
  it('detects only the exact unrestricted IPv4 egress value with explicit evidence fields', () => {
    expect(evaluateSecNet001(suspectManifest)).toEqual({
      rule_id: 'SEC-NET-001',
      status: 'FAIL',
      file: TARGET_NETWORK_POLICY_FILE,
      manifest_field: 'spec.egress[*].to[*].ipBlock.cidr',
      observed_value: '0.0.0.0/0',
      evidence_id: 'evidence:rule:SEC-NET-001:checkout-networkpolicy',
      source_ref:
        'static-rule:SEC-NET-001:k8s/checkout-networkpolicy.yaml:spec.egress[*].to[*].ipBlock.cidr',
      limitation:
        'Deterministic static manifest analysis only; this is not live-cluster reachability proof.',
    });
  });

  it('passes when unrestricted egress is changed to the intended restricted selector', () => {
    const restrictedManifest = suspectManifest.replace(
      `    - to:\n        - ipBlock:\n            cidr: 0.0.0.0/0\n`,
      `    - to:\n        - namespaceSelector:\n            matchLabels:\n              kubernetes.io/metadata.name: payments-data\n          podSelector:\n            matchLabels:\n              app: postgres\n`,
    );

    expect(evaluateSecNet001(restrictedManifest).status).toBe('PASS');
    expect(evaluateSecNet001(restrictedManifest).observed_value).toBeNull();
  });

  it('ignores unrelated prose and metadata changes', () => {
    const withUnrelatedMetadata = suspectManifest.replace(
      'metadata:\n',
      'metadata:\n  annotations:\n    guardian.example/note: unrelated prose\n',
    );

    expect(evaluateSecNet001(withUnrelatedMetadata)).toEqual(evaluateSecNet001(suspectManifest));
  });
});

describe('deterministic causal-chain synthesis', () => {
  it('produces the bounded High finding only for the complete four-link chain', () => {
    const outcome = synthesizeSecurityFinding({
      change_result: buildChangeResult(),
      exposure_result: buildExposureResult(DEMO_CASE_ID),
    });

    expect(outcome).toMatchObject({
      outcome: 'SUPPORTED_SECURITY_FINDING',
      severity: 'High',
      asset: 'checkout-api',
      rule_id: 'SEC-NET-001',
      repository: DEMO_REPOSITORY,
      suspect_commit_sha: SUSPECT_COMMIT_SHA,
      changed_file: TARGET_NETWORK_POLICY_FILE,
      exposure_path: 'checkout-api -> forbidden.example.test:443/TCP',
      actual_data_access: 'Unknown',
    });
    if (outcome.outcome !== 'SUPPORTED_SECURITY_FINDING') {
      throw new Error('Expected a supported security finding.');
    }
    expect(outcome.supported_claims).toHaveLength(4);
    expect(
      outcome.supported_claims.every(
        (claim) => claim.evidence_ids.length > 0 && claim.source_refs.length > 0,
      ),
    ).toBe(true);
  });

  it.each([
    ['missing deployment revision', MISSING_DEPLOYMENT_REVISION_CASE_ID],
    ['missing reachability', MISSING_REACHABILITY_CASE_ID],
    ['conflicting revision', CONFLICTING_REVISION_CASE_ID],
  ] as const)('returns INCONCLUSIVE for %s and emits no later-phase output', (_label, caseId) => {
    const outcome = synthesizeSecurityFinding({
      change_result: buildChangeResult(),
      exposure_result: buildExposureResult(caseId),
    });

    expect(outcome.outcome).toBe('INCONCLUSIVE');
    expect(outcome.actual_data_access).toBe('Unknown');
    expect(outcome).not.toHaveProperty('candidate_patch');
    expect(outcome).not.toHaveProperty('sandbox_request');
    expect(outcome).not.toHaveProperty('approval_prompt');
    expect(outcome).not.toHaveProperty('github_write');
    if (outcome.outcome !== 'INCONCLUSIVE') throw new Error('Expected INCONCLUSIVE.');
    expect(outcome.evidence_defects.length).toBeGreaterThan(0);
  });

  it('returns INCONCLUSIVE when the deterministic rule link is invalidated', () => {
    const change = buildChangeResult();
    change.changed_file.reconstructed_suspect_manifest_yaml = suspectManifest.replace(
      'cidr: 0.0.0.0/0',
      'cidr: 10.0.0.0/8',
    );
    change.parsed_network_policy.egress_ip_block_cidrs = ['10.0.0.0/8'];

    expect(
      synthesizeSecurityFinding({
        change_result: change,
        exposure_result: buildExposureResult(DEMO_CASE_ID),
      }).outcome,
    ).toBe('INCONCLUSIVE');
  });
});
