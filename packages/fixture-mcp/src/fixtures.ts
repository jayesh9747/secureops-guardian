import {
  caseMetadataSchema,
  incidentFixtureSchema,
  type CaseMetadata,
  type EvidenceItem,
  type IncidentFixture,
} from '@guardian/shared';

export const DEMO_CASE_ID = 'checkout-networkpolicy-egress-exposure';
export const MISSING_DEPLOYMENT_REVISION_CASE_ID =
  'checkout-networkpolicy-egress-exposure-missing-deployment-revision';
export const MISSING_REACHABILITY_CASE_ID =
  'checkout-networkpolicy-egress-exposure-missing-reachability';
export const CONFLICTING_REVISION_CASE_ID =
  'checkout-networkpolicy-egress-exposure-conflicting-revision';

export const LAST_GOOD_COMMIT_SHA = 'a6d177b43396c7b4b45aa98cb2970d0489a7a4f9';
export const SUSPECT_COMMIT_SHA = '7b2f2ad51f9ef97334176fbfed3138465b62fcdb';

const FIXTURE_VERSION = '2';
const SYNTHETIC_LIMITATION =
  'Owned synthetic observation; it is not live cluster telemetry or packet capture.';

const normalFixture = incidentFixtureSchema.parse({
  case_id: DEMO_CASE_ID,
  fixture_version: FIXTURE_VERSION,
  synthetic: true,
  summary: 'Owned synthetic post-deployment NetworkPolicy exposure fixture.',
  security_alert: {
    evidence_id: 'evidence:security-alert:checkout-egress:001',
    kind: 'security_alert',
    source: 'guardian-synthetic-security-sensor',
    source_ref: 'alert:checkout-forbidden-egress:20260824T090600Z',
    observed_at: '2026-08-24T09:06:00.000Z',
    fact: 'The synthetic security sensor reported an allowed checkout-api connection to the declared forbidden test destination.',
    supports: ['claim:forbidden-external-path-observed'],
    refutes: [],
    limitations: [
      SYNTHETIC_LIMITATION,
      'The alert reports reachability only; actual data access or exfiltration remains Unknown.',
    ],
    details: {
      alert_status: 'firing',
      workload: 'checkout-api',
      namespace: 'payments',
      rule_id: 'SYNTH-REACH-001',
      destination_host: 'forbidden.example.test',
      destination_ip: '203.0.113.10',
      destination_port: 443,
      protocol: 'TCP',
      actual_data_access: 'Unknown',
    },
  },
  deployment: {
    evidence_id: 'evidence:deployment:checkout-api:001',
    kind: 'deployment',
    source: 'guardian-synthetic-deployment-ledger',
    source_ref: 'deployment:checkout-api:20260824T090000Z',
    observed_at: '2026-08-24T09:00:00.000Z',
    fact: `The synthetic deployment ledger and workload annotation both report revision ${SUSPECT_COMMIT_SHA} for checkout-api.`,
    supports: ['claim:revision-deployed'],
    refutes: [],
    limitations: [
      SYNTHETIC_LIMITATION,
      'The deployment record identifies a revision but does not determine whether it caused an observation.',
    ],
    details: {
      deployment_id: 'deploy-checkout-20260824-090000',
      workload: 'checkout-api',
      namespace: 'payments',
      revision: SUSPECT_COMMIT_SHA,
      workload_annotation_revision: SUSPECT_COMMIT_SHA,
      deployed_at: '2026-08-24T09:00:00.000Z',
    },
  },
  reachability_observations: [
    {
      evidence_id: 'evidence:reachability:checkout-forbidden:001',
      kind: 'reachability',
      source: 'guardian-synthetic-reachability-probe',
      source_ref: 'probe:checkout-to-forbidden:20260824T090500Z',
      observed_at: '2026-08-24T09:05:00.000Z',
      fact: 'The synthetic probe recorded checkout-api reaching forbidden.example.test on TCP/443.',
      supports: ['claim:forbidden-external-path-observed'],
      refutes: [],
      limitations: [
        SYNTHETIC_LIMITATION,
        'The observation does not establish what data, if any, traversed the connection.',
      ],
      details: {
        source_workload: 'checkout-api',
        source_namespace: 'payments',
        destination_type: 'forbidden_external',
        destination: 'forbidden.example.test',
        destination_port: 443,
        protocol: 'TCP',
        outcome: 'allowed',
      },
    },
    {
      evidence_id: 'evidence:reachability:checkout-postgres:001',
      kind: 'reachability',
      source: 'guardian-synthetic-reachability-probe',
      source_ref: 'probe:checkout-to-postgres:20260824T090510Z',
      observed_at: '2026-08-24T09:05:10.000Z',
      fact: 'The synthetic probe recorded checkout-api reaching PostgreSQL on TCP/5432.',
      supports: ['claim:postgresql-path-observed'],
      refutes: [],
      limitations: [SYNTHETIC_LIMITATION],
      details: {
        source_workload: 'checkout-api',
        source_namespace: 'payments',
        destination_type: 'service_dependency',
        destination: 'payments-data/postgres',
        destination_port: 5432,
        protocol: 'TCP',
        outcome: 'allowed',
      },
    },
  ],
  service_dependencies: [
    {
      evidence_id: 'evidence:dependency:checkout-dns:001',
      kind: 'service_dependency',
      source: 'guardian-synthetic-service-catalog',
      source_ref: 'dependency:checkout-api:dns',
      observed_at: '2026-08-24T08:55:00.000Z',
      fact: 'The synthetic service catalog declares DNS on UDP/TCP 53 as required by checkout-api.',
      supports: ['claim:checkout-requires-dns'],
      refutes: [],
      limitations: [
        SYNTHETIC_LIMITATION,
        'The catalog states an intended dependency, not a live availability measurement.',
      ],
      details: {
        source_workload: 'checkout-api',
        source_namespace: 'payments',
        dependency_type: 'dns',
        destination_namespace: 'kube-system',
        destination_selector: { 'k8s-app': 'kube-dns' },
        ports: [
          { protocol: 'UDP', port: 53 },
          { protocol: 'TCP', port: 53 },
        ],
        required: true,
      },
    },
    {
      evidence_id: 'evidence:dependency:checkout-postgres:001',
      kind: 'service_dependency',
      source: 'guardian-synthetic-service-catalog',
      source_ref: 'dependency:checkout-api:postgresql',
      observed_at: '2026-08-24T08:55:00.000Z',
      fact: 'The synthetic service catalog declares payments-data PostgreSQL on TCP/5432 as required by checkout-api.',
      supports: ['claim:checkout-requires-postgres'],
      refutes: [],
      limitations: [
        SYNTHETIC_LIMITATION,
        'The catalog states an intended dependency, not a live availability measurement.',
      ],
      details: {
        source_workload: 'checkout-api',
        source_namespace: 'payments',
        dependency_type: 'postgresql',
        destination_namespace: 'payments-data',
        destination_selector: { app: 'postgres' },
        ports: [{ protocol: 'TCP', port: 5432 }],
        required: true,
      },
    },
  ],
});

function allEvidence(fixture: IncidentFixture): EvidenceItem[] {
  return [
    fixture.security_alert,
    fixture.deployment,
    ...fixture.reachability_observations,
    ...fixture.service_dependencies,
  ];
}

function createVariant(options: {
  caseId: string;
  suffix: string;
  update: (fixture: IncidentFixture) => void;
}): IncidentFixture {
  const fixture = structuredClone(normalFixture);
  fixture.case_id = options.caseId;
  for (const evidence of allEvidence(fixture)) {
    evidence.evidence_id = `${evidence.evidence_id}:${options.suffix}`;
    evidence.source_ref = `${evidence.source_ref}:${options.suffix}`;
  }
  options.update(fixture);
  return incidentFixtureSchema.parse(fixture);
}

const missingDeploymentRevisionFixture = createVariant({
  caseId: MISSING_DEPLOYMENT_REVISION_CASE_ID,
  suffix: 'missing-deployment-revision',
  update: (fixture) => {
    fixture.deployment.details.revision = null;
    fixture.deployment.details.workload_annotation_revision = null;
    fixture.deployment.fact = 'The synthetic deployment record omits the deployed commit revision.';
    fixture.deployment.supports = [];
  },
});

const missingReachabilityFixture = createVariant({
  caseId: MISSING_REACHABILITY_CASE_ID,
  suffix: 'missing-reachability',
  update: (fixture) => {
    fixture.reachability_observations = [];
  },
});

const conflictingRevisionFixture = createVariant({
  caseId: CONFLICTING_REVISION_CASE_ID,
  suffix: 'conflicting-revision',
  update: (fixture) => {
    fixture.deployment.details.workload_annotation_revision = LAST_GOOD_COMMIT_SHA;
    fixture.deployment.fact = `The synthetic deployment ledger reports revision ${SUSPECT_COMMIT_SHA}, while the workload annotation reports ${LAST_GOOD_COMMIT_SHA}.`;
    fixture.deployment.supports = [];
  },
});

const fixtures = [
  normalFixture,
  missingDeploymentRevisionFixture,
  missingReachabilityFixture,
  conflictingRevisionFixture,
].map((fixture) => incidentFixtureSchema.parse(fixture));

const evidenceIds = fixtures.flatMap((fixture) =>
  allEvidence(fixture).map((evidence) => evidence.evidence_id),
);
if (new Set(evidenceIds).size !== evidenceIds.length) {
  throw new Error('Fixture evidence IDs must be globally unique.');
}

const fixtureByCaseId = new Map(fixtures.map((fixture) => [fixture.case_id, fixture]));

export function getFixture(caseId: string): IncidentFixture | undefined {
  const fixture = fixtureByCaseId.get(caseId);
  return fixture === undefined ? undefined : structuredClone(fixture);
}

export function getCaseMetadata(caseId: string): CaseMetadata | undefined {
  const fixture = fixtureByCaseId.get(caseId);
  if (fixture === undefined) return undefined;

  return caseMetadataSchema.parse({
    case_id: fixture.case_id,
    fixture_version: fixture.fixture_version,
    synthetic: fixture.synthetic,
    summary: fixture.summary,
  });
}

export function listCaseIds(): string[] {
  return [...fixtureByCaseId.keys()];
}
