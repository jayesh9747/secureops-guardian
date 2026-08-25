import { fullGitShaSchema } from '@guardian/shared';
import { z } from 'zod';

export const guardianModeSchema = z.enum(['ANALYSIS_ONLY', 'PREPARE_REMEDIATION', 'OPEN_PR']);

export const repositorySchema = z
  .string()
  .max(140)
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/u,
    'Expected an owner/repository pair.',
  );

function isSafeRepositoryRelativePath(rawPath: string): boolean {
  let decodedPath = rawPath;
  for (let pass = 0; pass < rawPath.length; pass += 1) {
    let nextPath: string;
    try {
      nextPath = decodeURIComponent(decodedPath);
    } catch {
      return false;
    }
    if (nextPath === decodedPath) break;
    decodedPath = nextPath;
  }

  if (
    decodedPath.startsWith('/') ||
    decodedPath.includes('\\') ||
    [...decodedPath].some((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint <= 31 || (codePoint >= 127 && codePoint <= 159);
    })
  ) {
    return false;
  }

  const segments = decodedPath.split('/');
  return segments.every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

export const repositoryRelativePathSchema = z
  .string()
  .min(1)
  .max(1024)
  .refine(isSafeRepositoryRelativePath, 'Expected a repository-relative target file.');

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
    target_file: repositoryRelativePathSchema.optional(),
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
