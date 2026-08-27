import { createHash } from 'node:crypto';

import { actionReceiptSchema } from '@guardian/github-write';
import { canonicalJson, verifierPackIdentitySchema } from '@guardian/policy-verifier';
import { z } from 'zod';

export const phaseFiveScenarioIdSchema = z.enum([
  'existing-pr-reuse',
  'denied-first-write',
  'missing-deployment-evidence',
  'missing-reachability-evidence',
  'conflicting-deployment-revision',
  'candidate-failure-two-attempts',
  'mismatched-remote-branch-content',
  'reconnect-pending-action',
]);

export const phaseFiveTerminalStatusSchema = z.enum([
  'INCONCLUSIVE',
  'SECURITY_REMEDIATION_READY',
  'WRITE_REQUIRED',
  'NO_SAFE_REMEDIATION',
  'DENIED',
  'PR_REUSED',
  'WRITE_CONFLICT',
]);

const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/u);
const gitShaSchema = z.string().regex(/^[0-9a-f]{40}$/u);

const verifierAttemptSchema = z
  .object({
    attempt: z.union([z.literal(1), z.literal(2)]),
    outcome: z.enum(['SECURITY_REMEDIATION_READY', 'CORRECTION_REQUIRED', 'NO_SAFE_REMEDIATION']),
    classification: z.enum([
      'SECURE_AND_FUNCTIONAL',
      'EXPOSED',
      'SECURE_BUT_OPERATIONALLY_REJECTED',
      'INVALID',
    ]),
    eligible: z.boolean(),
    diagnostics: z.array(z.string().min(1)),
  })
  .strict();

const proofRowSchema = z
  .object({
    state: z.enum(['last-good', 'suspect', 'deny-all', 'candidate']),
    classification: z.enum([
      'SECURE_AND_FUNCTIONAL',
      'EXPOSED',
      'SECURE_BUT_OPERATIONALLY_REJECTED',
      'INVALID',
    ]),
    eligible: z.boolean(),
    secure: z.boolean(),
    functional: z.boolean(),
  })
  .strict();

const verifierOutputSchema = z
  .object({
    verifier_pack: verifierPackIdentitySchema,
    attempts: z.array(verifierAttemptSchema).min(1).max(2),
    four_state: z.array(proofRowSchema).length(4).nullable(),
  })
  .strict();

export const checkpointValuesSchema = z
  .object({
    case_id: z.string().min(1),
    evidence_ids: z.array(z.string().min(1)).min(1),
    proposal_hash_sha256: sha256Schema,
    pending_action: z.enum(['CREATE_BRANCH', 'UPDATE_FILE', 'CREATE_PR']),
  })
  .strict();

const persistenceProofSchema = z
  .object({
    before_reconnect: checkpointValuesSchema,
    after_reconnect: checkpointValuesSchema,
    serialized_checkpoint_sha256: sha256Schema,
  })
  .strict()
  .superRefine((proof, context) => {
    const before = canonicalJson(proof.before_reconnect);
    if (before !== canonicalJson(proof.after_reconnect)) {
      context.addIssue({ code: 'custom', message: 'Reconnect checkpoint values changed.' });
    }
    const expectedHash = createHash('sha256').update(before).digest('hex');
    if (proof.serialized_checkpoint_sha256 !== expectedHash) {
      context.addIssue({ code: 'custom', message: 'Reconnect checkpoint hash is invalid.' });
    }
  });

const remoteResultSchema = z.discriminatedUnion('status', [
  z
    .object({
      status: z.literal('PR_REUSED'),
      remote_commit_sha: gitShaSchema,
      candidate_git_blob_sha: gitShaSchema,
      pr_number: z.number().int().positive(),
      pr_url: z.url(),
    })
    .strict(),
  z
    .object({
      status: z.literal('WRITE_CONFLICT'),
      reason: z.string().min(1),
      observed_remote_commit_sha: gitShaSchema,
      observed_git_blob_sha: gitShaSchema,
    })
    .strict(),
]);

export const mutationObservationSchema = z
  .discriminatedUnion('status', [
    z
      .object({
        status: z.literal('ABSENT'),
        confirmed_absent: z.literal(true),
        confirmation_basis: z.enum(['NO_MUTATION_CAPABILITY', 'PRE_POST_SNAPSHOT']),
        before_state_sha256: sha256Schema.nullable(),
        after_state_sha256: sha256Schema.nullable(),
        observed_mutation_events: z.array(z.string()).max(0),
        verification: z.string().min(1),
      })
      .strict(),
    z
      .object({
        status: z.literal('OBSERVED'),
        confirmed_absent: z.literal(false),
        before_state_sha256: sha256Schema.nullable(),
        after_state_sha256: sha256Schema.nullable(),
        observed_mutation_events: z.array(z.string().min(1)).min(1),
        verification: z.string().min(1),
      })
      .strict(),
  ])
  .superRefine((observation, context) => {
    const hashNullnessMatches =
      (observation.before_state_sha256 === null) === (observation.after_state_sha256 === null);
    if (!hashNullnessMatches) {
      context.addIssue({ code: 'custom', message: 'Mutation observation requires paired hashes.' });
      return;
    }
    if (observation.status !== 'ABSENT') return;
    if (
      observation.confirmation_basis === 'NO_MUTATION_CAPABILITY' &&
      observation.before_state_sha256 !== null
    ) {
      context.addIssue({
        code: 'custom',
        message: 'No-capability proof cannot claim pre/post state observations.',
      });
    }
    if (
      observation.confirmation_basis === 'PRE_POST_SNAPSHOT' &&
      (observation.before_state_sha256 === null ||
        observation.before_state_sha256 !== observation.after_state_sha256)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'Absent pre/post observation requires equal before/after state hashes.',
      });
    }
  });

export const phaseFiveRunRecordSchema = z
  .object({
    schema_version: z.literal(1),
    scenario_id: phaseFiveScenarioIdSchema,
    fixture_case_id: z.string().min(1),
    execution_mode: z.literal('DETERMINISTIC_INTEGRATION'),
    trueforge_agent_id: z.null(),
    trueforge_session_id: z.null(),
    evidence_ids: z.array(z.string().min(1)).min(1),
    evidence_defects: z.array(z.string().min(1)),
    tool_event_references: z.array(z.string().min(1)).min(1),
    approval_event_references: z.array(z.string().min(1)),
    verifier_output: verifierOutputSchema.nullable(),
    proposal_hash_sha256: sha256Schema.nullable(),
    expected_terminal_status: phaseFiveTerminalStatusSchema,
    actual_terminal_status: phaseFiveTerminalStatusSchema,
    sandbox_started: z.boolean(),
    write_approval_requested: z.boolean(),
    persistence: persistenceProofSchema.nullable(),
    remote_result: remoteResultSchema.nullable(),
    action_receipt: actionReceiptSchema.nullable(),
    unsupported_github_mutation: mutationObservationSchema,
  })
  .strict()
  .superRefine((record, context) => {
    const status = record.actual_terminal_status;
    const receipt = record.action_receipt;
    const receiptReferencesAreRecorded = (references: string[]) =>
      references.every((reference) => record.tool_event_references.includes(reference));

    if (status === 'INCONCLUSIVE') {
      if (
        record.sandbox_started ||
        record.write_approval_requested ||
        record.verifier_output !== null ||
        record.proposal_hash_sha256 !== null ||
        record.evidence_defects.length === 0 ||
        receipt !== null
      ) {
        context.addIssue({
          code: 'custom',
          message:
            'INCONCLUSIVE must record defects and stop before verifier, proposal, sandbox, receipt, and approval.',
        });
      }
    } else if (record.evidence_defects.length > 0) {
      context.addIssue({
        code: 'custom',
        message: 'Conclusive records cannot contain evidence defects.',
      });
    }

    if (status === 'NO_SAFE_REMEDIATION') {
      const attempts = record.verifier_output?.attempts;
      if (
        !record.sandbox_started ||
        record.write_approval_requested ||
        record.proposal_hash_sha256 !== null ||
        receipt !== null ||
        attempts?.length !== 2 ||
        attempts[0]?.outcome !== 'CORRECTION_REQUIRED' ||
        attempts[1]?.outcome !== 'NO_SAFE_REMEDIATION'
      ) {
        context.addIssue({
          code: 'custom',
          message:
            'NO_SAFE_REMEDIATION requires the bounded two-attempt terminal workflow and no proposal, receipt, or approval.',
        });
      }
    }

    if (
      (status === 'SECURITY_REMEDIATION_READY' || status === 'WRITE_REQUIRED') &&
      (receipt !== null ||
        record.write_approval_requested ||
        record.approval_event_references.length > 0)
    ) {
      context.addIssue({
        code: 'custom',
        message: `${status} observation cannot claim a completed receipt or approval event.`,
      });
    }

    if (status === 'PR_REUSED') {
      const remote = record.remote_result?.status === 'PR_REUSED' ? record.remote_result : null;
      if (
        record.write_approval_requested ||
        record.approval_event_references.length > 0 ||
        receipt?.status !== 'PR_REUSED' ||
        remote === null ||
        receipt.proposal_hash_sha256 !== record.proposal_hash_sha256 ||
        receipt.remote_commit_sha !== remote.remote_commit_sha ||
        receipt.pr_number !== remote.pr_number ||
        receipt.pr_url !== remote.pr_url ||
        !receiptReferencesAreRecorded(receipt.github_result_references)
      ) {
        context.addIssue({
          code: 'custom',
          message:
            'PR_REUSED record must agree with its read-only action receipt and contain no approval.',
        });
      }
    }

    if (status === 'WRITE_CONFLICT') {
      const remote =
        record.remote_result?.status === 'WRITE_CONFLICT' ? record.remote_result : null;
      if (
        record.write_approval_requested ||
        record.approval_event_references.length > 0 ||
        receipt?.status !== 'WRITE_CONFLICT' ||
        remote === null ||
        receipt.proposal_hash_sha256 !== record.proposal_hash_sha256 ||
        receipt.write_conflict_reason !== remote.reason ||
        !receiptReferencesAreRecorded(receipt.github_result_references)
      ) {
        context.addIssue({
          code: 'custom',
          message:
            'WRITE_CONFLICT record must agree with its action receipt and contain no approval.',
        });
      }
    }

    if (status === 'DENIED') {
      if (
        !record.sandbox_started ||
        !record.write_approval_requested ||
        record.approval_event_references.length !== 1 ||
        record.proposal_hash_sha256 === null ||
        receipt?.status !== 'DENIED' ||
        receipt.proposal_hash_sha256 !== record.proposal_hash_sha256 ||
        !receiptReferencesAreRecorded(receipt.denied_tool_call_references) ||
        !receiptReferencesAreRecorded(receipt.github_result_references)
      ) {
        context.addIssue({
          code: 'custom',
          message:
            'DENIED requires exactly one denied approval event and an agreeing denied action receipt.',
        });
      }
    }

    if (status !== 'PR_REUSED' && status !== 'WRITE_CONFLICT' && record.remote_result !== null) {
      context.addIssue({
        code: 'custom',
        message: 'Terminal state cannot carry this remote result.',
      });
    }

    if (record.scenario_id === 'reconnect-pending-action' && record.persistence === null) {
      context.addIssue({
        code: 'custom',
        message: 'Reconnect scenario requires persistence proof.',
      });
    }
    if (record.scenario_id !== 'reconnect-pending-action' && record.persistence !== null) {
      context.addIssue({
        code: 'custom',
        message: 'Only the reconnect scenario may contain persistence proof.',
      });
    }
  });

export type MutationObservation = z.infer<typeof mutationObservationSchema>;
export type PhaseFiveRunRecord = z.infer<typeof phaseFiveRunRecordSchema>;
export type PhaseFiveScenarioId = z.infer<typeof phaseFiveScenarioIdSchema>;
export type PhaseFiveTerminalStatus = z.infer<typeof phaseFiveTerminalStatusSchema>;
