import { z } from 'zod';
import { verifierPackIdentitySchema } from '@guardian/policy-verifier';

export const GUARDIAN_APPROVAL_BOUNDARY =
  'TrueForge requires separate human approval for each official GitHub MCP write.' as const;
export const GUARDIAN_VERIFIER_BOUNDARY =
  'Daytona sandbox — deterministic static policy verifier' as const;

export const guardianTerminalStatusSchema = z.enum([
  'SECURITY_REMEDIATION_READY',
  'DENIED',
  'PR_CREATED',
  'PR_REUSED',
  'INCONCLUSIVE',
  'WRITE_CONFLICT',
  'NO_SAFE_REMEDIATION',
]);

const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/u);
const gitShaSchema = z.string().regex(/^[0-9a-f]{40}$/u);

const knownTextSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('KNOWN'), value: z.string().min(1) }).strict(),
  z.object({ state: z.literal('UNKNOWN'), reason: z.string().min(1) }).strict(),
]);

const proofRowSchema = z
  .object({
    state: z.enum(['LAST_KNOWN_GOOD', 'SUSPECT', 'DENY_ALL', 'GUARDIAN_REPAIR']),
    classification: z.enum([
      'SECURE_AND_FUNCTIONAL',
      'EXPOSED',
      'SECURE_BUT_OPERATIONALLY_REJECTED',
      'INVALID',
    ]),
    legitimate_db_path: z.enum(['Allow', 'Deny']),
    forbidden_external_path: z.enum(['Allow', 'Deny']),
    decision: z.string().min(1),
  })
  .strict();

const verifierAttemptSchema = z
  .object({
    attempt: z.union([z.literal(1), z.literal(2)]),
    outcome: z.enum(['CORRECTION_REQUIRED', 'NO_SAFE_REMEDIATION']),
    classification: z.enum([
      'SECURE_AND_FUNCTIONAL',
      'EXPOSED',
      'SECURE_BUT_OPERATIONALLY_REJECTED',
      'INVALID',
    ]),
    diagnostics: z.array(z.string().min(1)).min(1),
  })
  .strict();

const verifierPresentationSchema = z.discriminatedUnion('state', [
  z
    .object({
      state: z.literal('FOUR_STATE_VERIFIED'),
      execution_boundary: z.literal(GUARDIAN_VERIFIER_BOUNDARY),
      verifier_pack: verifierPackIdentitySchema,
      rows: z.array(proofRowSchema).length(4),
    })
    .strict(),
  z
    .object({
      state: z.literal('NO_SAFE_REMEDIATION'),
      execution_boundary: z.literal(GUARDIAN_VERIFIER_BOUNDARY),
      verifier_pack: verifierPackIdentitySchema,
      attempts: z.array(verifierAttemptSchema).length(2),
    })
    .strict(),
  z
    .object({
      state: z.literal('NOT_RUN'),
      reason: z.string().min(1),
    })
    .strict(),
]);

const proposalPresentationSchema = z.discriminatedUnion('state', [
  z
    .object({
      state: z.literal('EXACT'),
      proposal_id: z.string().startsWith('proposal:sha256:'),
      proposal_hash_sha256: sha256Schema,
      verifier_pack_binding_sha256: sha256Schema,
      exact_patch: z.string().min(1),
    })
    .strict(),
  z
    .object({
      state: z.literal('ABSENT'),
      reason: z.string().min(1),
    })
    .strict(),
]);

const githubResultSchema = z.discriminatedUnion('state', [
  z.object({ state: z.literal('NONE') }).strict(),
  z
    .object({
      state: z.literal('PR_CREATED'),
      pr_number: z.number().int().positive(),
      pr_url: z.url(),
      remote_commit_sha: gitShaSchema,
    })
    .strict(),
  z
    .object({
      state: z.literal('PR_REUSED'),
      pr_number: z.number().int().positive(),
      pr_url: z.url(),
      remote_commit_sha: gitShaSchema,
    })
    .strict(),
  z
    .object({
      state: z.literal('WRITE_CONFLICT'),
      reason: z.string().min(1),
      observed_remote_commit_sha: gitShaSchema,
      observed_git_blob_sha: gitShaSchema,
    })
    .strict(),
]);

const actionPresentationSchema = z
  .object({
    approval_state: z.enum([
      'NOT_REACHED',
      'REQUIRED',
      'DENIED',
      'APPROVED',
      'NOT_REQUIRED_REUSE',
      'BLOCKED_CONFLICT',
    ]),
    approval_boundary: z.literal(GUARDIAN_APPROVAL_BOUNDARY),
    github_result: githubResultSchema,
  })
  .strict();

export const guardianPresentationSchema = z
  .object({
    schema_version: z.literal(1),
    terminal_status: guardianTerminalStatusSchema,
    headline: z.string().min(1),
    severity: z.enum(['High', 'Unknown']),
    finding: z
      .object({
        affected_asset: z.literal('checkout-api'),
        causal_commit: knownTextSchema,
        changed_file: knownTextSchema,
        exposure_path: knownTextSchema,
        actual_data_access: z.literal('Unknown'),
      })
      .strict(),
    evidence: z
      .object({
        official_github_mcp: z.array(z.string().startsWith('evidence:github:')).min(1),
        incident_fixture_mcp: z
          .array(
            z.string().regex(/^evidence:(deployment|security-alert|reachability|dependency):/u),
          )
          .min(1),
        deterministic_rule: z.array(z.string().startsWith('evidence:rule:')),
      })
      .strict(),
    verifier: verifierPresentationSchema,
    proposal: proposalPresentationSchema,
    limitations: z.array(z.string().min(1)).min(1),
    action: actionPresentationSchema,
  })
  .strict()
  .superRefine((presentation, context) => {
    const status = presentation.terminal_status;
    const addIssue = (message: string) => context.addIssue({ code: 'custom', message });
    const knownFinding =
      presentation.finding.causal_commit.state === 'KNOWN' &&
      presentation.finding.changed_file.state === 'KNOWN' &&
      presentation.finding.exposure_path.state === 'KNOWN';

    if (status === 'INCONCLUSIVE') {
      if (
        presentation.severity !== 'Unknown' ||
        knownFinding ||
        presentation.verifier.state !== 'NOT_RUN' ||
        presentation.proposal.state !== 'ABSENT' ||
        presentation.action.approval_state !== 'NOT_REACHED' ||
        presentation.action.github_result.state !== 'NONE'
      ) {
        addIssue('INCONCLUSIVE must preserve unknown cause and stop before verifier or approval.');
      }
      return;
    }

    if (presentation.severity !== 'High' || !knownFinding) {
      addIssue('Conclusive presentation states require the supported High finding.');
    }

    if (status === 'NO_SAFE_REMEDIATION') {
      if (
        presentation.verifier.state !== 'NO_SAFE_REMEDIATION' ||
        presentation.proposal.state !== 'ABSENT' ||
        presentation.action.approval_state !== 'NOT_REACHED' ||
        presentation.action.github_result.state !== 'NONE'
      ) {
        addIssue('NO_SAFE_REMEDIATION must stop after two attempts with no proposal or approval.');
      }
      return;
    }

    if (
      presentation.verifier.state !== 'FOUR_STATE_VERIFIED' ||
      presentation.proposal.state !== 'EXACT'
    ) {
      addIssue('An actionable presentation requires the exact proposal and four-state proof.');
    }

    const expectedAction = {
      SECURITY_REMEDIATION_READY: ['REQUIRED', 'NONE'],
      DENIED: ['DENIED', 'NONE'],
      PR_CREATED: ['APPROVED', 'PR_CREATED'],
      PR_REUSED: ['NOT_REQUIRED_REUSE', 'PR_REUSED'],
      WRITE_CONFLICT: ['BLOCKED_CONFLICT', 'WRITE_CONFLICT'],
    } as const;
    const expected = expectedAction[status];
    if (
      presentation.action.approval_state !== expected[0] ||
      presentation.action.github_result.state !== expected[1]
    ) {
      addIssue(`Action presentation is inconsistent with ${status}.`);
    }
  });

export type GuardianPresentation = z.infer<typeof guardianPresentationSchema>;
export type GuardianTerminalStatus = z.infer<typeof guardianTerminalStatusSchema>;
