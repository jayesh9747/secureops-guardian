import { z } from 'zod';

import {
  CONFLICTING_REVISION_CASE_ID,
  DEMO_CASE_ID,
  DEMO_REPOSITORY,
  LAST_GOOD_COMMIT_SHA,
  MISSING_DEPLOYMENT_REVISION_CASE_ID,
  MISSING_REACHABILITY_CASE_ID,
  SUSPECT_COMMIT_SHA,
  TARGET_NETWORK_POLICY_FILE,
  deploymentEvidenceSchema,
  reachabilityEvidenceSchema,
  securityAlertEvidenceSchema,
  serviceDependencyEvidenceSchema,
} from '@guardian/shared';

import { parsedNetworkPolicyFactsSchema } from './rule.js';

export const GITHUB_EVIDENCE_IDS = {
  suspectCommit: 'evidence:github:commit:suspect',
  parentCommit: 'evidence:github:commit:parent',
  commitHistory: 'evidence:github:commit-history:checkout-networkpolicy',
  targetDiff: 'evidence:github:diff:checkout-networkpolicy',
  suspectManifest: 'evidence:github:manifest:checkout-networkpolicy:suspect',
  remediationBranches: 'evidence:github:remediation-branches',
  remediationPullRequests: 'evidence:github:remediation-pull-requests',
} as const;

export const SUSPECT_NETWORK_POLICY_BLOB_SHA = '477c7db7edd61de10fce67713d52e442f2358318';
export const SUSPECT_NETWORK_POLICY_PATCH = `@@ -32,3 +32,6 @@ spec:
       ports:
         - protocol: TCP
           port: 5432
+    - to:
+        - ipBlock:
+            cidr: 0.0.0.0/0`;

export const GITHUB_SOURCE_REFS = {
  suspectCommit: `github:${DEMO_REPOSITORY}:commit:${SUSPECT_COMMIT_SHA}`,
  parentCommit: `github:${DEMO_REPOSITORY}:commit:${LAST_GOOD_COMMIT_SHA}`,
  commitHistory: `github:${DEMO_REPOSITORY}:history:${TARGET_NETWORK_POLICY_FILE}@${SUSPECT_COMMIT_SHA}`,
  targetDiff: `github:${DEMO_REPOSITORY}:commit:${SUSPECT_COMMIT_SHA}:file:${TARGET_NETWORK_POLICY_FILE}:patch`,
  suspectManifest: `github:${DEMO_REPOSITORY}:blob:${SUSPECT_NETWORK_POLICY_BLOB_SHA}`,
  remediationBranches: `github:${DEMO_REPOSITORY}:branches`,
  remediationPullRequests: `github:${DEMO_REPOSITORY}:pull-requests:SEC-NET-001`,
} as const;

const githubEvidenceBaseShape = {
  source: z.literal('official-github-mcp'),
  fact: z.string().min(1),
  limitations: z.array(z.string().min(1)),
};

export const githubEvidenceRecordSchema = z.discriminatedUnion('evidence_id', [
  z
    .object({
      ...githubEvidenceBaseShape,
      evidence_id: z.literal(GITHUB_EVIDENCE_IDS.suspectCommit),
      source_ref: z.literal(GITHUB_SOURCE_REFS.suspectCommit),
      tool: z.literal('get_commit'),
    })
    .strict(),
  z
    .object({
      ...githubEvidenceBaseShape,
      evidence_id: z.literal(GITHUB_EVIDENCE_IDS.parentCommit),
      source_ref: z.literal(GITHUB_SOURCE_REFS.parentCommit),
      tool: z.literal('get_commit'),
    })
    .strict(),
  z
    .object({
      ...githubEvidenceBaseShape,
      evidence_id: z.literal(GITHUB_EVIDENCE_IDS.commitHistory),
      source_ref: z.literal(GITHUB_SOURCE_REFS.commitHistory),
      tool: z.literal('list_commits'),
    })
    .strict(),
  z
    .object({
      ...githubEvidenceBaseShape,
      evidence_id: z.literal(GITHUB_EVIDENCE_IDS.targetDiff),
      source_ref: z.literal(GITHUB_SOURCE_REFS.targetDiff),
      tool: z.literal('get_commit'),
    })
    .strict(),
  z
    .object({
      ...githubEvidenceBaseShape,
      evidence_id: z.literal(GITHUB_EVIDENCE_IDS.suspectManifest),
      source_ref: z.literal(GITHUB_SOURCE_REFS.suspectManifest),
      tool: z.literal('get_file_contents'),
    })
    .strict(),
  z
    .object({
      ...githubEvidenceBaseShape,
      evidence_id: z.literal(GITHUB_EVIDENCE_IDS.remediationBranches),
      source_ref: z.literal(GITHUB_SOURCE_REFS.remediationBranches),
      tool: z.literal('list_branches'),
    })
    .strict(),
  z
    .object({
      ...githubEvidenceBaseShape,
      evidence_id: z.literal(GITHUB_EVIDENCE_IDS.remediationPullRequests),
      source_ref: z.literal(GITHUB_SOURCE_REFS.remediationPullRequests),
      tool: z.literal('search_pull_requests'),
    })
    .strict(),
]);

const suspectCommitReferencesSchema = z
  .object({
    evidence_ids: z.tuple([
      z.literal(GITHUB_EVIDENCE_IDS.suspectCommit),
      z.literal(GITHUB_EVIDENCE_IDS.parentCommit),
      z.literal(GITHUB_EVIDENCE_IDS.commitHistory),
    ]),
    source_refs: z.tuple([
      z.literal(GITHUB_SOURCE_REFS.suspectCommit),
      z.literal(GITHUB_SOURCE_REFS.parentCommit),
      z.literal(GITHUB_SOURCE_REFS.commitHistory),
    ]),
  })
  .strict();

const changedFileReferencesSchema = z
  .object({
    evidence_ids: z.tuple([
      z.literal(GITHUB_EVIDENCE_IDS.targetDiff),
      z.literal(GITHUB_EVIDENCE_IDS.suspectManifest),
    ]),
    source_refs: z.tuple([
      z.literal(GITHUB_SOURCE_REFS.targetDiff),
      z.literal(GITHUB_SOURCE_REFS.suspectManifest),
    ]),
  })
  .strict();

const parsedPolicyReferencesSchema = z
  .object({
    evidence_ids: z.tuple([
      z.literal(GITHUB_EVIDENCE_IDS.suspectManifest),
      z.literal(GITHUB_EVIDENCE_IDS.targetDiff),
    ]),
    source_refs: z.tuple([
      z.literal(GITHUB_SOURCE_REFS.suspectManifest),
      z.literal(GITHUB_SOURCE_REFS.targetDiff),
    ]),
  })
  .strict();

const remediationReferencesSchema = z
  .object({
    evidence_ids: z.tuple([
      z.literal(GITHUB_EVIDENCE_IDS.remediationBranches),
      z.literal(GITHUB_EVIDENCE_IDS.remediationPullRequests),
    ]),
    source_refs: z.tuple([
      z.literal(GITHUB_SOURCE_REFS.remediationBranches),
      z.literal(GITHUB_SOURCE_REFS.remediationPullRequests),
    ]),
  })
  .strict();

export const changeInvestigationResultSchema = z
  .object({
    repository: z.literal(DEMO_REPOSITORY),
    branch: z.literal('main'),
    suspect_commit: z
      .object({
        sha: z.literal(SUSPECT_COMMIT_SHA),
        parent_sha: z.literal(LAST_GOOD_COMMIT_SHA),
        references: suspectCommitReferencesSchema,
      })
      .strict(),
    changed_file: z
      .object({
        path: z.literal(TARGET_NETWORK_POLICY_FILE),
        exact_diff: z.literal(SUSPECT_NETWORK_POLICY_PATCH),
        reconstructed_suspect_manifest_yaml: z.string().min(1),
        manifest_blob_sha: z.literal(SUSPECT_NETWORK_POLICY_BLOB_SHA),
        references: changedFileReferencesSchema,
      })
      .strict(),
    parsed_network_policy: parsedNetworkPolicyFactsSchema
      .extend({
        references: parsedPolicyReferencesSchema,
      })
      .strict(),
    existing_remediation: z
      .object({
        status: z.enum(['found', 'none', 'Unknown']),
        branch_names: z.array(z.string().min(1)),
        pull_request_urls: z.array(z.url()),
        references: remediationReferencesSchema,
      })
      .strict(),
    evidence_records: z.array(githubEvidenceRecordSchema).length(7),
    unknowns: z.array(z.string().min(1)),
    limitations: z.array(z.string().min(1)).min(1),
  })
  .strict()
  .superRefine((result, context) => {
    const evidenceById = new Map(
      result.evidence_records.map((record) => [record.evidence_id, record]),
    );
    if (evidenceById.size !== result.evidence_records.length) {
      context.addIssue({ code: 'custom', message: 'Evidence IDs must be unique.' });
    }

    const references = [
      result.suspect_commit.references,
      result.changed_file.references,
      result.parsed_network_policy.references,
      result.existing_remediation.references,
    ];
    for (const reference of references) {
      const sourceRefs = new Set<string>(reference.source_refs);
      for (const evidenceId of reference.evidence_ids) {
        const record = evidenceById.get(evidenceId);
        if (record === undefined) {
          context.addIssue({
            code: 'custom',
            message: `Referenced evidence ID is not present: ${evidenceId}`,
          });
          continue;
        }
        if (!sourceRefs.has(record.source_ref)) {
          context.addIssue({
            code: 'custom',
            message: `Source reference is missing for evidence ID: ${evidenceId}`,
          });
        }
      }
    }

    if (
      result.existing_remediation.status === 'found' &&
      result.existing_remediation.branch_names.length === 0 &&
      result.existing_remediation.pull_request_urls.length === 0
    ) {
      context.addIssue({
        code: 'custom',
        message: 'A found remediation requires a cited branch or pull request.',
      });
    }
    if (
      result.existing_remediation.status === 'none' &&
      (result.existing_remediation.branch_names.length > 0 ||
        result.existing_remediation.pull_request_urls.length > 0)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'A none remediation status cannot include a branch or pull request.',
      });
    }
  });

export const phaseTwoCaseIdSchema = z.enum([
  DEMO_CASE_ID,
  MISSING_DEPLOYMENT_REVISION_CASE_ID,
  MISSING_REACHABILITY_CASE_ID,
  CONFLICTING_REVISION_CASE_ID,
]);

export const exposureInvestigationResultSchema = z
  .object({
    case_id: phaseTwoCaseIdSchema,
    synthetic: z.literal(true),
    alert: securityAlertEvidenceSchema,
    deployment: deploymentEvidenceSchema,
    reachability_observations: z.array(reachabilityEvidenceSchema),
    service_dependencies: z.array(serviceDependencyEvidenceSchema).min(1),
    missing_fields: z.array(z.string().min(1)),
    conflicting_fields: z.array(z.string().min(1)),
    unknowns: z.array(z.string().min(1)),
    limitations: z.array(z.string().min(1)).min(1),
  })
  .strict()
  .superRefine((result, context) => {
    const evidence = [
      result.alert,
      result.deployment,
      ...result.reachability_observations,
      ...result.service_dependencies,
    ];
    const evidenceIds = evidence.map((item) => item.evidence_id);
    if (new Set(evidenceIds).size !== evidenceIds.length) {
      context.addIssue({ code: 'custom', message: 'Evidence IDs must be unique.' });
    }

    const suffixByCase = new Map([
      [DEMO_CASE_ID, ''],
      [MISSING_DEPLOYMENT_REVISION_CASE_ID, ':missing-deployment-revision'],
      [MISSING_REACHABILITY_CASE_ID, ':missing-reachability'],
      [CONFLICTING_REVISION_CASE_ID, ':conflicting-revision'],
    ]);
    const suffix = suffixByCase.get(result.case_id);
    if (suffix === undefined) return;

    const allowedBaseIds = [
      'evidence:security-alert:checkout-egress:001',
      'evidence:deployment:checkout-api:001',
      'evidence:reachability:checkout-forbidden:001',
      'evidence:reachability:checkout-postgres:001',
      'evidence:dependency:checkout-dns:001',
      'evidence:dependency:checkout-postgres:001',
    ];
    const allowedIds = new Set(allowedBaseIds.map((evidenceId) => `${evidenceId}${suffix}`));
    for (const evidenceId of evidenceIds) {
      if (!allowedIds.has(evidenceId)) {
        context.addIssue({ code: 'custom', message: `Unknown evidence ID: ${evidenceId}` });
      }
    }
  });

export type ChangeInvestigationResult = z.infer<typeof changeInvestigationResultSchema>;
export type ExposureInvestigationResult = z.infer<typeof exposureInvestigationResultSchema>;
