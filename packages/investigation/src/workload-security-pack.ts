import {
  EXACT_GITHUB_FILE_EVIDENCE,
  exactFileEvidenceIsBound,
  type FindingPackChangedFileEvidence,
} from './exact-file-evidence.js';
import { presentFindingPackAnalysis } from './finding-pack-summary.js';
import type { FindingPack } from './finding-packs.js';
import {
  analyzeWorkloadSecurity,
  extractSupportedWorkload,
  WORKLOAD_PACK_IDENTITY,
  WORKLOAD_RULE_ID_LIST,
  type WorkloadRuleId,
} from './workload-security.js';

export const WORKLOAD_ROUTES = Object.freeze({
  analysis: true,
  verifier: false,
  proposal: false,
  approval: false,
  github_writes: Object.freeze([] as const),
});

export const WORKLOAD_PACK: FindingPack<
  typeof WORKLOAD_PACK_IDENTITY,
  WorkloadRuleId,
  'ANALYSIS_ONLY'
> = Object.freeze({
  identity: WORKLOAD_PACK_IDENTITY,
  supported_file_kinds: Object.freeze(['v1/Pod', 'apps/v1/Deployment']),
  required_evidence: EXACT_GITHUB_FILE_EVIDENCE,
  deterministic_rules: WORKLOAD_RULE_ID_LIST,
  capability: 'ANALYSIS_ONLY',
  verifier_pack: null,
  routes: WORKLOAD_ROUTES,
  allowed_runtime_claims: ['repository manifest fact'],
  scope_predicate: (file: FindingPackChangedFileEvidence) =>
    exactFileEvidenceIsBound(file) && extractSupportedWorkload(file.content) !== undefined,
  analyze: analyzeWorkloadSecurity,
  presentation_adapter: presentFindingPackAnalysis,
});
