import { createHash } from 'node:crypto';

import { actionReceiptSchema } from '@guardian/github-write';
import {
  canonicalJson,
  computeVerifierPackBinding,
  verifierPackIdentitySchema,
} from '@guardian/policy-verifier';
import { z } from 'zod';

import { guardianModeSchema, repositoryScopeSchema } from './scope.js';

const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/u);

const runtimeClaimSchema = z.enum(['Unknown', 'SupportedByOwnedSyntheticEvidence']);

const githubReadTools = new Set([
  'list_branches',
  'list_commits',
  'get_commit',
  'get_file_contents',
  'search_pull_requests',
  'list_pull_requests',
]);

export const githubReadToolEventReferenceSchema = z.string().superRefine((reference, context) => {
  const match = /^deterministic:tool:([^:]+):(evidence:github:.+)$/u.exec(reference);
  if (match === null || !githubReadTools.has(match[1] ?? '')) {
    context.addIssue({
      code: 'custom',
      message: 'Expected an official GitHub read-tool event reference.',
    });
  }
});

export const guardianRunReceiptSchema = z
  .object({
    schema_version: z.literal(1),
    receipt_id: z.string().regex(/^guardian-run:sha256:[0-9a-f]{64}$/u),
    execution_basis: z.enum(['DETERMINISTIC_INTEGRATION', 'TRUEFORGE_SESSION']),
    mode: guardianModeSchema,
    terminal_status: z.enum([
      'ANALYSIS_COMPLETE',
      'SUPPORTED_SECURITY_FINDING',
      'SECURITY_REMEDIATION_READY',
      'INCONCLUSIVE',
      'NO_SAFE_REMEDIATION',
      'DENIED',
      'PR_CREATED',
      'PR_REUSED',
      'WRITE_CONFLICT',
    ]),
    scope: repositoryScopeSchema,
    stages: z
      .object({
        scope_preflight: z.enum(['COMPLETED', 'INCONCLUSIVE']),
        github_investigation: z.enum(['COMPLETED', 'NOT_RUN']),
        incident_evidence_join: z.enum(['COMPLETED', 'MISSING', 'NOT_RUN']),
        deterministic_rule: z.enum(['COMPLETED', 'NOT_RUN']),
        daytona_proof: z.enum(['COMPLETED', 'NOT_PERMITTED', 'NOT_RUN']),
        proposal: z.enum(['CREATED', 'ABSENT']),
        github_action: z.enum([
          'NOT_PERMITTED',
          'NOT_REACHED',
          'DENIED',
          'PR_CREATED',
          'PR_REUSED',
          'WRITE_CONFLICT',
        ]),
        presentation: z.enum(['OPENUI_WITH_MARKDOWN_FALLBACK', 'OPENUI_AND_MARKDOWN', 'MARKDOWN']),
      })
      .strict(),
    evidence_ids: z.array(z.string().min(1)),
    tool_event_references: z.array(z.string().min(1)),
    approval_event_references: z.array(z.string().min(1)),
    missing_or_unsupported_requirements: z.array(z.string().min(1)),
    proposal_hash_sha256: sha256Schema.nullable(),
    verifier_pack: verifierPackIdentitySchema.nullable(),
    verifier_pack_binding_sha256: sha256Schema.nullable(),
    action_receipt: actionReceiptSchema.nullable(),
    runtime_claims: z
      .object({
        deployment: runtimeClaimSchema,
        runtime_exposure: runtimeClaimSchema,
        data_access: z.literal('Unknown'),
        exfiltration: z.literal('Unknown'),
        live_cluster_behavior: z.literal('Unknown'),
      })
      .strict(),
    limitations: z.array(z.string().min(1)).min(1),
    guardian_did_not_merge_deploy_or_access_cluster: z.literal(true),
  })
  .strict()
  .superRefine((receipt, context) => {
    const core = { ...receipt } as Omit<typeof receipt, 'receipt_id'> & { receipt_id?: string };
    delete core.receipt_id;
    const expectedId = `guardian-run:sha256:${createHash('sha256')
      .update(canonicalJson(core))
      .digest('hex')}`;
    if (receipt.receipt_id !== expectedId) {
      context.addIssue({ code: 'custom', message: 'Guardian run receipt ID is invalid.' });
    }

    if (receipt.terminal_status === 'INCONCLUSIVE') {
      if (
        receipt.missing_or_unsupported_requirements.length === 0 ||
        receipt.stages.daytona_proof === 'COMPLETED' ||
        receipt.stages.proposal !== 'ABSENT' ||
        receipt.stages.github_action !== 'NOT_REACHED' ||
        receipt.proposal_hash_sha256 !== null ||
        receipt.verifier_pack !== null ||
        receipt.verifier_pack_binding_sha256 !== null ||
        receipt.action_receipt !== null ||
        receipt.approval_event_references.length > 0 ||
        receipt.runtime_claims.deployment !== 'Unknown' ||
        receipt.runtime_claims.runtime_exposure !== 'Unknown'
      ) {
        context.addIssue({
          code: 'custom',
          message: 'INCONCLUSIVE must stop before sandbox, proposal, approval, and GitHub action.',
        });
      }
    }

    if (receipt.mode === 'ANALYSIS_ONLY') {
      const expectedGitHubAction =
        receipt.terminal_status === 'INCONCLUSIVE' ? 'NOT_REACHED' : 'NOT_PERMITTED';
      if (
        !['ANALYSIS_COMPLETE', 'INCONCLUSIVE'].includes(receipt.terminal_status) ||
        receipt.stages.incident_evidence_join !== 'NOT_RUN' ||
        receipt.stages.daytona_proof !== 'NOT_PERMITTED' ||
        receipt.stages.proposal !== 'ABSENT' ||
        receipt.stages.github_action !== expectedGitHubAction ||
        receipt.proposal_hash_sha256 !== null ||
        receipt.verifier_pack !== null ||
        receipt.verifier_pack_binding_sha256 !== null ||
        receipt.action_receipt !== null ||
        receipt.approval_event_references.length > 0 ||
        receipt.runtime_claims.deployment !== 'Unknown' ||
        receipt.runtime_claims.runtime_exposure !== 'Unknown' ||
        receipt.evidence_ids.some((id) => !id.startsWith('evidence:github:')) ||
        receipt.tool_event_references.some(
          (reference) => !githubReadToolEventReferenceSchema.safeParse(reference).success,
        )
      ) {
        context.addIssue({
          code: 'custom',
          message:
            'ANALYSIS_ONLY permits GitHub evidence only and cannot carry fixture, runtime, sandbox, proposal, approval, or GitHub-write state.',
        });
      }
    }

    if (receipt.mode === 'PREPARE_REMEDIATION') {
      const expectedGitHubAction =
        receipt.terminal_status === 'INCONCLUSIVE' ? 'NOT_REACHED' : 'NOT_PERMITTED';
      if (
        receipt.stages.github_action !== expectedGitHubAction ||
        receipt.action_receipt !== null ||
        receipt.approval_event_references.length > 0
      ) {
        context.addIssue({
          code: 'custom',
          message: 'PREPARE_REMEDIATION cannot carry approval or GitHub-write state.',
        });
      }
    }

    if (
      receipt.terminal_status === 'SECURITY_REMEDIATION_READY' &&
      (receipt.stages.daytona_proof !== 'COMPLETED' ||
        receipt.stages.proposal !== 'CREATED' ||
        receipt.proposal_hash_sha256 === null)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'SECURITY_REMEDIATION_READY requires a completed proof and exact proposal.',
      });
    }

    if (receipt.proposal_hash_sha256 === null) {
      if (receipt.verifier_pack !== null || receipt.verifier_pack_binding_sha256 !== null) {
        context.addIssue({
          code: 'custom',
          message: 'A receipt without a proposal cannot carry verifier pack binding state.',
        });
      }
    } else if (receipt.verifier_pack === null || receipt.verifier_pack_binding_sha256 === null) {
      context.addIssue({
        code: 'custom',
        message: 'A proposal receipt requires the exact verifier pack identity and binding digest.',
      });
    } else {
      const expectedPackBinding = computeVerifierPackBinding({
        proposal_hash_sha256: receipt.proposal_hash_sha256,
        verifier_pack: receipt.verifier_pack,
      });
      if (receipt.verifier_pack_binding_sha256 !== expectedPackBinding) {
        context.addIssue({
          code: 'custom',
          message: 'Run receipt verifier pack binding is invalid.',
        });
      }
    }

    const action = receipt.action_receipt;
    const isActionTerminal = ['DENIED', 'PR_CREATED', 'PR_REUSED', 'WRITE_CONFLICT'].includes(
      receipt.terminal_status,
    );
    if (isActionTerminal) {
      if (action === null) {
        context.addIssue({
          code: 'custom',
          message: 'An OPEN_PR action terminal state requires a Phase 4 action receipt.',
        });
      }
      if (
        receipt.mode !== 'OPEN_PR' ||
        receipt.stages.daytona_proof !== 'COMPLETED' ||
        receipt.stages.proposal !== 'CREATED' ||
        receipt.proposal_hash_sha256 === null
      ) {
        context.addIssue({
          code: 'custom',
          message: 'An OPEN_PR action terminal state requires completed proof and proposal stages.',
        });
      }
    }
    if (action !== null) {
      if (
        receipt.mode !== 'OPEN_PR' ||
        action.status !== receipt.terminal_status ||
        action.repository !== receipt.scope.repository ||
        action.base_branch !== receipt.scope.base_branch ||
        action.proposal_hash_sha256 !== receipt.proposal_hash_sha256 ||
        canonicalJson(action.verifier_pack) !== canonicalJson(receipt.verifier_pack) ||
        action.verifier_pack_binding_sha256 !== receipt.verifier_pack_binding_sha256
      ) {
        context.addIssue({
          code: 'custom',
          message: 'Action receipt does not match the OPEN_PR run scope and proposal.',
        });
      }
    }

    if (
      receipt.terminal_status === 'PR_REUSED' &&
      (action?.status !== 'PR_REUSED' ||
        action.approved_tool_call_references.length > 0 ||
        receipt.approval_event_references.length > 0)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'PR_REUSED requires a read-only reuse receipt with no approval.',
      });
    }
  });

type GuardianRunReceiptCore = Omit<z.input<typeof guardianRunReceiptSchema>, 'receipt_id'>;

export function buildGuardianRunReceipt(core: GuardianRunReceiptCore) {
  const receiptId = `guardian-run:sha256:${createHash('sha256')
    .update(canonicalJson(core))
    .digest('hex')}`;
  return guardianRunReceiptSchema.parse({ ...core, receipt_id: receiptId });
}

export type GuardianRunReceipt = z.infer<typeof guardianRunReceiptSchema>;
