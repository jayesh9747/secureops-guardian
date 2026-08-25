import { fullGitShaSchema } from '@guardian/shared';
import { z } from 'zod';

export const guardianModeSchema = z.enum(['ANALYSIS_ONLY', 'PREPARE_REMEDIATION', 'OPEN_PR']);

const repositorySchema = z
  .string()
  .regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u, 'Expected an owner/repository pair.');

const suspectRevisionSchema = z.discriminatedUnion('kind', [
  z
    .object({
      kind: z.literal('commit'),
      commit_sha: fullGitShaSchema,
    })
    .strict(),
  z
    .object({
      kind: z.literal('comparison'),
      base_sha: fullGitShaSchema,
      head_sha: fullGitShaSchema,
    })
    .strict(),
]);

export const repositoryScopeSchema = z
  .object({
    schema_version: z.literal(1),
    repository: repositorySchema,
    base_branch: z.string().min(1),
    suspect: suspectRevisionSchema,
    target_file: z
      .string()
      .min(1)
      .refine(
        (path) => !path.startsWith('/') && !path.split('/').includes('..'),
        'Expected a repository-relative target file.',
      )
      .optional(),
  })
  .strict();

export const guardianRequestSchema = z
  .object({
    mode: guardianModeSchema.default('ANALYSIS_ONLY'),
    scope: repositoryScopeSchema,
  })
  .strict();

export function parseGuardianRequest(input: unknown) {
  return guardianRequestSchema.parse(input);
}

export type GuardianMode = z.infer<typeof guardianModeSchema>;
export type GuardianRequest = z.infer<typeof guardianRequestSchema>;
export type RepositoryScope = z.infer<typeof repositoryScopeSchema>;
