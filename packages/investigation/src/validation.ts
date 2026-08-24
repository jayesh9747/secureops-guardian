import { z } from 'zod';

import {
  CONFLICTING_REVISION_CASE_ID,
  DEMO_CASE_ID,
  MISSING_DEPLOYMENT_REVISION_CASE_ID,
  MISSING_REACHABILITY_CASE_ID,
} from '@guardian/shared';

import {
  changeInvestigationResultSchema,
  exposureInvestigationResultSchema,
  type ChangeInvestigationResult,
  type ExposureInvestigationResult,
} from './contracts.js';
import { getEgressIpBlockCidrs } from './rule.js';

export type ValidationResult<T> =
  { success: true; data: T } | { success: false; error: z.ZodError };

function customError(message: string): z.ZodError {
  return new z.ZodError([{ code: 'custom', path: [], message }]);
}

export function validateChangeInvestigationResult(
  value: unknown,
): ValidationResult<ChangeInvestigationResult> {
  const parsed = changeInvestigationResultSchema.safeParse(value);
  if (!parsed.success) return parsed;

  let observedCidrs: string[];
  try {
    observedCidrs = getEgressIpBlockCidrs(parsed.data.changed_file.suspect_manifest_yaml);
  } catch {
    return { success: false, error: customError('Suspect manifest is not valid YAML.') };
  }

  if (
    JSON.stringify(observedCidrs) !==
    JSON.stringify(parsed.data.parsed_network_policy.egress_ip_block_cidrs)
  ) {
    return {
      success: false,
      error: customError('Parsed NetworkPolicy facts are unsupported by the cited manifest.'),
    };
  }

  return parsed;
}

function expectedExposureEvidenceIds(caseId: ExposureInvestigationResult['case_id']): Set<string> {
  const suffixByCase = new Map([
    [DEMO_CASE_ID, ''],
    [MISSING_DEPLOYMENT_REVISION_CASE_ID, ':missing-deployment-revision'],
    [MISSING_REACHABILITY_CASE_ID, ':missing-reachability'],
    [CONFLICTING_REVISION_CASE_ID, ':conflicting-revision'],
  ]);
  const suffix = suffixByCase.get(caseId) ?? '';
  const baseIds = [
    'evidence:security-alert:checkout-egress:001',
    'evidence:deployment:checkout-api:001',
    'evidence:dependency:checkout-dns:001',
    'evidence:dependency:checkout-postgres:001',
  ];
  if (caseId !== MISSING_REACHABILITY_CASE_ID) {
    baseIds.push(
      'evidence:reachability:checkout-forbidden:001',
      'evidence:reachability:checkout-postgres:001',
    );
  }
  return new Set(baseIds.map((evidenceId) => `${evidenceId}${suffix}`));
}

export function validateExposureInvestigationResult(
  value: unknown,
): ValidationResult<ExposureInvestigationResult> {
  const parsed = exposureInvestigationResultSchema.safeParse(value);
  if (!parsed.success) return parsed;

  const evidence = [
    parsed.data.alert,
    parsed.data.deployment,
    ...parsed.data.reachability_observations,
    ...parsed.data.service_dependencies,
  ];
  const observedIds = new Set(evidence.map((item) => item.evidence_id));
  const expectedIds = expectedExposureEvidenceIds(parsed.data.case_id);
  const sameIds =
    observedIds.size === expectedIds.size &&
    [...expectedIds].every((item) => observedIds.has(item));
  if (!sameIds) {
    return {
      success: false,
      error: customError(
        'Exposure result is missing required source evidence or contains invented evidence.',
      ),
    };
  }

  return parsed;
}
