export type VerificationClassification =
  'SECURE_AND_FUNCTIONAL' | 'EXPOSED' | 'SECURE_BUT_OPERATIONALLY_REJECTED' | 'INVALID';

export type VerificationCheckId =
  | 'MANIFEST_VALID'
  | 'NETWORK_POLICY_KIND'
  | 'NETWORK_POLICY_STRUCTURE'
  | 'TARGET_IDENTITY'
  | 'DNS_REQUIRED_PATH'
  | 'POSTGRES_REQUIRED_PATH'
  | 'NO_UNRESTRICTED_EGRESS'
  | 'FORBIDDEN_DESTINATION_EXCLUDED';

export interface PolicyPortContract {
  protocol: 'TCP' | 'UDP';
  port: number;
}

export interface PolicyPeerContract {
  namespace_selector: Record<string, string>;
  pod_selector: Record<string, string>;
  ports: PolicyPortContract[];
}

export interface PolicyContract {
  schema_version: 1;
  target: {
    api_version: 'networking.k8s.io/v1';
    kind: 'NetworkPolicy';
    name: string;
    namespace: string;
    pod_selector: Record<string, string>;
  };
  required_paths: {
    dns: PolicyPeerContract;
    postgresql: PolicyPeerContract;
  };
  forbidden: {
    unrestricted_ipv4_cidr: '0.0.0.0/0';
    destination_host: string;
    destination_ipv4: string;
  };
}

export interface VerificationCheck {
  id: VerificationCheckId;
  passed: boolean;
  observed: unknown;
  message: string;
}

export interface VerificationResult {
  schema_version: 1;
  classification: VerificationClassification;
  eligible: boolean;
  secure: boolean;
  functional: boolean;
  checks: VerificationCheck[];
  limitations: string[];
}

export const VERIFIER_LIMITATIONS = [
  'Static validation of the owned NetworkPolicy fixture only; no Kubernetes API or cluster was contacted.',
  'The verifier does not simulate CNI behavior, DNS resolution, packets, application behavior, live reachability, data access, or exfiltration.',
] as const;
