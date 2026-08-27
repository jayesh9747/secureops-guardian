import { describe, expect, it } from 'vitest';

import { DEMO_REPOSITORY, SUSPECT_COMMIT_SHA, TARGET_NETWORK_POLICY_FILE } from '@guardian/shared';

import { REQUIRED_VERIFIER_INPUTS } from './intent.js';
import { buildCurrentFixtureJourneyContext, runCurrentFixtureJourney } from './journey.js';
import { buildGuardianRunReceipt } from './receipt.js';

const scope = {
  schema_version: 1 as const,
  repository: DEMO_REPOSITORY,
  base_branch: 'main',
  suspect: { kind: 'commit' as const, commit_sha: SUSPECT_COMMIT_SHA },
  target_file: TARGET_NETWORK_POLICY_FILE,
};

function coreOf(mode: 'ANALYSIS_ONLY' | 'PREPARE_REMEDIATION' | 'OPEN_PR') {
  const input = {
    mode,
    scope,
    ...(mode === 'ANALYSIS_ONLY' ? {} : { verifier_inputs: REQUIRED_VERIFIER_INPUTS }),
  };
  const { receipt_id: _receiptId, ...core } = runCurrentFixtureJourney(
    input,
    buildCurrentFixtureJourneyContext(input),
  ).receipt;
  void _receiptId;
  return core;
}

describe('Guardian run receipt cross-stage invariants', () => {
  it('rejects Fixture evidence and runtime claims in ANALYSIS_ONLY', () => {
    const core = coreOf('ANALYSIS_ONLY');

    expect(() =>
      buildGuardianRunReceipt({
        ...core,
        stages: { ...core.stages, incident_evidence_join: 'COMPLETED' },
        evidence_ids: [...core.evidence_ids, 'evidence:deployment:synthetic'],
        runtime_claims: {
          ...core.runtime_claims,
          deployment: 'SupportedByOwnedSyntheticEvidence',
        },
      }),
    ).toThrow(/ANALYSIS_ONLY/u);
  });

  it('rejects Fixture tool-event references in ANALYSIS_ONLY', () => {
    const core = coreOf('ANALYSIS_ONLY');

    expect(() =>
      buildGuardianRunReceipt({
        ...core,
        tool_event_references: [
          ...core.tool_event_references,
          'deterministic:tool:get_security_alert:evidence:deployment:synthetic',
        ],
      }),
    ).toThrow(/ANALYSIS_ONLY/u);
  });

  it('rejects a Fixture tool disguised with a GitHub evidence suffix in ANALYSIS_ONLY', () => {
    const core = coreOf('ANALYSIS_ONLY');

    expect(() =>
      buildGuardianRunReceipt({
        ...core,
        tool_event_references: ['deterministic:tool:get_security_alert:evidence:github:fake'],
      }),
    ).toThrow(/ANALYSIS_ONLY/u);
  });

  it('allows a fail-closed ANALYSIS_ONLY preflight receipt', () => {
    const core = coreOf('ANALYSIS_ONLY');

    expect(
      buildGuardianRunReceipt({
        ...core,
        terminal_status: 'INCONCLUSIVE',
        stages: {
          ...core.stages,
          scope_preflight: 'INCONCLUSIVE',
          deterministic_rule: 'NOT_RUN',
          github_action: 'NOT_REACHED',
        },
        missing_or_unsupported_requirements: ['Observed repository identity was incomplete.'],
      }).terminal_status,
    ).toBe('INCONCLUSIVE');
  });

  it('allows a fail-closed PREPARE_REMEDIATION preflight receipt', () => {
    const core = coreOf('PREPARE_REMEDIATION');

    expect(
      buildGuardianRunReceipt({
        ...core,
        terminal_status: 'INCONCLUSIVE',
        stages: {
          ...core.stages,
          scope_preflight: 'INCONCLUSIVE',
          incident_evidence_join: 'MISSING',
          deterministic_rule: 'NOT_RUN',
          daytona_proof: 'NOT_RUN',
          proposal: 'ABSENT',
          github_action: 'NOT_REACHED',
        },
        missing_or_unsupported_requirements: ['Complete incident evidence is required.'],
        proposal_hash_sha256: null,
        runtime_claims: {
          ...core.runtime_claims,
          deployment: 'Unknown',
          runtime_exposure: 'Unknown',
        },
      }).terminal_status,
    ).toBe('INCONCLUSIVE');
  });

  it('rejects synthetic runtime support in an INCONCLUSIVE receipt', () => {
    const core = coreOf('PREPARE_REMEDIATION');

    expect(() =>
      buildGuardianRunReceipt({
        ...core,
        terminal_status: 'INCONCLUSIVE',
        stages: {
          ...core.stages,
          scope_preflight: 'INCONCLUSIVE',
          incident_evidence_join: 'MISSING',
          deterministic_rule: 'NOT_RUN',
          daytona_proof: 'NOT_RUN',
          proposal: 'ABSENT',
          github_action: 'NOT_REACHED',
        },
        missing_or_unsupported_requirements: ['Complete incident evidence is required.'],
        proposal_hash_sha256: null,
        runtime_claims: {
          ...core.runtime_claims,
          deployment: 'SupportedByOwnedSyntheticEvidence',
          runtime_exposure: 'SupportedByOwnedSyntheticEvidence',
        },
      }),
    ).toThrow(/INCONCLUSIVE/u);
  });

  it('rejects an action terminal state without a Phase 4 action receipt', () => {
    const core = coreOf('OPEN_PR');

    expect(() => buildGuardianRunReceipt({ ...core, action_receipt: null })).toThrow(
      /action receipt/iu,
    );
  });

  it('rejects a remediation-ready state without an exact proposal', () => {
    const core = coreOf('PREPARE_REMEDIATION');

    expect(() =>
      buildGuardianRunReceipt({
        ...core,
        stages: { ...core.stages, proposal: 'ABSENT' },
        proposal_hash_sha256: null,
      }),
    ).toThrow(/exact proposal/iu);
  });

  it('rejects an OPEN_PR action state that bypasses proof and proposal stages', () => {
    const core = coreOf('OPEN_PR');

    expect(() =>
      buildGuardianRunReceipt({
        ...core,
        stages: { ...core.stages, daytona_proof: 'NOT_RUN', proposal: 'ABSENT' },
      }),
    ).toThrow(/proof and proposal/iu);
  });

  it('continues to parse persisted schema-version-1 receipts with the legacy presentation label', () => {
    const core = coreOf('OPEN_PR');

    expect(
      buildGuardianRunReceipt({
        ...core,
        stages: { ...core.stages, presentation: 'OPENUI_AND_MARKDOWN' },
      }).stages.presentation,
    ).toBe('OPENUI_AND_MARKDOWN');
  });
});
