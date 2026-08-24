import { parseDocument } from 'yaml';
import { z } from 'zod';

import { TARGET_NETWORK_POLICY_FILE } from '@guardian/shared';

export const SECURITY_RULE_ID = 'SEC-NET-001';
export const UNRESTRICTED_IPV4_CIDR = '0.0.0.0/0';
export const NETWORK_POLICY_CIDR_FIELD = 'spec.egress[*].to[*].ipBlock.cidr';

export const securityRuleResultSchema = z
  .object({
    rule_id: z.literal(SECURITY_RULE_ID),
    status: z.enum(['PASS', 'FAIL']),
    file: z.literal(TARGET_NETWORK_POLICY_FILE),
    manifest_field: z.literal(NETWORK_POLICY_CIDR_FIELD),
    observed_value: z.string().nullable(),
    evidence_id: z.literal('evidence:rule:SEC-NET-001:checkout-networkpolicy'),
    source_ref: z.literal(
      'static-rule:SEC-NET-001:k8s/checkout-networkpolicy.yaml:spec.egress[*].to[*].ipBlock.cidr',
    ),
    limitation: z.literal(
      'Deterministic static manifest analysis only; this is not live-cluster reachability proof.',
    ),
  })
  .strict();

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getArray(record: JsonRecord, key: string): unknown[] {
  const value = record[key];
  return Array.isArray(value) ? value : [];
}

export function getEgressIpBlockCidrs(manifestYaml: string): string[] {
  const parsed: unknown = parseDocument(manifestYaml).toJS();
  if (!isRecord(parsed)) return [];
  const spec = parsed.spec;
  if (!isRecord(spec)) return [];

  const cidrs: string[] = [];
  for (const egressRule of getArray(spec, 'egress')) {
    if (!isRecord(egressRule)) continue;
    for (const target of getArray(egressRule, 'to')) {
      if (!isRecord(target)) continue;
      const ipBlock = target.ipBlock;
      if (!isRecord(ipBlock)) continue;
      const cidr = ipBlock.cidr;
      if (typeof cidr === 'string') cidrs.push(cidr);
    }
  }
  return cidrs;
}

export function evaluateSecNet001(manifestYaml: string): z.infer<typeof securityRuleResultSchema> {
  const cidrs = getEgressIpBlockCidrs(manifestYaml);
  const unrestricted = cidrs.find((cidr) => cidr === UNRESTRICTED_IPV4_CIDR) ?? null;

  return securityRuleResultSchema.parse({
    rule_id: SECURITY_RULE_ID,
    status: unrestricted === null ? 'PASS' : 'FAIL',
    file: TARGET_NETWORK_POLICY_FILE,
    manifest_field: NETWORK_POLICY_CIDR_FIELD,
    observed_value: unrestricted,
    evidence_id: 'evidence:rule:SEC-NET-001:checkout-networkpolicy',
    source_ref:
      'static-rule:SEC-NET-001:k8s/checkout-networkpolicy.yaml:spec.egress[*].to[*].ipBlock.cidr',
    limitation:
      'Deterministic static manifest analysis only; this is not live-cluster reachability proof.',
  });
}

export type SecurityRuleResult = z.infer<typeof securityRuleResultSchema>;
