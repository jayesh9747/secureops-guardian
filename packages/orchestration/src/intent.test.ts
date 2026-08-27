import { describe, expect, it } from 'vitest';

import { compileGuardianRequest, REQUIRED_VERIFIER_INPUTS } from './intent.js';
import { planGuardianRun } from './plan.js';

const REPOSITORY = 'acme/payments';
const BRANCH = 'release';
const COMMIT_SHA = '1234567890abcdef1234567890abcdef12345678';
const VERIFIER_INPUTS = REQUIRED_VERIFIER_INPUTS;

function naturalLanguageInput(
  userText: string,
  actionEvidence: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    source: 'NATURAL_LANGUAGE',
    user_text: userText,
    draft: {
      schema_version: 1,
      intent: 'INVESTIGATION',
      requested_action: { kind: 'ANALYZE', evidence: actionEvidence },
      repository: REPOSITORY,
      base_branch: BRANCH,
      suspect: { kind: 'commit', commit_sha: COMMIT_SHA },
      ...overrides,
    },
  };
}

describe('natural-language Guardian request compiler', () => {
  it('keeps an exact JSON GuardianRequest executable and backward compatible', () => {
    const input = {
      mode: 'ANALYSIS_ONLY',
      scope: {
        schema_version: 1,
        repository: REPOSITORY,
        base_branch: BRANCH,
        suspect: { kind: 'commit', commit_sha: COMMIT_SHA },
      },
    };

    expect(compileGuardianRequest(input)).toEqual({
      status: 'READY',
      source: 'EXACT_JSON',
      request: input,
    });
    expect(planGuardianRun(input).mode).toBe('ANALYSIS_ONLY');
  });

  it('preserves the exact JSON remediation envelope while executing only GuardianRequest', () => {
    const result = compileGuardianRequest({
      mode: 'PREPARE_REMEDIATION',
      scope: {
        schema_version: 1,
        repository: REPOSITORY,
        base_branch: BRANCH,
        suspect: { kind: 'commit', commit_sha: COMMIT_SHA },
      },
      verifier_inputs: VERIFIER_INPUTS,
    });

    expect(result).toEqual({
      status: 'READY',
      source: 'EXACT_JSON',
      request: {
        mode: 'PREPARE_REMEDIATION',
        scope: {
          schema_version: 1,
          repository: REPOSITORY,
          base_branch: BRANCH,
          suspect: { kind: 'commit', commit_sha: COMMIT_SHA },
        },
      },
    });
  });

  it('fails closed before planning when exact JSON remediation omits verifier inputs', () => {
    const input = {
      mode: 'PREPARE_REMEDIATION',
      scope: {
        schema_version: 1,
        repository: REPOSITORY,
        base_branch: BRANCH,
        suspect: { kind: 'commit', commit_sha: COMMIT_SHA },
      },
    };

    expect(compileGuardianRequest(input)).toEqual({
      status: 'NEEDS_INPUT',
      source: 'EXACT_JSON',
      missing_fields: ['verifier_inputs'],
      question:
        'Provide a complete new remediation request with verifier.bundle.cjs, expected-contract.json, suspect.yaml, deny-all.yaml, and last-good.yaml in the same turn.',
    });
    expect(() => planGuardianRun(input)).toThrow('Guardian request is not executable: NEEDS_INPUT');
  });

  it.each([
    { verifier_bundle: 'wrong.cjs' },
    { verifier_bundle: 'verifier.bundle.cjs', contract: 'expected-contract.json' },
  ])(
    'asks once when exact JSON remediation has malformed verifier inputs: %j',
    (verifierInputs) => {
      const result = compileGuardianRequest({
        mode: 'OPEN_PR',
        scope: {
          schema_version: 1,
          repository: REPOSITORY,
          base_branch: BRANCH,
          suspect: { kind: 'commit', commit_sha: COMMIT_SHA },
        },
        verifier_inputs: verifierInputs,
      });

      expect(result).toMatchObject({
        status: 'NEEDS_INPUT',
        source: 'EXACT_JSON',
        missing_fields: ['verifier_inputs'],
      });
    },
  );

  it('rejects verifier inputs on ANALYSIS_ONLY instead of silently discarding them', () => {
    expect(
      compileGuardianRequest({
        mode: 'ANALYSIS_ONLY',
        scope: {
          schema_version: 1,
          repository: REPOSITORY,
          base_branch: BRANCH,
          suspect: { kind: 'commit', commit_sha: COMMIT_SHA },
        },
        verifier_inputs: VERIFIER_INPUTS,
      }),
    ).toMatchObject({
      status: 'NEEDS_INPUT',
      source: 'EXACT_JSON',
      missing_fields: ['verifier_inputs'],
    });
  });

  it.each([
    [
      'Check',
      `Check whether commit ${COMMIT_SHA} in ${REPOSITORY} on base branch ${BRANCH} is risky.`,
    ],
    ['Inspect', `Inspect ${REPOSITORY} at ${COMMIT_SHA}; the base branch is ${BRANCH}.`],
    [
      'Investigate',
      `Investigate ${COMMIT_SHA} for ${REPOSITORY}, using ${BRANCH} as the base branch.`,
    ],
    ['Analyze', `Analyze repository ${REPOSITORY}, base branch ${BRANCH}, commit ${COMMIT_SHA}.`],
    ['Analyse', `Analyse commit ${COMMIT_SHA} in ${REPOSITORY} against branch ${BRANCH}.`],
    ['Review', `Review ${REPOSITORY} commit ${COMMIT_SHA}; compare it with base branch ${BRANCH}.`],
    ['Assess', `Assess the security of ${COMMIT_SHA} in ${REPOSITORY}; base branch: ${BRANCH}.`],
    ['Look into', `Look into ${REPOSITORY} at commit ${COMMIT_SHA}, based on branch ${BRANCH}.`],
    ['Examine', `Examine commit ${COMMIT_SHA} from ${REPOSITORY} with base branch ${BRANCH}.`],
    ['Audit', `Audit ${REPOSITORY} commit ${COMMIT_SHA}; its base branch is ${BRANCH}.`],
  ])('normalizes the %s paraphrase to the same analysis request', (evidence, userText) => {
    expect(compileGuardianRequest(naturalLanguageInput(userText, evidence))).toEqual({
      status: 'READY',
      source: 'NATURAL_LANGUAGE',
      request: {
        mode: 'ANALYSIS_ONLY',
        scope: {
          schema_version: 1,
          repository: REPOSITORY,
          base_branch: BRANCH,
          suspect: { kind: 'commit', commit_sha: COMMIT_SHA },
        },
      },
    });
  });

  it('accepts a pasted GitHub commit URL but does not invent its missing base branch', () => {
    const repository = 'domain/payments';
    const commitUrl = `https://github.com/${repository}/commit/${COMMIT_SHA}`;
    const userText = `Please check ${commitUrl}.`;
    const result = compileGuardianRequest(
      naturalLanguageInput(userText, 'check', {
        repository,
        base_branch: 'main',
        suspect: undefined,
      }),
    );

    expect(result).toMatchObject({
      status: 'NEEDS_INPUT',
      missing_fields: ['base_branch'],
    });
    if (result.status !== 'NEEDS_INPUT') throw new Error('Expected missing input.');
    expect(result).not.toHaveProperty('request');
    expect(result.question).toBe('What is the exact base branch for this investigation?');
  });

  it('normalizes an explicit full-SHA comparison without changing endpoint order', () => {
    const baseSha = 'a'.repeat(40);
    const headSha = 'b'.repeat(40);
    const userText = `Investigate ${REPOSITORY} from base ${baseSha} through head ${headSha}; base branch ${BRANCH}.`;

    expect(
      compileGuardianRequest(
        naturalLanguageInput(userText, 'Investigate', {
          suspect: { kind: 'comparison', base_sha: baseSha, head_sha: headSha },
        }),
      ),
    ).toMatchObject({
      status: 'READY',
      request: {
        mode: 'ANALYSIS_ONLY',
        scope: {
          suspect: { kind: 'comparison', base_sha: baseSha, head_sha: headSha },
        },
      },
    });
  });

  it('rejects an uppercase full SHA instead of normalizing it', () => {
    const uppercaseSha = COMMIT_SHA.toUpperCase();
    const userText = `Analyze ${REPOSITORY} commit ${uppercaseSha} on base branch ${BRANCH}.`;

    expect(
      compileGuardianRequest(
        naturalLanguageInput(userText, 'Analyze', {
          suspect: { kind: 'commit', commit_sha: uppercaseSha },
        }),
      ),
    ).toMatchObject({ status: 'NEEDS_INPUT', missing_fields: ['revision'] });
  });

  it('rejects a commit request containing multiple distinct full SHAs', () => {
    const otherSha = 'abcdefabcdefabcdefabcdefabcdefabcdefabcd';
    const userText = `Analyze ${REPOSITORY} commits ${COMMIT_SHA} and ${otherSha} on base branch ${BRANCH}.`;

    expect(compileGuardianRequest(naturalLanguageInput(userText, 'Analyze'))).toMatchObject({
      status: 'NEEDS_INPUT',
      missing_fields: ['revision'],
    });
  });

  it.each([
    `Analyze ${REPOSITORY} and evil/other commit ${COMMIT_SHA} on base branches ${BRANCH} and main.`,
    `Analyze ${REPOSITORY} and evil/other commit ${COMMIT_SHA}; base branch ${BRANCH}, not branch main.`,
  ])('rejects contradictory repository and branch values: %s', (userText) => {
    expect(compileGuardianRequest(naturalLanguageInput(userText, 'Analyze'))).toMatchObject({
      status: 'NEEDS_INPUT',
      missing_fields: ['repository', 'base_branch'],
    });
  });

  it('does not accept an unrelated branch-like word as explicit branch scope', () => {
    const userText = `Analyze ${REPOSITORY} commit ${COMMIT_SHA}. My main concern is security.`;

    expect(compileGuardianRequest(naturalLanguageInput(userText, 'Analyze'))).toMatchObject({
      status: 'NEEDS_INPUT',
      missing_fields: ['base_branch'],
    });
  });

  it('keeps a contextually labeled slash-containing branch out of repository candidates', () => {
    const slashBranch = 'release/v1';
    const userText = `Analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${slashBranch}.`;

    expect(
      compileGuardianRequest(
        naturalLanguageInput(userText, 'Analyze', { base_branch: slashBranch }),
      ),
    ).toMatchObject({
      status: 'READY',
      request: { scope: { repository: REPOSITORY, base_branch: slashBranch } },
    });
  });

  it('does not let the draft reclassify a contradictory repository as an unlabeled target', () => {
    const contradictoryRepository = 'evil/other';
    const userText = `Analyze ${REPOSITORY} and ${contradictoryRepository} commit ${COMMIT_SHA} on base branch ${BRANCH}.`;

    expect(
      compileGuardianRequest(
        naturalLanguageInput(userText, 'Analyze', { target_file: contradictoryRepository }),
      ),
    ).toMatchObject({
      status: 'NEEDS_INPUT',
      missing_fields: ['repository', 'target_file'],
    });
  });

  it.each([
    `https://github.com/${REPOSITORY}/pull/123`,
    `http://github.com/${REPOSITORY}/commit/${COMMIT_SHA}`,
    `https://github.com/${REPOSITORY}/commit/not-a-sha`,
  ])('rejects unsupported or malformed GitHub URL scope: %s', (url) => {
    const userText = `Analyze ${url} at commit ${COMMIT_SHA} on base branch ${BRANCH}.`;

    const result = compileGuardianRequest(naturalLanguageInput(userText, 'Analyze'));
    expect(result).toMatchObject({ status: 'NEEDS_INPUT' });
    if (result.status !== 'NEEDS_INPUT') throw new Error('Expected missing input.');
    expect(result.missing_fields).toContain('repository');
  });

  it('asks one concise question for every missing executable scope fact', () => {
    const result = compileGuardianRequest({
      source: 'NATURAL_LANGUAGE',
      user_text: 'Please investigate this security change.',
      draft: {
        schema_version: 1,
        intent: 'INVESTIGATION',
        requested_action: { kind: 'ANALYZE', evidence: 'investigate' },
      },
    });

    expect(result).toEqual({
      status: 'NEEDS_INPUT',
      source: 'NATURAL_LANGUAGE',
      missing_fields: ['repository', 'base_branch', 'revision'],
      question:
        'Please provide the repository (owner/repo), exact base branch, and exact full commit SHA or comparison range.',
    });
  });

  it('fails closed when a draft value was not explicit in the user-authored text', () => {
    const userText = `Check ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`;
    const result = compileGuardianRequest(
      naturalLanguageInput(userText, 'Check', {
        repository: 'jayesh9747/guardian-demo-checkout',
      }),
    );

    expect(result).toMatchObject({
      status: 'NEEDS_INPUT',
      missing_fields: ['repository'],
    });
    expect(result).not.toHaveProperty('request');
  });

  it('does not let an untrusted action kind elevate analysis evidence to OPEN_PR', () => {
    const userText = `Analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`;
    const result = compileGuardianRequest(
      naturalLanguageInput(userText, 'Analyze', {
        requested_action: { kind: 'OPEN_PR', evidence: 'Analyze' },
      }),
    );

    expect(result).toMatchObject({
      status: 'NEEDS_INPUT',
      missing_fields: ['requested_action'],
    });
    expect(result).not.toHaveProperty('interpreted_request');
    expect(result).not.toHaveProperty('request');
  });

  it('asks for the requested action when the untrusted draft omits it', () => {
    const userText = `Please handle ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`;
    const result = compileGuardianRequest(
      naturalLanguageInput(userText, '', { requested_action: undefined }),
    );

    expect(result).toMatchObject({
      status: 'NEEDS_INPUT',
      missing_fields: ['requested_action'],
    });
  });

  it.each([
    `Do not open a PR; analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`,
    `I do not want you to open a PR; analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`,
    `As an example, open a PR. Analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`,
    `The ability to open a PR is useful, but analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`,
    `The documentation says open a PR. Analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`,
    `I would rather not open a PR; analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`,
    `Open a PR is not needed; analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`,
    `Open a PR is an option. Analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`,
    `Open a PR? No, analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`,
    `Reopen a PR is not the requested action; analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`,
    `The phrase "open a PR" is only an example. Analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`,
    `The phrase “open a PR” is only an example. Analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`,
  ])('does not elevate a negated or quoted OPEN_PR mention: %s', (userText) => {
    const result = compileGuardianRequest(
      naturalLanguageInput(userText, 'open a PR', {
        requested_action: { kind: 'OPEN_PR', evidence: 'open a PR' },
      }),
    );

    expect(result).toMatchObject({
      status: 'NEEDS_INPUT',
      missing_fields: ['requested_action'],
    });
  });

  it('asks once when confirmed natural-language remediation has malformed verifier inputs', () => {
    const userText = `Prepare a remediation for ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`;
    const input = naturalLanguageInput(userText, 'Prepare a remediation', {
      requested_action: { kind: 'PREPARE_REMEDIATION', evidence: 'Prepare a remediation' },
    });
    const pending = compileGuardianRequest(input);
    if (pending.status !== 'CONFIRMATION_REQUIRED') {
      throw new Error('Expected confirmation requirement.');
    }

    expect(
      compileGuardianRequest({
        ...input,
        confirmation: {
          decision: 'CONFIRM',
          interpreted_request_sha256: pending.interpreted_request_sha256,
        },
        verifier_inputs: { verifier_bundle: 'wrong.cjs' },
      }),
    ).toMatchObject({
      status: 'NEEDS_INPUT',
      source: 'NATURAL_LANGUAGE',
      missing_fields: ['verifier_inputs'],
    });
  });

  it.each([
    '/etc/passwd',
    '../secrets.yaml',
    '%252e%252e/secrets.yaml',
    String.raw`k8s\secrets.yaml`,
    'k8s/secret\u0000.yaml',
  ])('rejects the explicit unsafe target path %j without broadening scope', (targetFile) => {
    const userText = `Analyze ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}, target ${targetFile}.`;
    const result = compileGuardianRequest(
      naturalLanguageInput(userText, 'Analyze', { target_file: targetFile }),
    );

    expect(result).toMatchObject({
      status: 'NEEDS_INPUT',
      missing_fields: ['target_file'],
    });
    expect(result).not.toHaveProperty('request');
  });

  it('requires digest-bound confirmation before a natural-language OPEN_PR request is executable', () => {
    const userText = `Open a PR for ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`;
    const input = naturalLanguageInput(userText, 'Open a PR', {
      requested_action: { kind: 'OPEN_PR', evidence: 'Open a PR' },
      target_file: 'k8s/network-policy.yaml',
    });
    input.user_text += ' Target file: k8s/network-policy.yaml.';

    const pending = compileGuardianRequest(input);
    expect(pending).toMatchObject({
      status: 'CONFIRMATION_REQUIRED',
      source: 'NATURAL_LANGUAGE',
      interpreted_request: {
        mode: 'OPEN_PR',
        repository: REPOSITORY,
        base_branch: BRANCH,
        revision: COMMIT_SHA,
        target_file: 'k8s/network-policy.yaml',
      },
    });
    if (pending.status !== 'CONFIRMATION_REQUIRED') {
      throw new Error('Expected confirmation requirement.');
    }
    expect(pending.interpreted_request_sha256).toMatch(/^[a-f0-9]{64}$/u);
    expect(pending.question).toContain('three separately approval-gated GitHub writes');
    expect(pending.question).toContain('verifier.bundle.cjs');
    expect(() => planGuardianRun(input)).toThrow(
      'Guardian request is not executable: CONFIRMATION_REQUIRED',
    );

    const confirmedWithoutVerifier = {
      ...input,
      confirmation: {
        decision: 'CONFIRM',
        interpreted_request_sha256: pending.interpreted_request_sha256,
      },
    };
    expect(compileGuardianRequest(confirmedWithoutVerifier)).toMatchObject({
      status: 'NEEDS_INPUT',
      source: 'NATURAL_LANGUAGE',
      missing_fields: ['verifier_inputs'],
    });
    expect(() => planGuardianRun(confirmedWithoutVerifier)).toThrow(
      'Guardian request is not executable: NEEDS_INPUT',
    );

    const readyInput = { ...confirmedWithoutVerifier, verifier_inputs: VERIFIER_INPUTS };
    const ready = compileGuardianRequest(readyInput);
    expect(ready).toMatchObject({
      status: 'READY',
      source: 'NATURAL_LANGUAGE',
      request: {
        mode: 'OPEN_PR',
        scope: {
          repository: REPOSITORY,
          base_branch: BRANCH,
          target_file: 'k8s/network-policy.yaml',
        },
      },
    });
    expect(planGuardianRun(readyInput).mode).toBe('OPEN_PR');
  });

  it('does not accept confirmation for a different interpreted request', () => {
    const userText = `Prepare a remediation for ${REPOSITORY} commit ${COMMIT_SHA} on base branch ${BRANCH}.`;
    const input = naturalLanguageInput(userText, 'Prepare a remediation', {
      requested_action: { kind: 'PREPARE_REMEDIATION', evidence: 'Prepare a remediation' },
    });

    expect(
      compileGuardianRequest({
        ...input,
        confirmation: {
          decision: 'CONFIRM',
          interpreted_request_sha256: 'a'.repeat(64),
        },
      }),
    ).toMatchObject({ status: 'CONFIRMATION_REQUIRED' });
  });

  it('returns conversation-only classification without an executable request or question', () => {
    expect(
      compileGuardianRequest({
        source: 'NATURAL_LANGUAGE',
        user_text: 'What can you do?',
        draft: { schema_version: 1, intent: 'CONVERSATION_ONLY' },
      }),
    ).toEqual({ status: 'CONVERSATION_ONLY', source: 'NATURAL_LANGUAGE' });
  });
});
