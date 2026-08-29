import { describe, expect, it } from 'vitest';

import { DEMO_REPOSITORY, SUSPECT_COMMIT_SHA, TARGET_NETWORK_POLICY_FILE } from '@guardian/shared';
import { LAST_GOOD_COMMIT_SHA } from '@guardian/shared';

import { REQUIRED_VERIFIER_INPUTS } from './intent.js';
import {
  buildCurrentFixtureJourneyContext,
  runCurrentFixtureJourney,
  type GuardianJourneyContext,
} from './journey.js';

const fixtureScope = {
  schema_version: 1 as const,
  repository: DEMO_REPOSITORY,
  base_branch: 'main',
  suspect: { kind: 'commit' as const, commit_sha: SUSPECT_COMMIT_SHA },
  target_file: TARGET_NETWORK_POLICY_FILE,
};

function withVerifierInputs(input: unknown) {
  if (
    typeof input !== 'object' ||
    input === null ||
    !('mode' in input) ||
    input.mode === undefined ||
    input.mode === 'ANALYSIS_ONLY'
  ) {
    return input;
  }
  return { ...input, verifier_inputs: REQUIRED_VERIFIER_INPUTS };
}

function runJourney(input: unknown) {
  const executableInput = withVerifierInputs(input);
  return runCurrentFixtureJourney(
    executableInput,
    buildCurrentFixtureJourneyContext(executableInput),
  );
}

describe('unified current-fixture journey', () => {
  it('stops ANALYSIS_ONLY before Daytona, proposal, approval, and GitHub writes', () => {
    const result = runJourney({ scope: fixtureScope });

    expect(result.receipt).toMatchObject({
      mode: 'ANALYSIS_ONLY',
      terminal_status: 'ANALYSIS_COMPLETE',
      stages: {
        incident_evidence_join: 'NOT_RUN',
        daytona_proof: 'NOT_PERMITTED',
        proposal: 'ABSENT',
        github_action: 'NOT_PERMITTED',
        presentation: 'OPENUI_WITH_MARKDOWN_FALLBACK',
      },
      proposal_hash_sha256: null,
      verifier_pack: null,
      verifier_pack_binding_sha256: null,
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
    expect(result.incident_brief).toMatchObject({
      terminal_status: 'ANALYSIS_COMPLETE',
      evidence_completeness: 'PARTIAL',
      disclosures: { verification: null, proposed_change: null },
      controls: [],
    });
    expect(result.openui).toMatch(/^```openui\nroot = Stack\(\[incidentBrief\]/u);
    expect(result.openui).not.toContain('TabItem("verification"');
    expect(result.openui).not.toContain('TabItem("proposed-change"');
    expect(result.markdown).toContain('SecureOps Guardian Incident Brief');
    expect(result.markdown).not.toContain('owned synthetic incident evidence');
    expect(result.artifacts.verified_change).toBeNull();
    expect(result.investigation_rail).toBeNull();
  });

  it('prepares an exact proposal without requesting approval or calling GitHub writes', () => {
    const input = {
      mode: 'PREPARE_REMEDIATION',
      scope: fixtureScope,
    } as const;
    const result = runJourney(input);

    expect(result.receipt).toMatchObject({
      mode: 'PREPARE_REMEDIATION',
      terminal_status: 'SECURITY_REMEDIATION_READY',
      stages: {
        daytona_proof: 'COMPLETED',
        proposal: 'CREATED',
        github_action: 'NOT_PERMITTED',
        presentation: 'OPENUI_WITH_MARKDOWN_FALLBACK',
      },
      action_receipt: null,
      approval_event_references: [],
    });
    expect(result.receipt.proposal_hash_sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(result.receipt.verifier_pack).toMatchObject({
      pack_id: 'k8s-network-egress-v1',
    });
    expect(result.receipt.verifier_pack_binding_sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(result.incident_brief).toMatchObject({
      terminal_status: 'SECURITY_REMEDIATION_READY',
      disclosures: {
        verification: { state: 'FOUR_STATE_VERIFIED' },
        proposed_change: { proposal_hash_sha256: result.receipt.proposal_hash_sha256 },
      },
      controls: [],
    });
    expect(result.openui).toContain('TabItem("verification", "Verification"');
    expect(result.openui).toContain('TabItem("proposed-change", "Proposed change"');
    expect(result.openui).not.toContain('Button(');
    expect(result.artifacts.verified_change).not.toBeNull();
  });

  it('routes the exact parent-to-suspect comparison through the same prepared journey', () => {
    const input = {
      mode: 'PREPARE_REMEDIATION',
      scope: {
        ...fixtureScope,
        suspect: {
          kind: 'comparison',
          base_sha: LAST_GOOD_COMMIT_SHA,
          head_sha: SUSPECT_COMMIT_SHA,
        },
      },
    } as const;
    const result = runJourney(input);

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
    expect(result.markdown).toContain(
      `Revision: \`${LAST_GOOD_COMMIT_SHA}...${SUSPECT_COMMIT_SHA}\``,
    );
  });

  it('returns a fail-closed receipt with the preflight requirements instead of throwing', () => {
    const input = {
      mode: 'PREPARE_REMEDIATION',
      scope: { ...fixtureScope, base_branch: 'release' },
    } as const;
    const result = runJourney(input);

    expect(result.receipt).toMatchObject({
      terminal_status: 'INCONCLUSIVE',
      stages: {
        scope_preflight: 'INCONCLUSIVE',
        daytona_proof: 'NOT_RUN',
        proposal: 'ABSENT',
        github_action: 'NOT_REACHED',
      },
      runtime_claims: { deployment: 'Unknown', runtime_exposure: 'Unknown' },
    });
    expect(result.receipt.missing_or_unsupported_requirements).toContain(
      'The supported remediation base branch is main.',
    );
    expect(result.incident_brief).toMatchObject({
      terminal_status: 'INCONCLUSIVE',
      severity: 'Unknown',
      evidence_completeness: 'INCONCLUSIVE',
      disclosures: { verification: null, proposed_change: null },
      controls: [],
    });
    expect(result.openui).toContain('Tag("Status: Inconclusive"');
    expect(result.markdown).toContain('INCONCLUSIVE');
    expect(result.artifacts.verified_change).toBeNull();
  });

  it('composes the frozen modules end to end and reuses the exact existing PR', () => {
    const result = runJourney({ mode: 'OPEN_PR', scope: fixtureScope });

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
        presentation: 'OPENUI_WITH_MARKDOWN_FALLBACK',
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
    expect(result.openui).toContain('TabItem("receipt", "Run receipt"');
    expect(result.openui).not.toContain('## SecureOps Guardian');
    expect(result.openui).not.toContain('Journey Trace & Execution Log');
    expect(result.incident_brief).toMatchObject({
      terminal_status: 'PR_REUSED',
      identity: {
        receipt: { receipt_id: result.receipt.receipt_id },
        proposal: { proposal_hash_sha256: result.receipt.proposal_hash_sha256 },
      },
    });
    expect(result.artifacts.verified_change).not.toBeNull();
    expect(result.markdown).toContain('PR_REUSED');
    expect(result.markdown).toContain(
      'https://github.com/jayesh9747/guardian-demo-checkout/pull/1',
    );
  });

  it('uses caller-supplied observations for arbitrary-repository ANALYSIS_ONLY', () => {
    const input = {
      mode: 'ANALYSIS_ONLY',
      scope: {
        schema_version: 1 as const,
        repository: 'octo-org/arbitrary-repository',
        base_branch: 'stable',
        suspect: { kind: 'commit' as const, commit_sha: 'c'.repeat(40) },
      },
    };
    const context: GuardianJourneyContext = {
      preflight_observation: {
        repository: input.scope.repository,
        base_branch: input.scope.base_branch,
        suspect: { kind: 'commit', commit_sha: 'c'.repeat(40), parent_sha: null },
        resolved_target_file: null,
        target_kind: 'MISSING',
        verifier_subset: 'UNKNOWN',
        incident_evidence: 'MISSING',
        conflicts: [],
      },
      github_analysis: {
        evidence_ids: ['evidence:github:commit:arbitrary'],
        tool_event_references: ['deterministic:tool:get_commit:evidence:github:commit:arbitrary'],
        limitations: ['GitHub repository evidence does not establish live workload behavior.'],
      },
      investigation_rail: {
        observed_at_ms: 2_500,
        children: [
          {
            child_id: 'child:github',
            agent: 'change-security-investigator',
            status: 'COMPLETED',
            started_at_ms: 1_000,
            completed_at_ms: 2_250,
            result: 'Collected the exact arbitrary-repository commit evidence.',
            tool_groups: [{ provider: 'Official GitHub MCP', tools: ['get_commit'] }],
          },
        ],
        findings: [],
        evidence: ['evidence:github:commit:arbitrary'],
        activity: ['The GitHub evidence child completed.'],
      },
    };

    const result = runCurrentFixtureJourney(input, context);

    expect(result.receipt).toMatchObject({
      terminal_status: 'ANALYSIS_COMPLETE',
      scope: input.scope,
      evidence_ids: ['evidence:github:commit:arbitrary'],
    });
    expect(result.markdown).toContain('octo-org/arbitrary-repository');
    expect(result.markdown).not.toContain(SUSPECT_COMMIT_SHA);
    expect(result.markdown).toContain('Target file: Not selected');
    expect(result.investigation_rail).toMatchObject({
      sections: ['Findings', 'Evidence', 'Activity'],
      child_rows: [
        {
          agent: 'change-security-investigator',
          elapsed_ms: 1_250,
          tool_groups: [{ provider: 'Official GitHub MCP', tools: ['get_commit'] }],
        },
      ],
    });
  });

  it('rejects spoofed Fixture tool references at the journey context boundary', () => {
    const input = {
      mode: 'ANALYSIS_ONLY',
      scope: {
        schema_version: 1 as const,
        repository: 'octo-org/arbitrary-repository',
        base_branch: 'stable',
        suspect: { kind: 'commit' as const, commit_sha: 'c'.repeat(40) },
      },
    };
    const context = {
      preflight_observation: {
        repository: input.scope.repository,
        base_branch: input.scope.base_branch,
        suspect: { kind: 'commit' as const, commit_sha: 'c'.repeat(40), parent_sha: null },
        resolved_target_file: null,
        target_kind: 'MISSING' as const,
        verifier_subset: 'UNKNOWN' as const,
        incident_evidence: 'MISSING' as const,
        conflicts: [],
      },
      github_analysis: {
        evidence_ids: ['evidence:github:commit:arbitrary'],
        tool_event_references: ['deterministic:tool:get_security_alert:evidence:github:fake'],
        limitations: ['GitHub repository evidence does not establish live workload behavior.'],
      },
    };

    expect(() => runCurrentFixtureJourney(input, context)).toThrow(
      /official GitHub read-tool event reference/u,
    );
  });

  it('makes the OPEN_PR remote artifact gate load-bearing', () => {
    const input = withVerifierInputs({ mode: 'OPEN_PR', scope: fixtureScope });
    const context = buildCurrentFixtureJourneyContext(input);
    if (context.remote_snapshot === undefined) throw new Error('Expected remote snapshot.');
    const remote = structuredClone(context.remote_snapshot) as {
      branch: null | { targetFileGitBlobSha: string };
    };
    if (remote.branch === null) throw new Error('Expected remediation branch.');
    remote.branch.targetFileGitBlobSha = 'f'.repeat(40);

    const result = runCurrentFixtureJourney(input, { ...context, remote_snapshot: remote });

    expect(result.receipt).toMatchObject({
      terminal_status: 'WRITE_CONFLICT',
      stages: { github_action: 'WRITE_CONFLICT' },
      action_receipt: { status: 'WRITE_CONFLICT' },
    });
  });
});
