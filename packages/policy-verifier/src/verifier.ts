import { parseAllDocuments } from 'yaml';

import type {
  PolicyContract,
  PolicyPeerContract,
  PolicyPortContract,
  VerificationCheck,
  VerificationClassification,
  VerificationResult,
} from './types.js';
import { VERIFIER_LIMITATIONS } from './types.js';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function labelMap(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined;
  const result: Record<string, string> = {};
  for (const [key, labelValue] of Object.entries(value)) {
    if (typeof labelValue !== 'string') return undefined;
    result[key] = labelValue;
  }
  return result;
}

function equalLabels(actual: Record<string, string> | undefined, expected: Record<string, string>) {
  if (actual === undefined) return false;
  const actualKeys = Object.keys(actual).sort();
  const expectedKeys = Object.keys(expected).sort();
  return (
    actualKeys.length === expectedKeys.length &&
    actualKeys.every((key, index) => key === expectedKeys[index] && actual[key] === expected[key])
  );
}

function selectorLabels(
  peer: Record<string, unknown>,
  key: string,
): Record<string, string> | undefined {
  const selector = peer[key];
  if (!isRecord(selector)) return undefined;
  return labelMap(selector.matchLabels);
}

function portMatches(value: unknown, expected: PolicyPortContract): boolean {
  if (!isRecord(value)) return false;
  return value.protocol === expected.protocol && value.port === expected.port;
}

function ruleProvidesPath(rule: unknown, expected: PolicyPeerContract): boolean {
  if (!isRecord(rule) || !Array.isArray(rule.to) || !Array.isArray(rule.ports)) return false;
  const peers: unknown[] = rule.to;
  const ports: unknown[] = rule.ports;
  const peerMatches = peers.some(
    (peer) =>
      isRecord(peer) &&
      equalLabels(selectorLabels(peer, 'namespaceSelector'), expected.namespace_selector) &&
      equalLabels(selectorLabels(peer, 'podSelector'), expected.pod_selector),
  );
  return (
    peerMatches &&
    expected.ports.every((expectedPort) => ports.some((port) => portMatches(port, expectedPort)))
  );
}

function ipv4ToNumber(ipv4: string): number | undefined {
  const octets = ipv4.split('.');
  if (
    octets.length !== 4 ||
    !octets.every((octet) => /^\d{1,3}$/u.test(octet) && Number(octet) <= 255)
  ) {
    return undefined;
  }
  return octets.reduce((result, octet) => result * 256 + Number(octet), 0) >>> 0;
}

function cidrContainsIpv4(cidr: string, ipv4: string): boolean {
  const [networkText, prefixText, ...rest] = cidr.split('/');
  if (networkText === undefined || prefixText === undefined || rest.length > 0) return false;
  const network = ipv4ToNumber(networkText);
  const address = ipv4ToNumber(ipv4);
  const prefix = Number(prefixText);
  if (
    network === undefined ||
    address === undefined ||
    !Number.isInteger(prefix) ||
    prefix < 0 ||
    prefix > 32
  ) {
    return false;
  }
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (network & mask) === (address & mask);
}

interface PolicyInspection {
  document: Record<string, unknown> | undefined;
  parseMessage: string;
  parsePassed: boolean;
}

function inspectYaml(candidateYaml: string): PolicyInspection {
  try {
    const documents = parseAllDocuments(candidateYaml, { prettyErrors: false });
    const errors = documents.flatMap((document) => document.errors);
    if (errors.length > 0) {
      return {
        document: undefined,
        parseMessage: `YAML parse failed: ${errors[0]?.message ?? 'unknown parser error'}`,
        parsePassed: false,
      };
    }
    if (documents.length !== 1 || documents[0] === undefined) {
      return {
        document: undefined,
        parseMessage: 'Candidate must contain exactly one YAML document.',
        parsePassed: false,
      };
    }
    const parsed = documents[0].toJS() as unknown;
    if (!isRecord(parsed)) {
      return {
        document: undefined,
        parseMessage: 'Candidate YAML document must be an object.',
        parsePassed: false,
      };
    }
    return {
      document: parsed,
      parseMessage: 'Candidate is one valid YAML object.',
      parsePassed: true,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown YAML parser error';
    return {
      document: undefined,
      parseMessage: `YAML parse failed: ${detail}`,
      parsePassed: false,
    };
  }
}

function hasNarrowStructure(document: Record<string, unknown> | undefined): boolean {
  if (document === undefined || !isRecord(document.metadata) || !isRecord(document.spec))
    return false;
  const spec = document.spec;
  if (!isRecord(spec.podSelector) || !isRecord(spec.podSelector.matchLabels)) return false;
  if (!Array.isArray(spec.egress)) return false;
  if (
    spec.policyTypes !== undefined &&
    (!Array.isArray(spec.policyTypes) || !spec.policyTypes.includes('Egress'))
  ) {
    return false;
  }
  return spec.egress.every((rule) => {
    if (!isRecord(rule)) return false;
    if (rule.to !== undefined && !Array.isArray(rule.to)) return false;
    if (rule.ports !== undefined && !Array.isArray(rule.ports)) return false;
    return (
      (!Array.isArray(rule.to) || rule.to.every(isRecord)) &&
      (!Array.isArray(rule.ports) ||
        rule.ports.every(
          (port) =>
            isRecord(port) &&
            (port.protocol === 'TCP' || port.protocol === 'UDP') &&
            Number.isInteger(port.port) &&
            Number(port.port) >= 1 &&
            Number(port.port) <= 65_535,
        ))
    );
  });
}

function egressRules(document: Record<string, unknown> | undefined): unknown[] {
  if (document === undefined || !isRecord(document.spec) || !Array.isArray(document.spec.egress)) {
    return [];
  }
  return document.spec.egress;
}

function unrestrictedObservations(rules: unknown[], unrestrictedCidr: string): string[] {
  const observations: string[] = [];
  rules.forEach((rule, ruleIndex) => {
    if (!isRecord(rule) || !Array.isArray(rule.to) || rule.to.length === 0) {
      observations.push(`spec.egress[${ruleIndex}].to permits every destination`);
      return;
    }
    rule.to.forEach((peer, peerIndex) => {
      if (!isRecord(peer) || Object.keys(peer).length === 0) {
        observations.push(`spec.egress[${ruleIndex}].to[${peerIndex}] permits every destination`);
        return;
      }
      if (isRecord(peer.ipBlock) && typeof peer.ipBlock.cidr === 'string') {
        if (peer.ipBlock.cidr === unrestrictedCidr || peer.ipBlock.cidr === '::/0') {
          observations.push(
            `spec.egress[${ruleIndex}].to[${peerIndex}].ipBlock.cidr=${peer.ipBlock.cidr}`,
          );
        }
      }
    });
  });
  return observations;
}

function forbiddenObservations(rules: unknown[], forbiddenIpv4: string): string[] {
  const observations: string[] = [];
  rules.forEach((rule, ruleIndex) => {
    if (!isRecord(rule) || !Array.isArray(rule.to) || rule.to.length === 0) {
      observations.push(`spec.egress[${ruleIndex}].to includes ${forbiddenIpv4}`);
      return;
    }
    rule.to.forEach((peer, peerIndex) => {
      if (!isRecord(peer) || Object.keys(peer).length === 0) {
        observations.push(`spec.egress[${ruleIndex}].to[${peerIndex}] includes ${forbiddenIpv4}`);
        return;
      }
      if (
        isRecord(peer.ipBlock) &&
        typeof peer.ipBlock.cidr === 'string' &&
        cidrContainsIpv4(peer.ipBlock.cidr, forbiddenIpv4)
      ) {
        const except = Array.isArray(peer.ipBlock.except)
          ? peer.ipBlock.except.filter((item): item is string => typeof item === 'string')
          : [];
        if (!except.some((excludedCidr) => cidrContainsIpv4(excludedCidr, forbiddenIpv4))) {
          observations.push(
            `spec.egress[${ruleIndex}].to[${peerIndex}].ipBlock.cidr includes ${forbiddenIpv4}`,
          );
        }
      }
    });
  });
  return observations;
}

function check(
  id: VerificationCheck['id'],
  passed: boolean,
  observed: unknown,
  passMessage: string,
  failMessage: string,
): VerificationCheck {
  return { id, passed, observed, message: passed ? passMessage : failMessage };
}

function classification(
  secure: boolean,
  functional: boolean,
  structurallyValid: boolean,
): VerificationClassification {
  if (!structurallyValid) return 'INVALID';
  if (!secure) return 'EXPOSED';
  if (!functional) return 'SECURE_BUT_OPERATIONALLY_REJECTED';
  return 'SECURE_AND_FUNCTIONAL';
}

export function verifyNetworkPolicy(
  candidateYaml: string,
  contract: PolicyContract,
): VerificationResult {
  const inspection = inspectYaml(candidateYaml);
  const document = inspection.document;
  const kindPassed =
    inspection.parsePassed &&
    document?.apiVersion === contract.target.api_version &&
    document.kind === contract.target.kind;
  const structurePassed = kindPassed && hasNarrowStructure(document);
  const metadata =
    document !== undefined && isRecord(document.metadata) ? document.metadata : undefined;
  const spec = document !== undefined && isRecord(document.spec) ? document.spec : undefined;
  const podSelector =
    spec !== undefined && isRecord(spec.podSelector) ? spec.podSelector : undefined;
  const targetPassed =
    structurePassed &&
    metadata?.name === contract.target.name &&
    metadata.namespace === contract.target.namespace &&
    equalLabels(labelMap(podSelector?.matchLabels), contract.target.pod_selector);
  const rules = egressRules(document);
  const dnsPassed =
    structurePassed && rules.some((rule) => ruleProvidesPath(rule, contract.required_paths.dns));
  const postgresPassed =
    structurePassed &&
    rules.some((rule) => ruleProvidesPath(rule, contract.required_paths.postgresql));
  const unrestricted = structurePassed
    ? unrestrictedObservations(rules, contract.forbidden.unrestricted_ipv4_cidr)
    : ['Candidate structure could not be safely evaluated.'];
  const forbidden = structurePassed
    ? forbiddenObservations(rules, contract.forbidden.destination_ipv4)
    : ['Candidate structure could not be safely evaluated.'];
  const unrestrictedPassed = structurePassed && unrestricted.length === 0;
  const forbiddenPassed = structurePassed && forbidden.length === 0;

  const checks: VerificationCheck[] = [
    check(
      'MANIFEST_VALID',
      inspection.parsePassed,
      { document_count: inspection.parsePassed ? 1 : 0 },
      inspection.parseMessage,
      inspection.parseMessage,
    ),
    check(
      'NETWORK_POLICY_KIND',
      kindPassed,
      { apiVersion: document?.apiVersion ?? null, kind: document?.kind ?? null },
      'Candidate has the required NetworkPolicy API version and kind.',
      'Candidate must use apiVersion networking.k8s.io/v1 and kind NetworkPolicy.',
    ),
    check(
      'NETWORK_POLICY_STRUCTURE',
      structurePassed,
      { has_metadata: metadata !== undefined, has_egress_array: Array.isArray(spec?.egress) },
      'Candidate is inside the supported NetworkPolicy structure.',
      'Candidate is outside the supported narrow NetworkPolicy structure.',
    ),
    check(
      'TARGET_IDENTITY',
      targetPassed,
      {
        name: metadata?.name ?? null,
        namespace: metadata?.namespace ?? null,
        pod_selector: labelMap(podSelector?.matchLabels) ?? null,
      },
      'Candidate selects checkout-api in the expected policy identity.',
      'Candidate must target checkout-egress in payments and select only app=checkout-api.',
    ),
    check(
      'DNS_REQUIRED_PATH',
      dnsPassed,
      { required: contract.required_paths.dns },
      'Required kube-dns UDP/TCP port 53 path is present.',
      'Required kube-dns UDP/TCP port 53 path is missing or broader/different.',
    ),
    check(
      'POSTGRES_REQUIRED_PATH',
      postgresPassed,
      { required: contract.required_paths.postgresql },
      'Required payments-data/postgres TCP/5432 path is present.',
      'Required payments-data/postgres TCP/5432 path is missing or broader/different.',
    ),
    check(
      'NO_UNRESTRICTED_EGRESS',
      unrestrictedPassed,
      unrestricted,
      'No unrestricted IPv4 or IPv6 egress rule is present.',
      'Candidate contains an unrestricted egress rule.',
    ),
    check(
      'FORBIDDEN_DESTINATION_EXCLUDED',
      forbiddenPassed,
      { destination_ipv4: contract.forbidden.destination_ipv4, matches: forbidden },
      'Declared forbidden destination is excluded by the static policy model.',
      'Candidate permits the declared forbidden destination in the static policy model.',
    ),
  ];

  const structurallyValid = inspection.parsePassed && kindPassed && structurePassed;
  const secure = structurallyValid && unrestrictedPassed && forbiddenPassed;
  const functional = structurallyValid && targetPassed && dnsPassed && postgresPassed;
  const resultClassification = classification(secure, functional, structurallyValid);
  return {
    schema_version: 1,
    classification: resultClassification,
    eligible: resultClassification === 'SECURE_AND_FUNCTIONAL',
    secure,
    functional,
    checks,
    limitations: [...VERIFIER_LIMITATIONS],
  };
}
