import {
  guardianIncidentBriefSchema,
  renderGuardianIncidentBriefMarkdown,
  type GuardianIncidentBrief,
} from '@guardian/presentation';
import {
  canonicalJson,
  recomputeProposalHash,
  recomputeVerifierPackBinding,
  type EligibleProposal,
} from '@guardian/policy-verifier';

import { guardianRunReceiptSchema } from './receipt.js';

export function buildIncidentBriefArtifacts(input: {
  brief: GuardianIncidentBrief;
  receipt: unknown;
  proposal: EligibleProposal | null;
}) {
  const brief = guardianIncidentBriefSchema.parse(input.brief);
  const receipt = guardianRunReceiptSchema.parse(input.receipt);
  const receiptRevision =
    receipt.scope.suspect.kind === 'commit'
      ? receipt.scope.suspect.commit_sha
      : `${receipt.scope.suspect.base_sha}...${receipt.scope.suspect.head_sha}`;
  if (
    receipt.receipt_id !== brief.identity.receipt.receipt_id ||
    receipt.request_identity?.request_id !== brief.identity.request.request_id ||
    receipt.request_identity.request_sha256 !== brief.identity.request.request_sha256 ||
    receipt.finding_pack?.pack_id !== brief.identity.pack.pack_id ||
    receipt.finding_pack.pack_version !== brief.identity.pack.pack_version ||
    receipt.finding_pack.capability !== brief.identity.pack.capability ||
    receipt.scope.repository !== brief.identity.target.repository ||
    receipt.scope.base_branch !== brief.identity.target.base_branch ||
    receiptRevision !== brief.identity.target.revision ||
    (receipt.scope.target_file ?? null) !== brief.identity.target.file
  ) {
    throw new Error('Incident Brief artifact identity does not match its run receipt.');
  }
  const proposal = input.proposal;
  if (proposal === null) {
    if (
      brief.identity.proposal !== null ||
      brief.disclosures.proposed_change !== null ||
      receipt.proposal_hash_sha256 !== null ||
      (receipt.proposal_id !== undefined && receipt.proposal_id !== null)
    ) {
      throw new Error('Incident Brief artifact rejected unexpected proposal identity.');
    }
  } else if (
    brief.identity.proposal?.proposal_id !== proposal.proposal_id ||
    brief.identity.proposal.proposal_hash_sha256 !== proposal.proposal_hash_sha256 ||
    brief.identity.proposal.verifier_pack_binding_sha256 !==
      proposal.verifier_pack_binding_sha256 ||
    receipt.proposal_id !== proposal.proposal_id ||
    receipt.proposal_hash_sha256 !== proposal.proposal_hash_sha256 ||
    brief.disclosures.proposed_change?.exact_diff !== proposal.canonical_diff ||
    proposal.target.repository !== brief.identity.target.repository ||
    proposal.target.base_branch !== brief.identity.target.base_branch ||
    proposal.target.file !== brief.identity.target.file ||
    proposal.target.suspect_commit_sha !==
      (receipt.scope.suspect.kind === 'commit'
        ? receipt.scope.suspect.commit_sha
        : receipt.scope.suspect.head_sha)
  ) {
    throw new Error('Incident Brief artifact proposal, hash, diff, or target mismatch.');
  }
  if (
    proposal !== null &&
    (proposal.proposal_hash_sha256 !== recomputeProposalHash(proposal) ||
      proposal.proposal_id !== `proposal:sha256:${proposal.proposal_hash_sha256}` ||
      proposal.verifier_pack_binding_sha256 !== recomputeVerifierPackBinding(proposal) ||
      receipt.verifier_pack_binding_sha256 !== proposal.verifier_pack_binding_sha256 ||
      canonicalJson(receipt.verifier_pack) !== canonicalJson(proposal.verifier_pack))
  ) {
    throw new Error(
      'Incident Brief artifact rejected forged proposal content or verifier binding.',
    );
  }
  const markdown = renderGuardianIncidentBriefMarkdown(brief);
  const receiptJson = `${JSON.stringify(receipt, null, 2)}\n`;
  const verifiedChange =
    proposal === null
      ? null
      : {
          schema_version: 1,
          request_id: brief.identity.request.request_id,
          receipt_id: brief.identity.receipt.receipt_id,
          proposal_id: proposal.proposal_id,
          proposal_hash_sha256: proposal.proposal_hash_sha256,
          verifier_pack_binding_sha256: proposal.verifier_pack_binding_sha256,
          pack: brief.identity.pack,
          target: brief.identity.target,
          candidate_yaml: proposal.canonical_candidate_yaml,
          exact_diff: proposal.canonical_diff,
        };
  return {
    markdown: {
      file_name: 'guardian-incident-brief.md' as const,
      media_type: 'text/markdown' as const,
      content: markdown,
    },
    receipt_json: {
      file_name: 'guardian-run-receipt.json' as const,
      media_type: 'application/json' as const,
      content: receiptJson,
    },
    verified_change:
      verifiedChange === null
        ? null
        : {
            file_name: 'guardian-verified-change.json' as const,
            media_type: 'application/json' as const,
            content: `${JSON.stringify(verifiedChange, null, 2)}\n`,
          },
  };
}
