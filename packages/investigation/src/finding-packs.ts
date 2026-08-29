import { createHash } from 'node:crypto';

import { VERIFIER_PACK_IDENTITY } from '@guardian/shared';

import {
  evaluateSecNet001,
  parseNetworkPolicyFacts,
  SECURITY_RULE_ID,
  type SecurityRuleResult,
} from './rule.js';
import {
  analyzeWorkloadSecurity,
  extractSupportedWorkload,
  WORKLOAD_PACK_IDENTITY,
  WORKLOAD_RULE_ID_LIST,
  type WorkloadRuleId,
} from './workload-security.js';

const EGRESS_PACK_IDENTITY = Object.freeze({
  pack_id: 'k8s-network-egress-v1',
  pack_version: '1.0.4',
} as const);
export type FindingPackIdentity = typeof EGRESS_PACK_IDENTITY | typeof WORKLOAD_PACK_IDENTITY;
export type FindingPackRuleId = typeof SECURITY_RULE_ID | WorkloadRuleId;

export type FindingPackCapability = 'ANALYSIS_ONLY' | 'REMEDIATION_PROVEN' | 'OPEN_PR_ELIGIBLE';

type FindingPackRoutes = {
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

export interface FindingPackEvidenceReference {
  readonly evidence_id: string;
  readonly source_ref: string;
}

export interface FindingPackChangedFileEvidence {
  readonly repository: string;
  readonly revision: string;
  readonly file: string;
  readonly patch: string;
  readonly content: string;
  readonly git_blob_sha: string;
  readonly evidence_references: readonly FindingPackEvidenceReference[];
}

export interface FindingPackFinding {
  readonly rule_id: FindingPackRuleId;
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

export interface FindingPackAnalysis<C extends FindingPackCapability = FindingPackCapability> {
  readonly outcome: 'ANALYZED';
  readonly pack: FindingPackIdentity;
  readonly capability: C;
  readonly severity: 'High' | 'None';
  readonly repository: string;
  readonly revision: string;
  readonly file: string;
  readonly object_identity: FindingPackFinding['object_identity'];
  readonly evidence_references: readonly FindingPackEvidenceReference[];
  readonly findings: readonly FindingPackFinding[];
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

export interface FindingPackEvidenceContract {
  readonly schema_version: 1;
  readonly required_fields: readonly [
    'repository',
    'revision',
    'file',
    'patch',
    'content',
    'git_blob_sha',
    'evidence_references',
  ];
  readonly exact_git_blob_required: true;
  readonly patch_and_blob_references_required: true;
}

export interface FindingPack<C extends FindingPackCapability = FindingPackCapability> {
  readonly identity: FindingPackIdentity;
  readonly supported_file_kinds: readonly string[];
  readonly required_evidence: FindingPackEvidenceContract;
  readonly deterministic_rules: readonly FindingPackRuleId[];
  readonly capability: C;
  readonly verifier_pack: FindingPackVerifier<C>;
  readonly routes: FindingPackRoutes[C];
  readonly allowed_runtime_claims: readonly string[];
  readonly scope_predicate: (file: FindingPackChangedFileEvidence) => boolean;
  readonly analyze: (file: FindingPackChangedFileEvidence) => FindingPackAnalysis<C>;
  readonly presentation_adapter: (analysis: FindingPackAnalysis) => FindingPackPresentation;
}

const EGRESS_ROUTES: FindingPackRoutes['OPEN_PR_ELIGIBLE'] = Object.freeze({
  analysis: true,
  verifier: true,
  proposal: true,
  approval: true,
  github_writes: Object.freeze([
    'create_branch',
    'create_or_update_file',
    'create_pull_request',
  ] as const),
});

const WORKLOAD_ROUTES: FindingPackRoutes['ANALYSIS_ONLY'] = Object.freeze({
  analysis: true,
  verifier: false,
  proposal: false,
  approval: false,
  github_writes: Object.freeze([] as const),
});

const EXACT_GITHUB_FILE_EVIDENCE: FindingPackEvidenceContract = Object.freeze({
  schema_version: 1,
  required_fields: Object.freeze([
    'repository',
    'revision',
    'file',
    'patch',
    'content',
    'git_blob_sha',
    'evidence_references',
  ] as const),
  exact_git_blob_required: true,
  patch_and_blob_references_required: true,
});

function gitBlobSha(content: string): string {
  return createHash('sha1')
    .update(`blob ${String(Buffer.byteLength(content))}\0`)
    .update(content)
    .digest('hex');
}

function patchMatchesPostimage(patch: string, content: string): boolean {
  const patchLines = patch.split('\n');
  const contentLines = content.endsWith('\n')
    ? content.slice(0, -1).split('\n')
    : content.split('\n');
  let foundHunk = false;
  for (let index = 0; index < patchLines.length; index += 1) {
    const header = patchLines[index];
    if (header === undefined || !header.startsWith('@@ ')) continue;
    const match = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/u.exec(header);
    if (match === null) return false;
    foundHunk = true;
    const newStart = Number(match[1]);
    const newCount = match[2] === undefined ? 1 : Number(match[2]);
    const postimage: string[] = [];
    for (index += 1; index < patchLines.length; index += 1) {
      const line = patchLines[index];
      if (line === undefined) return false;
      if (line.startsWith('@@ ')) {
        index -= 1;
        break;
      }
      if (line.startsWith(' ') || (line.startsWith('+') && !line.startsWith('+++'))) {
        postimage.push(line.slice(1));
      } else if (!line.startsWith('-') && !line.startsWith('\\ No newline at end of file')) {
        return false;
      }
    }
    if (postimage.length !== newCount) return false;
    if (
      contentLines.slice(newStart - 1, newStart - 1 + newCount).some((line, lineIndex) => {
        return line !== postimage[lineIndex];
      })
    ) {
      return false;
    }
  }
  return foundHunk;
}

function isSafeRepositoryRelativePath(rawPath: string): boolean {
  if (rawPath.length === 0 || rawPath.length > 1024) return false;
  let decodedPath = rawPath;
  for (let pass = 0; pass < rawPath.length; pass += 1) {
    let nextPath: string;
    try {
      nextPath = decodeURIComponent(decodedPath);
    } catch {
      return false;
    }
    if (nextPath === decodedPath) break;
    decodedPath = nextPath;
  }
  if (
    decodedPath.startsWith('/') ||
    decodedPath.includes('\\') ||
    [...decodedPath].some((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint <= 31 || (codePoint >= 127 && codePoint <= 159);
    })
  ) {
    return false;
  }
  return decodedPath
    .split('/')
    .every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

function evidenceIsBound(file: FindingPackChangedFileEvidence): boolean {
  const patchSource = `github:${file.repository}:commit:${file.revision}:file:${file.file}:patch`;
  const blobSource = `github:${file.repository}:blob:${file.git_blob_sha}`;
  return (
    /^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/u.test(file.repository) &&
    /^[0-9a-f]{40}$/u.test(file.revision) &&
    isSafeRepositoryRelativePath(file.file) &&
    file.patch.length > 0 &&
    patchMatchesPostimage(file.patch, file.content) &&
    /^[0-9a-f]{40}$/u.test(file.git_blob_sha) &&
    gitBlobSha(file.content) === file.git_blob_sha &&
    file.evidence_references.length >= 2 &&
    file.evidence_references.every(
      (reference) =>
        reference.evidence_id.startsWith('evidence:github:') &&
        (reference.source_ref === patchSource || reference.source_ref === blobSource),
    ) &&
    file.evidence_references.some((reference) => reference.source_ref === patchSource) &&
    file.evidence_references.some((reference) => reference.source_ref === blobSource)
  );
}

function egressScopePredicate(file: FindingPackChangedFileEvidence): boolean {
  if (!evidenceIsBound(file)) return false;
  try {
    return parseNetworkPolicyFacts(file.content) !== undefined;
  } catch {
    return false;
  }
}

function analyzeEgress(
  file: FindingPackChangedFileEvidence,
): FindingPackAnalysis<'OPEN_PR_ELIGIBLE'> {
  const facts = parseNetworkPolicyFacts(file.content);
  if (facts === undefined) throw new Error('Egress pack received evidence outside its scope.');
  const legacyRule = evaluateSecNet001(file.content);
  const findings: FindingPackFinding[] =
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

function presentAnalysis(analysis: FindingPackAnalysis): FindingPackPresentation {
  return {
    pack_label: `${analysis.pack.pack_id}@${analysis.pack.pack_version}`,
    terminal_status: analysis.findings.length === 0 ? 'NO_DETERMINISTIC_FINDING' : 'FINDINGS',
    finding_count: analysis.findings.length,
    headline:
      analysis.findings.length === 0
        ? 'No deterministic finding in the supported manifest scope'
        : `${String(analysis.findings.length)} deterministic security finding(s)`,
    next_action:
      analysis.capability === 'ANALYSIS_ONLY'
        ? 'Review the cited repository evidence; no remediation route is available.'
        : 'Use only the separately gated verifier and remediation route for this pack.',
  };
}

const EGRESS_PACK: FindingPack<'OPEN_PR_ELIGIBLE'> = Object.freeze({
  identity: EGRESS_PACK_IDENTITY,
  supported_file_kinds: Object.freeze(['networking.k8s.io/v1/NetworkPolicy']),
  required_evidence: EXACT_GITHUB_FILE_EVIDENCE,
  deterministic_rules: Object.freeze([SECURITY_RULE_ID] as const),
  capability: 'OPEN_PR_ELIGIBLE',
  verifier_pack: VERIFIER_PACK_IDENTITY,
  routes: EGRESS_ROUTES,
  allowed_runtime_claims: ['repository manifest fact', 'static verifier result'],
  scope_predicate: egressScopePredicate,
  analyze: analyzeEgress,
  presentation_adapter: presentAnalysis,
});

const WORKLOAD_PACK: FindingPack<'ANALYSIS_ONLY'> = Object.freeze({
  identity: WORKLOAD_PACK_IDENTITY,
  supported_file_kinds: Object.freeze(['v1/Pod', 'apps/v1/Deployment']),
  required_evidence: EXACT_GITHUB_FILE_EVIDENCE,
  deterministic_rules: WORKLOAD_RULE_ID_LIST,
  capability: 'ANALYSIS_ONLY',
  verifier_pack: null,
  routes: WORKLOAD_ROUTES,
  allowed_runtime_claims: ['repository manifest fact'],
  scope_predicate: (file: FindingPackChangedFileEvidence) =>
    evidenceIsBound(file) && extractSupportedWorkload(file.content) !== undefined,
  analyze: analyzeWorkloadSecurity,
  presentation_adapter: presentAnalysis,
});

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
    return match.pack.analyze(match.file);
  },
});
