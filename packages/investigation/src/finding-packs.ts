import type { VERIFIER_PACK_IDENTITY } from '@guardian/shared';

import {
  type FindingPackChangedFileEvidence,
  type FindingPackEvidenceContract,
  type FindingPackEvidenceReference,
} from './exact-file-evidence.js';
import { EGRESS_PACK } from './network-egress-pack.js';
import type { EGRESS_PACK_IDENTITY } from './network-egress-pack.js';
import type { SECURITY_RULE_ID, SecurityRuleResult } from './rule.js';
import type { WORKLOAD_PACK_IDENTITY, WorkloadRuleId } from './workload-security.js';
import { WORKLOAD_PACK, WORKLOAD_ROUTES } from './workload-security-pack.js';

export type FindingPackIdentity = typeof EGRESS_PACK_IDENTITY | typeof WORKLOAD_PACK_IDENTITY;
export type FindingPackRuleId = typeof SECURITY_RULE_ID | WorkloadRuleId;

export type FindingPackCapability = 'ANALYSIS_ONLY' | 'REMEDIATION_PROVEN' | 'OPEN_PR_ELIGIBLE';

export type FindingPackRoutes = {
  ANALYSIS_ONLY: {
    readonly analysis: true;
    readonly verifier: false;
    readonly proposal: false;
    readonly approval: false;
    readonly github_writes: readonly [];
  };
  REMEDIATION_PROVEN: {
    readonly analysis: true;
    readonly verifier: true;
    readonly proposal: true;
    readonly approval: false;
    readonly github_writes: readonly [];
  };
  OPEN_PR_ELIGIBLE: {
    readonly analysis: true;
    readonly verifier: true;
    readonly proposal: true;
    readonly approval: true;
    readonly github_writes: readonly [
      'create_branch',
      'create_or_update_file',
      'create_pull_request',
    ];
  };
};

type FindingPackVerifier<C extends FindingPackCapability> = C extends 'ANALYSIS_ONLY'
  ? null
  : typeof VERIFIER_PACK_IDENTITY;

export type {
  FindingPackChangedFileEvidence,
  FindingPackEvidenceContract,
  FindingPackEvidenceReference,
} from './exact-file-evidence.js';

export interface FindingPackFinding<R extends FindingPackRuleId = FindingPackRuleId> {
  readonly rule_id: R;
  readonly severity: 'High';
  readonly object_identity: {
    readonly api_version: string;
    readonly kind: string;
    readonly namespace: string;
    readonly name: string;
  };
  readonly container_identity: null | {
    readonly container_type: 'container' | 'initContainer' | 'ephemeralContainer';
    readonly name: string;
  };
  readonly json_path: string;
  readonly evidence_references: readonly FindingPackEvidenceReference[];
  readonly observed_value: unknown;
  readonly summary: string;
  readonly legacy_rule_result?: SecurityRuleResult;
}

export interface FindingPackAnalysis<
  C extends FindingPackCapability = FindingPackCapability,
  I extends FindingPackIdentity = FindingPackIdentity,
  R extends FindingPackRuleId = FindingPackRuleId,
> {
  readonly outcome: 'ANALYZED';
  readonly pack: I;
  readonly capability: C;
  readonly severity: 'High' | 'None';
  readonly repository: string;
  readonly revision: string;
  readonly file: string;
  readonly object_identity: FindingPackFinding['object_identity'];
  readonly evidence_references: readonly FindingPackEvidenceReference[];
  readonly findings: readonly FindingPackFinding<R>[];
  readonly claims: {
    readonly known: readonly string[];
    readonly refuted: readonly string[];
    readonly unknown: readonly string[];
  };
  readonly limitations: readonly string[];
}

export interface FindingPackInconclusive {
  readonly outcome: 'INCONCLUSIVE';
  readonly pack: null;
  readonly severity: 'Unknown';
  readonly missing_or_unsupported_requirements: readonly string[];
  readonly routes: FindingPackRoutes['ANALYSIS_ONLY'];
}

export type FindingPackExecution = FindingPackAnalysis | FindingPackInconclusive;

export interface FindingPackRequest {
  readonly requested_capability: FindingPackCapability;
  readonly changed_files: readonly FindingPackChangedFileEvidence[];
}

export interface FindingPackPresentation {
  readonly pack_label: string;
  readonly terminal_status: 'FINDINGS' | 'NO_DETERMINISTIC_FINDING';
  readonly finding_count: number;
  readonly headline: string;
  readonly next_action: string;
}

export interface FindingPack<
  I extends FindingPackIdentity,
  R extends FindingPackRuleId,
  C extends FindingPackCapability,
> {
  readonly identity: I;
  readonly supported_file_kinds: readonly string[];
  readonly required_evidence: FindingPackEvidenceContract;
  readonly deterministic_rules: readonly R[];
  readonly capability: C;
  readonly verifier_pack: FindingPackVerifier<C>;
  readonly routes: FindingPackRoutes[C];
  readonly allowed_runtime_claims: readonly string[];
  readonly scope_predicate: (file: FindingPackChangedFileEvidence) => boolean;
  readonly analyze: (file: FindingPackChangedFileEvidence) => FindingPackAnalysis<C, I, R>;
  readonly presentation_adapter: (analysis: FindingPackAnalysis) => FindingPackPresentation;
}

const REGISTERED_FINDING_PACKS = Object.freeze([EGRESS_PACK, WORKLOAD_PACK] as const);

export const FINDING_PACK_REGISTRY = Object.freeze({
  packs: REGISTERED_FINDING_PACKS,
  analyze(request: FindingPackRequest): FindingPackExecution {
    const matches = REGISTERED_FINDING_PACKS.flatMap((pack) =>
      request.changed_files
        .filter((file) => pack.scope_predicate(file))
        .map((file) => ({ pack, file })),
    );
    if (matches.length !== 1) {
      return {
        outcome: 'INCONCLUSIVE',
        pack: null,
        severity: 'Unknown',
        missing_or_unsupported_requirements: [
          matches.length === 0
            ? 'No changed file matches a supported finding pack with complete exact evidence.'
            : 'Changed-file evidence matches more than one finding pack; select one exact target file.',
        ],
        routes: WORKLOAD_ROUTES,
      };
    }
    const match = matches[0];
    if (match === undefined) throw new Error('Registry match disappeared.');
    const capabilityRank: Record<FindingPackCapability, number> = {
      ANALYSIS_ONLY: 0,
      REMEDIATION_PROVEN: 1,
      OPEN_PR_ELIGIBLE: 2,
    };
    if (capabilityRank[request.requested_capability] > capabilityRank[match.pack.capability]) {
      return {
        outcome: 'INCONCLUSIVE',
        pack: null,
        severity: 'Unknown',
        missing_or_unsupported_requirements: [
          `${match.pack.identity.pack_id} cannot satisfy ${request.requested_capability}.`,
        ],
        routes: WORKLOAD_ROUTES,
      };
    }
    return match.pack.capability === 'ANALYSIS_ONLY'
      ? WORKLOAD_PACK.analyze(match.file)
      : EGRESS_PACK.analyze(match.file);
  },
});
