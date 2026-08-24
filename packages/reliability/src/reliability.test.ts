import { PHASE_FOUR_AGENT_SPEC, PHASE_THREE_PROPOSAL_HASH } from '@guardian/github-write';
import { describe, expect, it } from 'vitest';

import {
  assertApprovalMatchesCheckpoint,
  runPhaseFiveMatrix,
  runPhaseFiveScenario,
} from './harness.js';
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
    expect(records.every((record) => record.unsupported_github_mutation.confirmed_absent)).toBe(
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
  });

  it('denies the first write and proves the remote snapshot was not mutated', () => {
    const record = runPhaseFiveScenario('denied-first-write');
    expect(record.actual_terminal_status).toBe('DENIED');
    expect(record.write_approval_requested).toBe(true);
    expect(record.approval_event_references).toEqual([
      'deterministic:approval:denied-first-write:create_branch:denied',
    ]);
    expect(record.unsupported_github_mutation.verification).toContain('byte-identical');
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
    expect(record.unsupported_github_mutation.verification).toContain('without overwrite');
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
    expect(record.persistence).toMatchObject({
      same_case_id: true,
      same_evidence_ids: true,
      same_proposal_hash: true,
      same_pending_action: true,
    });
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
    ).toThrow(/persisted proposal/u);
    expect(() =>
      assertApprovalMatchesCheckpoint(checkpoint, {
        proposal_hash_sha256: PHASE_THREE_PROPOSAL_HASH,
        pending_action: 'UPDATE_FILE',
      }),
    ).toThrow(/pending action/u);
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
    ).toThrow(/before\/after state hashes/u);
  });

  it('rejects reconnect records whose persisted values changed despite boolean claims', () => {
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
    ).toThrow(/byte-semantically identical/u);
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
