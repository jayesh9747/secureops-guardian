import { z } from 'zod';

import { VERIFIER_PACK_METADATA, VERIFIER_PACK_SCOPE } from './verifier-pack-metadata.js';

export {
  VERIFIER_PACK_METADATA,
  VERIFIER_PACK_ROOT,
  VERIFIER_PACK_SCOPE,
  VERIFIER_SKILL_NAME,
} from './verifier-pack-metadata.js';

export const DEMO_REPOSITORY = VERIFIER_PACK_SCOPE.repository;
export const DEMO_CASE_ID = 'checkout-networkpolicy-egress-exposure';
export const MISSING_DEPLOYMENT_REVISION_CASE_ID =
  'checkout-networkpolicy-egress-exposure-missing-deployment-revision';
export const MISSING_REACHABILITY_CASE_ID =
  'checkout-networkpolicy-egress-exposure-missing-reachability';
export const CONFLICTING_REVISION_CASE_ID =
  'checkout-networkpolicy-egress-exposure-conflicting-revision';
export const LAST_GOOD_COMMIT_SHA = 'a6d177b43396c7b4b45aa98cb2970d0489a7a4f9';
export const SUSPECT_COMMIT_SHA = VERIFIER_PACK_SCOPE.suspect_commit_sha;
export const TARGET_NETWORK_POLICY_FILE = VERIFIER_PACK_SCOPE.target_file;
export const VERIFIER_PACK_IDENTITY = {
  ...VERIFIER_PACK_METADATA,
  manifest_sha256: 'e70853b49715a949f61ae7584ef963b15267026051091a169e78a27249a869fe',
} as const;
export const VERIFIER_BUNDLE_SHA256 =
  '028172c2b937dc95e1d406db49d5801d5742a5636b5360dc99bd1d6b4c0049f9' as const;
export const fullGitShaSchema = z
  .string()
  .regex(/^[0-9a-f]{40}$/u, 'Expected a full Git commit SHA.');

export interface GuardianMcpServerSpec {
  name: string;
  enable_tools: readonly string[];
  require_approval_for_tools: readonly string[];
  preload: boolean;
}

export interface GuardianAgentDefinition {
  name: string;
  instructions: string;
  mcpServers?: readonly GuardianMcpServerSpec[];
  skills?: readonly string[];
  sandbox?: { enabled: boolean; file_downloads?: boolean };
  dynamicSubAgents?: boolean;
  generativeUi?: boolean;
  askUserQuestions?: boolean;
  iterationLimit: number;
}

export function defineGuardianAgent(definition: GuardianAgentDefinition) {
  return {
    name: definition.name,
    manifest: {
      model: {
        name: 'google-gemini/gemini-3-6-flash',
        params: { temperature: 0 },
      },
      instructions: definition.instructions,
      mcp_servers: (definition.mcpServers ?? []).map((server) => ({
        ...server,
        enable_tools: [...server.enable_tools],
        disable_tools: [],
        preload_tools: [],
        require_approval_for_tools: [...server.require_approval_for_tools],
      })),
      skills: (definition.skills ?? []).map((name) => ({ name })),
      config: {
        sandbox: definition.sandbox ?? { enabled: false },
        generative_ui: { enabled: definition.generativeUi ?? false },
        ask_user_questions: { enabled: definition.askUserQuestions ?? false },
        dynamic_sub_agents: { enabled: definition.dynamicSubAgents ?? false },
        context_management: {
          compaction: { enabled: true },
          large_tool_response: { enabled: true },
        },
        iteration_limit: definition.iterationLimit,
      },
    },
  };
}

const evidenceBaseShape = {
  evidence_id: z.string().min(1),
  source: z.string().min(1),
  source_ref: z.string().min(1),
  observed_at: z.iso.datetime(),
  fact: z.string().min(1),
  supports: z.array(z.string().min(1)),
  refutes: z.array(z.string().min(1)),
  limitations: z.array(z.string().min(1)).min(1),
};

export const securityAlertEvidenceSchema = z.object({
  ...evidenceBaseShape,
  kind: z.literal('security_alert'),
  details: z.object({
    alert_status: z.literal('firing'),
    workload: z.string().min(1),
    namespace: z.string().min(1),
    rule_id: z.string().min(1),
    destination_host: z.string().min(1),
    destination_ip: z.ipv4(),
    destination_port: z.number().int().min(1).max(65_535),
    protocol: z.enum(['TCP', 'UDP']),
    actual_data_access: z.literal('Unknown'),
  }),
});

export const deploymentEvidenceSchema = z.object({
  ...evidenceBaseShape,
  kind: z.literal('deployment'),
  details: z.object({
    deployment_id: z.string().min(1),
    workload: z.string().min(1),
    namespace: z.string().min(1),
    revision: fullGitShaSchema.nullable(),
    workload_annotation_revision: fullGitShaSchema.nullable(),
    deployed_at: z.iso.datetime(),
  }),
});

export const reachabilityEvidenceSchema = z.object({
  ...evidenceBaseShape,
  kind: z.literal('reachability'),
  details: z.object({
    source_workload: z.string().min(1),
    source_namespace: z.string().min(1),
    destination_type: z.enum(['forbidden_external', 'service_dependency']),
    destination: z.string().min(1),
    destination_port: z.number().int().min(1).max(65_535),
    protocol: z.enum(['TCP', 'UDP']),
    outcome: z.enum(['allowed', 'denied']),
  }),
});

export const serviceDependencyEvidenceSchema = z.object({
  ...evidenceBaseShape,
  kind: z.literal('service_dependency'),
  details: z.object({
    source_workload: z.string().min(1),
    source_namespace: z.string().min(1),
    dependency_type: z.enum(['dns', 'postgresql']),
    destination_namespace: z.string().min(1),
    destination_selector: z
      .record(z.string(), z.string())
      .refine((selector) => Object.keys(selector).length > 0, 'Expected at least one selector.'),
    ports: z
      .array(
        z.object({
          protocol: z.enum(['TCP', 'UDP']),
          port: z.number().int().min(1).max(65_535),
        }),
      )
      .min(1),
    required: z.literal(true),
  }),
});

export const evidenceItemSchema = z.discriminatedUnion('kind', [
  securityAlertEvidenceSchema,
  deploymentEvidenceSchema,
  reachabilityEvidenceSchema,
  serviceDependencyEvidenceSchema,
]);

export const caseMetadataSchema = z.object({
  case_id: z.string().min(1),
  fixture_version: z.string().min(1),
  synthetic: z.literal(true),
  summary: z.string().min(1),
});

export const incidentFixtureSchema = caseMetadataSchema.extend({
  security_alert: securityAlertEvidenceSchema,
  deployment: deploymentEvidenceSchema,
  reachability_observations: z.array(reachabilityEvidenceSchema),
  service_dependencies: z.array(serviceDependencyEvidenceSchema).min(1),
});

export const securityAlertResultSchema = z.object({
  case_id: z.string().min(1),
  synthetic: z.literal(true),
  alert: securityAlertEvidenceSchema,
});

export const deploymentResultSchema = z.object({
  case_id: z.string().min(1),
  synthetic: z.literal(true),
  deployment: deploymentEvidenceSchema,
});

export const reachabilityResultSchema = z.object({
  case_id: z.string().min(1),
  synthetic: z.literal(true),
  observations: z.array(reachabilityEvidenceSchema),
});

export const serviceDependenciesResultSchema = z.object({
  case_id: z.string().min(1),
  synthetic: z.literal(true),
  dependencies: z.array(serviceDependencyEvidenceSchema),
});

export type CaseMetadata = z.infer<typeof caseMetadataSchema>;
export type DeploymentResult = z.infer<typeof deploymentResultSchema>;
export type EvidenceItem = z.infer<typeof evidenceItemSchema>;
export type IncidentFixture = z.infer<typeof incidentFixtureSchema>;
export type ReachabilityResult = z.infer<typeof reachabilityResultSchema>;
export type SecurityAlertResult = z.infer<typeof securityAlertResultSchema>;
export type ServiceDependenciesResult = z.infer<typeof serviceDependenciesResultSchema>;
