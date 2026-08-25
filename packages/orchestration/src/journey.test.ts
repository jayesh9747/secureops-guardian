import { describe, expect, it } from 'vitest';

import { DEMO_REPOSITORY, SUSPECT_COMMIT_SHA, TARGET_NETWORK_POLICY_FILE } from '@guardian/shared';
import { LAST_GOOD_COMMIT_SHA } from '@guardian/shared';

import { runCurrentFixtureJourney } from './journey.js';

const fixtureScope = {
  schema_version: 1 as const,
  repository: DEMO_REPOSITORY,
  base_branch: 'main',
  suspect: { kind: 'commit' as const, commit_sha: SUSPECT_COMMIT_SHA },
  target_file: TARGET_NETWORK_POLICY_FILE,
};

describe('unified current-fixture journey', () => {
  it('stops ANALYSIS_ONLY before Daytona, proposal, approval, and GitHub writes', () => {
    const result = runCurrentFixtureJourney({ scope: fixtureScope });

    expect(result.receipt).toMatchObject({
      mode: 'ANALYSIS_ONLY',
      terminal_status: 'ANALYSIS_COMPLETE',
      stages: {
        incident_evidence_join: 'NOT_RUN',
        daytona_proof: 'NOT_PERMITTED',
        proposal: 'ABSENT',
        github_action: 'NOT_PERMITTED',
        presentation: 'MARKDOWN',
      },
      proposal_hash_sha256: null,
      action_receipt: null,
      approval_event_references: [],
      runtime_claims: {
        deployment: 'Unknown',
        runtime_exposure: 'Unknown',
      },
    });
    expect(result.receipt.evidence_ids.every((id) => id.startsWith('evidence:github:'))).toBe(true);
    expect(
      result.receipt.tool_event_references.every((reference) =>
        reference.includes(':evidence:github:'),
      ),
    ).toBe(true);
    expect(result.openui).toBeNull();
    expect(result.markdown).toContain('GitHub-only analysis');
    expect(result.markdown).not.toContain('owned synthetic incident evidence');
  });

  it('prepares an exact proposal without requesting approval or calling GitHub writes', () => {
    const result = runCurrentFixtureJourney({
      mode: 'PREPARE_REMEDIATION',
      scope: fixtureScope,
    });

    expect(result.receipt).toMatchObject({
      mode: 'PREPARE_REMEDIATION',
      terminal_status: 'SECURITY_REMEDIATION_READY',
      stages: {
        daytona_proof: 'COMPLETED',
        proposal: 'CREATED',
        github_action: 'NOT_PERMITTED',
        presentation: 'MARKDOWN',
      },
      action_receipt: null,
      approval_event_references: [],
    });
    expect(result.receipt.proposal_hash_sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(result.openui).toBeNull();
    expect(result.markdown).toContain('No GitHub write or approval is permitted in this mode.');
  });

  it('routes the exact parent-to-suspect comparison through the same prepared journey', () => {
    const result = runCurrentFixtureJourney({
      mode: 'PREPARE_REMEDIATION',
      scope: {
        ...fixtureScope,
        suspect: {
          kind: 'comparison',
          base_sha: LAST_GOOD_COMMIT_SHA,
          head_sha: SUSPECT_COMMIT_SHA,
        },
      },
    });

    expect(result.receipt).toMatchObject({
      terminal_status: 'SECURITY_REMEDIATION_READY',
      scope: {
        suspect: {
          kind: 'comparison',
          base_sha: LAST_GOOD_COMMIT_SHA,
          head_sha: SUSPECT_COMMIT_SHA,
        },
      },
    });
  });

  it('composes the frozen modules end to end and reuses the exact existing PR', () => {
    const result = runCurrentFixtureJourney({ mode: 'OPEN_PR', scope: fixtureScope });

    expect(result.receipt).toMatchObject({
      schema_version: 1,
      mode: 'OPEN_PR',
      terminal_status: 'PR_REUSED',
      scope: fixtureScope,
      stages: {
        scope_preflight: 'COMPLETED',
        github_investigation: 'COMPLETED',
        incident_evidence_join: 'COMPLETED',
        deterministic_rule: 'COMPLETED',
        daytona_proof: 'COMPLETED',
        proposal: 'CREATED',
        github_action: 'PR_REUSED',
        presentation: 'OPENUI_AND_MARKDOWN',
      },
      action_receipt: {
        status: 'PR_REUSED',
        approved_tool_call_references: [],
        denied_tool_call_references: [],
        pr_url: 'https://github.com/jayesh9747/guardian-demo-checkout/pull/1',
      },
      runtime_claims: {
        data_access: 'Unknown',
        exfiltration: 'Unknown',
        live_cluster_behavior: 'Unknown',
      },
    });
    expect(result.openui).toMatch(/^```openui\nroot = Stack\(/u);
    expect(result.markdown).toContain('PR_REUSED');
    expect(result.markdown).toContain(
      'https://github.com/jayesh9747/guardian-demo-checkout/pull/1',
    );
  });
});
