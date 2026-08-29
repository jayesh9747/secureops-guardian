import { FINDING_PACK_REGISTRY } from '@guardian/investigation';
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
  const selectedPack = FINDING_PACK_REGISTRY.packs.find(
    (pack) =>
      pack.identity.pack_id === selection.pack_id &&
      pack.identity.pack_version === selection.pack_version,
  );
  if (selectedPack === undefined) {
    throw new Error('Interpreted-request card requires a registered pack capability.');
  }
  const capabilityRank = {
    ANALYSIS_ONLY: 0,
    REMEDIATION_PROVEN: 1,
    OPEN_PR_ELIGIBLE: 2,
  } as const;
  const requestedCeiling = {
    ANALYSIS_ONLY: 'ANALYSIS_ONLY',
    PREPARE_REMEDIATION: 'REMEDIATION_PROVEN',
    OPEN_PR: 'OPEN_PR_ELIGIBLE',
  } as const;
  const expectedCeiling =
    capabilityRank[selectedPack.capability] < capabilityRank[requestedCeiling[mode]]
      ? selectedPack.capability
      : requestedCeiling[mode];
  if (selection.capability_ceiling !== expectedCeiling) {
    throw new Error('Interpreted-request card requires a registered pack capability.');
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
