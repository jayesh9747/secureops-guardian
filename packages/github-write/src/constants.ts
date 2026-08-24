import {
  DETERMINISTIC_REMEDIATION_BRANCH,
  PROPOSAL_LIMITATIONS,
  SUPPORTING_EVIDENCE_IDS,
} from '@guardian/policy-verifier';
import { DEMO_REPOSITORY, TARGET_NETWORK_POLICY_FILE } from '@guardian/shared';

export const PHASE_THREE_PROPOSAL_HASH =
  '2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15' as const;
export const PHASE_THREE_PROPOSAL_ID = `proposal:sha256:${PHASE_THREE_PROPOSAL_HASH}` as const;
export const VERIFIED_CANDIDATE_SHA256 =
  'c282434c506a45e93e39d2329b33c8466ba7a8a1d5d238817530678d975ad165' as const;
export const VERIFIED_CANDIDATE_GIT_BLOB_SHA = '1eddb230ac7c05bae199e6b9162a42da3bf039fa' as const;
export const SUSPECT_CANDIDATE_GIT_BLOB_SHA = '477c7db7edd61de10fce67713d52e442f2358318' as const;

export const VERIFIED_CANDIDATE_YAML = `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: checkout-egress
  namespace: payments
spec:
  podSelector:
    matchLabels:
      app: checkout-api
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: payments-data
          podSelector:
            matchLabels:
              app: postgres
      ports:
        - protocol: TCP
          port: 5432
`;

export const REMEDIATION_COMMIT_MESSAGE = `fix: restrict checkout egress

Guardian-Proposal-SHA256: ${PHASE_THREE_PROPOSAL_HASH}`;

export const REMEDIATION_PR_TITLE = 'fix: restrict checkout egress to required dependencies';

const evidenceLines = SUPPORTING_EVIDENCE_IDS.map((id) => `- \`${id}\``).join('\n');
const limitationLines = PROPOSAL_LIMITATIONS.map((limitation) => `- ${limitation}`).join('\n');

export const REMEDIATION_PR_BODY = `## SecureOps Guardian remediation

This pull request applies the exact Phase 3 sandbox-verified candidate for \`SEC-NET-001\`.

- Proposal hash: \`${PHASE_THREE_PROPOSAL_HASH}\`
- Proposal ID: \`${PHASE_THREE_PROPOSAL_ID}\`
- Base branch: \`main\`
- Remediation branch: \`${DETERMINISTIC_REMEDIATION_BRANCH}\`
- Target file: \`${TARGET_NETWORK_POLICY_FILE}\`
- Verified candidate SHA-256: \`${VERIFIED_CANDIDATE_SHA256}\`
- Verified candidate Git blob SHA: \`${VERIFIED_CANDIDATE_GIT_BLOB_SHA}\`

### Four-state verifier

| State | Classification | Secure | Functional |
| --- | --- | --- | --- |
| Last-known-good | SECURE_AND_FUNCTIONAL | Yes | Yes |
| Suspect | EXPOSED | No | Yes |
| Deny-all | SECURE_BUT_OPERATIONALLY_REJECTED | Yes | No |
| Guardian candidate | SECURE_AND_FUNCTIONAL | Yes | Yes |

### Supporting evidence IDs

${evidenceLines}

### Evidence records

- [Phase 3 sandbox proof](https://github.com/jayesh9747/secureops-guardian/blob/main/docs/evidence/PHASE_3_SANDBOX_PROOF.md)
- [Verified candidate artifact](https://github.com/jayesh9747/secureops-guardian/blob/main/docs/evidence/PHASE_3_CANDIDATE.yaml)
- [Canonical proposal artifact](https://github.com/jayesh9747/secureops-guardian/blob/main/docs/evidence/PHASE_3_PROPOSAL.json)

### Limitations

${limitationLines}

Guardian created this reviewable pull request through separately approved official GitHub MCP writes. The sequence is retry-safe, not atomic. Guardian did not merge, deploy, roll back, delete a branch, or access a Kubernetes cluster.
`;

export const PHASE_FOUR_TARGET = {
  repository: DEMO_REPOSITORY,
  owner: 'jayesh9747',
  repo: 'guardian-demo-checkout',
  baseBranch: 'main',
  remediationBranch: DETERMINISTIC_REMEDIATION_BRANCH,
  file: TARGET_NETWORK_POLICY_FILE,
} as const;
