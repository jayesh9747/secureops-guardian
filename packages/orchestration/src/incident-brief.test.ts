import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import { FINDING_PACK_REGISTRY } from '@guardian/investigation';
import {
  buildPhaseSixControllingArtifacts,
  renderGuardianIncidentBriefOpenUi,
  renderInterpretedRequestCardOpenUi,
} from '@guardian/presentation';
import { describe, expect, it } from 'vitest';

import { compileGuardianRequest } from './intent.js';
import {
  buildFindingPackIncidentBrief,
  buildGuardianIncidentBrief,
  incidentBriefDecisionWordCount,
} from './incident-brief.js';
import { buildIncidentBriefArtifacts } from './incident-brief-artifacts.js';
import { buildPhaseElevenIncidentBriefMatrix } from './incident-brief-matrix.js';
import { buildInterpretedRequestCard } from './request-card.js';
import { buildCurrentFixtureJourneyContext, runCurrentFixtureJourney } from './journey.js';

const repository = 'jayesh9747/guardian-demo-checkout';
const revision = '7b2f2ad51f9ef97334176fbfed3138465b62fcdb';
const targetFile = 'k8s/checkout-networkpolicy.yaml';

describe('Phase 11 interpreted-request card', () => {
  it('binds the visible egress request and capability boundary to the compiler digest', () => {
    const compilation = compileGuardianRequest({
      source: 'NATURAL_LANGUAGE',
      user_text: `Prepare a remediation for repository ${repository}, base branch main, commit ${revision}, target file ${targetFile}.`,
      draft: {
        schema_version: 1,
        intent: 'INVESTIGATION',
        requested_action: { kind: 'PREPARE_REMEDIATION', evidence: 'Prepare a remediation' },
        repository,
        base_branch: 'main',
        suspect: { kind: 'commit', commit_sha: revision },
        target_file: targetFile,
      },
    });

    const card = buildInterpretedRequestCard(compilation, {
      pack_id: 'k8s-network-egress-v1',
      pack_version: '1.0.4',
      capability_ceiling: 'REMEDIATION_PROVEN',
    });

    expect(card).toEqual({
      schema_version: 1,
      request_id: `guardian-request:sha256:${compilation.status === 'CONFIRMATION_REQUIRED' ? compilation.interpreted_request_sha256 : ''}`,
      request_sha256:
        compilation.status === 'CONFIRMATION_REQUIRED'
          ? compilation.interpreted_request_sha256
          : '',
      repository,
      base_branch: 'main',
      revision,
      target_file: targetFile,
      pack: {
        pack_id: 'k8s-network-egress-v1',
        pack_version: '1.0.4',
      },
      capability_ceiling: 'REMEDIATION_PROVEN',
      will_not:
        'Guardian will not request GitHub approval, write, merge, deploy, or access a Kubernetes cluster in this mode.',
      confirmation_notice: 'Confirming this interpretation does not authorize any GitHub write.',
    });
    const openui = renderInterpretedRequestCardOpenUi(card);
    expect(openui).toContain('root = Stack([requestCard]');
    expect(openui).toContain(repository);
    expect(openui).toContain(revision);
    expect(openui).toContain(targetFile);
    expect(openui).toContain('k8s-network-egress-v1@1.0.4');
    expect(openui).toContain('REMEDIATION_PROVEN');
    expect(openui).not.toContain('Button(');
  });

  it('renders the selected workload pack and its analysis-only ceiling without remediation claims', () => {
    const workloadRepository = 'jayesh9747/guardian-demo-privileged-api';
    const workloadRevision = '2c7bdb3e07714e08d9504b3504587fbf18847f29';
    const workloadFile = 'k8s/api-deployment.yaml';
    const compilation = compileGuardianRequest({
      source: 'NATURAL_LANGUAGE',
      user_text: `Prepare a remediation for repository ${workloadRepository}, base branch main, commit ${workloadRevision}, target file ${workloadFile}.`,
      draft: {
        schema_version: 1,
        intent: 'INVESTIGATION',
        requested_action: { kind: 'PREPARE_REMEDIATION', evidence: 'Prepare a remediation' },
        repository: workloadRepository,
        base_branch: 'main',
        suspect: { kind: 'commit', commit_sha: workloadRevision },
        target_file: workloadFile,
      },
    });

    const card = buildInterpretedRequestCard(compilation, {
      pack_id: 'k8s-workload-security-v1',
      pack_version: '1.0.0',
      capability_ceiling: 'ANALYSIS_ONLY',
    });

    expect(card.pack).toEqual({
      pack_id: 'k8s-workload-security-v1',
      pack_version: '1.0.0',
    });
    expect(card.capability_ceiling).toBe('ANALYSIS_ONLY');
    expect(card.will_not).toContain(
      'create a sandbox, proposal, approval request, or GitHub write',
    );
    const openui = renderInterpretedRequestCardOpenUi(card);
    expect(openui).toContain('k8s-workload-security-v1@1.0.0');
    expect(openui).toContain('Capability: ANALYSIS_ONLY');
    expect(openui).not.toMatch(/Capability: REMEDIATION_PROVEN|Capability: OPEN_PR_ELIGIBLE/u);

    expect(() =>
      buildInterpretedRequestCard(compilation, {
        pack_id: 'k8s-workload-security-v1',
        pack_version: '1.0.0',
        capability_ceiling: 'OPEN_PR_ELIGIBLE',
      }),
    ).toThrow(/registered pack capability/u);
    expect(() =>
      buildInterpretedRequestCard(compilation, {
        pack_id: 'arbitrary-pack',
        pack_version: '9.9.9',
        capability_ceiling: 'ANALYSIS_ONLY',
      }),
    ).toThrow(/registered pack capability/u);
  });
});

describe('Phase 11 egress Incident Brief', () => {
  it('binds request, receipt, proposal, pack, and target identity in a decision-first brief', () => {
    const request = {
      mode: 'OPEN_PR' as const,
      scope: {
        schema_version: 1 as const,
        repository,
        base_branch: 'main',
        suspect: { kind: 'commit' as const, commit_sha: revision },
        target_file: targetFile,
      },
    };
    const journey = runCurrentFixtureJourney(request, buildCurrentFixtureJourneyContext(request));
    if (journey.presentation === null) throw new Error('Expected the egress presentation.');
    const { proposal } = buildPhaseSixControllingArtifacts();

    const brief = buildGuardianIncidentBrief({
      request,
      receipt: journey.receipt,
      presentation: journey.presentation,
      proposal,
    });

    expect(brief.identity.request.request_id).toMatch(/^guardian-request:sha256:[0-9a-f]{64}$/u);
    expect(brief.identity.request.request_sha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(brief.identity).toEqual({
      request: {
        request_id: brief.identity.request.request_id,
        request_sha256: brief.identity.request.request_sha256,
      },
      receipt: { receipt_id: journey.receipt.receipt_id },
      proposal: {
        proposal_id: proposal.proposal_id,
        proposal_hash_sha256: proposal.proposal_hash_sha256,
        verifier_pack_binding_sha256: proposal.verifier_pack_binding_sha256,
      },
      pack: {
        pack_id: 'k8s-network-egress-v1',
        pack_version: '1.0.4',
        capability: 'OPEN_PR_ELIGIBLE',
      },
      target: {
        repository,
        base_branch: 'main',
        revision,
        file: targetFile,
      },
    });
    expect(brief.evidence_completeness).toBe('COMPLETE');
    expect(Object.keys(brief.decision)).toEqual([
      'finding',
      'key_reason',
      'guardian_did',
      'next_action',
    ]);
    expect(incidentBriefDecisionWordCount(brief)).toBeLessThanOrEqual(120);
    expect(brief.disclosures.verification).not.toBeNull();
    expect(brief.disclosures.proposed_change).toMatchObject({
      proposal_id: proposal.proposal_id,
      proposal_hash_sha256: proposal.proposal_hash_sha256,
      exact_diff: proposal.canonical_diff,
    });

    const artifacts = buildIncidentBriefArtifacts({
      brief,
      receipt: journey.receipt,
      proposal,
    });
    expect(artifacts.markdown.file_name).toBe('guardian-incident-brief.md');
    expect(artifacts.receipt_json.file_name).toBe('guardian-run-receipt.json');
    expect(artifacts.verified_change?.file_name).toBe('guardian-verified-change.json');
    for (const identity of [
      brief.identity.request.request_id,
      brief.identity.receipt.receipt_id,
      proposal.proposal_id,
      proposal.proposal_hash_sha256,
      proposal.verifier_pack_binding_sha256,
    ]) {
      expect(artifacts.markdown.content).toContain(identity);
      expect(artifacts.receipt_json.content).toContain(identity);
      expect(artifacts.verified_change?.content).toContain(identity);
    }
    const verifiedChange = JSON.parse(artifacts.verified_change?.content ?? '{}') as {
      candidate_yaml?: string;
      exact_diff?: string;
    };
    expect(verifiedChange.candidate_yaml).toBe(proposal.canonical_candidate_yaml);
    expect(verifiedChange.exact_diff).toBe(proposal.canonical_diff);
    expect(buildIncidentBriefArtifacts({ brief, receipt: journey.receipt, proposal })).toEqual(
      artifacts,
    );

    const openui = renderGuardianIncidentBriefOpenUi(brief);
    const findingIndex = openui.indexOf('"Finding"');
    const reasonIndex = openui.indexOf('"Key reason"');
    const didIndex = openui.indexOf('"What Guardian did"');
    const nextIndex = openui.indexOf('"Next action"');
    expect(findingIndex).toBeGreaterThan(0);
    expect(findingIndex).toBeLessThan(reasonIndex);
    expect(reasonIndex).toBeLessThan(didIndex);
    expect(didIndex).toBeLessThan(nextIndex);
    expect(openui).toContain('Tag("Status: PR reused"');
    expect(openui).toContain('Tag("Severity: High"');
    expect(openui).toContain('Tag("Evidence: Complete"');
    for (const accessibleName of [
      `Repository: ${repository}`,
      `Revision: ${revision}`,
      'Pack: k8s-network-egress-v1@1.0.4',
      'Status: PR reused',
      'Severity: High',
      'Evidence: Complete',
    ]) {
      expect(openui).toContain(`Tag(${JSON.stringify(accessibleName)}`);
    }
    expect(openui).toContain('Callout("warning", "Finding"');
    expect(openui).toContain('Callout("warning", "Key reason"');
    expect(openui).toContain('Callout("success", "What Guardian did"');
    expect(openui).toContain('Callout("warning", "Next action"');
    expect(openui).toContain('TabItem("causal-chain", "Causal chain"');
    expect(openui).toContain('TabItem("verification", "Verification"');
    expect(openui).toContain('TabItem("proposed-change", "Proposed change"');
    expect(openui).toContain('TabItem("receipt", "Run receipt"');
    expect(openui).toContain('Review pull request #1');
    expect(openui).not.toContain('Button(');
    expect(openui).not.toContain('Journey Trace & Execution Log');
    expect(openui).not.toContain('change-security-investigator');
    for (const identity of [
      brief.identity.request.request_id,
      brief.identity.receipt.receipt_id,
      proposal.proposal_id,
      proposal.proposal_hash_sha256,
      proposal.verifier_pack_binding_sha256,
    ]) {
      expect(openui).toContain(identity);
    }
  });

  it('answers the four decision questions for every egress terminal scenario', () => {
    const matrix = buildPhaseElevenIncidentBriefMatrix();
    expect(matrix.map((item) => item.scenario)).toEqual([
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
    for (const item of matrix) {
      expect(Object.keys(item.brief.decision)).toEqual([
        'finding',
        'key_reason',
        'guardian_did',
        'next_action',
      ]);
      expect(incidentBriefDecisionWordCount(item.brief)).toBeLessThanOrEqual(120);
      const openui = renderGuardianIncidentBriefOpenUi(item.brief);
      expect(openui).toContain('TabItem("evidence", "Evidence"');
      expect(openui).toContain('TabItem("causal-chain", "Causal chain"');
      expect(openui).toContain('TabItem("limitations", "Limitations"');
      expect(openui).toContain('TabItem("receipt", "Run receipt"');
      expect(openui).not.toContain('Journey Trace & Execution Log');
      expect(openui).not.toContain('Button(');
      if (item.brief.disclosures.verification === null) {
        expect(openui).not.toContain('TabItem("verification"');
      } else {
        expect(openui).toContain('TabItem("verification", "Verification"');
      }
      if (item.brief.disclosures.proposed_change === null) {
        expect(openui).not.toContain('TabItem("proposed-change"');
      } else {
        expect(openui).toContain('TabItem("proposed-change", "Proposed change"');
      }
      const expectedStatusVariant = {
        SECURITY_REMEDIATION_READY: 'warning',
        DENIED: 'danger',
        PR_CREATED: 'success',
        PR_REUSED: 'success',
        INCONCLUSIVE: 'warning',
        WRITE_CONFLICT: 'danger',
        NO_SAFE_REMEDIATION: 'danger',
      }[item.brief.terminal_status];
      expect(openui).toMatch(
        new RegExp(`statusTag = Tag\\([^\\n]+, "${expectedStatusVariant}"\\)`, 'u'),
      );
    }
  });

  it('fails closed when receipt, proposal, or target identity drifts between representations', () => {
    const ready = buildPhaseElevenIncidentBriefMatrix()[0];
    if (ready === undefined) throw new Error('Expected remediation-ready matrix entry.');
    const { proposal } = buildPhaseSixControllingArtifacts();

    expect(() =>
      buildIncidentBriefArtifacts({
        brief: {
          ...ready.brief,
          identity: {
            ...ready.brief.identity,
            target: { ...ready.brief.identity.target, file: 'k8s/other.yaml' },
          },
        },
        receipt: ready.receipt,
        proposal,
      }),
    ).toThrow(/identity does not match its run receipt/u);

    expect(() =>
      buildIncidentBriefArtifacts({
        brief: {
          ...ready.brief,
          identity: {
            ...ready.brief.identity,
            target: { ...ready.brief.identity.target, revision: '0'.repeat(40) },
          },
        },
        receipt: ready.receipt,
        proposal,
      }),
    ).toThrow(/identity does not match its run receipt/u);

    expect(() =>
      buildIncidentBriefArtifacts({
        brief: ready.brief,
        receipt: ready.receipt,
        proposal: { ...proposal, canonical_diff: `${proposal.canonical_diff}# drift` },
      }),
    ).toThrow(/hash, diff, or target mismatch/u);

    expect(() =>
      buildIncidentBriefArtifacts({
        brief: ready.brief,
        receipt: ready.receipt,
        proposal: {
          ...proposal,
          canonical_candidate_yaml: `${proposal.canonical_candidate_yaml}\n# forged candidate`,
        },
      }),
    ).toThrow(/proposal content or verifier binding/u);

    expect(() =>
      buildIncidentBriefArtifacts({
        brief: ready.brief,
        receipt: {
          ...ready.receipt,
          request_identity: {
            request_id: `guardian-request:sha256:${'0'.repeat(64)}`,
            request_sha256: '0'.repeat(64),
          },
        },
        proposal,
      }),
    ).toThrow(/receipt ID|request identity|run receipt/iu);
  });
});

describe('Phase 11 workload Incident Brief', () => {
  it('keeps analysis-only findings decision-first and omits every higher-capability control', () => {
    const workloadRepository = 'jayesh9747/guardian-demo-privileged-api';
    const workloadRevision = '2c7bdb3e07714e08d9504b3504587fbf18847f29';
    const workloadFile = 'k8s/api-deployment.yaml';
    const content = readFileSync(
      new URL('../../investigation/fixtures/workload/privileged-deployment.yaml', import.meta.url),
      'utf8',
    );
    const contentLines = (content.endsWith('\n') ? content.slice(0, -1) : content).split('\n');
    const patch = `@@ -0,0 +1,${String(contentLines.length)} @@\n${contentLines
      .map((line) => `+${line}`)
      .join('\n')}`;
    const analysis = FINDING_PACK_REGISTRY.analyze({
      requested_capability: 'ANALYSIS_ONLY',
      changed_files: [
        {
          repository: workloadRepository,
          revision: workloadRevision,
          file: workloadFile,
          patch,
          patch_sha256: createHash('sha256').update(patch).digest('hex'),
          content,
          git_blob_sha: 'b1a60bb96fad7f93bc95536d08381e5629a6a7bd',
          evidence_references: [
            {
              evidence_id: 'evidence:github:diff:privileged-api',
              source_ref: `github:${workloadRepository}:commit:${workloadRevision}:file:${workloadFile}:patch`,
            },
            {
              evidence_id: 'evidence:github:manifest:privileged-api',
              source_ref:
                'github:jayesh9747/guardian-demo-privileged-api:blob:b1a60bb96fad7f93bc95536d08381e5629a6a7bd',
            },
          ],
        },
      ],
    });
    if (analysis.outcome !== 'ANALYZED') throw new Error('Expected workload analysis.');
    const request = {
      mode: 'ANALYSIS_ONLY' as const,
      scope: {
        schema_version: 1 as const,
        repository: workloadRepository,
        base_branch: 'main',
        suspect: { kind: 'commit' as const, commit_sha: workloadRevision },
        target_file: workloadFile,
      },
    };

    const brief = buildFindingPackIncidentBrief({ request, analysis });

    expect(brief.identity.pack).toEqual({
      pack_id: 'k8s-workload-security-v1',
      pack_version: '1.0.0',
      capability: 'ANALYSIS_ONLY',
    });
    expect(brief.identity.proposal).toBeNull();
    expect(brief.disclosures.verification).toBeNull();
    expect(brief.disclosures.proposed_change).toBeNull();
    expect(brief.controls).toEqual([]);
    expect(brief.decision.finding).toContain('deterministic workload-security findings');
    expect(brief.disclosures.evidence).toEqual([
      'evidence:github:diff:privileged-api',
      'evidence:github:manifest:privileged-api',
    ]);
    expect(JSON.stringify(brief.disclosures.run_receipt)).toContain('ANALYSIS_ONLY');
    expect(
      JSON.stringify({
        decision: brief.decision,
        verification: brief.disclosures.verification,
        proposed_change: brief.disclosures.proposed_change,
        controls: brief.controls,
      }),
    ).not.toMatch(/Daytona|sandbox|approval|Open PR/u);
    expect(incidentBriefDecisionWordCount(brief)).toBeLessThanOrEqual(120);

    const artifacts = buildIncidentBriefArtifacts({
      brief,
      receipt: brief.disclosures.run_receipt,
      proposal: null,
    });
    expect(artifacts.verified_change).toBeNull();
    expect(artifacts.receipt_json.content).toContain(brief.identity.request.request_id);
    expect(artifacts.markdown.content).toContain(brief.identity.receipt.receipt_id);
    expect(artifacts.markdown.content.indexOf('## Evidence')).toBeLessThan(
      artifacts.markdown.content.indexOf('## Causal chain'),
    );
    expect(artifacts.markdown.content).not.toContain('## Verification');
    expect(artifacts.markdown.content).not.toContain('## Proposed change');

    const openui = renderGuardianIncidentBriefOpenUi(brief);
    expect(openui).toContain('Tag("Status: Findings"');
    expect(openui).toContain('Tag("Pack: k8s-workload-security-v1@1.0.0"');
    expect(openui).toContain('TabItem("evidence", "Evidence"');
    expect(openui).toContain('TabItem("causal-chain", "Causal chain"');
    expect(openui).toContain('TabItem("limitations", "Limitations"');
    expect(openui).toContain('TabItem("receipt", "Run receipt"');
    expect(openui).not.toContain('TabItem("verification"');
    expect(openui).not.toContain('TabItem("proposed-change"');
    expect(openui).not.toContain('Button(');
    expect(openui).not.toContain('Prepare remediation');
    expect(openui).not.toContain('Open PR');
  });

  it('renders the benign workload terminal state with all four decisions and no higher tabs', () => {
    const workloadRepository = 'jayesh9747/guardian-demo-privileged-api';
    const workloadRevision = 'd2ee0cdc4e27cc8af671f4c0de15081d1c996e36';
    const workloadFile = 'k8s/api-deployment.yaml';
    const content = readFileSync(
      new URL('../../investigation/fixtures/workload/benign-deployment.yaml', import.meta.url),
      'utf8',
    );
    const contentLines = (content.endsWith('\n') ? content.slice(0, -1) : content).split('\n');
    const patch = `@@ -0,0 +1,${String(contentLines.length)} @@\n${contentLines
      .map((line) => `+${line}`)
      .join('\n')}`;
    const analysis = FINDING_PACK_REGISTRY.analyze({
      requested_capability: 'ANALYSIS_ONLY',
      changed_files: [
        {
          repository: workloadRepository,
          revision: workloadRevision,
          file: workloadFile,
          patch,
          patch_sha256: createHash('sha256').update(patch).digest('hex'),
          content,
          git_blob_sha: '3e8b0f62ef1ba0553b1b4b310444f9a207b9fc9a',
          evidence_references: [
            {
              evidence_id: 'evidence:github:diff:benign-api',
              source_ref: `github:${workloadRepository}:commit:${workloadRevision}:file:${workloadFile}:patch`,
            },
            {
              evidence_id: 'evidence:github:manifest:benign-api',
              source_ref: `github:${workloadRepository}:blob:3e8b0f62ef1ba0553b1b4b310444f9a207b9fc9a`,
            },
          ],
        },
      ],
    });
    if (analysis.outcome !== 'ANALYZED') throw new Error('Expected benign workload analysis.');

    const brief = buildFindingPackIncidentBrief({
      request: {
        mode: 'ANALYSIS_ONLY',
        scope: {
          schema_version: 1,
          repository: workloadRepository,
          base_branch: 'main',
          suspect: { kind: 'commit', commit_sha: workloadRevision },
          target_file: workloadFile,
        },
      },
      analysis,
    });

    expect(brief.terminal_status).toBe('NO_DETERMINISTIC_FINDING');
    expect(brief.severity).toBe('None');
    expect(Object.values(brief.decision).every((answer) => answer.length > 0)).toBe(true);
    expect(incidentBriefDecisionWordCount(brief)).toBeLessThanOrEqual(120);
    expect(brief.disclosures.verification).toBeNull();
    expect(brief.disclosures.proposed_change).toBeNull();
    expect(brief.controls).toEqual([]);
    const openui = renderGuardianIncidentBriefOpenUi(brief);
    expect(openui).toContain('Status: No Deterministic Finding');
    expect(openui).not.toContain('TabItem("verification"');
    expect(openui).not.toContain('TabItem("proposed-change"');
    expect(openui).not.toContain('Button(');
  });
});
