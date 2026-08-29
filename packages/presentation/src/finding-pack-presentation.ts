import {
  FINDING_PACK_REGISTRY,
  type FindingPackAnalysis,
  type FindingPackEvidenceReference,
  type FindingPackFinding,
} from '@guardian/investigation';

export interface FindingPackAnalysisPresentation {
  readonly terminal_status: 'FINDINGS' | 'NO_DETERMINISTIC_FINDING';
  readonly headline: string;
  readonly pack: FindingPackAnalysis['pack'];
  readonly capability: FindingPackAnalysis['capability'];
  readonly severity: FindingPackAnalysis['severity'];
  readonly repository: string;
  readonly revision: string;
  readonly file: string;
  readonly object_identity: FindingPackAnalysis['object_identity'];
  readonly findings: readonly FindingPackFinding[];
  readonly evidence_references: readonly FindingPackEvidenceReference[];
  readonly known_claims: readonly string[];
  readonly refuted_claims: readonly string[];
  readonly unknown_claims: readonly string[];
  readonly limitations: readonly string[];
  readonly next_action: string;
}

export function buildFindingPackAnalysisPresentation(
  analysis: FindingPackAnalysis,
): FindingPackAnalysisPresentation {
  const pack = FINDING_PACK_REGISTRY.packs.find(
    (candidate) =>
      candidate.identity.pack_id === analysis.pack.pack_id &&
      candidate.identity.pack_version === analysis.pack.pack_version,
  );
  if (pack === undefined) throw new Error('Analysis refers to an unregistered finding pack.');
  if (pack.capability !== analysis.capability) {
    throw new Error('Analysis capability does not match its registered finding pack.');
  }
  const summary = pack.presentation_adapter(analysis);
  return {
    terminal_status: summary.terminal_status,
    headline: summary.headline,
    pack: analysis.pack,
    capability: analysis.capability,
    severity: analysis.severity,
    repository: analysis.repository,
    revision: analysis.revision,
    file: analysis.file,
    object_identity: analysis.object_identity,
    findings: analysis.findings,
    evidence_references: analysis.evidence_references,
    known_claims: analysis.claims.known,
    refuted_claims: analysis.claims.refuted,
    unknown_claims: analysis.claims.unknown,
    limitations: analysis.limitations,
    next_action: summary.next_action,
  };
}

function bullets(items: readonly string[]): string {
  return items.length === 0 ? '- None' : items.map((item) => `- ${item}`).join('\n');
}

function tableCell(value: string): string {
  return value.replaceAll('|', '\\|').replaceAll('\n', ' ');
}

export function renderFindingPackAnalysisMarkdown(
  presentation: FindingPackAnalysisPresentation,
): string {
  const identity = `${presentation.object_identity.api_version}/${presentation.object_identity.kind} ${presentation.object_identity.namespace}/${presentation.object_identity.name}`;
  const findingRows =
    presentation.findings.length === 0
      ? '| — | — | — | — | No deterministic finding |'
      : presentation.findings
          .map((finding) => {
            const findingIdentity =
              finding.container_identity === null
                ? identity
                : `${identity} · ${finding.container_identity.container_type}:${finding.container_identity.name}`;
            return `| ${finding.rule_id} | ${finding.severity} | ${tableCell(findingIdentity)} | \`${tableCell(finding.json_path)}\` | ${tableCell(finding.summary)} |`;
          })
          .join('\n');
  const evidence = presentation.evidence_references
    .map((reference) => `- \`${reference.evidence_id}\` — \`${reference.source_ref}\``)
    .join('\n');
  return `## SecureOps Guardian — workload analysis

**${presentation.headline}**

- Pack: \`${presentation.pack.pack_id}@${presentation.pack.pack_version}\`
- Capability: \`${presentation.capability}\`
- Severity: \`${presentation.severity}\`
- Repository: \`${presentation.repository}\`
- Revision: \`${presentation.revision}\`
- File: \`${presentation.file}\`
- Kubernetes object: \`${identity}\`

| Rule | Severity | Identity | JSONPath | Finding |
| --- | --- | --- | --- | --- |
${findingRows}

### Evidence

${evidence}

### Known claims

${bullets(presentation.known_claims)}

### Refuted claims

${bullets(presentation.refuted_claims)}

### Unknown claims

${bullets(presentation.unknown_claims)}

### Limitations

${bullets(presentation.limitations)}

### Next action

${presentation.next_action}

No verifier, proposal, approval, branch, commit, or PR was reached.`;
}

export function renderFindingPackAnalysisOpenUi(
  presentation: FindingPackAnalysisPresentation,
): string {
  const title = JSON.stringify(presentation.headline);
  const objectIdentity = `${presentation.object_identity.api_version}/${presentation.object_identity.kind} ${presentation.object_identity.namespace}/${presentation.object_identity.name}`;
  const scope = JSON.stringify(
    `${presentation.repository}@${presentation.revision} · ${presentation.file} · ${objectIdentity}`,
  );
  const pack = JSON.stringify(
    `${presentation.pack.pack_id}@${presentation.pack.pack_version} · ${presentation.capability}`,
  );
  const findingRows = JSON.stringify(
    presentation.findings.map((finding) => [
      finding.rule_id,
      finding.severity,
      finding.container_identity === null
        ? objectIdentity
        : `${objectIdentity} · ${finding.container_identity.container_type}:${finding.container_identity.name}`,
      finding.json_path,
    ]),
  );
  const evidence = JSON.stringify(
    presentation.evidence_references
      .map((reference) => `${reference.evidence_id} — ${reference.source_ref}`)
      .join('\n'),
  );
  const unknown = JSON.stringify(presentation.unknown_claims.join('\n'));
  const limitations = JSON.stringify(presentation.limitations.join('\n'));
  const nextAction = JSON.stringify(presentation.next_action);
  return `root = Stack([guardianCard], "column", "m")
guardianCard = Card([header, scopeText, findingTable, detailsTabs, nextAction])
header = CardHeader(${title}, ${pack})
scopeText = TextContent(${scope})
findingTable = Table(["Rule", "Severity", "Identity", "JSONPath"], ${findingRows})
detailsTabs = Tabs([evidenceTab, unknownTab, limitationsTab])
evidenceTab = TabItem("evidence", "Evidence", [TextContent(${evidence})])
unknownTab = TabItem("unknown", "Unknown", [TextContent(${unknown})])
limitationsTab = TabItem("limitations", "Limitations", [TextContent(${limitations})])
nextAction = Callout("Next action", ${nextAction}, "warning")`;
}
