import { z } from 'zod';

import { DEMO_REPOSITORY, SUSPECT_COMMIT_SHA, TARGET_NETWORK_POLICY_FILE } from '@guardian/shared';

import { type ChangeInvestigationResult, type ExposureInvestigationResult } from './contracts.js';
import { SECURITY_RULE_ID, evaluateSecNet001 } from './rule.js';
import {
  validateChangeInvestigationResult,
  validateExposureInvestigationResult,
} from './validation.js';

const supportedClaimSchema = z
  .object({
    claim: z.enum([
      'suspect revision deployed',
      'suspect revision changed target NetworkPolicy',
      'target NetworkPolicy contains unrestricted IPv4 egress',
      'post-deployment forbidden reachability observed from checkout-api',
    ]),
    evidence_ids: z.array(z.string().min(1)).min(1),
    source_refs: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const supportedSecurityFindingSchema = z
  .object({
    outcome: z.literal('SUPPORTED_SECURITY_FINDING'),
    severity: z.literal('High'),
    asset: z.literal('checkout-api'),
    rule_id: z.literal(SECURITY_RULE_ID),
    repository: z.literal(DEMO_REPOSITORY),
    suspect_commit_sha: z.literal(SUSPECT_COMMIT_SHA),
    changed_file: z.literal(TARGET_NETWORK_POLICY_FILE),
    exposure_path: z.literal('checkout-api -> forbidden.example.test:443/TCP'),
    affected_scope: z.literal(
      'checkout-api pod identity in the owned synthetic payments namespace',
    ),
    actual_data_access: z.literal('Unknown'),
    validation_boundary: z.literal(
      'Real GitHub evidence, owned synthetic operational observations, and deterministic static policy analysis.',
    ),
    supported_claims: z.array(supportedClaimSchema).length(4),
    limitations: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const inconclusiveFindingSchema = z
  .object({
    outcome: z.literal('INCONCLUSIVE'),
    severity: z.literal('Unknown'),
    asset: z.literal('checkout-api'),
    rule_id: z.literal(SECURITY_RULE_ID),
    repository: z.literal(DEMO_REPOSITORY),
    actual_data_access: z.literal('Unknown'),
    evidence_defects: z.array(z.string().min(1)).min(1),
    unknown_claims: z.array(z.string().min(1)).min(1),
    limitations: z.array(z.string().min(1)).min(1),
  })
  .strict();

export const investigationOutcomeSchema = z.discriminatedUnion('outcome', [
  supportedSecurityFindingSchema,
  inconclusiveFindingSchema,
]);

const commonLimitations = [
  'Operational observations are owned synthetic fixtures, not live telemetry.',
  'Policy analysis is deterministic and static; no Kubernetes cluster was accessed.',
  'Reachability does not establish data access or exfiltration.',
];

function inconclusive(evidenceDefects: string[]): z.infer<typeof inconclusiveFindingSchema> {
  return inconclusiveFindingSchema.parse({
    outcome: 'INCONCLUSIVE',
    severity: 'Unknown',
    asset: 'checkout-api',
    rule_id: SECURITY_RULE_ID,
    repository: DEMO_REPOSITORY,
    actual_data_access: 'Unknown',
    evidence_defects: evidenceDefects,
    unknown_claims: [
      'Whether the suspect deployment caused the observed forbidden path is Unknown.',
      'Actual data access and exfiltration are Unknown.',
    ],
    limitations: commonLimitations,
  });
}

function collectGithubReferences(
  change: ChangeInvestigationResult,
  evidenceIds: string[],
): string[] {
  const wanted = new Set(evidenceIds);
  return change.evidence_records
    .filter((record) => wanted.has(record.evidence_id))
    .map((record) => record.source_ref);
}

function synthesizeValidated(options: {
  change: ChangeInvestigationResult;
  exposure: ExposureInvestigationResult;
}): z.infer<typeof investigationOutcomeSchema> {
  const { change, exposure } = options;
  const defects: string[] = [];
  const deployment = exposure.deployment;
  const revision = deployment.details.revision;
  const annotationRevision = deployment.details.workload_annotation_revision;

  if (
    deployment.details.workload !== 'checkout-api' ||
    deployment.details.namespace !== 'payments'
  ) {
    defects.push(`Deployment evidence ${deployment.evidence_id} does not name the bounded asset.`);
  }

  if (revision === null || annotationRevision === null) {
    defects.push(`Missing deployment revision in ${deployment.evidence_id}.`);
  } else if (revision !== annotationRevision) {
    defects.push(
      `Conflicting deployment revisions in ${deployment.evidence_id}: ledger ${revision}, annotation ${annotationRevision}.`,
    );
  } else if (revision !== change.suspect_commit.sha) {
    defects.push(
      `Deployment revision ${revision} does not match GitHub suspect revision ${change.suspect_commit.sha}.`,
    );
  }

  const rule = evaluateSecNet001(change.changed_file.suspect_manifest_yaml);
  if (rule.status !== 'FAIL' || rule.observed_value !== '0.0.0.0/0') {
    defects.push(`Rule ${SECURITY_RULE_ID} did not identify unrestricted IPv4 egress.`);
  }
  if (!change.parsed_network_policy.egress_ip_block_cidrs.includes('0.0.0.0/0')) {
    defects.push('Parsed NetworkPolicy facts do not report unrestricted IPv4 egress.');
  }

  const deploymentTime = Date.parse(deployment.details.deployed_at);
  const forbiddenReachability = exposure.reachability_observations.find(
    (observation) =>
      observation.details.source_workload === 'checkout-api' &&
      observation.details.source_namespace === 'payments' &&
      observation.details.destination_type === 'forbidden_external' &&
      observation.details.destination === 'forbidden.example.test' &&
      observation.details.destination_port === 443 &&
      observation.details.protocol === 'TCP' &&
      observation.details.outcome === 'allowed' &&
      Date.parse(observation.observed_at) > deploymentTime,
  );
  if (forbiddenReachability === undefined) {
    defects.push('Missing post-deployment forbidden reachability observation from checkout-api.');
  }

  const alert = exposure.alert;
  const alertMatches =
    alert.details.workload === 'checkout-api' &&
    alert.details.namespace === 'payments' &&
    alert.details.destination_host === 'forbidden.example.test' &&
    alert.details.destination_port === 443 &&
    alert.details.protocol === 'TCP' &&
    Date.parse(alert.observed_at) > deploymentTime;
  if (!alertMatches) defects.push('Missing matching post-deployment forbidden-path alert.');

  if (defects.length > 0) return inconclusive(defects);
  if (forbiddenReachability === undefined) {
    return inconclusive(['Missing post-deployment forbidden reachability observation.']);
  }

  const deploymentEvidenceIds = [deployment.evidence_id];
  const changeEvidenceIds = change.changed_file.references.evidence_ids;
  const ruleEvidenceIds = [rule.evidence_id];
  const exposureEvidenceIds = [alert.evidence_id, forbiddenReachability.evidence_id];

  return supportedSecurityFindingSchema.parse({
    outcome: 'SUPPORTED_SECURITY_FINDING',
    severity: 'High',
    asset: 'checkout-api',
    rule_id: SECURITY_RULE_ID,
    repository: DEMO_REPOSITORY,
    suspect_commit_sha: SUSPECT_COMMIT_SHA,
    changed_file: TARGET_NETWORK_POLICY_FILE,
    exposure_path: 'checkout-api -> forbidden.example.test:443/TCP',
    affected_scope: 'checkout-api pod identity in the owned synthetic payments namespace',
    actual_data_access: 'Unknown',
    validation_boundary:
      'Real GitHub evidence, owned synthetic operational observations, and deterministic static policy analysis.',
    supported_claims: [
      {
        claim: 'suspect revision deployed',
        evidence_ids: deploymentEvidenceIds,
        source_refs: [deployment.source_ref],
      },
      {
        claim: 'suspect revision changed target NetworkPolicy',
        evidence_ids: changeEvidenceIds,
        source_refs: collectGithubReferences(change, changeEvidenceIds),
      },
      {
        claim: 'target NetworkPolicy contains unrestricted IPv4 egress',
        evidence_ids: ruleEvidenceIds,
        source_refs: [rule.source_ref],
      },
      {
        claim: 'post-deployment forbidden reachability observed from checkout-api',
        evidence_ids: exposureEvidenceIds,
        source_refs: [alert.source_ref, forbiddenReachability.source_ref],
      },
    ],
    limitations: commonLimitations,
  });
}

export function synthesizeSecurityFinding(options: {
  change_result: unknown;
  exposure_result: unknown;
}): z.infer<typeof investigationOutcomeSchema> {
  const change = validateChangeInvestigationResult(options.change_result);
  const exposure = validateExposureInvestigationResult(options.exposure_result);
  const defects: string[] = [];
  if (!change.success) defects.push('Change-investigation result failed schema validation.');
  if (!exposure.success) defects.push('Exposure-investigation result failed schema validation.');
  if (!change.success || !exposure.success) return inconclusive(defects);

  return synthesizeValidated({ change: change.data, exposure: exposure.data });
}

export type InvestigationOutcome = z.infer<typeof investigationOutcomeSchema>;
