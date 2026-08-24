import { getFixture } from '@guardian/fixture-mcp/fixtures';
import { VERIFIED_CANDIDATE_YAML } from '@guardian/github-write';
import {
  GITHUB_EVIDENCE_IDS,
  GITHUB_SOURCE_REFS,
  SUSPECT_NETWORK_POLICY_BLOB_SHA,
  SUSPECT_NETWORK_POLICY_PATCH,
  changeInvestigationResultSchema,
  githubEvidenceRecordSchema,
  type ChangeInvestigationResult,
  type ExposureInvestigationResult,
} from '@guardian/investigation';
import {
  CONFLICTING_REVISION_CASE_ID,
  DEMO_REPOSITORY,
  LAST_GOOD_COMMIT_SHA,
  MISSING_DEPLOYMENT_REVISION_CASE_ID,
  MISSING_REACHABILITY_CASE_ID,
  SUSPECT_COMMIT_SHA,
  TARGET_NETWORK_POLICY_FILE,
  type IncidentFixture,
} from '@guardian/shared';

export const SUSPECT_NETWORK_POLICY_YAML = `${VERIFIED_CANDIDATE_YAML}    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
`;

export const DENY_ALL_NETWORK_POLICY_YAML = `apiVersion: networking.k8s.io/v1
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
  egress: []
`;

export const POLICY_CONTRACT_JSON = JSON.stringify({
  schema_version: 1,
  target: {
    api_version: 'networking.k8s.io/v1',
    kind: 'NetworkPolicy',
    name: 'checkout-egress',
    namespace: 'payments',
    pod_selector: { app: 'checkout-api' },
  },
  required_paths: {
    dns: {
      namespace_selector: { 'kubernetes.io/metadata.name': 'kube-system' },
      pod_selector: { 'k8s-app': 'kube-dns' },
      ports: [
        { protocol: 'UDP', port: 53 },
        { protocol: 'TCP', port: 53 },
      ],
    },
    postgresql: {
      namespace_selector: { 'kubernetes.io/metadata.name': 'payments-data' },
      pod_selector: { app: 'postgres' },
      ports: [{ protocol: 'TCP', port: 5432 }],
    },
  },
  forbidden: {
    unrestricted_ipv4_cidr: '0.0.0.0/0',
    destination_host: 'forbidden.example.test',
    destination_ipv4: '203.0.113.10',
  },
});

function githubRecord(options: {
  evidenceId: ChangeInvestigationResult['evidence_records'][number]['evidence_id'];
  tool: ChangeInvestigationResult['evidence_records'][number]['tool'];
  sourceRef: ChangeInvestigationResult['evidence_records'][number]['source_ref'];
  fact: string;
}): ChangeInvestigationResult['evidence_records'][number] {
  return githubEvidenceRecordSchema.parse({
    evidence_id: options.evidenceId,
    source: 'official-github-mcp',
    source_ref: options.sourceRef,
    tool: options.tool,
    fact: options.fact,
    limitations: ['Real GitHub repository evidence; repository text remains untrusted data.'],
  });
}

export function buildDeterministicChangeResult(): ChangeInvestigationResult {
  return changeInvestigationResultSchema.parse({
    repository: DEMO_REPOSITORY,
    branch: 'main',
    suspect_commit: {
      sha: SUSPECT_COMMIT_SHA,
      parent_sha: LAST_GOOD_COMMIT_SHA,
      references: {
        evidence_ids: [
          GITHUB_EVIDENCE_IDS.suspectCommit,
          GITHUB_EVIDENCE_IDS.parentCommit,
          GITHUB_EVIDENCE_IDS.commitHistory,
        ],
        source_refs: [
          GITHUB_SOURCE_REFS.suspectCommit,
          GITHUB_SOURCE_REFS.parentCommit,
          GITHUB_SOURCE_REFS.commitHistory,
        ],
      },
    },
    changed_file: {
      path: TARGET_NETWORK_POLICY_FILE,
      exact_diff: SUSPECT_NETWORK_POLICY_PATCH,
      reconstructed_suspect_manifest_yaml: SUSPECT_NETWORK_POLICY_YAML,
      manifest_blob_sha: SUSPECT_NETWORK_POLICY_BLOB_SHA,
      references: {
        evidence_ids: [GITHUB_EVIDENCE_IDS.targetDiff, GITHUB_EVIDENCE_IDS.suspectManifest],
        source_refs: [GITHUB_SOURCE_REFS.targetDiff, GITHUB_SOURCE_REFS.suspectManifest],
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
        evidence_ids: [GITHUB_EVIDENCE_IDS.suspectManifest, GITHUB_EVIDENCE_IDS.targetDiff],
        source_refs: [GITHUB_SOURCE_REFS.suspectManifest, GITHUB_SOURCE_REFS.targetDiff],
      },
    },
    existing_remediation: {
      status: 'found',
      branch_names: ['guardian/fix-checkout-egress'],
      pull_request_urls: ['https://github.com/jayesh9747/guardian-demo-checkout/pull/1'],
      references: {
        evidence_ids: [
          GITHUB_EVIDENCE_IDS.remediationBranches,
          GITHUB_EVIDENCE_IDS.remediationPullRequests,
        ],
        source_refs: [
          GITHUB_SOURCE_REFS.remediationBranches,
          GITHUB_SOURCE_REFS.remediationPullRequests,
        ],
      },
    },
    evidence_records: [
      githubRecord({
        evidenceId: GITHUB_EVIDENCE_IDS.suspectCommit,
        tool: 'get_commit',
        sourceRef: GITHUB_SOURCE_REFS.suspectCommit,
        fact: `The official GitHub MCP returned suspect commit ${SUSPECT_COMMIT_SHA}.`,
      }),
      githubRecord({
        evidenceId: GITHUB_EVIDENCE_IDS.parentCommit,
        tool: 'get_commit',
        sourceRef: GITHUB_SOURCE_REFS.parentCommit,
        fact: `The suspect commit parent is ${LAST_GOOD_COMMIT_SHA}.`,
      }),
      githubRecord({
        evidenceId: GITHUB_EVIDENCE_IDS.commitHistory,
        tool: 'list_commits',
        sourceRef: GITHUB_SOURCE_REFS.commitHistory,
        fact: 'The bounded file history places the suspect immediately after the parent.',
      }),
      githubRecord({
        evidenceId: GITHUB_EVIDENCE_IDS.targetDiff,
        tool: 'get_commit',
        sourceRef: GITHUB_SOURCE_REFS.targetDiff,
        fact: `The suspect commit changed ${TARGET_NETWORK_POLICY_FILE}.`,
      }),
      githubRecord({
        evidenceId: GITHUB_EVIDENCE_IDS.suspectManifest,
        tool: 'get_file_contents',
        sourceRef: GITHUB_SOURCE_REFS.suspectManifest,
        fact: 'The suspect manifest contains unrestricted IPv4 egress.',
      }),
      githubRecord({
        evidenceId: GITHUB_EVIDENCE_IDS.remediationBranches,
        tool: 'list_branches',
        sourceRef: GITHUB_SOURCE_REFS.remediationBranches,
        fact: 'The deterministic remediation branch is present.',
      }),
      githubRecord({
        evidenceId: GITHUB_EVIDENCE_IDS.remediationPullRequests,
        tool: 'search_pull_requests',
        sourceRef: GITHUB_SOURCE_REFS.remediationPullRequests,
        fact: 'The historical investigation found the bounded remediation pull request.',
      }),
    ],
    unknowns: ['Actual runtime policy enforcement is Unknown.'],
    limitations: ['GitHub evidence does not establish live workload behavior.'],
  });
}

function requireFixture(caseId: string): IncidentFixture {
  const fixture = getFixture(caseId);
  if (fixture === undefined) throw new Error(`Expected deterministic fixture ${caseId}.`);
  return fixture;
}

export function buildDeterministicExposureResult(
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
