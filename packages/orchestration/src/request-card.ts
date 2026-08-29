import { interpretedRequestCardSchema } from '@guardian/presentation';

import type { GuardianRequestCompilation } from './intent.js';

export interface InterpretedRequestPackSelection {
  pack_id: string;
  pack_version: string;
  capability_ceiling: 'ANALYSIS_ONLY' | 'REMEDIATION_PROVEN' | 'OPEN_PR_ELIGIBLE';
}

export function buildInterpretedRequestCard(
  compilation: GuardianRequestCompilation,
  selection: InterpretedRequestPackSelection,
) {
  if (compilation.status !== 'CONFIRMATION_REQUIRED') {
    throw new Error('An interpreted-request card requires a confirmation-required compilation.');
  }
  const mode = compilation.interpreted_request.mode;
  const isRegisteredSelection =
    (selection.pack_id === 'k8s-network-egress-v1' &&
      selection.pack_version === '1.0.4' &&
      (selection.capability_ceiling === 'REMEDIATION_PROVEN' ||
        selection.capability_ceiling === 'OPEN_PR_ELIGIBLE')) ||
    (selection.pack_id === 'k8s-workload-security-v1' &&
      selection.pack_version === '1.0.0' &&
      selection.capability_ceiling === 'ANALYSIS_ONLY');
  if (!isRegisteredSelection) {
    throw new Error('Interpreted-request card requires a registered pack capability.');
  }
  if (
    (mode === 'ANALYSIS_ONLY' && selection.capability_ceiling !== 'ANALYSIS_ONLY') ||
    (mode === 'PREPARE_REMEDIATION' && selection.capability_ceiling === 'OPEN_PR_ELIGIBLE')
  ) {
    throw new Error('Selected pack capability exceeds the interpreted request mode.');
  }
  return interpretedRequestCardSchema.parse({
    schema_version: 1,
    request_id: `guardian-request:sha256:${compilation.interpreted_request_sha256}`,
    request_sha256: compilation.interpreted_request_sha256,
    repository: compilation.interpreted_request.repository,
    base_branch: compilation.interpreted_request.base_branch,
    revision: compilation.interpreted_request.revision,
    target_file: compilation.interpreted_request.target_file,
    pack: {
      pack_id: selection.pack_id,
      pack_version: selection.pack_version,
    },
    capability_ceiling: selection.capability_ceiling,
    will_not:
      selection.capability_ceiling === 'ANALYSIS_ONLY'
        ? 'Guardian will not create a sandbox, proposal, approval request, or GitHub write for this pack.'
        : mode === 'OPEN_PR'
          ? 'Guardian will not write without separate approvals, merge, deploy, or access a Kubernetes cluster.'
          : 'Guardian will not request GitHub approval, write, merge, deploy, or access a Kubernetes cluster in this mode.',
    confirmation_notice: 'Confirming this interpretation does not authorize any GitHub write.',
  });
}
