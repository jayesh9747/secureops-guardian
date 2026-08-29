import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

import { z } from 'zod';

import {
  VERIFIER_PACK_METADATA,
  VERIFIER_PACK_SCOPE,
} from '@guardian/shared/verifier-pack-metadata';

export const REQUIRED_VERIFIER_PACK_FILES = [
  'SKILL.md',
  'verifier.bundle.cjs',
  'fixtures/expected-contract.json',
  'fixtures/suspect.yaml',
  'fixtures/deny-all.yaml',
  'fixtures/last-good.yaml',
] as const;

const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/u);
const packFilePathSchema = z.enum(REQUIRED_VERIFIER_PACK_FILES);

export const verifierPackScopeSchema = z
  .object({
    repository: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u),
    base_branch: z.string().min(1),
    suspect_commit_sha: z.string().regex(/^[0-9a-f]{40}$/u),
    target_file: z.string().min(1),
    api_version: z.string().min(1),
    kind: z.string().min(1),
    verifier_subset: z.string().min(1),
  })
  .strict();

export const verifierPackManifestSchema = z
  .object({
    schema_version: z.literal(1),
    pack_id: z.literal(VERIFIER_PACK_METADATA.pack_id),
    pack_version: z.string().regex(/^\d+\.\d+\.\d+$/u),
    source_revision: z.string().min(1),
    supported_guardian_scope: verifierPackScopeSchema,
    files: z
      .array(
        z
          .object({
            path: packFilePathSchema,
            sha256: sha256Schema,
          })
          .strict(),
      )
      .length(REQUIRED_VERIFIER_PACK_FILES.length),
  })
  .strict();

export const verifierPackIdentitySchema = z
  .object({
    pack_id: z.literal(VERIFIER_PACK_METADATA.pack_id),
    pack_version: z.string().regex(/^\d+\.\d+\.\d+$/u),
    source_revision: z.string().min(1),
    manifest_sha256: sha256Schema,
  })
  .strict();

export type VerifierPackIdentity = z.infer<typeof verifierPackIdentitySchema>;
export type VerifierPackScope = z.infer<typeof verifierPackScopeSchema>;

export const PINNED_VERIFIER_PACK_METADATA = {
  ...VERIFIER_PACK_METADATA,
  supported_guardian_scope: VERIFIER_PACK_SCOPE,
} as const;

export type VerifierPackValidationErrorCode =
  | 'PACK_MANIFEST_MISSING'
  | 'PACK_MANIFEST_DIGEST_MISMATCH'
  | 'PACK_MANIFEST_INVALID'
  | 'PACK_ID_MISMATCH'
  | 'PACK_VERSION_MISMATCH'
  | 'PACK_SOURCE_REVISION_MISMATCH'
  | 'PACK_SCOPE_MISMATCH'
  | 'PACK_FILE_SET_MISMATCH'
  | 'PACK_FILE_MISSING'
  | 'PACK_FILE_DIGEST_MISMATCH';

export class VerifierPackValidationError extends Error {
  readonly code: VerifierPackValidationErrorCode;

  constructor(code: VerifierPackValidationErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'VerifierPackValidationError';
    this.code = code;
  }
}

interface ExpectedVerifierPack {
  pack_id: string;
  pack_version: string;
  source_revision: string;
  manifest_sha256: string;
  supported_guardian_scope: VerifierPackScope;
}

function sha256(contents: string | Buffer): string {
  return createHash('sha256').update(contents).digest('hex');
}

function exactJson(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function readPackFile(path: string, code: VerifierPackValidationErrorCode): Promise<Buffer> {
  try {
    return await readFile(path);
  } catch (error) {
    throw new VerifierPackValidationError(code, `Unable to read verifier pack path: ${path}`, {
      cause: error,
    });
  }
}

export async function loadVerifierPack(options: {
  pack_root: string;
  expected: ExpectedVerifierPack;
}): Promise<VerifierPackIdentity> {
  const root = resolve(options.pack_root);
  const manifestPath = resolve(root, 'manifest.json');
  const manifestBytes = await readPackFile(manifestPath, 'PACK_MANIFEST_MISSING');
  const manifestDigest = sha256(manifestBytes);
  if (manifestDigest !== options.expected.manifest_sha256) {
    throw new VerifierPackValidationError(
      'PACK_MANIFEST_DIGEST_MISMATCH',
      'Verifier pack manifest does not match the pinned SHA-256 digest.',
    );
  }

  const parsedJson = (() => {
    try {
      return JSON.parse(manifestBytes.toString('utf8')) as unknown;
    } catch (error) {
      throw new VerifierPackValidationError(
        'PACK_MANIFEST_INVALID',
        'Verifier pack manifest is not valid JSON.',
        { cause: error },
      );
    }
  })();
  const parsed = verifierPackManifestSchema.safeParse(parsedJson);
  if (!parsed.success) {
    throw new VerifierPackValidationError(
      'PACK_MANIFEST_INVALID',
      `Verifier pack manifest failed schema validation: ${parsed.error.message}`,
    );
  }
  const manifest = parsed.data;
  if (manifest.pack_id !== options.expected.pack_id) {
    throw new VerifierPackValidationError('PACK_ID_MISMATCH', 'Verifier pack ID is not pinned.');
  }
  if (manifest.pack_version !== options.expected.pack_version) {
    throw new VerifierPackValidationError(
      'PACK_VERSION_MISMATCH',
      'Verifier pack version is not pinned.',
    );
  }
  if (manifest.source_revision !== options.expected.source_revision) {
    throw new VerifierPackValidationError(
      'PACK_SOURCE_REVISION_MISMATCH',
      'Verifier pack source revision is not pinned.',
    );
  }
  if (!exactJson(manifest.supported_guardian_scope, options.expected.supported_guardian_scope)) {
    throw new VerifierPackValidationError(
      'PACK_SCOPE_MISMATCH',
      'Verifier pack does not support the exact Guardian scope.',
    );
  }

  const listedPaths = manifest.files.map((file) => file.path);
  if (
    new Set(listedPaths).size !== REQUIRED_VERIFIER_PACK_FILES.length ||
    !exactJson([...listedPaths].sort(), [...REQUIRED_VERIFIER_PACK_FILES].sort())
  ) {
    throw new VerifierPackValidationError(
      'PACK_FILE_SET_MISMATCH',
      'Verifier pack manifest must list every exact payload file once.',
    );
  }

  for (const file of manifest.files) {
    const resolvedPath = resolve(root, file.path);
    if (!resolvedPath.startsWith(`${root}${sep}`)) {
      throw new VerifierPackValidationError(
        'PACK_FILE_SET_MISMATCH',
        'Verifier pack file resolved outside the registered root.',
      );
    }
    const contents = await readPackFile(resolvedPath, 'PACK_FILE_MISSING');
    if (sha256(contents) !== file.sha256) {
      throw new VerifierPackValidationError(
        'PACK_FILE_DIGEST_MISMATCH',
        `Verifier pack file digest mismatch: ${file.path}`,
      );
    }
  }

  return verifierPackIdentitySchema.parse({
    pack_id: manifest.pack_id,
    pack_version: manifest.pack_version,
    source_revision: manifest.source_revision,
    manifest_sha256: manifestDigest,
  });
}
