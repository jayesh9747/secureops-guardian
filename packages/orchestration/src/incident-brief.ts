import {
  guardianIncidentBriefSchema,
  guardianPresentationSchema,
  incidentBriefDecisionWordCount,
  type GuardianPresentation,
} from '@guardian/presentation';
import type { FindingPackAnalysis, FindingPackInconclusive } from '@guardian/investigation';
import { canonicalJson, type EligibleProposal } from '@guardian/policy-verifier';

import { computeGuardianRequestSha256 } from './intent.js';
import { guardianRunReceiptSchema, type GuardianRunReceipt } from './receipt.js';
import { buildGuardianRunReceipt } from './receipt.js';
import { parseGuardianRequest, type GuardianRequest } from './scope.js';

export { incidentBriefDecisionWordCount } from '@guardian/presentation';

function egressDecision(status: GuardianRunReceipt['terminal_status'], keyReason: string) {
  const decisions: Partial<
    Record<
      GuardianRunReceipt['terminal_status'],
      { finding: string; guardian_did: string; next_action: string }
    >
  > = {
    ANALYSIS_COMPLETE: {
      finding: 'Repository analysis completed without making a live-runtime claim.',
      guardian_did:
        'Guardian inspected only the requested GitHub evidence and stopped at the analysis ceiling.',
      next_action:
        'Review the cited repository evidence or start a separately confirmed remediation request.',
    },
    SECURITY_REMEDIATION_READY: {
      finding:
        'A High-severity unrestricted-egress regression has a verified least-privilege remediation.',
      guardian_did: 'Guardian verified the four policy states and prepared the exact proposal.',
      next_action: 'Review the exact change; any GitHub write still requires separate approval.',
    },
    DENIED: {
      finding:
        'The High-severity unrestricted-egress regression remains; the exact remediation was denied.',
      guardian_did: 'Guardian verified the remediation and stopped without changing GitHub.',
      next_action: 'Revise the proposal or leave the repository unchanged.',
    },
    PR_CREATED: {
      finding:
        'The High-severity unrestricted-egress regression has an approved remediation pull request.',
      guardian_did:
        'Guardian verified the exact change and created the separately approved pull request.',
      next_action: 'Review the pull request; Guardian will not merge or deploy it.',
    },
    PR_REUSED: {
      finding:
        'The High-severity unrestricted-egress regression already has the exact verified remediation pull request.',
      guardian_did:
        'Guardian revalidated the proposal and reused the matching pull request without a write.',
      next_action: 'Review the pull request; Guardian will not merge or deploy it.',
    },
    INCONCLUSIVE: {
      finding:
        'The investigation is inconclusive because required evidence is incomplete or conflicting.',
      guardian_did: 'Guardian stopped before verification, proposal, approval, or write.',
      next_action: 'Resolve the missing or conflicting evidence, then start a new run.',
    },
    WRITE_CONFLICT: {
      finding:
        'The High-severity regression has a verified proposal, but remote remediation state conflicts.',
      guardian_did: 'Guardian detected remote drift and stopped without overwriting GitHub.',
      next_action: 'Review the remote change and start a new run against the updated revision.',
    },
    NO_SAFE_REMEDIATION: {
      finding:
        'No tested remediation preserved both the security invariant and checkout availability.',
      guardian_did:
        'Guardian stopped after the bounded two-attempt verifier found no safe candidate.',
      next_action:
        'Escalate for manual remediation design; Guardian will not propose an unsafe change.',
    },
  };
  const decision = decisions[status];
  if (decision === undefined) throw new Error(`Unsupported Incident Brief status: ${status}.`);
  return {
    finding: decision.finding,
    key_reason: keyReason,
    guardian_did: decision.guardian_did,
    next_action: decision.next_action,
  };
}

export function buildGuardianIncidentBrief(input: {
  request: GuardianRequest;
  receipt: GuardianRunReceipt;
  presentation: GuardianPresentation | null;
  proposal: EligibleProposal | null;
}) {
  const request = parseGuardianRequest(input.request);
  const receipt = guardianRunReceiptSchema.parse(input.receipt);
  const presentation =
    input.presentation === null ? null : guardianPresentationSchema.parse(input.presentation);
  if (
    receipt.mode !== request.mode ||
    canonicalJson(receipt.scope) !== canonicalJson(request.scope)
  ) {
    throw new Error('Incident Brief rejected a receipt for a different request scope.');
  }
  if (presentation !== null && receipt.terminal_status !== presentation.terminal_status) {
    throw new Error('Incident Brief terminal status does not match its receipt.');
  }
  const proposal = input.proposal;
  if ((proposal === null) !== (receipt.proposal_hash_sha256 === null)) {
    throw new Error('Incident Brief proposal presence does not match its run receipt.');
  }
  const expectedRevision =
    request.scope.suspect.kind === 'commit'
      ? request.scope.suspect.commit_sha
      : request.scope.suspect.head_sha;
  const displayRevision =
    request.scope.suspect.kind === 'commit'
      ? request.scope.suspect.commit_sha
      : `${request.scope.suspect.base_sha}...${request.scope.suspect.head_sha}`;
  const findingPack = receipt.finding_pack;
  if (findingPack === undefined) {
    throw new Error('Incident Brief requires the selected finding-pack identity in its receipt.');
  }
  if (proposal !== null) {
    if (
      receipt.proposal_id !== proposal.proposal_id ||
      receipt.proposal_hash_sha256 !== proposal.proposal_hash_sha256 ||
      receipt.verifier_pack_binding_sha256 !== proposal.verifier_pack_binding_sha256 ||
      (presentation?.proposal.state === 'EXACT' &&
        (presentation.proposal.proposal_id !== proposal.proposal_id ||
          presentation.proposal.proposal_hash_sha256 !== proposal.proposal_hash_sha256 ||
          presentation.proposal.verifier_pack_binding_sha256 !==
            proposal.verifier_pack_binding_sha256 ||
          presentation.proposal.exact_patch !== proposal.canonical_diff)) ||
      proposal.target.repository !== request.scope.repository ||
      proposal.target.base_branch !== request.scope.base_branch ||
      proposal.target.suspect_commit_sha !== expectedRevision ||
      proposal.target.file !== request.scope.target_file
    ) {
      throw new Error('Incident Brief proposal, receipt, or target identity mismatch.');
    }
  } else if (presentation?.proposal.state === 'EXACT') {
    throw new Error('Incident Brief cannot display a proposal absent from its receipt.');
  }
  const requestSha256 = computeGuardianRequestSha256(request);
  const githubResult = presentation?.action.github_result;
  const controls =
    githubResult?.state === 'PR_CREATED' || githubResult?.state === 'PR_REUSED'
      ? [
          {
            kind: 'REVIEW_PULL_REQUEST' as const,
            label: `Review pull request #${String(githubResult.pr_number)}`,
            href: githubResult.pr_url,
          },
        ]
      : [];
  const knownCause =
    presentation?.finding.causal_commit.state === 'KNOWN' &&
    presentation.finding.changed_file.state === 'KNOWN' &&
    presentation.finding.exposure_path.state === 'KNOWN'
      ? `${presentation.finding.causal_commit.value} changed ${presentation.finding.changed_file.value}, enabling ${presentation.finding.exposure_path.value}.`
      : receipt.terminal_status === 'INCONCLUSIVE'
        ? receipt.missing_or_unsupported_requirements.join(' ')
        : receipt.terminal_status === 'ANALYSIS_COMPLETE'
          ? `Revision ${expectedRevision} was inspected from GitHub; ANALYSIS_ONLY has no deployment or runtime evidence.`
          : `Revision ${expectedRevision} changed ${request.scope.target_file ?? 'the selected target'}; the exact candidate passed the static four-state proof.`;
  const verification =
    receipt.stages.daytona_proof !== 'COMPLETED'
      ? null
      : presentation?.verifier.state !== undefined && presentation.verifier.state !== 'NOT_RUN'
        ? presentation.verifier
        : (proposal?.four_state_verifier_result ?? null);
  const evidence =
    presentation === null
      ? receipt.evidence_ids
      : [
          ...presentation.evidence.official_github_mcp,
          ...presentation.evidence.incident_fixture_mcp,
          ...presentation.evidence.deterministic_rule,
        ];
  const targetFile = request.scope.target_file ?? null;
  const brief = guardianIncidentBriefSchema.parse({
    schema_version: 1,
    identity: {
      request: {
        request_id: `guardian-request:sha256:${requestSha256}`,
        request_sha256: requestSha256,
      },
      receipt: { receipt_id: receipt.receipt_id },
      proposal:
        proposal === null
          ? null
          : {
              proposal_id: proposal.proposal_id,
              proposal_hash_sha256: proposal.proposal_hash_sha256,
              verifier_pack_binding_sha256: proposal.verifier_pack_binding_sha256,
            },
      pack: {
        pack_id: findingPack.pack_id,
        pack_version: findingPack.pack_version,
        capability: findingPack.capability,
      },
      target: {
        repository: request.scope.repository,
        base_branch: request.scope.base_branch,
        revision: displayRevision,
        file: targetFile,
      },
    },
    terminal_status: receipt.terminal_status,
    severity: presentation?.severity ?? 'Unknown',
    evidence_completeness:
      receipt.terminal_status === 'INCONCLUSIVE'
        ? 'INCONCLUSIVE'
        : receipt.terminal_status === 'ANALYSIS_COMPLETE'
          ? 'PARTIAL'
          : 'COMPLETE',
    decision: egressDecision(receipt.terminal_status, knownCause),
    disclosures: {
      evidence,
      causal_chain: [
        `Revision ${displayRevision} scoped the investigation to ${targetFile ?? 'the exact changed files'}.`,
        knownCause,
        receipt.stages.daytona_proof === 'COMPLETED'
          ? 'The static verifier evaluated the bounded candidate; it did not contact Kubernetes.'
          : 'Guardian stopped at the current capability or evidence boundary.',
      ],
      verification,
      proposed_change:
        proposal === null
          ? null
          : {
              proposal_id: proposal.proposal_id,
              proposal_hash_sha256: proposal.proposal_hash_sha256,
              verifier_pack_binding_sha256: proposal.verifier_pack_binding_sha256,
              exact_diff: proposal.canonical_diff,
            },
      limitations: presentation?.limitations ?? receipt.limitations,
      run_receipt: structuredClone(receipt),
    },
    controls,
  });
  if (incidentBriefDecisionWordCount(brief) > 120) {
    throw new Error('Incident Brief decision summary exceeds 120 words.');
  }
  return brief;
}

export function buildFindingPackIncidentBrief(input: {
  request: GuardianRequest;
  analysis: FindingPackAnalysis;
}) {
  const request = parseGuardianRequest(input.request);
  const analysis = input.analysis;
  const expectedRevision =
    request.scope.suspect.kind === 'commit'
      ? request.scope.suspect.commit_sha
      : request.scope.suspect.head_sha;
  if (
    request.mode !== 'ANALYSIS_ONLY' ||
    analysis.capability !== 'ANALYSIS_ONLY' ||
    analysis.repository !== request.scope.repository ||
    analysis.revision !== expectedRevision ||
    analysis.file !== request.scope.target_file
  ) {
    throw new Error('FindingPack Incident Brief rejected mismatched analysis-only scope.');
  }
  const evidenceIds = analysis.evidence_references.map((reference) => reference.evidence_id);
  const receipt = buildGuardianRunReceipt({
    schema_version: 1,
    execution_basis: 'DETERMINISTIC_INTEGRATION',
    mode: request.mode,
    terminal_status: 'ANALYSIS_COMPLETE',
    scope: request.scope,
    stages: {
      scope_preflight: 'COMPLETED',
      github_investigation: 'COMPLETED',
      incident_evidence_join: 'NOT_RUN',
      deterministic_rule: 'COMPLETED',
      daytona_proof: 'NOT_PERMITTED',
      proposal: 'ABSENT',
      github_action: 'NOT_PERMITTED',
      presentation: 'OPENUI_WITH_MARKDOWN_FALLBACK',
    },
    evidence_ids: evidenceIds,
    tool_event_references: analysis.evidence_references.map(
      (reference) =>
        `deterministic:tool:${reference.evidence_id.includes(':manifest:') ? 'get_file_contents' : 'get_commit'}:${reference.evidence_id}`,
    ),
    approval_event_references: [],
    missing_or_unsupported_requirements: [],
    proposal_id: null,
    proposal_hash_sha256: null,
    finding_pack: {
      pack_id: analysis.pack.pack_id,
      pack_version: analysis.pack.pack_version,
      capability: analysis.capability,
    },
    verifier_pack: null,
    verifier_pack_binding_sha256: null,
    action_receipt: null,
    runtime_claims: {
      deployment: 'Unknown',
      runtime_exposure: 'Unknown',
      data_access: 'Unknown',
      exfiltration: 'Unknown',
      live_cluster_behavior: 'Unknown',
    },
    limitations: [...analysis.limitations, 'ANALYSIS_ONLY did not create or use a sandbox.'],
    guardian_did_not_merge_deploy_or_access_cluster: true,
  });
  const findingCount = analysis.findings.length;
  const firstFinding = analysis.findings[0];
  const requestSha256 = computeGuardianRequestSha256(request);
  const brief = guardianIncidentBriefSchema.parse({
    schema_version: 1,
    identity: {
      request: {
        request_id: `guardian-request:sha256:${requestSha256}`,
        request_sha256: requestSha256,
      },
      receipt: { receipt_id: receipt.receipt_id },
      proposal: null,
      pack: {
        pack_id: analysis.pack.pack_id,
        pack_version: analysis.pack.pack_version,
        capability: analysis.capability,
      },
      target: {
        repository: request.scope.repository,
        base_branch: request.scope.base_branch,
        revision: expectedRevision,
        file: analysis.file,
      },
    },
    terminal_status: findingCount === 0 ? 'NO_DETERMINISTIC_FINDING' : 'FINDINGS',
    severity: analysis.severity,
    evidence_completeness: 'COMPLETE',
    decision: {
      finding:
        findingCount === 0
          ? 'No deterministic workload-security finding was present in the supported repository evidence.'
          : `${String(findingCount)} deterministic workload-security findings require review.`,
      key_reason:
        firstFinding === undefined
          ? `The supported ${analysis.object_identity.kind} fields satisfy the bounded rules.`
          : `${firstFinding.rule_id} cites ${firstFinding.json_path}: ${firstFinding.summary}`,
      guardian_did:
        'Guardian evaluated the exact GitHub patch and blob with the analysis-only workload pack.',
      next_action:
        'Review the cited repository evidence; this pack has no remediation or GitHub-write route.',
    },
    disclosures: {
      evidence: evidenceIds,
      causal_chain: [
        `Revision ${expectedRevision} changed ${analysis.file}.`,
        `${analysis.pack.pack_id}@${analysis.pack.pack_version} evaluated only supported manifest fields.`,
        'The findings describe repository state; deployment and live-cluster behavior remain Unknown.',
      ],
      verification: null,
      proposed_change: null,
      limitations: analysis.limitations,
      run_receipt: structuredClone(receipt),
    },
    controls: [],
  });
  if (incidentBriefDecisionWordCount(brief) > 120) {
    throw new Error('Incident Brief decision summary exceeds 120 words.');
  }
  return brief;
}

export function buildFindingPackInconclusiveIncidentBrief(input: {
  request: GuardianRequest;
  analysis: FindingPackInconclusive;
}) {
  const request = parseGuardianRequest(input.request);
  const analysis = input.analysis;
  const revision =
    request.scope.suspect.kind === 'commit'
      ? request.scope.suspect.commit_sha
      : `${request.scope.suspect.base_sha}...${request.scope.suspect.head_sha}`;
  const requestSha256 = computeGuardianRequestSha256(request);
  const findingPack = {
    pack_id: 'no-selected-pack',
    pack_version: 'not-applicable',
    capability: 'ANALYSIS_ONLY' as const,
  };
  const receipt = buildGuardianRunReceipt({
    schema_version: 1,
    execution_basis: 'DETERMINISTIC_INTEGRATION',
    mode: request.mode,
    terminal_status: 'INCONCLUSIVE',
    scope: request.scope,
    stages: {
      scope_preflight: 'INCONCLUSIVE',
      github_investigation: 'COMPLETED',
      incident_evidence_join: 'NOT_RUN',
      deterministic_rule: 'NOT_RUN',
      daytona_proof: request.mode === 'ANALYSIS_ONLY' ? 'NOT_PERMITTED' : 'NOT_RUN',
      proposal: 'ABSENT',
      github_action: 'NOT_REACHED',
      presentation: 'OPENUI_WITH_MARKDOWN_FALLBACK',
    },
    evidence_ids: [],
    tool_event_references: [],
    approval_event_references: [],
    missing_or_unsupported_requirements: [...analysis.missing_or_unsupported_requirements],
    proposal_id: null,
    proposal_hash_sha256: null,
    finding_pack: findingPack,
    verifier_pack: null,
    verifier_pack_binding_sha256: null,
    action_receipt: null,
    runtime_claims: {
      deployment: 'Unknown',
      runtime_exposure: 'Unknown',
      data_access: 'Unknown',
      exfiltration: 'Unknown',
      live_cluster_behavior: 'Unknown',
    },
    limitations: [
      'No supported finding pack accepted one exact changed file at the requested capability.',
      'No sandbox, proposal, approval, GitHub write, deployment, or cluster access occurred.',
    ],
    guardian_did_not_merge_deploy_or_access_cluster: true,
  });
  const reason = analysis.missing_or_unsupported_requirements.join(' ');
  const brief = guardianIncidentBriefSchema.parse({
    schema_version: 1,
    identity: {
      request: {
        request_id: `guardian-request:sha256:${requestSha256}`,
        request_sha256: requestSha256,
      },
      receipt: { receipt_id: receipt.receipt_id },
      proposal: null,
      pack: findingPack,
      target: {
        repository: request.scope.repository,
        base_branch: request.scope.base_branch,
        revision,
        file: request.scope.target_file ?? null,
      },
    },
    terminal_status: 'INCONCLUSIVE',
    severity: 'Unknown',
    evidence_completeness: 'INCONCLUSIVE',
    decision: {
      finding: 'The finding-pack analysis is inconclusive.',
      key_reason: reason,
      guardian_did:
        'Guardian stopped at the exact-evidence or capability boundary without selecting a pack.',
      next_action: 'Provide one supported exact target and request no more than its capability.',
    },
    disclosures: {
      evidence: analysis.missing_or_unsupported_requirements,
      causal_chain: [
        `Revision ${revision} and ${request.scope.target_file ?? 'the supplied changed files'} scoped the request.`,
        reason,
        'The registry failed closed before deterministic rules or any higher-capability route.',
      ],
      verification: null,
      proposed_change: null,
      limitations: receipt.limitations,
      run_receipt: structuredClone(receipt),
    },
    controls: [],
  });
  if (incidentBriefDecisionWordCount(brief) > 120) {
    throw new Error('Incident Brief decision summary exceeds 120 words.');
  }
  return brief;
}
