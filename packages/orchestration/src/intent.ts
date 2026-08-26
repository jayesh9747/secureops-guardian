import { createHash } from 'node:crypto';

import { fullGitShaSchema } from '@guardian/shared';
import { z } from 'zod';

import {
  guardianRequestSchema,
  parseGuardianRequest,
  repositoryRelativePathSchema,
  repositorySchema,
  type GuardianMode,
  type GuardianRequest,
} from './scope.js';

const requestedActionDraftSchema = z
  .object({
    kind: z.enum(['ANALYZE', 'PREPARE_REMEDIATION', 'OPEN_PR']),
    evidence: z.string().min(1).max(240),
  })
  .strict();

const commitDraftSchema = z
  .object({
    kind: z.literal('commit'),
    commit_sha: z.string().optional(),
  })
  .strict();

const comparisonDraftSchema = z
  .object({
    kind: z.literal('comparison'),
    base_sha: z.string().optional(),
    head_sha: z.string().optional(),
  })
  .strict();

export const guardianIntentDraftSchema = z
  .object({
    schema_version: z.literal(1),
    intent: z.enum(['CONVERSATION_ONLY', 'INVESTIGATION']),
    requested_action: requestedActionDraftSchema.optional(),
    repository: z.string().optional(),
    base_branch: z.string().optional(),
    suspect: z.discriminatedUnion('kind', [commitDraftSchema, comparisonDraftSchema]).optional(),
    target_file: z.string().optional(),
  })
  .strict();

const confirmationSchema = z
  .object({
    decision: z.literal('CONFIRM'),
    interpreted_request_sha256: z.string().regex(/^[a-f0-9]{64}$/u),
  })
  .strict();

export const naturalLanguageGuardianInputSchema = z
  .object({
    source: z.literal('NATURAL_LANGUAGE'),
    user_text: z.string().min(1).max(20_000),
    draft: guardianIntentDraftSchema,
    confirmation: confirmationSchema.optional(),
  })
  .strict();

const exactVerifierInputsSchema = z
  .object({
    verifier_bundle: z.literal('verifier.bundle.cjs'),
    expected_contract: z.literal('expected-contract.json'),
    suspect: z.literal('suspect.yaml'),
    deny_all: z.literal('deny-all.yaml'),
    last_good: z.literal('last-good.yaml'),
  })
  .strict();

const exactJsonGuardianInputSchema = guardianRequestSchema
  .extend({ verifier_inputs: exactVerifierInputsSchema.optional() })
  .strict();

type NaturalLanguageGuardianInput = z.infer<typeof naturalLanguageGuardianInputSchema>;
type GuardianIntentDraft = z.infer<typeof guardianIntentDraftSchema>;
type MissingGuardianField = 'requested_action' | 'repository' | 'base_branch' | 'revision';

export interface InterpretedGuardianRequest {
  mode: GuardianMode;
  repository: string;
  base_branch: string;
  revision: string;
  target_file: string | null;
}

export type GuardianRequestCompilation =
  | {
      status: 'READY';
      source: 'EXACT_JSON' | 'NATURAL_LANGUAGE';
      request: GuardianRequest;
    }
  | {
      status: 'CONVERSATION_ONLY';
      source: 'NATURAL_LANGUAGE';
    }
  | {
      status: 'NEEDS_INPUT';
      source: 'NATURAL_LANGUAGE';
      missing_fields: MissingGuardianField[];
      question: string;
    }
  | {
      status: 'CONFIRMATION_REQUIRED';
      source: 'NATURAL_LANGUAGE';
      interpreted_request: InterpretedGuardianRequest;
      interpreted_request_sha256: string;
      question: string;
    };

function sourceContainsLiteral(userText: string, explicitValue: string): boolean {
  return userText.toLocaleLowerCase('en-US').includes(explicitValue.toLocaleLowerCase('en-US'));
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function sourceContainsDelimited(
  userText: string,
  explicitValue: string,
  adjacentCharacters: string,
): boolean {
  const escapedValue = escapeRegularExpression(explicitValue);
  return new RegExp(
    `(?:^|[^${adjacentCharacters}])${escapedValue}(?=$|[^${adjacentCharacters}]|\\.(?=\\s|$))`,
    'iu',
  ).test(userText);
}

function normalizeRepository(rawRepository: string | undefined): string | undefined {
  if (rawRepository === undefined) return undefined;
  const trimmed = rawRepository.trim();

  try {
    const url = new URL(trimmed);
    if (url.hostname.toLocaleLowerCase('en-US') !== 'github.com') return undefined;
    const [owner, rawRepo] = url.pathname.split('/').filter(Boolean);
    if (owner === undefined || rawRepo === undefined) return undefined;
    const repository = `${owner}/${rawRepo.replace(/\.git$/u, '')}`;
    return repositorySchema.safeParse(repository).success ? repository : undefined;
  } catch {
    return repositorySchema.safeParse(trimmed).success ? trimmed : undefined;
  }
}

function normalizeFullSha(rawSha: string | undefined, userText: string): string | undefined {
  if (rawSha === undefined) return undefined;
  const normalized = rawSha.trim().toLocaleLowerCase('en-US');
  if (
    !fullGitShaSchema.safeParse(normalized).success ||
    !sourceContainsDelimited(userText, normalized, 'a-f0-9')
  ) {
    return undefined;
  }
  return normalized;
}

function normalizeRequestedMode(
  draft: GuardianIntentDraft,
  userText: string,
): GuardianMode | undefined {
  if (draft.requested_action === undefined) return 'ANALYSIS_ONLY';
  if (!sourceContainsLiteral(userText, draft.requested_action.evidence.trim())) return undefined;

  switch (draft.requested_action.kind) {
    case 'ANALYZE':
      return 'ANALYSIS_ONLY';
    case 'PREPARE_REMEDIATION':
      return 'PREPARE_REMEDIATION';
    case 'OPEN_PR':
      return 'OPEN_PR';
  }
}

function normalizeTargetFile(rawTargetFile: string | undefined, userText: string) {
  if (rawTargetFile === undefined) return undefined;
  const normalized = rawTargetFile.trim();
  if (
    !repositoryRelativePathSchema.safeParse(normalized).success ||
    !sourceContainsDelimited(userText, normalized, 'A-Za-z0-9_.\\/-')
  ) {
    return undefined;
  }
  return normalized;
}

function buildMissingQuestion(missingFields: readonly MissingGuardianField[]): string {
  if (missingFields.length === 1) {
    switch (missingFields[0]) {
      case 'requested_action':
        return 'Should Guardian analyze only, prepare a remediation, or open a pull request?';
      case 'repository':
        return 'What is the exact repository (owner/repo) for this investigation?';
      case 'base_branch':
        return 'What is the exact base branch for this investigation?';
      case 'revision':
        return 'What is the exact full commit SHA or comparison range for this investigation?';
    }
  }

  const labels = missingFields.map((field) => {
    switch (field) {
      case 'requested_action':
        return 'requested action';
      case 'repository':
        return 'repository (owner/repo)';
      case 'base_branch':
        return 'exact base branch';
      case 'revision':
        return 'exact full commit SHA or comparison range';
    }
  });
  const joined =
    labels.length === 2
      ? labels.join(' and ')
      : `${labels.slice(0, -1).join(', ')}, and ${labels.at(-1)}`;
  return `Please provide the ${joined}.`;
}

function canonicalRequestDigest(request: GuardianRequest): string {
  return createHash('sha256').update(JSON.stringify(request)).digest('hex');
}

function interpretRequest(request: GuardianRequest): InterpretedGuardianRequest {
  const revision =
    request.scope.suspect.kind === 'commit'
      ? request.scope.suspect.commit_sha
      : `${request.scope.suspect.base_sha}...${request.scope.suspect.head_sha}`;
  return {
    mode: request.mode,
    repository: request.scope.repository,
    base_branch: request.scope.base_branch,
    revision,
    target_file: request.scope.target_file ?? null,
  };
}

function buildConfirmationQuestion(interpreted: InterpretedGuardianRequest): string {
  const target = interpreted.target_file === null ? 'changed files only' : interpreted.target_file;
  const capabilityBoundary =
    interpreted.mode === 'OPEN_PR'
      ? 'This may reach three separately approval-gated GitHub writes only after every existing safety gate passes.'
      : 'This may prepare a sandbox-verified proposal but cannot request approval or write to GitHub.';
  return `I interpreted this as ${interpreted.mode} for ${interpreted.repository} at ${interpreted.revision}, base branch ${interpreted.base_branch}, target ${target}. ${capabilityBoundary} Confirm this exact request?`;
}

function compileNaturalLanguageInput(
  input: NaturalLanguageGuardianInput,
): GuardianRequestCompilation {
  if (input.draft.intent === 'CONVERSATION_ONLY') {
    return { status: 'CONVERSATION_ONLY', source: 'NATURAL_LANGUAGE' };
  }

  const mode = normalizeRequestedMode(input.draft, input.user_text);
  const repository = normalizeRepository(input.draft.repository);
  const explicitRepository =
    repository !== undefined && sourceContainsDelimited(input.user_text, repository, 'A-Za-z0-9_.-')
      ? repository
      : undefined;
  const branch = input.draft.base_branch?.trim();
  const explicitBranch =
    branch !== undefined &&
    branch.length > 0 &&
    sourceContainsDelimited(input.user_text, branch, 'A-Za-z0-9_.\\/-')
      ? branch
      : undefined;
  const missingFields: MissingGuardianField[] = [];
  if (mode === undefined) missingFields.push('requested_action');
  if (explicitRepository === undefined) missingFields.push('repository');
  if (explicitBranch === undefined) missingFields.push('base_branch');

  let suspect: GuardianRequest['scope']['suspect'] | undefined;
  if (input.draft.suspect?.kind === 'commit') {
    const commitSha = normalizeFullSha(input.draft.suspect.commit_sha, input.user_text);
    if (commitSha !== undefined) suspect = { kind: 'commit', commit_sha: commitSha };
  } else if (input.draft.suspect?.kind === 'comparison') {
    const baseSha = normalizeFullSha(input.draft.suspect.base_sha, input.user_text);
    const headSha = normalizeFullSha(input.draft.suspect.head_sha, input.user_text);
    if (baseSha !== undefined && headSha !== undefined) {
      suspect = { kind: 'comparison', base_sha: baseSha, head_sha: headSha };
    }
  }
  if (suspect === undefined) missingFields.push('revision');

  if (missingFields.length > 0) {
    return {
      status: 'NEEDS_INPUT',
      source: 'NATURAL_LANGUAGE',
      missing_fields: missingFields,
      question: buildMissingQuestion(missingFields),
    };
  }

  const targetFile = normalizeTargetFile(input.draft.target_file, input.user_text);
  const request = parseGuardianRequest({
    mode,
    scope: {
      schema_version: 1,
      repository: explicitRepository,
      base_branch: explicitBranch,
      suspect,
      ...(targetFile === undefined ? {} : { target_file: targetFile }),
    },
  });

  if (request.mode === 'ANALYSIS_ONLY') {
    return { status: 'READY', source: 'NATURAL_LANGUAGE', request };
  }

  const interpretedRequestSha256 = canonicalRequestDigest(request);
  if (input.confirmation?.interpreted_request_sha256 === interpretedRequestSha256) {
    return { status: 'READY', source: 'NATURAL_LANGUAGE', request };
  }

  const interpretedRequest = interpretRequest(request);
  return {
    status: 'CONFIRMATION_REQUIRED',
    source: 'NATURAL_LANGUAGE',
    interpreted_request: interpretedRequest,
    interpreted_request_sha256: interpretedRequestSha256,
    question: buildConfirmationQuestion(interpretedRequest),
  };
}

export function compileGuardianRequest(input: unknown): GuardianRequestCompilation {
  const exactRequest = guardianRequestSchema.safeParse(input);
  if (exactRequest.success) {
    return { status: 'READY', source: 'EXACT_JSON', request: exactRequest.data };
  }

  const exactJsonInput = exactJsonGuardianInputSchema.safeParse(input);
  if (exactJsonInput.success) {
    return {
      status: 'READY',
      source: 'EXACT_JSON',
      request: {
        mode: exactJsonInput.data.mode,
        scope: exactJsonInput.data.scope,
      },
    };
  }

  if (
    typeof input === 'object' &&
    input !== null &&
    'source' in input &&
    input.source === 'NATURAL_LANGUAGE'
  ) {
    return compileNaturalLanguageInput(naturalLanguageGuardianInputSchema.parse(input));
  }

  return { status: 'READY', source: 'EXACT_JSON', request: parseGuardianRequest(input) };
}

export type { GuardianIntentDraft, NaturalLanguageGuardianInput };
