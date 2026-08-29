import { z } from 'zod';

export const GUARDIAN_TRACE_LABELS = {
  rootAgent: 'SecureOps Guardian',
  githubChild: 'change-security-investigator — official GitHub MCP evidence',
  fixtureChild: 'exposure-evidence-investigator — Fixture MCP evidence',
  sandbox: 'Daytona sandbox — deterministic four-state policy verification',
  approval: 'TrueForge approval required — official GitHub MCP write',
  githubResult: 'Official GitHub MCP result or deterministic PR reuse',
} as const;

export const GUARDIAN_TRACE_SEQUENCE = [
  GUARDIAN_TRACE_LABELS.githubChild,
  GUARDIAN_TRACE_LABELS.fixtureChild,
  GUARDIAN_TRACE_LABELS.sandbox,
  GUARDIAN_TRACE_LABELS.approval,
  GUARDIAN_TRACE_LABELS.githubResult,
] as const;

const oneSentenceSchema = z
  .string()
  .min(1)
  .max(240)
  .refine(
    (value) => /[.!?]$/u.test(value) && (value.match(/[.!?](?:\s|$)/gu)?.length ?? 0) === 1,
    'Expected one concise sentence.',
  );

const investigationChildSchema = z
  .object({
    child_id: z.string().min(1),
    agent: z.string().min(1),
    status: z.enum(['RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED']),
    started_at_ms: z.number().int().nonnegative(),
    completed_at_ms: z.number().int().nonnegative().nullable().optional(),
    result: oneSentenceSchema,
    tool_groups: z.array(
      z
        .object({
          provider: z.string().min(1),
          tools: z.array(z.string().min(1)).min(1),
        })
        .strict(),
    ),
  })
  .strict()
  .superRefine((child, context) => {
    if (
      child.status === 'RUNNING' &&
      child.completed_at_ms !== undefined &&
      child.completed_at_ms !== null
    ) {
      context.addIssue({
        code: 'custom',
        message: 'A running child cannot have a completion time.',
      });
    }
    if (
      child.status !== 'RUNNING' &&
      (child.completed_at_ms === undefined ||
        child.completed_at_ms === null ||
        child.completed_at_ms < child.started_at_ms)
    ) {
      context.addIssue({
        code: 'custom',
        message: 'A terminal child requires a valid completion time.',
      });
    }
  });

const investigationRailInputSchema = z
  .object({
    observed_at_ms: z.number().int().nonnegative(),
    children: z.array(investigationChildSchema),
    findings: z.array(z.string().min(1)),
    evidence: z.array(z.string().min(1)),
    activity: z.array(z.string().min(1)),
  })
  .strict()
  .superRefine((rail, context) => {
    if (new Set(rail.children.map((child) => child.child_id)).size !== rail.children.length) {
      context.addIssue({ code: 'custom', message: 'Investigation rail child IDs must be unique.' });
    }
    for (const [index, child] of rail.children.entries()) {
      if (child.status === 'RUNNING' && child.started_at_ms > rail.observed_at_ms) {
        context.addIssue({
          code: 'custom',
          message: 'A running child cannot start after the rail observation time.',
          path: ['children', index, 'started_at_ms'],
        });
      }
    }
  });

export type GuardianInvestigationRailInput = z.input<typeof investigationRailInputSchema>;

export function buildGuardianInvestigationRail(input: GuardianInvestigationRailInput) {
  const rail = investigationRailInputSchema.parse(input);
  return {
    sections: ['Findings', 'Evidence', 'Activity'] as const,
    child_rows: rail.children.map((child) => ({
      child_id: child.child_id,
      agent: child.agent,
      status: child.status,
      elapsed_ms:
        child.completed_at_ms === undefined || child.completed_at_ms === null
          ? rail.observed_at_ms - child.started_at_ms
          : child.completed_at_ms - child.started_at_ms,
      result: child.result,
      tool_groups: child.tool_groups.map((group) => ({
        provider: group.provider,
        tools: [...group.tools],
      })),
    })),
    findings: [...rail.findings],
    evidence: [...rail.evidence],
    activity: [...rail.activity],
  };
}
