import type { PolicyContract, PolicyPeerContract, PolicyPortContract } from './types.js';

export class PolicyContractError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'PolicyContractError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new PolicyContractError(`${path} must be an object.`);
  }
  return value;
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new PolicyContractError(`${path} must be a non-empty string.`);
  }
  return value;
}

function requireSelector(value: unknown, path: string): Record<string, string> {
  const record = requireRecord(value, path);
  const entries = Object.entries(record);
  if (entries.length === 0) {
    throw new PolicyContractError(`${path} must contain at least one label.`);
  }
  const selector: Record<string, string> = {};
  for (const [key, labelValue] of entries) {
    selector[key] = requireString(labelValue, `${path}.${key}`);
  }
  return selector;
}

function requirePorts(value: unknown, path: string): PolicyPortContract[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new PolicyContractError(`${path} must be a non-empty array.`);
  }
  return value.map((item, index) => {
    const port = requireRecord(item, `${path}[${index}]`);
    const protocol = requireString(port.protocol, `${path}[${index}].protocol`);
    if (protocol !== 'TCP' && protocol !== 'UDP') {
      throw new PolicyContractError(`${path}[${index}].protocol must be TCP or UDP.`);
    }
    if (!Number.isInteger(port.port) || Number(port.port) < 1 || Number(port.port) > 65_535) {
      throw new PolicyContractError(`${path}[${index}].port must be an integer from 1 to 65535.`);
    }
    return { protocol, port: Number(port.port) };
  });
}

function requirePeer(value: unknown, path: string): PolicyPeerContract {
  const peer = requireRecord(value, path);
  return {
    namespace_selector: requireSelector(peer.namespace_selector, `${path}.namespace_selector`),
    pod_selector: requireSelector(peer.pod_selector, `${path}.pod_selector`),
    ports: requirePorts(peer.ports, `${path}.ports`),
  };
}

function isIpv4(value: string): boolean {
  const octets = value.split('.');
  return (
    octets.length === 4 && octets.every((octet) => /^\d{1,3}$/u.test(octet) && Number(octet) <= 255)
  );
}

export function parsePolicyContract(contractJson: string): PolicyContract {
  let parsed: unknown;
  try {
    parsed = JSON.parse(contractJson) as unknown;
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'unknown JSON parser error';
    throw new PolicyContractError(`Contract is not valid JSON: ${detail}`);
  }

  const root = requireRecord(parsed, 'contract');
  if (root.schema_version !== 1) {
    throw new PolicyContractError('contract.schema_version must be 1.');
  }
  const target = requireRecord(root.target, 'contract.target');
  if (target.api_version !== 'networking.k8s.io/v1') {
    throw new PolicyContractError('contract.target.api_version must be networking.k8s.io/v1.');
  }
  if (target.kind !== 'NetworkPolicy') {
    throw new PolicyContractError('contract.target.kind must be NetworkPolicy.');
  }
  const requiredPaths = requireRecord(root.required_paths, 'contract.required_paths');
  const forbidden = requireRecord(root.forbidden, 'contract.forbidden');
  if (forbidden.unrestricted_ipv4_cidr !== '0.0.0.0/0') {
    throw new PolicyContractError('contract.forbidden.unrestricted_ipv4_cidr must be 0.0.0.0/0.');
  }
  const destinationIpv4 = requireString(
    forbidden.destination_ipv4,
    'contract.forbidden.destination_ipv4',
  );
  if (!isIpv4(destinationIpv4)) {
    throw new PolicyContractError('contract.forbidden.destination_ipv4 must be an IPv4 address.');
  }

  return {
    schema_version: 1,
    target: {
      api_version: 'networking.k8s.io/v1',
      kind: 'NetworkPolicy',
      name: requireString(target.name, 'contract.target.name'),
      namespace: requireString(target.namespace, 'contract.target.namespace'),
      pod_selector: requireSelector(target.pod_selector, 'contract.target.pod_selector'),
    },
    required_paths: {
      dns: requirePeer(requiredPaths.dns, 'contract.required_paths.dns'),
      postgresql: requirePeer(requiredPaths.postgresql, 'contract.required_paths.postgresql'),
    },
    forbidden: {
      unrestricted_ipv4_cidr: '0.0.0.0/0',
      destination_host: requireString(
        forbidden.destination_host,
        'contract.forbidden.destination_host',
      ),
      destination_ipv4: destinationIpv4,
    },
  };
}
