import { describe, expect, it } from 'vitest';

import { compileGuardianRequest } from './intent.js';
import { planGuardianRun } from './plan.js';

const REPOSITORY = 'acme/payments';
const BRANCH = 'release';
const COMMIT_SHA = '1234567890abcdef1234567890abcdef12345678';

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
      mode: 'OPEN_PR',
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
    expect(planGuardianRun(input).mode).toBe('OPEN_PR');
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
      verifier_inputs: {
        verifier_bundle: 'verifier.bundle.cjs',
        expected_contract: 'expected-contract.json',
        suspect: 'suspect.yaml',
        deny_all: 'deny-all.yaml',
        last_good: 'last-good.yaml',
      },
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
    const userText = `Please check https://github.com/${repository}/commit/${COMMIT_SHA}.`;
    const result = compileGuardianRequest(
      naturalLanguageInput(userText, 'check', { repository, base_branch: 'main' }),
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
    expect(() => planGuardianRun(input)).toThrow(
      'Guardian request is not executable: CONFIRMATION_REQUIRED',
    );

    const ready = compileGuardianRequest({
      ...input,
      confirmation: {
        decision: 'CONFIRM',
        interpreted_request_sha256: pending.interpreted_request_sha256,
      },
    });
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
    expect(
      planGuardianRun({
        ...input,
        confirmation: {
          decision: 'CONFIRM',
          interpreted_request_sha256: pending.interpreted_request_sha256,
        },
      }).mode,
    ).toBe('OPEN_PR');
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
