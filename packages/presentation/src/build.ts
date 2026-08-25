import {
  actionReceiptSchema,
  bindEligibleProposal,
  PHASE_FOUR_TARGET,
  type ActionReceipt,
} from '@guardian/github-write';
import { investigationOutcomeSchema, type InvestigationOutcome } from '@guardian/investigation';
import type { EligibleProposal, FourStateProof, ProofState } from '@guardian/policy-verifier';
import { phaseFiveRunRecordSchema, type PhaseFiveRunRecord } from '@guardian/reliability';

import { guardianPresentationSchema, type GuardianPresentation } from './schema.js';

const APPROVAL_BOUNDARY =
  'TrueForge requires separate human approval for each official GitHub MCP write.' as const;
const VERIFIER_BOUNDARY = 'Daytona sandbox — deterministic static policy verifier' as const;

const proofStateDisplay: Record<
  ProofState,
  GuardianPresentation['verifier'] extends infer T
    ? T extends { state: 'FOUR_STATE_VERIFIED'; rows: (infer R)[] }
      ? R extends { state: infer S }
        ? S
        : never
      : never
    : never
> = {
  'last-good': 'LAST_KNOWN_GOOD',
  suspect: 'SUSPECT',
  'deny-all': 'DENY_ALL',
  candidate: 'GUARDIAN_REPAIR',
};

type PresentationEvidence = GuardianPresentation['evidence'];
type SupportedFinding = Extract<InvestigationOutcome, { outcome: 'SUPPORTED_SECURITY_FINDING' }>;

function unique(items: readonly string[]): string[] {
  return [...new Set(items)];
}

function presentationEvidence(evidenceIds: readonly string[]): PresentationEvidence {
  const ids = unique(evidenceIds);
  return {
    official_github_mcp: ids.filter((id) => id.startsWith('evidence:github:')),
    incident_fixture_mcp: ids.filter((id) =>
      /^evidence:(deployment|security-alert|reachability|dependency):/u.test(id),
    ),
    deterministic_rule: ids.filter((id) => id.startsWith('evidence:rule:')),
  };
}

function supportedEvidenceIds(finding: InvestigationOutcome, proposal: EligibleProposal | null) {
  const findingIds =
    finding.outcome === 'SUPPORTED_SECURITY_FINDING'
      ? finding.supported_claims.flatMap((claim) => claim.evidence_ids)
      : [];
  return unique([...findingIds, ...(proposal?.supporting_evidence_ids ?? [])]);
}

function knownFinding(finding: InvestigationOutcome): GuardianPresentation['finding'] {
  if (finding.outcome !== 'SUPPORTED_SECURITY_FINDING') {
    const reason = finding.evidence_defects.join(' ');
    return {
      affected_asset: finding.asset,
      causal_commit: { state: 'UNKNOWN', reason },
      changed_file: { state: 'UNKNOWN', reason },
      exposure_path: { state: 'UNKNOWN', reason },
      actual_data_access: finding.actual_data_access,
    };
  }
  return {
    affected_asset: finding.asset,
    causal_commit: { state: 'KNOWN', value: finding.suspect_commit_sha },
    changed_file: { state: 'KNOWN', value: finding.changed_file },
    exposure_path: { state: 'KNOWN', value: finding.exposure_path },
    actual_data_access: finding.actual_data_access,
  };
}

function bindPresentationProposal(proposal: EligibleProposal) {
  const result = bindEligibleProposal(proposal);
  if (result.status !== 'BOUND') {
    throw new Error(`Presentation rejected an unbound proposal: ${result.reason}`);
  }
  return result.binding.proposal;
}

function assertReceiptMatchesBoundProposal(
  receipt: ActionReceipt,
  proposal: EligibleProposal,
): void {
  if (receipt.proposal_hash_sha256 !== proposal.proposal_hash_sha256) {
    throw new Error('Presentation rejected an action receipt for a different proposal hash.');
  }
  if (
    receipt.repository !== PHASE_FOUR_TARGET.repository ||
    receipt.base_branch !== PHASE_FOUR_TARGET.baseBranch ||
    receipt.remediation_branch !== PHASE_FOUR_TARGET.remediationBranch
  ) {
    throw new Error('Presentation rejected an action receipt for a different GitHub target.');
  }
  if (
    receipt.pr_number !== undefined &&
    receipt.pr_url !==
      `https://github.com/${PHASE_FOUR_TARGET.repository}/pull/${receipt.pr_number}`
  ) {
    throw new Error('Presentation rejected an action receipt with a mismatched pull-request URL.');
  }
}

function proofRows(proof: FourStateProof) {
  return proof.states.map(({ state, result }) => ({
    state: proofStateDisplay[state],
    classification: result.classification,
    legitimate_db_path: result.functional ? ('Allow' as const) : ('Deny' as const),
    forbidden_external_path: result.secure ? ('Deny' as const) : ('Allow' as const),
    decision:
      result.classification === 'SECURE_AND_FUNCTIONAL'
        ? 'Secure and functional'
        : result.classification === 'EXPOSED'
          ? 'Exposure reproduced'
          : result.classification === 'SECURE_BUT_OPERATIONALLY_REJECTED'
            ? 'Rejected: breaks checkout'
            : 'Invalid candidate',
  }));
}

function exactProposal(proposal: EligibleProposal): GuardianPresentation['proposal'] {
  return {
    state: 'EXACT',
    proposal_id: proposal.proposal_id,
    proposal_hash_sha256: proposal.proposal_hash_sha256,
    exact_patch: proposal.canonical_diff,
  };
}

function buildVerifiedPresentationSections(input: {
  finding: SupportedFinding;
  proposal: EligibleProposal;
  receipt: ActionReceipt | null;
  evidenceIds?: readonly string[];
}): Pick<
  GuardianPresentation,
  'severity' | 'finding' | 'evidence' | 'verifier' | 'proposal' | 'limitations'
> {
  return {
    severity: input.finding.severity,
    finding: knownFinding(input.finding),
    evidence: presentationEvidence(
      input.evidenceIds ?? supportedEvidenceIds(input.finding, input.proposal),
    ),
    verifier: {
      state: 'FOUR_STATE_VERIFIED',
      execution_boundary: VERIFIER_BOUNDARY,
      rows: proofRows(input.proposal.four_state_verifier_result),
    },
    proposal: exactProposal(input.proposal),
    limitations: commonLimitations(input),
  };
}

function commonLimitations(input: {
  finding: InvestigationOutcome;
  proposal: EligibleProposal | null;
  receipt: ActionReceipt | null;
}): string[] {
  return unique([
    ...input.finding.limitations,
    ...(input.proposal?.limitations ?? []),
    ...(input.receipt?.remaining_limitations ?? []),
  ]);
}

function parseFinding(untrustedFinding: InvestigationOutcome): InvestigationOutcome {
  return investigationOutcomeSchema.parse(untrustedFinding);
}

export function buildReadyPresentation(input: {
  finding: InvestigationOutcome;
  proposal: EligibleProposal;
}): GuardianPresentation {
  const finding = parseFinding(input.finding);
  if (finding.outcome !== 'SUPPORTED_SECURITY_FINDING') {
    throw new Error('A ready presentation requires a supported security finding.');
  }
  const proposal = bindPresentationProposal(input.proposal);
  return guardianPresentationSchema.parse({
    schema_version: 1,
    terminal_status: 'SECURITY_REMEDIATION_READY',
    headline: 'Least-privilege remediation is verified and awaiting approval',
    ...buildVerifiedPresentationSections({ finding, proposal, receipt: null }),
    action: {
      approval_state: 'REQUIRED',
      approval_boundary: APPROVAL_BOUNDARY,
      github_result: { state: 'NONE' },
    },
  });
}

export function buildRunRecordPresentation(input: {
  record: PhaseFiveRunRecord;
  finding: InvestigationOutcome;
  proposal: EligibleProposal | null;
}): GuardianPresentation {
  const record = phaseFiveRunRecordSchema.parse(input.record);
  const finding = parseFinding(input.finding);
  const status = record.actual_terminal_status;
  if (
    status !== 'INCONCLUSIVE' &&
    status !== 'NO_SAFE_REMEDIATION' &&
    status !== 'DENIED' &&
    status !== 'PR_REUSED' &&
    status !== 'WRITE_CONFLICT'
  ) {
    throw new Error(`Phase 5 record status ${status} is not a terminal presentation source.`);
  }

  if (status === 'INCONCLUSIVE') {
    if (finding.outcome !== 'INCONCLUSIVE' || input.proposal !== null) {
      throw new Error('INCONCLUSIVE presentation source must not contain a proposal.');
    }
    return guardianPresentationSchema.parse({
      schema_version: 1,
      terminal_status: status,
      headline: 'Investigation stopped because required evidence is incomplete or conflicting',
      severity: finding.severity,
      finding: knownFinding(finding),
      evidence: presentationEvidence(record.evidence_ids),
      verifier: {
        state: 'NOT_RUN',
        reason: record.evidence_defects.join(' '),
      },
      proposal: {
        state: 'ABSENT',
        reason: 'No proposal is permitted when the evidence gate is inconclusive.',
      },
      limitations: commonLimitations({ finding, proposal: null, receipt: null }),
      action: {
        approval_state: 'NOT_REACHED',
        approval_boundary: APPROVAL_BOUNDARY,
        github_result: { state: 'NONE' },
      },
    });
  }

  if (finding.outcome !== 'SUPPORTED_SECURITY_FINDING') {
    throw new Error(`${status} presentation requires the supported High security finding.`);
  }

  if (status === 'NO_SAFE_REMEDIATION') {
    if (input.proposal !== null || record.verifier_output === null) {
      throw new Error('NO_SAFE_REMEDIATION cannot contain an eligible proposal.');
    }
    const attempts = record.verifier_output.attempts.map((attempt) => ({
      attempt: attempt.attempt,
      outcome: attempt.outcome,
      classification: attempt.classification,
      diagnostics: attempt.diagnostics,
    }));
    return guardianPresentationSchema.parse({
      schema_version: 1,
      terminal_status: status,
      headline: 'No tested candidate preserved both security and checkout availability',
      severity: finding.severity,
      finding: knownFinding(finding),
      evidence: presentationEvidence([
        ...record.evidence_ids,
        ...supportedEvidenceIds(finding, null),
      ]),
      verifier: {
        state: 'NO_SAFE_REMEDIATION',
        execution_boundary: VERIFIER_BOUNDARY,
        attempts,
      },
      proposal: {
        state: 'ABSENT',
        reason: 'The bounded two-attempt verifier produced no eligible remediation.',
      },
      limitations: commonLimitations({ finding, proposal: null, receipt: null }),
      action: {
        approval_state: 'NOT_REACHED',
        approval_boundary: APPROVAL_BOUNDARY,
        github_result: { state: 'NONE' },
      },
    });
  }

  if (input.proposal === null || record.verifier_output?.four_state === null) {
    throw new Error(`${status} presentation requires the bound proposal and four-state proof.`);
  }
  const proposal = bindPresentationProposal(input.proposal);
  const receipt = record.action_receipt;
  if (receipt === null) throw new Error(`${status} presentation requires an action receipt.`);
  assertReceiptMatchesBoundProposal(receipt, proposal);

  const outcome = (() => {
    switch (status) {
      case 'DENIED':
        return {
          headline: 'Human denied the exact remediation; GitHub remained unchanged',
          approvalState: 'DENIED' as const,
          githubResult: { state: 'NONE' as const },
        };
      case 'PR_REUSED': {
        const remote = record.remote_result;
        if (remote?.status !== 'PR_REUSED') {
          throw new Error('PR_REUSED presentation requires the typed remote result.');
        }
        return {
          headline: 'Existing verified remediation pull request reused without a write',
          approvalState: 'NOT_REQUIRED_REUSE' as const,
          githubResult: {
            state: 'PR_REUSED' as const,
            pr_number: remote.pr_number,
            pr_url: remote.pr_url,
            remote_commit_sha: remote.remote_commit_sha,
          },
        };
      }
      case 'WRITE_CONFLICT': {
        const remote = record.remote_result;
        if (remote?.status !== 'WRITE_CONFLICT') {
          throw new Error('WRITE_CONFLICT presentation requires the typed remote result.');
        }
        return {
          headline: 'Remote remediation state conflicts with the exact approved proposal',
          approvalState: 'BLOCKED_CONFLICT' as const,
          githubResult: {
            state: 'WRITE_CONFLICT' as const,
            reason: remote.reason,
            observed_remote_commit_sha: remote.observed_remote_commit_sha,
            observed_git_blob_sha: remote.observed_git_blob_sha,
          },
        };
      }
    }
  })();

  return guardianPresentationSchema.parse({
    schema_version: 1,
    terminal_status: status,
    headline: outcome.headline,
    ...buildVerifiedPresentationSections({
      finding,
      proposal,
      receipt,
      evidenceIds: [...record.evidence_ids, ...supportedEvidenceIds(finding, proposal)],
    }),
    action: {
      approval_state: outcome.approvalState,
      approval_boundary: APPROVAL_BOUNDARY,
      github_result: outcome.githubResult,
    },
  });
}

export function buildCreatedPresentation(input: {
  receipt: ActionReceipt;
  finding: InvestigationOutcome;
  proposal: EligibleProposal;
}): GuardianPresentation {
  const receipt = actionReceiptSchema.parse(input.receipt);
  const finding = parseFinding(input.finding);
  if (receipt.status !== 'PR_CREATED' || finding.outcome !== 'SUPPORTED_SECURITY_FINDING') {
    throw new Error('PR_CREATED presentation requires a created receipt and supported finding.');
  }
  const proposal = bindPresentationProposal(input.proposal);
  assertReceiptMatchesBoundProposal(receipt, proposal);
  if (
    receipt.pr_number === undefined ||
    receipt.pr_url === undefined ||
    receipt.remote_commit_sha === undefined
  ) {
    throw new Error('PR_CREATED receipt is missing its typed remote result.');
  }
  return guardianPresentationSchema.parse({
    schema_version: 1,
    terminal_status: 'PR_CREATED',
    headline: 'Approved remediation pull request created through official GitHub MCP',
    ...buildVerifiedPresentationSections({ finding, proposal, receipt }),
    action: {
      approval_state: 'APPROVED',
      approval_boundary: APPROVAL_BOUNDARY,
      github_result: {
        state: 'PR_CREATED',
        pr_number: receipt.pr_number,
        pr_url: receipt.pr_url,
        remote_commit_sha: receipt.remote_commit_sha,
      },
    },
  });
}
