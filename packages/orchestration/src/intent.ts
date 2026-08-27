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

export const REQUIRED_VERIFIER_INPUTS = Object.freeze({
  verifier_bundle: 'verifier.bundle.cjs',
  expected_contract: 'expected-contract.json',
  suspect: 'suspect.yaml',
  deny_all: 'deny-all.yaml',
  last_good: 'last-good.yaml',
} as const);

const verifierInputsSchema = z
  .object({
    verifier_bundle: z.literal(REQUIRED_VERIFIER_INPUTS.verifier_bundle),
    expected_contract: z.literal(REQUIRED_VERIFIER_INPUTS.expected_contract),
    suspect: z.literal(REQUIRED_VERIFIER_INPUTS.suspect),
    deny_all: z.literal(REQUIRED_VERIFIER_INPUTS.deny_all),
    last_good: z.literal(REQUIRED_VERIFIER_INPUTS.last_good),
  })
  .strict();

export const naturalLanguageGuardianInputSchema = z
  .object({
    source: z.literal('NATURAL_LANGUAGE'),
    user_text: z.string().min(1).max(20_000),
    draft: guardianIntentDraftSchema,
    confirmation: confirmationSchema.optional(),
    verifier_inputs: z.unknown().optional(),
  })
  .strict();

type NaturalLanguageGuardianInput = z.infer<typeof naturalLanguageGuardianInputSchema>;
type GuardianIntentDraft = z.infer<typeof guardianIntentDraftSchema>;
type MissingGuardianField =
  | 'requested_action'
  | 'repository'
  | 'base_branch'
  | 'revision'
  | 'target_file'
  | 'verifier_inputs';

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
      source: 'EXACT_JSON' | 'NATURAL_LANGUAGE';
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

function sourceAffirmsLiteral(userText: string, explicitValue: string): boolean {
  const normalizedText = userText.toLocaleLowerCase('en-US');
  const normalizedValue = explicitValue.toLocaleLowerCase('en-US');
  let searchFrom = 0;

  while (searchFrom < normalizedText.length) {
    const index = normalizedText.indexOf(normalizedValue, searchFrom);
    if (index === -1) return false;
    const before = index === 0 ? undefined : userText.at(index - 1);
    const after = userText.at(index + explicitValue.length);
    if (before?.match(/[A-Za-z0-9_]/u) || after?.match(/[A-Za-z0-9_]/u)) {
      searchFrom = index + normalizedValue.length;
      continue;
    }

    const clauseBoundary = Math.max(
      normalizedText.lastIndexOf('.', index - 1),
      normalizedText.lastIndexOf('!', index - 1),
      normalizedText.lastIndexOf('?', index - 1),
      normalizedText.lastIndexOf(';', index - 1),
      normalizedText.lastIndexOf(':', index - 1),
      normalizedText.lastIndexOf('\n', index - 1),
    );
    const clausePrefix = normalizedText.slice(clauseBoundary + 1, index);
    const actionEnd = index + normalizedValue.length;
    const clauseEndCandidates = ['.', '!', '?', ';', ':', '\n']
      .map((delimiter) => ({ delimiter, index: normalizedText.indexOf(delimiter, actionEnd) }))
      .filter((candidate) => candidate.index !== -1)
      .sort((left, right) => left.index - right.index);
    const clauseEnd = clauseEndCandidates[0]?.index ?? normalizedText.length;
    const clauseTerminator = clauseEndCandidates[0]?.delimiter;
    const clauseSuffix = normalizedText.slice(actionEnd, clauseEnd);
    const prefix = clausePrefix.slice(-96);
    const quotePairs: Readonly<Record<string, string>> = {
      '"': '"',
      "'": "'",
      '`': '`',
      '“': '”',
      '‘': '’',
    };
    const isQuoted = before !== undefined && quotePairs[before] === after;
    const isNegated = /(?:do\s+not|don't|never|without|\bnot\b)(?:\s+[a-z0-9_-]+){0,6}\s*$/u.test(
      prefix,
    );
    const directPrefix = prefix.trim();
    const isDirectInstruction =
      directPrefix.length === 0 ||
      /(?:^|\s)(?:please|kindly|then|also|and)\s*$/u.test(directPrefix) ||
      /\b(?:can|could|would|will)\s+you\s*$/u.test(directPrefix) ||
      /\b(?:i|we)\s+(?:want|need|would\s+like)(?:\s+(?:you|guardian))?\s+to\s*$/u.test(
        directPrefix,
      ) ||
      /\b(?:you|guardian|we)\s+(?:should|must)\s*$/u.test(directPrefix) ||
      /\bgo\s+ahead\s+and\s*$/u.test(directPrefix);
    const isPostposedExplanation =
      /^\s*(?:is|are|was|were|means|represents|would|could|can)\b/u.test(clauseSuffix) ||
      /\b(?:not|never|no)\b/u.test(clauseSuffix);
    const isBareQuestion = directPrefix.length === 0 && clauseTerminator === '?';
    if (
      !isNegated &&
      !isQuoted &&
      !isPostposedExplanation &&
      !isBareQuestion &&
      isDirectInstruction
    ) {
      return true;
    }
    searchFrom = index + normalizedValue.length;
  }

  return false;
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

function sourceContainsDelimited(
  userText: string,
  explicitValue: string,
  adjacentCharacters: string,
  caseInsensitive = true,
): boolean {
  const escapedValue = escapeRegularExpression(explicitValue);
  return new RegExp(
    `(?:^|[^${adjacentCharacters}])${escapedValue}(?=$|[^${adjacentCharacters}]|\\.(?=\\s|$))`,
    caseInsensitive ? 'iu' : 'u',
  ).test(userText);
}

function sourceFullShas(userText: string): string[] {
  return [...userText.matchAll(/(?<![A-Fa-f0-9])[A-Fa-f0-9]{40}(?![A-Fa-f0-9])/gu)].map(
    (match) => match[0],
  );
}

function normalizeRepository(rawRepository: string | undefined): string | undefined {
  if (rawRepository === undefined) return undefined;
  const trimmed = rawRepository.trim();

  try {
    new URL(trimmed);
    return parseGitHubCommitUrl(trimmed)?.repository;
  } catch {
    return repositorySchema.safeParse(trimmed).success ? trimmed : undefined;
  }
}

function parseGitHubCommitUrl(
  rawUrl: string | undefined,
): { repository: string; commit_sha: string } | undefined {
  if (rawUrl === undefined) return undefined;

  try {
    const url = new URL(rawUrl.trim());
    if (url.protocol !== 'https:' || url.hostname.toLocaleLowerCase('en-US') !== 'github.com') {
      return undefined;
    }
    const [owner, rawRepository, commitSegment, commitSha, ...extraSegments] = url.pathname
      .split('/')
      .filter(Boolean);
    if (
      owner === undefined ||
      rawRepository === undefined ||
      commitSegment !== 'commit' ||
      commitSha === undefined ||
      extraSegments.length > 0
    ) {
      return undefined;
    }
    const repository = `${owner}/${rawRepository.replace(/\.git$/u, '')}`;
    if (
      !repositorySchema.safeParse(repository).success ||
      !fullGitShaSchema.safeParse(commitSha).success
    ) {
      return undefined;
    }
    return { repository, commit_sha: commitSha };
  } catch {
    return undefined;
  }
}

function sourceGitHubUrls(userText: string): string[] {
  const urls = userText.match(/https?:\/\/github\.com\/[^\s<>"'`]+/giu) ?? [];
  return urls.map((url) => url.replace(/[),.;!?\]]+$/gu, ''));
}

function sourceGitHubCommitUrls(userText: string): Array<{
  repository: string;
  commit_sha: string;
}> {
  return sourceGitHubUrls(userText)
    .map((url) => parseGitHubCommitUrl(url))
    .filter((parsedUrl): parsedUrl is { repository: string; commit_sha: string } =>
      Boolean(parsedUrl),
    );
}

function sourceRepositoryCandidates(userText: string, excludedValues: readonly string[]): string[] {
  let repositoryText = userText;
  for (const excludedValue of excludedValues) {
    repositoryText = repositoryText.replaceAll(excludedValue, ' ');
  }
  const plainCandidates = [
    ...repositoryText.matchAll(
      /(?<![A-Za-z0-9_./-])([A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*)(?![A-Za-z0-9_./-])/gu,
    ),
  ].map((match) => match[1]?.replace(/[.!?]+$/gu, ''));
  return plainCandidates.filter(
    (candidate): candidate is string =>
      candidate !== undefined && repositorySchema.safeParse(candidate).success,
  );
}

function sourceBranchCandidates(userText: string): string[] {
  const branchToken = '[A-Za-z0-9][A-Za-z0-9._/-]*';
  const candidates: string[] = [];
  const forwardPattern = new RegExp(
    `\\b(?:base\\s+)?branch(?:es)?\\s*(?:(?:is|are)\\s+|:\\s*)?(${branchToken})`,
    'giu',
  );
  for (const match of userText.matchAll(forwardPattern)) {
    if (match[1] !== undefined) candidates.push(match[1]);
  }

  const reversePattern = new RegExp(
    `\\b(${branchToken})\\s+as\\s+(?:the\\s+)?base\\s+branch\\b`,
    'giu',
  );
  for (const match of userText.matchAll(reversePattern)) {
    if (match[1] !== undefined) candidates.push(match[1]);
  }

  const listPattern = new RegExp(
    `\\b(?:base\\s+)?branches\\s*(?:(?:is|are)\\s+|:\\s*)?(${branchToken})\\s+(?:and|or)\\s+(${branchToken})`,
    'giu',
  );
  for (const match of userText.matchAll(listPattern)) {
    if (match[1] !== undefined) candidates.push(match[1]);
    if (match[2] !== undefined) candidates.push(match[2]);
  }

  return candidates.map((candidate) => candidate.replace(/[.,!?;]+$/gu, ''));
}

function normalizeFullSha(rawSha: string | undefined, userText: string): string | undefined {
  if (rawSha === undefined) return undefined;
  const normalized = rawSha.trim();
  if (
    !fullGitShaSchema.safeParse(normalized).success ||
    !sourceContainsDelimited(userText, normalized, 'A-Fa-f0-9', false)
  ) {
    return undefined;
  }
  return normalized;
}

function normalizeRequestedMode(
  draft: GuardianIntentDraft,
  userText: string,
): GuardianMode | undefined {
  if (draft.requested_action === undefined) return undefined;
  const evidence = draft.requested_action.evidence.trim();
  if (!sourceAffirmsLiteral(userText, evidence)) return undefined;

  const normalizedEvidence = evidence.toLocaleLowerCase('en-US').replace(/\s+/gu, ' ').trim();
  let evidenceMode: GuardianMode | undefined;
  if (
    /^(?:inspect|check|analy[sz]e|investigate|review|assess|examine|audit)\b/u.test(
      normalizedEvidence,
    ) ||
    /^look into\b/u.test(normalizedEvidence)
  ) {
    evidenceMode = 'ANALYSIS_ONLY';
  } else if (
    /^(?:prepare|propose)\b/u.test(normalizedEvidence) ||
    /^draft\s+(?:a\s+|an\s+)?(?:remediation|fix|patch|change)\b/u.test(normalizedEvidence)
  ) {
    evidenceMode = 'PREPARE_REMEDIATION';
  } else if (/^(?:open|create)\s+(?:a\s+|an\s+)?(?:pull request|pr)\b/u.test(normalizedEvidence)) {
    evidenceMode = 'OPEN_PR';
  }

  switch (draft.requested_action.kind) {
    case 'ANALYZE':
      return evidenceMode === 'ANALYSIS_ONLY' ? evidenceMode : undefined;
    case 'PREPARE_REMEDIATION':
      return evidenceMode === 'PREPARE_REMEDIATION' ? evidenceMode : undefined;
    case 'OPEN_PR':
      return evidenceMode === 'OPEN_PR' ? evidenceMode : undefined;
  }
}

function sourceLabelsTargetFile(userText: string, explicitValue: string): boolean {
  const escapedValue = escapeRegularExpression(explicitValue);
  return new RegExp(
    `\\b(?:targeting|target(?:\\s+file)?|file)(?:\\s+(?:is\\s+)?|\\s*[:=]\\s*)${escapedValue}(?=$|[^A-Za-z0-9_.\\/-]|\\.(?=\\s|$))`,
    'iu',
  ).test(userText);
}

function normalizeTargetFile(rawTargetFile: string | undefined, userText: string) {
  if (rawTargetFile === undefined) return undefined;
  const normalized = rawTargetFile.trim();
  if (
    !repositoryRelativePathSchema.safeParse(normalized).success ||
    !sourceLabelsTargetFile(userText, normalized) ||
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
      case 'target_file':
        return 'Provide a valid repository-relative target file or omit the target.';
      case 'verifier_inputs':
        return 'Provide a complete new remediation request with verifier.bundle.cjs, expected-contract.json, suspect.yaml, deny-all.yaml, and last-good.yaml in the same turn.';
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
      case 'target_file':
        return 'valid repository-relative target file or no target';
      case 'verifier_inputs':
        return 'all five exact verifier inputs';
    }
  });
  const joined =
    labels.length === 2
      ? labels.join(' and ')
      : `${labels.slice(0, -1).join(', ')}, and ${labels.at(-1)}`;
  return `Please provide the ${joined}.`;
}

function verifierInputsNeed(
  source: 'EXACT_JSON' | 'NATURAL_LANGUAGE',
  question = buildMissingQuestion(['verifier_inputs']),
): GuardianRequestCompilation {
  return {
    status: 'NEEDS_INPUT',
    source,
    missing_fields: ['verifier_inputs'],
    question,
  };
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
  return `I interpreted this as ${interpreted.mode} for ${interpreted.repository} at ${interpreted.revision}, base branch ${interpreted.base_branch}, target ${target}. ${capabilityBoundary} Confirm this exact request and attach verifier.bundle.cjs, expected-contract.json, suspect.yaml, deny-all.yaml, and last-good.yaml in the same turn.`;
}

function compileNaturalLanguageInput(
  input: NaturalLanguageGuardianInput,
): GuardianRequestCompilation {
  if (input.draft.intent === 'CONVERSATION_ONLY') {
    return { status: 'CONVERSATION_ONLY', source: 'NATURAL_LANGUAGE' };
  }

  const mode = normalizeRequestedMode(input.draft, input.user_text);
  const sourceGitHubUrlValues = sourceGitHubUrls(input.user_text);
  const parsedSourceCommitUrls = sourceGitHubCommitUrls(input.user_text);
  const parsedCommitUrl =
    parsedSourceCommitUrls.length === 1
      ? parsedSourceCommitUrls[0]
      : parseGitHubCommitUrl(input.draft.repository);
  const draftRepository = normalizeRepository(input.draft.repository);
  const repository = draftRepository ?? parsedCommitUrl?.repository;
  const branch = input.draft.base_branch?.trim();
  const branchCandidates = new Set(sourceBranchCandidates(input.user_text));
  const targetIsLabeled =
    input.draft.target_file !== undefined &&
    sourceLabelsTargetFile(input.user_text, input.draft.target_file);
  const repositoryCandidates = new Set([
    ...sourceRepositoryCandidates(input.user_text, [
      ...branchCandidates,
      ...(targetIsLabeled && input.draft.target_file !== undefined
        ? [input.draft.target_file]
        : []),
    ]),
    ...parsedSourceCommitUrls.map((commitUrl) => commitUrl.repository),
  ]);
  const repositoryConflictsWithUrl =
    draftRepository !== undefined &&
    parsedCommitUrl !== undefined &&
    draftRepository !== parsedCommitUrl.repository;
  const explicitRepository =
    !repositoryConflictsWithUrl &&
    sourceGitHubUrlValues.length === parsedSourceCommitUrls.length &&
    parsedSourceCommitUrls.length <= 1 &&
    repositoryCandidates.size === 1 &&
    repository !== undefined &&
    repositoryCandidates.has(repository) &&
    sourceContainsDelimited(input.user_text, repository, 'A-Za-z0-9_.-')
      ? repository
      : undefined;
  const explicitBranch =
    branch !== undefined &&
    branch.length > 0 &&
    branchCandidates.size === 1 &&
    branchCandidates.has(branch) &&
    sourceContainsDelimited(input.user_text, branch, 'A-Za-z0-9_.\\/-')
      ? branch
      : undefined;
  const missingFields: MissingGuardianField[] = [];
  if (mode === undefined) missingFields.push('requested_action');
  if (explicitRepository === undefined) missingFields.push('repository');
  if (explicitBranch === undefined) missingFields.push('base_branch');

  let suspect: GuardianRequest['scope']['suspect'] | undefined;
  const fullShas = sourceFullShas(input.user_text);
  const distinctFullShas = new Set(fullShas);
  const sourceHasOnlyLowercaseShas = fullShas.every(
    (sha) => sha === sha.toLocaleLowerCase('en-US'),
  );
  if (input.draft.suspect?.kind === 'commit') {
    const commitSha = normalizeFullSha(input.draft.suspect.commit_sha, input.user_text);
    if (
      commitSha !== undefined &&
      sourceHasOnlyLowercaseShas &&
      distinctFullShas.size === 1 &&
      distinctFullShas.has(commitSha)
    ) {
      suspect = { kind: 'commit', commit_sha: commitSha };
    }
  } else if (input.draft.suspect?.kind === 'comparison') {
    const baseSha = normalizeFullSha(input.draft.suspect.base_sha, input.user_text);
    const headSha = normalizeFullSha(input.draft.suspect.head_sha, input.user_text);
    if (
      baseSha !== undefined &&
      headSha !== undefined &&
      sourceHasOnlyLowercaseShas &&
      distinctFullShas.size === 2 &&
      distinctFullShas.has(baseSha) &&
      distinctFullShas.has(headSha)
    ) {
      suspect = { kind: 'comparison', base_sha: baseSha, head_sha: headSha };
    }
  } else if (parsedCommitUrl !== undefined) {
    const commitSha = normalizeFullSha(parsedCommitUrl.commit_sha, input.user_text);
    if (
      commitSha !== undefined &&
      sourceHasOnlyLowercaseShas &&
      distinctFullShas.size === 1 &&
      distinctFullShas.has(commitSha)
    ) {
      suspect = { kind: 'commit', commit_sha: commitSha };
    }
  }
  if (suspect === undefined) missingFields.push('revision');
  const targetFile = normalizeTargetFile(input.draft.target_file, input.user_text);
  if (input.draft.target_file !== undefined && targetFile === undefined) {
    missingFields.push('target_file');
  }

  if (missingFields.length > 0) {
    return {
      status: 'NEEDS_INPUT',
      source: 'NATURAL_LANGUAGE',
      missing_fields: missingFields,
      question: buildMissingQuestion(missingFields),
    };
  }

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
    if (input.verifier_inputs !== undefined) {
      return verifierInputsNeed(
        'NATURAL_LANGUAGE',
        'ANALYSIS_ONLY requests must omit verifier_inputs. Submit a complete new request without them.',
      );
    }
    return { status: 'READY', source: 'NATURAL_LANGUAGE', request };
  }

  const interpretedRequestSha256 = canonicalRequestDigest(request);
  if (input.confirmation?.interpreted_request_sha256 === interpretedRequestSha256) {
    if (!verifierInputsSchema.safeParse(input.verifier_inputs).success) {
      return verifierInputsNeed('NATURAL_LANGUAGE');
    }
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
  if (typeof input === 'object' && input !== null && !Array.isArray(input)) {
    const inputRecord = input as Record<string, unknown>;
    const exactRequest = guardianRequestSchema.safeParse({
      ...('mode' in inputRecord ? { mode: inputRecord.mode } : {}),
      scope: inputRecord.scope,
    });
    if (exactRequest.success && inputRecord.source !== 'NATURAL_LANGUAGE') {
      const verifierLikeKeys = Object.keys(inputRecord).filter((key) =>
        key.toLocaleLowerCase('en-US').includes('verifier'),
      );
      if (exactRequest.data.mode === 'ANALYSIS_ONLY') {
        if (verifierLikeKeys.length > 0) {
          return verifierInputsNeed(
            'EXACT_JSON',
            'ANALYSIS_ONLY requests must omit verifier_inputs. Submit a complete new request without them.',
          );
        }
        return {
          status: 'READY',
          source: 'EXACT_JSON',
          request: parseGuardianRequest(input),
        };
      }
      if (!verifierInputsSchema.safeParse(inputRecord.verifier_inputs).success) {
        return verifierInputsNeed('EXACT_JSON');
      }
      const exactEnvelope = guardianRequestSchema
        .extend({ verifier_inputs: verifierInputsSchema })
        .strict()
        .parse(input);
      return {
        status: 'READY',
        source: 'EXACT_JSON',
        request: {
          mode: exactEnvelope.mode,
          scope: exactEnvelope.scope,
        },
      };
    }
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
