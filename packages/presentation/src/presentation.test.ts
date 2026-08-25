import { PHASE_FOUR_AGENT_SPEC } from '@guardian/github-write';
import { phaseFiveRunRecordSchema, runPhaseFiveScenario } from '@guardian/reliability';
import { MISSING_REACHABILITY_CASE_ID } from '@guardian/shared';
import { describe, expect, it } from 'vitest';

import { PHASE_SIX_AGENT_SPEC } from './agent.js';
import { buildCreatedPresentation, buildRunRecordPresentation } from './build.js';
import { buildPhaseSixControllingArtifacts, buildPhaseSixPresentationMatrix } from './matrix.js';
import {
  renderGuardianFallbackResponse,
  renderGuardianMarkdown,
  renderGuardianOpenUi,
  renderGuardianResponse,
} from './render.js';
import { guardianPresentationSchema } from './schema.js';
import { GUARDIAN_TRACE_SEQUENCE } from './trace.js';

const matrix = buildPhaseSixPresentationMatrix();

describe('Phase 6 presentation schema', () => {
  it('covers every supported terminal result and each inconclusive fixture variant', () => {
    expect(matrix.map(({ scenario }) => scenario)).toEqual([
      'remediation-ready',
      'denied',
      'pr-created',
      'pr-reused',
      'missing-deployment-inconclusive',
      'missing-reachability-inconclusive',
      'conflicting-revision-inconclusive',
      'write-conflict',
      'no-safe-remediation',
    ]);
    expect(new Set(matrix.map(({ presentation }) => presentation.terminal_status))).toEqual(
      new Set([
        'SECURITY_REMEDIATION_READY',
        'DENIED',
        'PR_CREATED',
        'PR_REUSED',
        'INCONCLUSIVE',
        'WRITE_CONFLICT',
        'NO_SAFE_REMEDIATION',
      ]),
    );
    for (const { presentation } of matrix) {
      expect(guardianPresentationSchema.parse(presentation)).toEqual(presentation);
      if (presentation.terminal_status === 'INCONCLUSIVE') {
        expect(presentation.evidence.deterministic_rule).toEqual([]);
      } else {
        expect(presentation.evidence.deterministic_rule).toContain(
          'evidence:rule:SEC-NET-001:checkout-networkpolicy',
        );
      }
    }
  });

  it('fails closed when an inconclusive result claims High severity', () => {
    const inconclusive = matrix.find(
      ({ scenario }) => scenario === 'missing-deployment-inconclusive',
    );
    expect(inconclusive).toBeDefined();
    if (inconclusive === undefined) return;
    expect(() =>
      guardianPresentationSchema.parse({
        ...inconclusive.presentation,
        severity: 'High',
      }),
    ).toThrow(/INCONCLUSIVE must preserve unknown cause/u);
  });

  it('fails closed when no-safe remediation carries an exact proposal', () => {
    const noSafe = matrix.find(({ scenario }) => scenario === 'no-safe-remediation');
    const ready = matrix.find(({ scenario }) => scenario === 'remediation-ready');
    expect(noSafe).toBeDefined();
    expect(ready).toBeDefined();
    if (noSafe === undefined || ready === undefined) return;
    expect(() =>
      guardianPresentationSchema.parse({
        ...noSafe.presentation,
        proposal: ready.presentation.proposal,
      }),
    ).toThrow(/NO_SAFE_REMEDIATION must stop after two attempts/u);
  });

  it('rejects receipts and records that do not match the bound proposal and GitHub target', () => {
    const { finding, proposal, createdReceipt } = buildPhaseSixControllingArtifacts();
    expect(() =>
      buildCreatedPresentation({
        finding,
        proposal,
        receipt: {
          ...createdReceipt,
          proposal_hash_sha256: '0'.repeat(64),
        },
      }),
    ).toThrow(/different proposal hash/u);
    expect(() =>
      buildCreatedPresentation({
        finding,
        proposal,
        receipt: {
          ...createdReceipt,
          repository: 'someone-else/checkout',
        },
      }),
    ).toThrow(/different GitHub target/u);
    expect(() =>
      buildCreatedPresentation({
        finding,
        proposal,
        receipt: {
          ...createdReceipt,
          pr_url: 'https://github.com/jayesh9747/guardian-demo-checkout/pull/2',
        },
      }),
    ).toThrow(/mismatched pull-request URL/u);

    const deniedRecord = structuredClone(runPhaseFiveScenario('denied-first-write'));
    deniedRecord.proposal_hash_sha256 = '0'.repeat(64);
    if (deniedRecord.action_receipt === null) {
      throw new Error('Denied fixture must contain an action receipt.');
    }
    deniedRecord.action_receipt.proposal_hash_sha256 = '0'.repeat(64);
    expect(() => buildRunRecordPresentation({ record: deniedRecord, finding, proposal })).toThrow(
      /different proposal hash/u,
    );
  });

  it('rejects a conclusive record with no four-state verifier output', () => {
    const { finding, proposal } = buildPhaseSixControllingArtifacts();
    const record = structuredClone(runPhaseFiveScenario('denied-first-write'));
    record.verifier_output = null;
    expect(phaseFiveRunRecordSchema.parse(record)).toEqual(record);
    expect(() => buildRunRecordPresentation({ record, finding, proposal })).toThrow(
      /requires the bound proposal and four-state proof/u,
    );
  });

  it('rejects a run-record proof that differs from the bound proposal proof', () => {
    const { finding, proposal } = buildPhaseSixControllingArtifacts();
    const record = structuredClone(runPhaseFiveScenario('denied-first-write'));
    if (record.verifier_output?.four_state === null || record.verifier_output === null) {
      throw new Error('Denied fixture must contain a four-state proof.');
    }
    for (const row of record.verifier_output.four_state) {
      row.classification = 'EXPOSED';
      row.eligible = false;
      row.secure = false;
      row.functional = false;
    }
    expect(phaseFiveRunRecordSchema.parse(record)).toEqual(record);
    expect(() => buildRunRecordPresentation({ record, finding, proposal })).toThrow(
      /run-record four-state proof does not match the bound proposal/u,
    );
  });

  it('rejects a run record for a different fixture case', () => {
    const { finding, proposal } = buildPhaseSixControllingArtifacts();
    const record = structuredClone(runPhaseFiveScenario('denied-first-write'));
    record.fixture_case_id = MISSING_REACHABILITY_CASE_ID;
    expect(phaseFiveRunRecordSchema.parse(record)).toEqual(record);
    expect(() => buildRunRecordPresentation({ record, finding, proposal })).toThrow(
      /run record and finding refer to different fixture cases/u,
    );
  });

  it('rejects evidence IDs that the presentation cannot classify', () => {
    const { finding, proposal } = buildPhaseSixControllingArtifacts();
    const record = structuredClone(runPhaseFiveScenario('denied-first-write'));
    record.evidence_ids.push('evidence:daytona:four-state-proof');
    expect(phaseFiveRunRecordSchema.parse(record)).toEqual(record);
    expect(() => buildRunRecordPresentation({ record, finding, proposal })).toThrow(
      /unclassified evidence ID/u,
    );
  });

  it('reports missing no-safe diagnostics through an explicit presentation error', () => {
    const { finding } = buildPhaseSixControllingArtifacts();
    const record = structuredClone(runPhaseFiveScenario('candidate-failure-two-attempts'));
    if (record.verifier_output === null) {
      throw new Error('No-safe fixture must contain verifier attempts.');
    }
    for (const attempt of record.verifier_output.attempts) attempt.diagnostics = [];
    expect(phaseFiveRunRecordSchema.parse(record)).toEqual(record);
    expect(() => buildRunRecordPresentation({ record, finding, proposal: null })).toThrowError(
      'NO_SAFE_REMEDIATION presentation requires diagnostics for every verifier attempt.',
    );
  });
});

describe('stock TrueForge OpenUI rendering matrix', () => {
  const allowedComponents = new Set([
    'Callout',
    'Card',
    'CardHeader',
    'CodeBlock',
    'Col',
    'MarkDownRenderer',
    'Stack',
    'TabItem',
    'Table',
    'Tabs',
    'Tag',
    'TextContent',
  ]);

  it.each(matrix)(
    'renders $scenario with a streaming-safe root and stock components',
    (testCase) => {
      const openui = renderGuardianOpenUi(testCase.presentation);
      expect(openui.split('\n')[0]).toBe('root = Stack([guardianCard], "column", "m")');
      expect(openui).toContain(testCase.presentation.terminal_status);
      expect(openui).toContain('Actual data access Unknown');
      expect(openui).not.toContain('undefined');
      expect(openui).toContain('findingTable, evidenceDetail, verifierSection, detailsTabs');
      expect(openui).toContain('detailsTabs = Tabs([proposalTab, limitationsTab])');

      const componentNames = [...openui.matchAll(/\b([A-Z][A-Za-z]+)\(/gu)].map(
        (match) => match[1],
      );
      expect(
        componentNames.every((name) => name !== undefined && allowedComponents.has(name)),
      ).toBe(true);
    },
  );

  it.each(matrix)('keeps $scenario readable through the Markdown fallback', (testCase) => {
    const markdown = renderGuardianMarkdown(testCase.presentation);
    const response = renderGuardianResponse(testCase.presentation);
    const fallback = renderGuardianFallbackResponse(testCase.presentation);
    expect(markdown).toContain(testCase.presentation.terminal_status);
    expect(markdown).toContain('Actual data access: **Unknown**');
    expect(markdown).toContain('Official GitHub MCP evidence');
    expect(markdown).toContain('Incident Fixture MCP evidence');
    expect(markdown).toContain('Approval and GitHub result');
    expect(response).toContain('```openui\nroot = Stack(');
    expect(response).not.toContain('Markdown fallback');
    expect(response.endsWith('```')).toBe(true);
    expect(fallback).toBe(markdown);

    if (testCase.presentation.proposal.state === 'EXACT') {
      expect(markdown).toContain(testCase.presentation.proposal.proposal_hash_sha256);
      expect(markdown).toContain(testCase.presentation.proposal.exact_patch);
    } else {
      expect(markdown).toContain('No proposal:');
    }

    const githubResult = testCase.presentation.action.github_result;
    if (githubResult.state === 'PR_CREATED' || githubResult.state === 'PR_REUSED') {
      expect(markdown).toContain(githubResult.pr_url);
    }
  });

  it('keeps the run receipt behind one disclosure in the primary OpenUI response', () => {
    const reused = matrix.find(({ scenario }) => scenario === 'pr-reused');
    expect(reused).toBeDefined();
    if (reused === undefined) return;

    const response = renderGuardianResponse(reused.presentation, {
      runReceipt: {
        schema_version: 1,
        receipt_id: 'guardian-run:sha256:fixture',
        terminal_status: 'PR_REUSED',
      },
    });

    expect(response.match(/```openui/gu)).toHaveLength(1);
    expect(response).toContain('TabItem("receipt", "Run receipt"');
    expect(response).toContain('CodeBlock("json"');
    expect(response).not.toContain('## SecureOps Guardian');
    expect(response).not.toContain('Journey Trace & Execution Log');
  });

  it('escapes free-text pipe characters inside Markdown verifier tables', () => {
    const noSafe = matrix.find(({ scenario }) => scenario === 'no-safe-remediation');
    const ready = matrix.find(({ scenario }) => scenario === 'remediation-ready');
    expect(noSafe).toBeDefined();
    expect(ready).toBeDefined();
    if (
      noSafe?.presentation.verifier.state !== 'NO_SAFE_REMEDIATION' ||
      ready?.presentation.verifier.state !== 'FOUR_STATE_VERIFIED'
    ) {
      return;
    }
    const firstAttempt = noSafe.presentation.verifier.attempts[0];
    const firstRow = ready.presentation.verifier.rows[0];
    if (firstAttempt === undefined || firstRow === undefined) return;
    firstAttempt.diagnostics = ['broken | row | injection'];
    firstRow.decision = 'secure | functional';
    expect(renderGuardianMarkdown(noSafe.presentation)).toContain('broken \\| row \\| injection');
    expect(renderGuardianMarkdown(ready.presentation)).toContain('secure \\| functional');
  });
});

describe('Phase 6 TrueForge configuration and trace labels', () => {
  it('enables Generative UI without changing the Phase 4 tools or approval gates', () => {
    expect(PHASE_SIX_AGENT_SPEC.manifest.mcp_servers).not.toBe(
      PHASE_FOUR_AGENT_SPEC.manifest.mcp_servers,
    );
    expect(PHASE_SIX_AGENT_SPEC.manifest.config.sandbox).not.toBe(
      PHASE_FOUR_AGENT_SPEC.manifest.config.sandbox,
    );
    expect(PHASE_SIX_AGENT_SPEC.manifest.config.dynamic_sub_agents).not.toBe(
      PHASE_FOUR_AGENT_SPEC.manifest.config.dynamic_sub_agents,
    );
    expect(PHASE_SIX_AGENT_SPEC.manifest.mcp_servers).toEqual(
      PHASE_FOUR_AGENT_SPEC.manifest.mcp_servers,
    );
    expect(PHASE_SIX_AGENT_SPEC.manifest.config.sandbox).toEqual(
      PHASE_FOUR_AGENT_SPEC.manifest.config.sandbox,
    );
    expect(PHASE_SIX_AGENT_SPEC.manifest.config.dynamic_sub_agents).toEqual(
      PHASE_FOUR_AGENT_SPEC.manifest.config.dynamic_sub_agents,
    );
    expect(PHASE_SIX_AGENT_SPEC.manifest.config.generative_ui).toEqual({ enabled: true });
    expect(PHASE_SIX_AGENT_SPEC.manifest.mcp_servers[0]?.require_approval_for_tools).toEqual([
      'create_branch',
      'create_or_update_file',
      'create_pull_request',
    ]);
  });

  it('names every judge-visible trace milestone without recasting platform behavior', () => {
    expect(GUARDIAN_TRACE_SEQUENCE).toEqual([
      'change-security-investigator — official GitHub MCP evidence',
      'exposure-evidence-investigator — Fixture MCP evidence',
      'Daytona sandbox — deterministic four-state policy verification',
      'TrueForge approval required — official GitHub MCP write',
      'Official GitHub MCP result or deterministic PR reuse',
    ]);
    for (const label of GUARDIAN_TRACE_SEQUENCE) {
      expect(PHASE_SIX_AGENT_SPEC.manifest.instructions).toContain(label);
    }
    expect(PHASE_SIX_AGENT_SPEC.manifest.instructions).toContain(
      'Do not print a Journey Trace & Execution Log',
    );
    expect(PHASE_SIX_AGENT_SPEC.manifest.instructions).toContain(
      'TrueForge Investigation rail owns the execution trace',
    );
  });
});
