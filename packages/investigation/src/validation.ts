import { createHash } from 'node:crypto';

import { z } from 'zod';

import { getFixture } from '@guardian/fixture-mcp/fixtures';

import {
  changeInvestigationResultSchema,
  exposureInvestigationResultSchema,
  SUSPECT_NETWORK_POLICY_BLOB_SHA,
  type ChangeInvestigationResult,
  type ExposureInvestigationResult,
} from './contracts.js';
import { parseNetworkPolicyFacts } from './rule.js';

export type ValidationResult<T> =
  { success: true; data: T } | { success: false; error: z.ZodError };

function customError(message: string): z.ZodError {
  return new z.ZodError([{ code: 'custom', path: [], message }]);
}

function normalizeManifest(manifestYaml: string): string {
  return `${manifestYaml.replace(/\n*$/u, '')}\n`;
}

function gitBlobSha(content: string): string {
  const byteLength = Buffer.byteLength(content);
  return createHash('sha1')
    .update(`blob ${String(byteLength)}\0`)
    .update(content)
    .digest('hex');
}

export function validateChangeInvestigationResult(
  value: unknown,
): ValidationResult<ChangeInvestigationResult> {
  const parsed = changeInvestigationResultSchema.safeParse(value);
  if (!parsed.success) return parsed;

  const manifest = normalizeManifest(parsed.data.changed_file.reconstructed_suspect_manifest_yaml);
  if (gitBlobSha(manifest) !== SUSPECT_NETWORK_POLICY_BLOB_SHA) {
    return {
      success: false,
      error: customError('Reconstructed manifest does not match the cited Git blob.'),
    };
  }

  let observedFacts: ReturnType<typeof parseNetworkPolicyFacts>;
  try {
    observedFacts = parseNetworkPolicyFacts(manifest);
  } catch {
    return { success: false, error: customError('Suspect manifest is not valid YAML.') };
  }

  if (observedFacts === undefined) {
    return {
      success: false,
      error: customError('Suspect manifest is not the bounded checkout NetworkPolicy.'),
    };
  }

  const childFacts = {
    api_version: parsed.data.parsed_network_policy.api_version,
    kind: parsed.data.parsed_network_policy.kind,
    name: parsed.data.parsed_network_policy.name,
    namespace: parsed.data.parsed_network_policy.namespace,
    selected_workload: parsed.data.parsed_network_policy.selected_workload,
    egress_ip_block_cidrs: parsed.data.parsed_network_policy.egress_ip_block_cidrs,
  };
  if (JSON.stringify(observedFacts) !== JSON.stringify(childFacts)) {
    return {
      success: false,
      error: customError('Parsed NetworkPolicy facts are unsupported by the cited manifest.'),
    };
  }

  return parsed;
}

export function validateExposureInvestigationResult(
  value: unknown,
): ValidationResult<ExposureInvestigationResult> {
  const parsed = exposureInvestigationResultSchema.safeParse(value);
  if (!parsed.success) return parsed;

  const fixture = getFixture(parsed.data.case_id);
  if (fixture === undefined) {
    return {
      success: false,
      error: customError('No canonical fixture exists for the bounded case.'),
    };
  }

  const canonicalSourcePayload = {
    alert: fixture.security_alert,
    deployment: fixture.deployment,
    reachability_observations: fixture.reachability_observations,
    service_dependencies: fixture.service_dependencies,
  };
  const childSourcePayload = {
    alert: parsed.data.alert,
    deployment: parsed.data.deployment,
    reachability_observations: parsed.data.reachability_observations,
    service_dependencies: parsed.data.service_dependencies,
  };
  if (JSON.stringify(canonicalSourcePayload) !== JSON.stringify(childSourcePayload)) {
    return {
      success: false,
      error: customError('Exposure evidence does not match the canonical Fixture MCP payload.'),
    };
  }

  return parsed;
}
