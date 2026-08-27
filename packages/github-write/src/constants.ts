import { DETERMINISTIC_REMEDIATION_BRANCH } from '@guardian/policy-verifier';
import { DEMO_REPOSITORY, SUSPECT_COMMIT_SHA, TARGET_NETWORK_POLICY_FILE } from '@guardian/shared';

export const PHASE_THREE_PROPOSAL_HASH =
  '2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15' as const;
export const PHASE_THREE_PROPOSAL_ID = `proposal:sha256:${PHASE_THREE_PROPOSAL_HASH}` as const;
export const PHASE_THREE_VERIFIER_PACK_BINDING_SHA256 =
  '85b4e6fe6c547c89be6e7f1d42a224cb12ab12a43a4f572ada79936a84715458' as const;
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

export const EXPECTED_PROPOSAL_TARGET = {
  repository: DEMO_REPOSITORY,
  base_branch: 'main',
  remediation_branch: DETERMINISTIC_REMEDIATION_BRANCH,
  file: TARGET_NETWORK_POLICY_FILE,
  suspect_commit_sha: SUSPECT_COMMIT_SHA,
} as const;

const repositoryParts = DEMO_REPOSITORY.split('/');
if (repositoryParts.length !== 2 || repositoryParts.some((part) => part.length === 0)) {
  throw new Error('DEMO_REPOSITORY must be an owner/repository pair.');
}
const [repositoryOwner, repositoryName] = repositoryParts as [string, string];

export const PHASE_FOUR_TARGET = {
  repository: DEMO_REPOSITORY,
  owner: repositoryOwner,
  repo: repositoryName,
  baseBranch: EXPECTED_PROPOSAL_TARGET.base_branch,
  remediationBranch: EXPECTED_PROPOSAL_TARGET.remediation_branch,
  file: EXPECTED_PROPOSAL_TARGET.file,
} as const;
