import { createHash } from 'node:crypto';

import {
  PHASE_FOUR_AGENT_SPEC,
  PHASE_THREE_PROPOSAL_HASH,
  SUSPECT_CANDIDATE_GIT_BLOB_SHA,
} from '@guardian/github-write';
import { parsePolicyContract, runBoundedCandidateWorkflow } from '@guardian/policy-verifier';
import { describe, expect, it } from 'vitest';

import {
  assertApprovalMatchesCheckpoint,
  observeMutation,
  phaseFiveRecordPassed,
  runPhaseFiveMatrix,
  runPhaseFiveScenario,
} from './harness.js';
import {
  DENY_ALL_NETWORK_POLICY_YAML,
  PHASE_THREE_FIXTURE_SHA256,
  POLICY_CONTRACT_JSON,
  SUSPECT_NETWORK_POLICY_YAML,
} from './inputs.js';
import { phaseFiveRunRecordSchema } from './records.js';

describe('Phase 5 deterministic integration matrix', () => {
  it('covers every required scenario with matching expected and actual terminal states', () => {
    const records = runPhaseFiveMatrix();
    expect(records.map((record) => record.scenario_id)).toEqual([
      'existing-pr-reuse',
      'denied-first-write',
      'missing-deployment-evidence',
      'missing-reachability-evidence',
      'conflicting-deployment-revision',
      'candidate-failure-two-attempts',
      'mismatched-remote-branch-content',
      'reconnect-pending-action',
    ]);
    expect(
      records.every((record) => record.expected_terminal_status === record.actual_terminal_status),
    ).toBe(true);
    expect(records.every(phaseFiveRecordPassed)).toBe(true);
    expect(records.every((record) => record.unsupported_github_mutation.status === 'ABSENT')).toBe(
      true,
    );
    expect(
      records.every(
        (record) => record.unsupported_github_mutation.observed_mutation_events.length === 0,
      ),
    ).toBe(true);
  });

  it('reuses an exact existing PR without a write or approval event', () => {
    const record = runPhaseFiveScenario('existing-pr-reuse');
    expect(record.actual_terminal_status).toBe('PR_REUSED');
    expect(record.proposal_hash_sha256).toBe(PHASE_THREE_PROPOSAL_HASH);
    expect(record.write_approval_requested).toBe(false);
    expect(record.approval_event_references).toEqual([]);
    expect(record.tool_event_references).toContain(
      'deterministic:github:list_pull_requests:open:main:guardian/fix-checkout-egress',
    );
    expect(record.remote_result).toEqual({
      status: 'PR_REUSED',
      remote_commit_sha: '44fb8c7f5e99f835c6779f5e7b777c1b016af5b3',
      candidate_git_blob_sha: '1eddb230ac7c05bae199e6b9162a42da3bf039fa',
      pr_number: 1,
      pr_url: 'https://github.com/jayesh9747/guardian-demo-checkout/pull/1',
    });
    expect(record.unsupported_github_mutation.before_state_sha256).toBe(
      record.unsupported_github_mutation.after_state_sha256,
    );
    expect(record.action_receipt?.status).toBe('PR_REUSED');
    expect(record.evidence_ids).toEqual(
      expect.arrayContaining([
        'evidence:github:commit:parent',
        'evidence:github:commit-history:checkout-networkpolicy',
        'evidence:github:remediation-branches',
        'evidence:github:remediation-pull-requests',
      ]),
    );
  });

  it('denies the first write and proves the remote snapshot was not mutated', () => {
    const record = runPhaseFiveScenario('denied-first-write');
    expect(record.actual_terminal_status).toBe('DENIED');
    expect(record.write_approval_requested).toBe(true);
    expect(record.approval_event_references).toEqual([
      'deterministic:approval:denied-first-write:create_branch:denied',
    ]);
    expect(record.unsupported_github_mutation).toMatchObject({
      status: 'ABSENT',
      confirmation_basis: 'PRE_POST_SNAPSHOT',
    });
    expect(record.unsupported_github_mutation.before_state_sha256).toBe(
      record.unsupported_github_mutation.after_state_sha256,
    );
  });

  it.each([
    'missing-deployment-evidence',
    'missing-reachability-evidence',
    'conflicting-deployment-revision',
  ] as const)('fails closed before sandbox or write approval for %s', (scenarioId) => {
    const record = runPhaseFiveScenario(scenarioId);
    expect(record.actual_terminal_status).toBe('INCONCLUSIVE');
    expect(record.sandbox_started).toBe(false);
    expect(record.verifier_output).toBeNull();
    expect(record.proposal_hash_sha256).toBeNull();
    expect(record.write_approval_requested).toBe(false);
    expect(record.approval_event_references).toEqual([]);
    const expectedDefect = {
      'missing-deployment-evidence':
        'Missing deployment revision in evidence:deployment:checkout-api:001:missing-deployment-revision.',
      'missing-reachability-evidence':
        'Missing post-deployment forbidden reachability observation from checkout-api.',
      'conflicting-deployment-revision':
        'Conflicting deployment revisions in evidence:deployment:checkout-api:001:conflicting-revision: ledger 7b2f2ad51f9ef97334176fbfed3138465b62fcdb, annotation a6d177b43396c7b4b45aa98cb2970d0489a7a4f9.',
    }[scenarioId];
    expect(record.evidence_defects).toEqual([expectedDefect]);
  });

  it('returns NO_SAFE_REMEDIATION after exactly two failed candidate attempts', () => {
    const record = runPhaseFiveScenario('candidate-failure-two-attempts');
    expect(record.actual_terminal_status).toBe('NO_SAFE_REMEDIATION');
    expect(record.verifier_output?.attempts).toHaveLength(2);
    expect(record.verifier_output?.attempts.map((attempt) => attempt.outcome)).toEqual([
      'CORRECTION_REQUIRED',
      'NO_SAFE_REMEDIATION',
    ]);
    expect(record.verifier_output?.attempts[1]?.diagnostics).toEqual(
      expect.arrayContaining([
        expect.stringContaining('DNS_REQUIRED_PATH'),
        expect.stringContaining('POSTGRES_REQUIRED_PATH'),
      ]),
    );
    expect(record.proposal_hash_sha256).toBeNull();
    expect(record.write_approval_requested).toBe(false);
  });

  it('returns WRITE_CONFLICT for mismatched remote work without overwrite', () => {
    const record = runPhaseFiveScenario('mismatched-remote-branch-content');
    expect(record.actual_terminal_status).toBe('WRITE_CONFLICT');
    expect(record.write_approval_requested).toBe(false);
    expect(record.approval_event_references).toEqual([]);
    expect(record.unsupported_github_mutation.verification).toContain('no overwrite');
    expect(record.remote_result).toMatchObject({
      status: 'WRITE_CONFLICT',
      observed_remote_commit_sha: 'd'.repeat(40),
      observed_git_blob_sha: 'f'.repeat(40),
    });
  });

  it('restores the same evidence, proposal hash, and pending action after reconnect', () => {
    const record = runPhaseFiveScenario('reconnect-pending-action');
    expect(record.actual_terminal_status).toBe('DENIED');
    expect(record.persistence).not.toBeNull();
    expect(record.persistence?.before_reconnect).toEqual(record.persistence?.after_reconnect);
    expect(record.persistence?.before_reconnect.evidence_ids).toHaveLength(13);
    expect(record.persistence?.before_reconnect.pending_action).toBe('CREATE_BRANCH');
    expect(record.persistence?.before_reconnect.proposal_hash_sha256).toBe(
      PHASE_THREE_PROPOSAL_HASH,
    );
  });

  it('rejects reconnect approvals for a different proposal or pending action', () => {
    const checkpoint = runPhaseFiveScenario('reconnect-pending-action').persistence
      ?.after_reconnect;
    expect(checkpoint).toBeDefined();
    expect(() =>
      assertApprovalMatchesCheckpoint(checkpoint, {
        proposal_hash_sha256: '0'.repeat(64),
        pending_action: 'CREATE_BRANCH',
      }),
    ).toThrow('Reconnect approval proposal hash does not match the persisted proposal.');
    expect(() =>
      assertApprovalMatchesCheckpoint(checkpoint, {
        proposal_hash_sha256: PHASE_THREE_PROPOSAL_HASH,
        pending_action: 'UPDATE_FILE',
      }),
    ).toThrow('Reconnect approval pending action does not match the persisted action.');
  });

  it('requires a denied write approval and its denial event', () => {
    const valid = runPhaseFiveScenario('denied-first-write');
    expect(() =>
      phaseFiveRunRecordSchema.parse({
        ...valid,
        write_approval_requested: false,
        approval_event_references: [],
      }),
    ).toThrow(/DENIED requires exactly one denied approval event/u);
  });

  it('can serialize an observed mutation instead of forcing an absent claim', () => {
    const valid = runPhaseFiveScenario('denied-first-write');
    expect(() =>
      phaseFiveRunRecordSchema.parse({
        ...valid,
        unsupported_github_mutation: {
          status: 'OBSERVED',
          confirmed_absent: false,
          before_state_sha256: valid.unsupported_github_mutation.before_state_sha256,
          after_state_sha256: '0'.repeat(64),
          observed_mutation_events: ['create_branch'],
          verification: 'Regression fixture observed an unsupported mutation.',
        },
      }),
    ).not.toThrow();
  });

  it('can serialize an expected/actual mismatch for a failing matrix artifact', () => {
    const conflict = runPhaseFiveScenario('mismatched-remote-branch-content');
    expect(() =>
      phaseFiveRunRecordSchema.parse({
        ...conflict,
        scenario_id: 'existing-pr-reuse',
        expected_terminal_status: 'PR_REUSED',
      }),
    ).not.toThrow();
  });

  it('derives an unexpected actual status from the observed remote decision', () => {
    const record = runPhaseFiveScenario('existing-pr-reuse', {
      remoteSnapshot: {
        base: {
          commitSha: '7b2f2ad51f9ef97334176fbfed3138465b62fcdb',
          targetFileGitBlobSha: SUSPECT_CANDIDATE_GIT_BLOB_SHA,
        },
        branch: {
          commitSha: 'd'.repeat(40),
          targetFileGitBlobSha: 'f'.repeat(40),
          commitMessage: 'unexpected remote work',
        },
        pullRequest: null,
      },
    });
    expect(record.expected_terminal_status).toBe('PR_REUSED');
    expect(record.actual_terminal_status).toBe('WRITE_CONFLICT');
    expect(phaseFiveRecordPassed(record)).toBe(false);
  });

  it('rejects record fields that disagree with the Phase 4 action receipt', () => {
    const valid = runPhaseFiveScenario('existing-pr-reuse');
    expect(() =>
      phaseFiveRunRecordSchema.parse({
        ...valid,
        remote_result: { ...valid.remote_result, pr_number: 2 },
      }),
    ).toThrow(/agree with its read-only action receipt/u);
  });

  it('turns changed state or mutation events into an OBSERVED mutation artifact', () => {
    const before = {
      base: {
        commitSha: '7b2f2ad51f9ef97334176fbfed3138465b62fcdb',
        targetFileGitBlobSha: SUSPECT_CANDIDATE_GIT_BLOB_SHA,
      },
      branch: null,
      pullRequest: null,
    } as const;
    const after = {
      ...before,
      branch: {
        commitSha: 'd'.repeat(40),
        targetFileGitBlobSha: 'f'.repeat(40),
        commitMessage: 'unsupported mutation',
      },
    };
    expect(
      observeMutation({
        before,
        after,
        mutationEvents: ['create_branch'],
        detail: 'Regression observation.',
      }),
    ).toMatchObject({ status: 'OBSERVED', confirmed_absent: false });
  });

  it('loads the canonical Phase 3 fixtures under their frozen hashes', () => {
    const sha256 = (contents: string) => createHash('sha256').update(contents).digest('hex');
    expect(sha256(SUSPECT_NETWORK_POLICY_YAML)).toBe(PHASE_THREE_FIXTURE_SHA256.suspect);
    expect(sha256(DENY_ALL_NETWORK_POLICY_YAML)).toBe(PHASE_THREE_FIXTURE_SHA256.denyAll);
    expect(sha256(POLICY_CONTRACT_JSON)).toBe(PHASE_THREE_FIXTURE_SHA256.contract);
  });

  it('owns the two-attempt limit in a bounded workflow driver', () => {
    const workflow = runBoundedCandidateWorkflow(
      [DENY_ALL_NETWORK_POLICY_YAML, DENY_ALL_NETWORK_POLICY_YAML],
      parsePolicyContract(POLICY_CONTRACT_JSON),
    );
    expect(workflow.outcome).toBe('NO_SAFE_REMEDIATION');
    expect(workflow.attempts).toHaveLength(2);
    expect(workflow.attempts.at(-1)?.outcome).toBe('NO_SAFE_REMEDIATION');
  });

  it('rejects records that claim an unsupported GitHub mutation or wrong terminal state', () => {
    const valid = runPhaseFiveScenario('existing-pr-reuse');
    expect(() =>
      phaseFiveRunRecordSchema.parse({
        ...valid,
        unsupported_github_mutation: {
          ...valid.unsupported_github_mutation,
          observed_mutation_events: ['create_branch'],
        },
      }),
    ).toThrow();
    expect(() =>
      phaseFiveRunRecordSchema.parse({ ...valid, actual_terminal_status: 'PR_CREATED' }),
    ).toThrow();

    expect(() =>
      phaseFiveRunRecordSchema.parse({
        ...valid,
        unsupported_github_mutation: {
          ...valid.unsupported_github_mutation,
          after_state_sha256: '0'.repeat(64),
        },
      }),
    ).toThrow(/equal before\/after state hashes/u);
  });

  it('rejects reconnect records whose canonical persisted values changed', () => {
    const valid = runPhaseFiveScenario('reconnect-pending-action');
    expect(valid.persistence).not.toBeNull();
    if (valid.persistence === null) throw new Error('Expected reconnect persistence proof.');
    const persistence = valid.persistence;
    expect(() =>
      phaseFiveRunRecordSchema.parse({
        ...valid,
        persistence: {
          ...persistence,
          after_reconnect: {
            ...persistence.after_reconnect,
            evidence_ids: [...persistence.after_reconnect.evidence_ids, 'evidence:changed'],
          },
        },
      }),
    ).toThrow(/checkpoint values changed/u);
  });

  it('uses direct head-filtered PR listing and approval-gates every write', () => {
    const github = PHASE_FOUR_AGENT_SPEC.manifest.mcp_servers[0];
    expect(github?.enable_tools).toContain('list_pull_requests');
    expect(github?.enable_tools).not.toContain('search_pull_requests');
    expect(github?.require_approval_for_tools).toEqual([
      'create_branch',
      'create_or_update_file',
      'create_pull_request',
    ]);
  });
});
