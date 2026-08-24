import { z } from 'zod';

const fullGitShaSchema = z.string().regex(/^[0-9a-f]{40}$/u, 'Expected a full Git commit SHA.');

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
