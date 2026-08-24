import type { ProposalBinding } from './binding.js';
import { buildActionReceipt, type ReceiptProof } from './receipt.js';

export const PHASE_FOUR_RECEIPT_PROOFS = [
  {
    fileName: 'PHASE_4_DENIED_RECEIPT.json',
    proof: {
      status: 'DENIED',
      deniedToolCallReferences: ['call_8455492'],
      githubResultReferences: ['call_1209563', 'call_1209579', 'call_1209587', 'call_1209598'],
      remoteCandidateVerified: false,
      baseBranchUnchanged: true,
      deterministicBranchAbsent: true,
      matchingPullRequestAbsent: true,
    },
  },
  {
    fileName: 'PHASE_4_PR_CREATED_RECEIPT.json',
    proof: {
      status: 'PR_CREATED',
      approvedToolCallReferences: ['call_5239399', 'call_5722506', 'call_7149047'],
      githubResultReferences: [
        '01m0t4phxj040eq379fzn7em2q',
        '01m0t4qpx3gj0kna251s5s49kq',
        'call_6832789',
        'call_6832793',
        'call_6832805',
        'call_6832809',
        '01m0t4sa4naf9y2b22bm4nqemn',
        'call_3578534',
      ],
      remoteCandidateVerified: true,
      baseBranchUnchanged: true,
      remoteCommitSha: '44fb8c7f5e99f835c6779f5e7b777c1b016af5b3',
      prNumber: 1,
      prUrl: 'https://github.com/jayesh9747/guardian-demo-checkout/pull/1',
    },
  },
  {
    fileName: 'PHASE_4_PR_REUSED_RECEIPT.json',
    proof: {
      status: 'PR_REUSED',
      githubResultReferences: [
        'call_6791435',
        'call_6791447',
        'call_6791466',
        'call_6791470',
        'call_8972036',
        'call_8972059',
      ],
      remoteCandidateVerified: true,
      baseBranchUnchanged: true,
      remoteCommitSha: '44fb8c7f5e99f835c6779f5e7b777c1b016af5b3',
      prNumber: 1,
      prUrl: 'https://github.com/jayesh9747/guardian-demo-checkout/pull/1',
    },
  },
] as const satisfies ReadonlyArray<{ fileName: string; proof: ReceiptProof }>;

export function buildPhaseFourReceiptArtifacts(binding: ProposalBinding) {
  return PHASE_FOUR_RECEIPT_PROOFS.map(({ fileName, proof }) => ({
    fileName,
    receipt: buildActionReceipt(binding, proof),
  }));
}
