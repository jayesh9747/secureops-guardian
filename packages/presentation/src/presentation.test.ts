import { PHASE_FOUR_AGENT_SPEC } from '@guardian/github-write';
import { describe, expect, it } from 'vitest';

import { PHASE_SIX_AGENT_SPEC } from './agent.js';
import { buildPhaseSixPresentationMatrix } from './matrix.js';
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
});

describe('Phase 6 TrueForge configuration and trace labels', () => {
  it('enables Generative UI without changing the Phase 4 tools or approval gates', () => {
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
  });
});
