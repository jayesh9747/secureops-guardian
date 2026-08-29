import { z } from 'zod';

const sha256Schema = z.string().regex(/^[0-9a-f]{64}$/u);
const requestIdentitySchema = z
  .object({
    request_id: z.string().regex(/^guardian-request:sha256:[0-9a-f]{64}$/u),
    request_sha256: sha256Schema,
  })
  .strict();

const proposalIdentitySchema = z
  .object({
    proposal_id: z.string().regex(/^proposal:sha256:[0-9a-f]{64}$/u),
    proposal_hash_sha256: sha256Schema,
    verifier_pack_binding_sha256: sha256Schema,
  })
  .strict();

export const guardianIncidentBriefSchema = z
  .object({
    schema_version: z.literal(1),
    identity: z
      .object({
        request: requestIdentitySchema,
        receipt: z
          .object({ receipt_id: z.string().regex(/^guardian-run:sha256:[0-9a-f]{64}$/u) })
          .strict(),
        proposal: proposalIdentitySchema.nullable(),
        pack: z
          .object({
            pack_id: z.string().min(1),
            pack_version: z.string().min(1),
            capability: z.enum(['ANALYSIS_ONLY', 'REMEDIATION_PROVEN', 'OPEN_PR_ELIGIBLE']),
          })
          .strict(),
        target: z
          .object({
            repository: z.string().min(1),
            base_branch: z.string().min(1),
            revision: z.string().min(1),
            file: z.string().min(1).nullable(),
          })
          .strict(),
      })
      .strict(),
    terminal_status: z.string().min(1),
    severity: z.enum(['High', 'None', 'Unknown']),
    evidence_completeness: z.enum(['COMPLETE', 'PARTIAL', 'INCONCLUSIVE']),
    decision: z
      .object({
        finding: z.string().min(1),
        key_reason: z.string().min(1),
        guardian_did: z.string().min(1),
        next_action: z.string().min(1),
      })
      .strict(),
    disclosures: z
      .object({
        evidence: z.array(z.string().min(1)).min(1),
        causal_chain: z.array(z.string().min(1)).min(1),
        verification: z.unknown().nullable(),
        proposed_change: z
          .object({
            proposal_id: z.string().regex(/^proposal:sha256:[0-9a-f]{64}$/u),
            proposal_hash_sha256: sha256Schema,
            verifier_pack_binding_sha256: sha256Schema,
            exact_diff: z.string().min(1),
          })
          .strict()
          .nullable(),
        limitations: z.array(z.string().min(1)).min(1),
        run_receipt: z.record(z.string(), z.unknown()),
      })
      .strict(),
    controls: z.array(
      z
        .object({
          kind: z.literal('REVIEW_PULL_REQUEST'),
          label: z.string().min(1),
          href: z.url(),
        })
        .strict(),
    ),
  })
  .strict()
  .superRefine((brief, context) => {
    if (
      brief.identity.request.request_id !==
      `guardian-request:sha256:${brief.identity.request.request_sha256}`
    ) {
      context.addIssue({ code: 'custom', message: 'Incident Brief request identity is invalid.' });
    }
    const proposal = brief.identity.proposal;
    const change = brief.disclosures.proposed_change;
    if ((proposal === null) !== (change === null)) {
      context.addIssue({
        code: 'custom',
        message: 'Incident Brief proposal identity is incomplete.',
      });
    } else if (
      proposal !== null &&
      change !== null &&
      (proposal.proposal_id !== change.proposal_id ||
        proposal.proposal_hash_sha256 !== change.proposal_hash_sha256 ||
        proposal.verifier_pack_binding_sha256 !== change.verifier_pack_binding_sha256)
    ) {
      context.addIssue({ code: 'custom', message: 'Incident Brief proposal identities disagree.' });
    }
    if (
      brief.identity.pack.capability === 'ANALYSIS_ONLY' &&
      (brief.disclosures.verification !== null ||
        brief.disclosures.proposed_change !== null ||
        brief.controls.length > 0)
    ) {
      context.addIssue({
        code: 'custom',
        message:
          'Analysis-only Incident Brief cannot expose verification, proposal, or PR controls.',
      });
    }
  });

export type GuardianIncidentBrief = z.infer<typeof guardianIncidentBriefSchema>;

export function incidentBriefDecisionWordCount(brief: GuardianIncidentBrief): number {
  return Object.values(brief.decision).join(' ').trim().split(/\s+/u).filter(Boolean).length;
}

function markdownBullets(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

export function renderGuardianIncidentBriefMarkdown(untrustedBrief: GuardianIncidentBrief): string {
  const brief = guardianIncidentBriefSchema.parse(untrustedBrief);
  const proposal = brief.identity.proposal;
  const verification =
    brief.disclosures.verification === null
      ? ''
      : `\n## Verification\n\n\`\`\`json\n${JSON.stringify(brief.disclosures.verification, null, 2)}\n\`\`\`\n`;
  const proposedChange =
    brief.disclosures.proposed_change === null
      ? ''
      : `\n## Proposed change\n\n- Proposal ID: \`${brief.disclosures.proposed_change.proposal_id}\`\n- Proposal SHA-256: \`${brief.disclosures.proposed_change.proposal_hash_sha256}\`\n- Verifier pack binding SHA-256: \`${brief.disclosures.proposed_change.verifier_pack_binding_sha256}\`\n\n\`\`\`diff\n${brief.disclosures.proposed_change.exact_diff}\`\`\`\n`;
  return `# SecureOps Guardian Incident Brief

## Decision

### Finding

${brief.decision.finding}

### Key reason

${brief.decision.key_reason}

### What Guardian did

${brief.decision.guardian_did}

### Next action

${brief.decision.next_action}

## Identity

- Request ID: \`${brief.identity.request.request_id}\`
- Request SHA-256: \`${brief.identity.request.request_sha256}\`
- Run receipt ID: \`${brief.identity.receipt.receipt_id}\`
${proposal === null ? '- Proposal: None' : `- Proposal ID: \`${proposal.proposal_id}\`\n- Proposal SHA-256: \`${proposal.proposal_hash_sha256}\`\n- Verifier pack binding SHA-256: \`${proposal.verifier_pack_binding_sha256}\``}
- Pack: \`${brief.identity.pack.pack_id}@${brief.identity.pack.pack_version}\`
- Capability: \`${brief.identity.pack.capability}\`
- Terminal status: \`${brief.terminal_status}\`
- Severity: ${brief.severity}
- Evidence completeness: ${brief.evidence_completeness}
- Repository: \`${brief.identity.target.repository}\`
- Base branch: \`${brief.identity.target.base_branch}\`
- Revision: \`${brief.identity.target.revision}\`
- Target file: ${brief.identity.target.file === null ? 'Not selected' : `\`${brief.identity.target.file}\``}

## Evidence

${markdownBullets(brief.disclosures.evidence)}

## Causal chain

${brief.disclosures.causal_chain.map((item, index) => `${String(index + 1)}. ${item}`).join('\n')}
${verification}${proposedChange}
## Limitations

${markdownBullets(brief.disclosures.limitations)}

## Run receipt

\`\`\`json
${JSON.stringify(brief.disclosures.run_receipt, null, 2)}
\`\`\`
`;
}

function titleCaseStatus(status: string): string {
  const words = status
    .toLocaleLowerCase('en-US')
    .split('_')
    .map((part) => `${part.charAt(0).toLocaleUpperCase('en-US')}${part.slice(1)}`)
    .join(' ');
  return words.startsWith('Pr ') ? `PR ${words.slice(3).toLocaleLowerCase('en-US')}` : words;
}

export function renderGuardianIncidentBriefOpenUi(untrustedBrief: GuardianIncidentBrief): string {
  const brief = guardianIncidentBriefSchema.parse(untrustedBrief);
  const statusLabel = titleCaseStatus(brief.terminal_status);
  const evidenceLabel = titleCaseStatus(brief.evidence_completeness);
  const evidenceMarkdown = markdownBullets(brief.disclosures.evidence.map((item) => `\`${item}\``));
  const causalMarkdown = brief.disclosures.causal_chain
    .map((item, index) => `${String(index + 1)}. ${item}`)
    .join('\n');
  const limitationMarkdown = markdownBullets(brief.disclosures.limitations);
  const tabNames = ['evidenceTab', 'causalTab'];
  const detailLines = [
    `evidenceDetail = MarkDownRenderer(${JSON.stringify(evidenceMarkdown)}, "clear")`,
    'evidenceTab = TabItem("evidence", "Evidence", [evidenceDetail])',
    `causalDetail = MarkDownRenderer(${JSON.stringify(causalMarkdown)}, "clear")`,
    'causalTab = TabItem("causal-chain", "Causal chain", [causalDetail])',
  ];
  if (brief.disclosures.verification !== null) {
    tabNames.push('verificationTab');
    detailLines.push(
      `verificationCode = CodeBlock("json", ${JSON.stringify(JSON.stringify(brief.disclosures.verification, null, 2))})`,
      'verificationTab = TabItem("verification", "Verification", [verificationCode])',
    );
  }
  if (brief.disclosures.proposed_change !== null) {
    tabNames.push('proposedChangeTab');
    detailLines.push(
      `proposalIdentity = MarkDownRenderer(${JSON.stringify(`Proposal ID: \`${brief.disclosures.proposed_change.proposal_id}\`\n\nProposal SHA-256: \`${brief.disclosures.proposed_change.proposal_hash_sha256}\`\n\nVerifier pack binding SHA-256: \`${brief.disclosures.proposed_change.verifier_pack_binding_sha256}\``)}, "clear")`,
      `proposalDiff = CodeBlock("diff", ${JSON.stringify(brief.disclosures.proposed_change.exact_diff)})`,
      'proposedChangeTab = TabItem("proposed-change", "Proposed change", [proposalIdentity, proposalDiff])',
    );
  }
  tabNames.push('limitationsTab', 'receiptTab');
  detailLines.push(
    `limitationsDetail = MarkDownRenderer(${JSON.stringify(limitationMarkdown)}, "clear")`,
    'limitationsTab = TabItem("limitations", "Limitations", [limitationsDetail])',
    `receiptCode = CodeBlock("json", ${JSON.stringify(JSON.stringify(brief.disclosures.run_receipt, null, 2))})`,
    'receiptTab = TabItem("receipt", "Run receipt", [receiptCode])',
  );
  const controlLines = brief.controls.flatMap((control, index) => [
    `control${String(index)} = MarkDownRenderer(${JSON.stringify(`[${control.label}](${control.href})`)}, "clear")`,
  ]);
  const controls = brief.controls.map((_control, index) => `control${String(index)}`);
  const cardChildren = [
    'header',
    'chipRow',
    'scopeText',
    'findingCallout',
    'reasonCallout',
    'didCallout',
    'nextCallout',
    'detailsTabs',
    ...controls,
  ];
  return [
    'root = Stack([incidentBrief], "column", "m")',
    `incidentBrief = Card([${cardChildren.join(', ')}], "card", "column", "m")`,
    'header = CardHeader("SecureOps Guardian Incident Brief", "Decision first; execution remains in Investigation")',
    'chipRow = Stack([repositoryTag, revisionTag, packTag, statusTag, severityTag, evidenceTag], "row", "s", "center", "start", true)',
    `repositoryTag = Tag(${JSON.stringify(`Repository: ${brief.identity.target.repository}`)}, null, "md", "neutral")`,
    `revisionTag = Tag(${JSON.stringify(`Revision: ${brief.identity.target.revision}`)}, null, "md", "neutral")`,
    `packTag = Tag(${JSON.stringify(`Pack: ${brief.identity.pack.pack_id}@${brief.identity.pack.pack_version}`)}, null, "md", "neutral")`,
    `statusTag = Tag(${JSON.stringify(`Status: ${statusLabel}`)}, null, "md", ${JSON.stringify(brief.evidence_completeness === 'INCONCLUSIVE' ? 'warning' : 'success')})`,
    `severityTag = Tag(${JSON.stringify(`Severity: ${brief.severity}`)}, null, "md", ${JSON.stringify(brief.severity === 'High' ? 'danger' : 'neutral')})`,
    `evidenceTag = Tag(${JSON.stringify(`Evidence: ${evidenceLabel}`)}, null, "md", ${JSON.stringify(brief.evidence_completeness === 'COMPLETE' ? 'success' : 'warning')})`,
    `scopeText = MarkDownRenderer(${JSON.stringify(`Target: \`${brief.identity.target.file ?? 'changed files only'}\` · Request: \`${brief.identity.request.request_id}\` · Receipt: \`${brief.identity.receipt.receipt_id}\``)}, "clear")`,
    `findingCallout = Callout("warning", "Finding", ${JSON.stringify(brief.decision.finding)})`,
    `reasonCallout = Callout("warning", "Key reason", ${JSON.stringify(brief.decision.key_reason)})`,
    `didCallout = Callout("success", "What Guardian did", ${JSON.stringify(brief.decision.guardian_did)})`,
    `nextCallout = Callout("warning", "Next action", ${JSON.stringify(brief.decision.next_action)})`,
    ...detailLines,
    `detailsTabs = Tabs([${tabNames.join(', ')}])`,
    ...controlLines,
  ].join('\n');
}

export function renderGuardianIncidentBriefResponse(brief: GuardianIncidentBrief): string {
  return `\`\`\`openui\n${renderGuardianIncidentBriefOpenUi(brief)}\n\`\`\``;
}
