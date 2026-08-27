export const VERIFIER_SKILL_NAME = 'guardian-network-egress-v1' as const;
export const VERIFIER_PACK_ROOT = `/opt/tf/skills/${VERIFIER_SKILL_NAME}` as const;

export const VERIFIER_PACK_METADATA = {
  pack_id: 'k8s-network-egress-v1',
  pack_version: '1.0.2',
  source_revision: 'guardian-network-egress-v1.0.2',
} as const;

// This trust-anchor module deliberately excludes manifest and bundle digests.
// The published verifier bundle imports it, so adding either digest here would
// create a manifest/bundle digest cycle.
export const VERIFIER_PACK_SCOPE = {
  repository: 'jayesh9747/guardian-demo-checkout',
  base_branch: 'main',
  suspect_commit_sha: '7b2f2ad51f9ef97334176fbfed3138465b62fcdb',
  target_file: 'k8s/checkout-networkpolicy.yaml',
  api_version: 'networking.k8s.io/v1',
  kind: 'NetworkPolicy',
  verifier_subset: VERIFIER_SKILL_NAME,
} as const;
