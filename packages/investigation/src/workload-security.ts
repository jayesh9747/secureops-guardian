import { parseAllDocuments } from 'yaml';

import type {
  FindingPackAnalysis,
  FindingPackChangedFileEvidence,
  FindingPackFinding,
} from './finding-packs.js';

type JsonRecord = Record<string, unknown>;

export const WORKLOAD_PACK_IDENTITY = Object.freeze({
  pack_id: 'k8s-workload-security-v1',
  pack_version: '1.0.0',
} as const);
export const WORKLOAD_RULE_IDS = Object.freeze({
  privileged: 'K8S-WORKLOAD-001',
  privilege_escalation: 'K8S-WORKLOAD-002',
  root_execution: 'K8S-WORKLOAD-003',
  capabilities: 'K8S-WORKLOAD-004',
  host_namespaces: 'K8S-WORKLOAD-005',
  host_path: 'K8S-WORKLOAD-006',
} as const);
export type WorkloadRuleId = (typeof WORKLOAD_RULE_IDS)[keyof typeof WORKLOAD_RULE_IDS];
export const WORKLOAD_RULE_ID_LIST: readonly WorkloadRuleId[] = Object.freeze(
  Object.values(WORKLOAD_RULE_IDS),
);

const DNS_LABEL = /^[a-z0-9](?:[-a-z0-9]*[a-z0-9])?$/u;
const DNS_SUBDOMAIN = /^[a-z0-9](?:[-a-z0-9.]*[a-z0-9])?$/u;

interface ExtractedContainer {
  readonly type: 'container' | 'initContainer' | 'ephemeralContainer';
  readonly collection: 'containers' | 'initContainers' | 'ephemeralContainers';
  readonly index: number;
  readonly name: string;
  readonly value: JsonRecord;
}

interface ExtractedWorkload {
  readonly object_identity: FindingPackFinding['object_identity'];
  readonly pod_spec: JsonRecord;
  readonly pod_spec_path: '$.spec' | '$.spec.template.spec';
  readonly containers: readonly ExtractedContainer[];
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function recordAt(parent: JsonRecord, key: string): JsonRecord | undefined {
  const value = parent[key];
  return isRecord(value) ? value : undefined;
}

function isOptionalRecord(value: unknown): boolean {
  return value === undefined || value === null || isRecord(value);
}

function isOptionalBoolean(value: unknown): boolean {
  return value === undefined || value === null || typeof value === 'boolean';
}

function isOptionalInteger(value: unknown): boolean {
  return (
    value === undefined || value === null || (typeof value === 'number' && Number.isInteger(value))
  );
}

function isOptionalStringArray(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    (Array.isArray(value) && value.every((item) => typeof item === 'string'))
  );
}

function securityContextIsSupported(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (!isRecord(value)) return false;
  if (
    !isOptionalBoolean(value.privileged) ||
    !isOptionalBoolean(value.allowPrivilegeEscalation) ||
    !isOptionalBoolean(value.runAsNonRoot) ||
    !isOptionalInteger(value.runAsUser) ||
    !isOptionalRecord(value.capabilities)
  ) {
    return false;
  }
  const capabilities = isRecord(value.capabilities) ? value.capabilities : undefined;
  return (
    capabilities === undefined ||
    (isOptionalStringArray(capabilities.add) && isOptionalStringArray(capabilities.drop))
  );
}

function podSpecSemanticsAreSupported(
  podSpec: JsonRecord,
  containers: readonly ExtractedContainer[],
): boolean {
  if (
    !securityContextIsSupported(podSpec.securityContext) ||
    !isOptionalBoolean(podSpec.hostNetwork) ||
    !isOptionalBoolean(podSpec.hostPID) ||
    !isOptionalBoolean(podSpec.hostIPC)
  ) {
    return false;
  }
  if (podSpec.volumes !== undefined && podSpec.volumes !== null) {
    if (!Array.isArray(podSpec.volumes)) return false;
    for (const volume of podSpec.volumes) {
      if (!isRecord(volume)) return false;
      if (volume.hostPath !== undefined && volume.hostPath !== null && !isRecord(volume.hostPath)) {
        return false;
      }
    }
  }
  return containers.every((container) =>
    securityContextIsSupported(container.value.securityContext),
  );
}

function extractContainers(podSpec: JsonRecord): ExtractedContainer[] | undefined {
  const collections = [
    ['containers', 'container'],
    ['initContainers', 'initContainer'],
    ['ephemeralContainers', 'ephemeralContainer'],
  ] as const;
  const result: ExtractedContainer[] = [];
  for (const [collection, type] of collections) {
    const value = podSpec[collection];
    if (value === undefined && collection !== 'containers') continue;
    if (!Array.isArray(value) || (collection === 'containers' && value.length === 0)) {
      return undefined;
    }
    const names = new Set<string>();
    for (const [index, container] of value.entries()) {
      if (
        !isRecord(container) ||
        typeof container.name !== 'string' ||
        container.name.length > 63 ||
        !DNS_LABEL.test(container.name)
      ) {
        return undefined;
      }
      if (names.has(container.name)) return undefined;
      names.add(container.name);
      result.push({ type, collection, index, name: container.name, value: container });
    }
  }
  return result;
}

export function extractSupportedWorkload(content: string): ExtractedWorkload | undefined {
  const documents = parseAllDocuments(content);
  if (documents.length !== 1 || documents[0] === undefined || documents[0].errors.length > 0) {
    return undefined;
  }
  const parsed: unknown = documents[0].toJS();
  if (!isRecord(parsed) || !isRecord(parsed.metadata)) return undefined;
  if (
    typeof parsed.apiVersion !== 'string' ||
    typeof parsed.kind !== 'string' ||
    typeof parsed.metadata.name !== 'string' ||
    typeof parsed.metadata.namespace !== 'string' ||
    parsed.metadata.name.length === 0 ||
    parsed.metadata.name.length > 253 ||
    !DNS_SUBDOMAIN.test(parsed.metadata.name) ||
    parsed.metadata.namespace.length === 0 ||
    parsed.metadata.namespace.length > 63 ||
    !DNS_LABEL.test(parsed.metadata.namespace)
  ) {
    return undefined;
  }

  let podSpec: JsonRecord | undefined;
  let podSpecPath: ExtractedWorkload['pod_spec_path'] | undefined;
  if (parsed.apiVersion === 'v1' && parsed.kind === 'Pod') {
    podSpec = recordAt(parsed, 'spec');
    podSpecPath = '$.spec';
  } else if (parsed.apiVersion === 'apps/v1' && parsed.kind === 'Deployment') {
    const spec = recordAt(parsed, 'spec');
    const template = spec === undefined ? undefined : recordAt(spec, 'template');
    podSpec = template === undefined ? undefined : recordAt(template, 'spec');
    podSpecPath = '$.spec.template.spec';
  } else {
    return undefined;
  }
  if (podSpec === undefined || podSpecPath === undefined) return undefined;
  if (!isOptionalRecord(podSpec.os)) return undefined;
  const os = recordAt(podSpec, 'os');
  if (os !== undefined && os.name !== 'linux') return undefined;
  const containers = extractContainers(podSpec);
  if (containers === undefined) return undefined;
  if (!podSpecSemanticsAreSupported(podSpec, containers)) return undefined;

  return {
    object_identity: {
      api_version: parsed.apiVersion,
      kind: parsed.kind,
      namespace: parsed.metadata.namespace,
      name: parsed.metadata.name,
    },
    pod_spec: podSpec,
    pod_spec_path: podSpecPath,
    containers,
  };
}

function createWorkloadFinding(
  workload: ExtractedWorkload,
  evidence: FindingPackChangedFileEvidence,
  finding: Omit<
    FindingPackFinding,
    'severity' | 'object_identity' | 'evidence_references' | 'legacy_rule_result'
  >,
): FindingPackFinding {
  return {
    ...finding,
    severity: 'High',
    object_identity: workload.object_identity,
    evidence_references: evidence.evidence_references,
  };
}

function privilegedFindings(
  workload: ExtractedWorkload,
  evidence: FindingPackChangedFileEvidence,
): FindingPackFinding[] {
  return workload.containers.flatMap((container) => {
    const securityContext = recordAt(container.value, 'securityContext');
    if (securityContext?.privileged !== true) return [];
    return [
      createWorkloadFinding(workload, evidence, {
        rule_id: WORKLOAD_RULE_IDS.privileged,
        container_identity: { container_type: container.type, name: container.name },
        json_path: `${workload.pod_spec_path}.${container.collection}[${String(container.index)}].securityContext.privileged`,
        observed_value: true,
        summary: 'Container explicitly enables privileged execution.',
      }),
    ];
  });
}

function privilegeEscalationFindings(
  workload: ExtractedWorkload,
  evidence: FindingPackChangedFileEvidence,
): FindingPackFinding[] {
  return workload.containers.flatMap((container) => {
    const securityContext = recordAt(container.value, 'securityContext');
    const observed = securityContext?.allowPrivilegeEscalation;
    if (observed === false) return [];
    return [
      createWorkloadFinding(workload, evidence, {
        rule_id: WORKLOAD_RULE_IDS.privilege_escalation,
        container_identity: { container_type: container.type, name: container.name },
        json_path: `${workload.pod_spec_path}.${container.collection}[${String(container.index)}].securityContext.allowPrivilegeEscalation`,
        observed_value: observed ?? null,
        summary: 'Container does not explicitly disable privilege escalation.',
      }),
    ];
  });
}

function rootExecutionFindings(
  workload: ExtractedWorkload,
  evidence: FindingPackChangedFileEvidence,
): FindingPackFinding[] {
  const findings: FindingPackFinding[] = [];
  const podSecurityContext = recordAt(workload.pod_spec, 'securityContext');
  if (podSecurityContext?.runAsUser === 0) {
    findings.push(
      createWorkloadFinding(workload, evidence, {
        rule_id: WORKLOAD_RULE_IDS.root_execution,
        container_identity: null,
        json_path: `${workload.pod_spec_path}.securityContext.runAsUser`,
        observed_value: {
          runAsUser: 0,
          runAsNonRoot:
            typeof podSecurityContext.runAsNonRoot === 'boolean'
              ? podSecurityContext.runAsNonRoot
              : null,
        },
        summary:
          podSecurityContext.runAsNonRoot === true
            ? 'Pod declares UID 0 while also declaring runAsNonRoot.'
            : 'Pod declares UID 0.',
      }),
    );
  }
  for (const container of workload.containers) {
    const securityContext = recordAt(container.value, 'securityContext');
    if (securityContext?.runAsUser !== 0) continue;
    const effectiveRunAsNonRoot =
      typeof securityContext?.runAsNonRoot === 'boolean'
        ? securityContext.runAsNonRoot
        : typeof podSecurityContext?.runAsNonRoot === 'boolean'
          ? podSecurityContext.runAsNonRoot
          : null;
    findings.push(
      createWorkloadFinding(workload, evidence, {
        rule_id: WORKLOAD_RULE_IDS.root_execution,
        container_identity: { container_type: container.type, name: container.name },
        json_path: `${workload.pod_spec_path}.${container.collection}[${String(container.index)}].securityContext.runAsUser`,
        observed_value: { runAsUser: 0, runAsNonRoot: effectiveRunAsNonRoot },
        summary:
          effectiveRunAsNonRoot === true
            ? 'Container declares UID 0 while effective runAsNonRoot is true.'
            : 'Container declares UID 0.',
      }),
    );
  }
  return findings;
}

function capabilityFindings(
  workload: ExtractedWorkload,
  evidence: FindingPackChangedFileEvidence,
): FindingPackFinding[] {
  const findings: FindingPackFinding[] = [];
  for (const container of workload.containers) {
    const securityContext = recordAt(container.value, 'securityContext');
    const capabilities =
      securityContext === undefined ? undefined : recordAt(securityContext, 'capabilities');
    const drop = capabilities?.drop;
    if (!Array.isArray(drop) || !drop.includes('ALL')) {
      findings.push(
        createWorkloadFinding(workload, evidence, {
          rule_id: WORKLOAD_RULE_IDS.capabilities,
          container_identity: { container_type: container.type, name: container.name },
          json_path: `${workload.pod_spec_path}.${container.collection}[${String(container.index)}].securityContext.capabilities.drop`,
          observed_value: drop ?? null,
          summary: 'Container does not drop the ALL Linux capability set.',
        }),
      );
    }
    const add = capabilities?.add;
    if (!Array.isArray(add)) continue;
    for (const [index, capability] of add.entries()) {
      if (capability === 'NET_BIND_SERVICE') continue;
      findings.push(
        createWorkloadFinding(workload, evidence, {
          rule_id: WORKLOAD_RULE_IDS.capabilities,
          container_identity: { container_type: container.type, name: container.name },
          json_path: `${workload.pod_spec_path}.${container.collection}[${String(container.index)}].securityContext.capabilities.add[${String(index)}]`,
          observed_value: capability,
          summary: 'Container adds a Linux capability outside the Restricted allowance.',
        }),
      );
    }
  }
  return findings;
}

function hostNamespaceFindings(
  workload: ExtractedWorkload,
  evidence: FindingPackChangedFileEvidence,
): FindingPackFinding[] {
  return (['hostNetwork', 'hostPID', 'hostIPC'] as const).flatMap((field) => {
    if (workload.pod_spec[field] !== true) return [];
    return [
      createWorkloadFinding(workload, evidence, {
        rule_id: WORKLOAD_RULE_IDS.host_namespaces,
        container_identity: null,
        json_path: `${workload.pod_spec_path}.${field}`,
        observed_value: true,
        summary: `Pod explicitly enables the ${field} host namespace.`,
      }),
    ];
  });
}

function hostPathFindings(
  workload: ExtractedWorkload,
  evidence: FindingPackChangedFileEvidence,
): FindingPackFinding[] {
  const volumes = workload.pod_spec.volumes;
  if (!Array.isArray(volumes)) return [];
  return volumes.flatMap((volume, index) => {
    if (!isRecord(volume) || volume.hostPath === undefined || volume.hostPath === null) return [];
    return [
      createWorkloadFinding(workload, evidence, {
        rule_id: WORKLOAD_RULE_IDS.host_path,
        container_identity: null,
        json_path: `${workload.pod_spec_path}.volumes[${String(index)}].hostPath`,
        observed_value: volume.hostPath,
        summary: 'Pod uses a hostPath volume.',
      }),
    ];
  });
}

export function analyzeWorkloadSecurity(
  evidence: FindingPackChangedFileEvidence,
): FindingPackAnalysis<'ANALYSIS_ONLY'> {
  const workload = extractSupportedWorkload(evidence.content);
  if (workload === undefined) {
    throw new Error('Workload pack received malformed or unsupported evidence.');
  }
  const findings = [
    ...privilegedFindings(workload, evidence),
    ...privilegeEscalationFindings(workload, evidence),
    ...rootExecutionFindings(workload, evidence),
    ...capabilityFindings(workload, evidence),
    ...hostNamespaceFindings(workload, evidence),
    ...hostPathFindings(workload, evidence),
  ];
  return {
    outcome: 'ANALYZED',
    pack: WORKLOAD_PACK_IDENTITY,
    capability: 'ANALYSIS_ONLY',
    severity: findings.length === 0 ? 'None' : 'High',
    repository: evidence.repository,
    revision: evidence.revision,
    file: evidence.file,
    object_identity: workload.object_identity,
    evidence_references: evidence.evidence_references,
    findings,
    claims: {
      known:
        findings.length === 0
          ? ['No supported deterministic workload-security violation was found.']
          : findings.map((finding) => finding.summary),
      refuted: [],
      unknown: [
        'deployment',
        'Pod Security Admission outcome',
        'runtime Pod state',
        'exploitability',
        'reachability',
        'data access',
        'exfiltration',
        'live-cluster behavior',
      ],
    },
    limitations: [
      'Deterministic repository manifest analysis only; no live Kubernetes cluster was accessed.',
      'The result does not establish admission behavior, deployment, runtime state, or exploitability.',
    ],
  };
}
