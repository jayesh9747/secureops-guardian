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
  'NO_SAFE_REMEDIATION',
  'DENIED',
  'PR_REUSED',
  'WRITE_CONFLICT',
]);

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
    attempts: z.array(verifierAttemptSchema).min(1).max(2),
    four_state: z.array(proofRowSchema).length(4).nullable(),
  })
  .strict();

export const checkpointValuesSchema = z
  .object({
    case_id: z.string().min(1),
    evidence_ids: z.array(z.string().min(1)).min(1),
    proposal_hash_sha256: z.string().regex(/^[0-9a-f]{64}$/u),
    pending_action: z.enum(['CREATE_BRANCH', 'UPDATE_FILE', 'CREATE_PR']),
  })
  .strict();

const persistenceProofSchema = z
  .object({
    before_reconnect: checkpointValuesSchema,
    after_reconnect: checkpointValuesSchema,
    serialized_checkpoint_sha256: z.string().regex(/^[0-9a-f]{64}$/u),
    same_case_id: z.literal(true),
    same_evidence_ids: z.literal(true),
    same_proposal_hash: z.literal(true),
    same_pending_action: z.literal(true),
  })
  .strict();

export const phaseFiveRunRecordSchema = z
  .object({
    schema_version: z.literal(1),
    scenario_id: phaseFiveScenarioIdSchema,
    fixture_case_id: z.string().min(1),
    execution_mode: z.literal('DETERMINISTIC_INTEGRATION'),
    trueforge_agent_id: z.null(),
    trueforge_session_id: z.null(),
    evidence_ids: z.array(z.string().min(1)).min(1),
    tool_event_references: z.array(z.string().min(1)).min(1),
    approval_event_references: z.array(z.string().min(1)),
    verifier_output: verifierOutputSchema.nullable(),
    proposal_hash_sha256: z
      .string()
      .regex(/^[0-9a-f]{64}$/u)
      .nullable(),
    expected_terminal_status: phaseFiveTerminalStatusSchema,
    actual_terminal_status: phaseFiveTerminalStatusSchema,
    sandbox_started: z.boolean(),
    write_approval_requested: z.boolean(),
    persistence: persistenceProofSchema.nullable(),
    unsupported_github_mutation: z
      .object({
        confirmed_absent: z.literal(true),
        observed_mutation_events: z.array(z.string()).max(0),
        verification: z.string().min(1),
      })
      .strict(),
  })
  .strict()
  .superRefine((record, context) => {
    if (record.actual_terminal_status !== record.expected_terminal_status) {
      context.addIssue({
        code: 'custom',
        message: 'Actual terminal status must equal the expected terminal status.',
      });
    }
    if (record.actual_terminal_status === 'INCONCLUSIVE') {
      if (
        record.sandbox_started ||
        record.write_approval_requested ||
        record.verifier_output !== null ||
        record.proposal_hash_sha256 !== null
      ) {
        context.addIssue({
          code: 'custom',
          message: 'INCONCLUSIVE must stop before verifier, proposal, sandbox, and approval.',
        });
      }
    }
    if (record.actual_terminal_status === 'NO_SAFE_REMEDIATION') {
      if (
        !record.sandbox_started ||
        record.write_approval_requested ||
        record.proposal_hash_sha256 !== null ||
        record.verifier_output?.attempts.length !== 2
      ) {
        context.addIssue({
          code: 'custom',
          message: 'NO_SAFE_REMEDIATION requires exactly two attempts and no proposal or approval.',
        });
      }
    }
    if (record.actual_terminal_status === 'PR_REUSED') {
      if (record.write_approval_requested || record.approval_event_references.length > 0) {
        context.addIssue({
          code: 'custom',
          message: 'PR_REUSED cannot contain a write approval event.',
        });
      }
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

export type PhaseFiveRunRecord = z.infer<typeof phaseFiveRunRecordSchema>;
export type PhaseFiveScenarioId = z.infer<typeof phaseFiveScenarioIdSchema>;
export type PhaseFiveTerminalStatus = z.infer<typeof phaseFiveTerminalStatusSchema>;
