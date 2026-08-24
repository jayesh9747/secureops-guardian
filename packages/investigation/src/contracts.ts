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

export const GITHUB_EVIDENCE_IDS = {
  suspectCommit: 'evidence:github:commit:suspect',
  parentCommit: 'evidence:github:commit:parent',
  targetDiff: 'evidence:github:diff:checkout-networkpolicy',
  suspectManifest: 'evidence:github:manifest:checkout-networkpolicy:suspect',
  remediationBranches: 'evidence:github:remediation-branches',
  remediationPullRequests: 'evidence:github:remediation-pull-requests',
} as const;

const githubEvidenceIdSchema = z.enum([
  GITHUB_EVIDENCE_IDS.suspectCommit,
  GITHUB_EVIDENCE_IDS.parentCommit,
  GITHUB_EVIDENCE_IDS.targetDiff,
  GITHUB_EVIDENCE_IDS.suspectManifest,
  GITHUB_EVIDENCE_IDS.remediationBranches,
  GITHUB_EVIDENCE_IDS.remediationPullRequests,
]);

export const githubEvidenceRecordSchema = z
  .object({
    evidence_id: githubEvidenceIdSchema,
    source: z.literal('official-github-mcp'),
    source_ref: z.string().min(1),
    tool: z.enum([
      'get_commit',
      'list_commits',
      'get_file_contents',
      'list_branches',
      'search_pull_requests',
    ]),
    fact: z.string().min(1),
    limitations: z.array(z.string().min(1)),
  })
  .strict();

const evidenceReferencesSchema = z
  .object({
    evidence_ids: z.array(githubEvidenceIdSchema).min(1),
    source_refs: z.array(z.string().min(1)).min(1),
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
        references: evidenceReferencesSchema,
      })
      .strict(),
    changed_file: z
      .object({
        path: z.literal(TARGET_NETWORK_POLICY_FILE),
        exact_diff: z.string().min(1),
        reconstructed_suspect_manifest_yaml: z.string().min(1),
        references: evidenceReferencesSchema,
      })
      .strict(),
    parsed_network_policy: z
      .object({
        api_version: z.literal('networking.k8s.io/v1'),
        kind: z.literal('NetworkPolicy'),
        name: z.literal('checkout-egress'),
        namespace: z.literal('payments'),
        selected_workload: z.object({ app: z.literal('checkout-api') }).strict(),
        egress_ip_block_cidrs: z.array(z.string().min(1)),
        references: evidenceReferencesSchema,
      })
      .strict(),
    existing_remediation: z
      .object({
        status: z.enum(['found', 'none', 'Unknown']),
        branch_names: z.array(z.string().min(1)),
        pull_request_urls: z.array(z.url()),
        references: evidenceReferencesSchema,
      })
      .strict(),
    evidence_records: z.array(githubEvidenceRecordSchema).min(1),
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
      for (const evidenceId of reference.evidence_ids) {
        const record = evidenceById.get(evidenceId);
        if (record === undefined) {
          context.addIssue({
            code: 'custom',
            message: `Referenced evidence ID is not present: ${evidenceId}`,
          });
          continue;
        }
        if (!reference.source_refs.includes(record.source_ref)) {
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

const phaseTwoCaseIdSchema = z.enum([
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
