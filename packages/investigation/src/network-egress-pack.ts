import { VERIFIER_PACK_IDENTITY } from '@guardian/shared';

import {
  EXACT_GITHUB_FILE_EVIDENCE,
  exactFileEvidenceIsBound,
  type FindingPackChangedFileEvidence,
} from './exact-file-evidence.js';
import { presentFindingPackAnalysis } from './finding-pack-summary.js';
import type { FindingPack, FindingPackAnalysis, FindingPackFinding } from './finding-packs.js';
import { evaluateSecNet001, parseNetworkPolicyFacts, SECURITY_RULE_ID } from './rule.js';

export const EGRESS_PACK_IDENTITY = Object.freeze({
  pack_id: 'k8s-network-egress-v1',
  pack_version: '1.0.4',
} as const);

function egressScopePredicate(file: FindingPackChangedFileEvidence): boolean {
  if (!exactFileEvidenceIsBound(file)) return false;
  try {
    return parseNetworkPolicyFacts(file.content) !== undefined;
  } catch {
    return false;
  }
}

function analyzeEgress(
  file: FindingPackChangedFileEvidence,
): FindingPackAnalysis<'OPEN_PR_ELIGIBLE', typeof EGRESS_PACK_IDENTITY, typeof SECURITY_RULE_ID> {
  const facts = parseNetworkPolicyFacts(file.content);
  if (facts === undefined) throw new Error('Egress pack received evidence outside its scope.');
  const legacyRule = evaluateSecNet001(file.content);
  const findings: FindingPackFinding<typeof SECURITY_RULE_ID>[] =
    legacyRule.status === 'FAIL'
      ? [
          {
            rule_id: legacyRule.rule_id,
            severity: 'High',
            object_identity: {
              api_version: facts.api_version,
              kind: facts.kind,
              namespace: facts.namespace,
              name: facts.name,
            },
            container_identity: null,
            json_path: `$.${legacyRule.manifest_field}`,
            evidence_references: file.evidence_references,
            observed_value: legacyRule.observed_value,
            summary: 'NetworkPolicy contains unrestricted IPv4 egress.',
            legacy_rule_result: legacyRule,
          },
        ]
      : [];
  return {
    outcome: 'ANALYZED',
    pack: EGRESS_PACK_IDENTITY,
    capability: 'OPEN_PR_ELIGIBLE',
    severity: findings.length === 0 ? 'None' : 'High',
    repository: file.repository,
    revision: file.revision,
    file: file.file,
    object_identity: {
      api_version: facts.api_version,
      kind: facts.kind,
      namespace: facts.namespace,
      name: facts.name,
    },
    evidence_references: file.evidence_references,
    findings,
    claims: {
      known:
        findings.length === 0
          ? ['The bounded repository NetworkPolicy has no unrestricted IPv4 CIDR.']
          : ['The bounded repository NetworkPolicy contains unrestricted IPv4 egress.'],
      refuted: [],
      unknown: [
        'deployment',
        'runtime exposure',
        'data access',
        'exfiltration',
        'live-cluster behavior',
      ],
    },
    limitations: [legacyRule.limitation],
  };
}

export const EGRESS_PACK: FindingPack<
  typeof EGRESS_PACK_IDENTITY,
  typeof SECURITY_RULE_ID,
  'OPEN_PR_ELIGIBLE'
> = Object.freeze({
  identity: EGRESS_PACK_IDENTITY,
  supported_file_kinds: Object.freeze(['networking.k8s.io/v1/NetworkPolicy']),
  required_evidence: EXACT_GITHUB_FILE_EVIDENCE,
  deterministic_rules: Object.freeze([SECURITY_RULE_ID] as const),
  capability: 'OPEN_PR_ELIGIBLE',
  verifier_pack: VERIFIER_PACK_IDENTITY,
  routes: Object.freeze({
    analysis: true,
    verifier: true,
    proposal: true,
    approval: true,
    github_writes: Object.freeze([
      'create_branch',
      'create_or_update_file',
      'create_pull_request',
    ] as const),
  }),
  allowed_runtime_claims: ['repository manifest fact', 'static verifier result'],
  scope_predicate: egressScopePredicate,
  analyze: analyzeEgress,
  presentation_adapter: presentFindingPackAnalysis,
});
