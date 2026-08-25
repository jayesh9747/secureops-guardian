import { guardianPresentationSchema, type GuardianPresentation } from './schema.js';

const statusLabel: Record<GuardianPresentation['terminal_status'], string> = {
  SECURITY_REMEDIATION_READY: 'Remediation ready',
  DENIED: 'Denied',
  PR_CREATED: 'PR created',
  PR_REUSED: 'PR reused',
  INCONCLUSIVE: 'Inconclusive',
  WRITE_CONFLICT: 'Write conflict',
  NO_SAFE_REMEDIATION: 'No safe remediation',
};

const statusTagVariant: Record<
  GuardianPresentation['terminal_status'],
  'success' | 'warning' | 'danger'
> = {
  SECURITY_REMEDIATION_READY: 'warning',
  DENIED: 'danger',
  PR_CREATED: 'success',
  PR_REUSED: 'success',
  INCONCLUSIVE: 'warning',
  WRITE_CONFLICT: 'danger',
  NO_SAFE_REMEDIATION: 'danger',
};

const calloutVariant: Record<
  GuardianPresentation['terminal_status'],
  'success' | 'warning' | 'error'
> = {
  SECURITY_REMEDIATION_READY: 'warning',
  DENIED: 'error',
  PR_CREATED: 'success',
  PR_REUSED: 'success',
  INCONCLUSIVE: 'warning',
  WRITE_CONFLICT: 'error',
  NO_SAFE_REMEDIATION: 'error',
};

function openUiString(value: string): string {
  return JSON.stringify(value);
}

function knownValue(value: GuardianPresentation['finding']['causal_commit']): string {
  return value.state === 'KNOWN' ? value.value : `Unknown — ${value.reason}`;
}

function markdownBullets(items: readonly string[]): string {
  return items.map((item) => `- \`${item}\``).join('\n');
}

function evidenceMarkdown(presentation: GuardianPresentation): string {
  const ruleEvidence =
    presentation.evidence.deterministic_rule.length === 0
      ? '- Not reached'
      : markdownBullets(presentation.evidence.deterministic_rule);
  return `### Official GitHub MCP evidence
${markdownBullets(presentation.evidence.official_github_mcp)}

### Incident Fixture MCP evidence
${markdownBullets(presentation.evidence.incident_fixture_mcp)}

### Deterministic rule evidence
${ruleEvidence}`;
}

function verifierMarkdown(presentation: GuardianPresentation): string {
  if (presentation.verifier.state === 'NOT_RUN') {
    return `Verifier not run: ${presentation.verifier.reason}`;
  }
  if (presentation.verifier.state === 'NO_SAFE_REMEDIATION') {
    return `| Attempt | Outcome | Classification | Diagnostics |
| --- | --- | --- | --- |
${presentation.verifier.attempts
  .map(
    (attempt) =>
      `| ${attempt.attempt} | ${attempt.outcome} | ${attempt.classification} | ${attempt.diagnostics.join('; ')} |`,
  )
  .join('\n')}

Execution boundary: ${presentation.verifier.execution_boundary}.`;
  }
  return `| State | Classification | DB path | Forbidden path | Decision |
| --- | --- | --- | --- | --- |
${presentation.verifier.rows
  .map(
    (row) =>
      `| ${row.state} | ${row.classification} | ${row.legitimate_db_path} | ${row.forbidden_external_path} | ${row.decision} |`,
  )
  .join('\n')}

Execution boundary: ${presentation.verifier.execution_boundary}.`;
}

function actionMarkdown(presentation: GuardianPresentation): string {
  const result = presentation.action.github_result;
  const githubResult = (() => {
    switch (result.state) {
      case 'NONE':
        return 'No pull-request result.';
      case 'PR_CREATED':
      case 'PR_REUSED':
        return `[Pull request #${result.pr_number}](${result.pr_url}) at commit \`${result.remote_commit_sha}\`.`;
      case 'WRITE_CONFLICT':
        return `${result.reason} Observed commit \`${result.observed_remote_commit_sha}\`, blob \`${result.observed_git_blob_sha}\`.`;
    }
  })();
  return `Approval state: **${presentation.action.approval_state}**. ${presentation.action.approval_boundary} ${githubResult}`;
}

export function renderGuardianMarkdown(untrustedPresentation: GuardianPresentation): string {
  const presentation = guardianPresentationSchema.parse(untrustedPresentation);
  const proposal =
    presentation.proposal.state === 'EXACT'
      ? `- Proposal ID: \`${presentation.proposal.proposal_id}\`
- Proposal SHA-256: \`${presentation.proposal.proposal_hash_sha256}\`

\`\`\`diff
${presentation.proposal.exact_patch}\`\`\``
      : `No proposal: ${presentation.proposal.reason}`;
  return `## SecureOps Guardian — ${statusLabel[presentation.terminal_status]}

**${presentation.headline}**

- Terminal status: \`${presentation.terminal_status}\`
- Severity: **${presentation.severity}**
- Affected asset: \`${presentation.finding.affected_asset}\`
- Causal commit: \`${knownValue(presentation.finding.causal_commit)}\`
- Changed file: \`${knownValue(presentation.finding.changed_file)}\`
- Exposure path: \`${knownValue(presentation.finding.exposure_path)}\`
- Actual data access: **${presentation.finding.actual_data_access}**

### Evidence IDs

${evidenceMarkdown(presentation)}

### Verifier

${verifierMarkdown(presentation)}

### Exact proposal

${proposal}

### Limitations

${presentation.limitations.map((limitation) => `- ${limitation}`).join('\n')}

### Approval and GitHub result

${actionMarkdown(presentation)}`;
}

function verifierOpenUiLines(presentation: GuardianPresentation): string[] {
  if (presentation.verifier.state === 'NOT_RUN') {
    return [
      `verifierSection = Callout("warning", "Verifier not run", ${openUiString(presentation.verifier.reason)})`,
    ];
  }
  if (presentation.verifier.state === 'NO_SAFE_REMEDIATION') {
    return [
      'verifierSection = Card([verifierHeader, verifierTable], "sunk", "column", "s")',
      `verifierHeader = CardHeader("Daytona verifier", ${openUiString(presentation.verifier.execution_boundary)})`,
      'verifierTable = Table([Col("Attempt", verifierAttempts), Col("Outcome", verifierOutcomes), Col("Diagnostics", verifierDiagnostics)])',
      `verifierAttempts = ${JSON.stringify(presentation.verifier.attempts.map((attempt) => attempt.attempt))}`,
      `verifierOutcomes = ${JSON.stringify(presentation.verifier.attempts.map((attempt) => attempt.outcome))}`,
      `verifierDiagnostics = ${JSON.stringify(presentation.verifier.attempts.map((attempt) => attempt.diagnostics.join('; ')))}`,
    ];
  }
  return [
    'verifierSection = Card([verifierHeader, verifierTable], "sunk", "column", "s")',
    `verifierHeader = CardHeader("Four-state verifier", ${openUiString(presentation.verifier.execution_boundary)})`,
    'verifierTable = Table([Col("State", verifierStates), Col("DB", verifierDb), Col("Forbidden", verifierForbidden), Col("Decision", verifierDecisions)])',
    `verifierStates = ${JSON.stringify(presentation.verifier.rows.map((row) => row.state))}`,
    `verifierDb = ${JSON.stringify(presentation.verifier.rows.map((row) => row.legitimate_db_path))}`,
    `verifierForbidden = ${JSON.stringify(presentation.verifier.rows.map((row) => row.forbidden_external_path))}`,
    `verifierDecisions = ${JSON.stringify(presentation.verifier.rows.map((row) => row.decision))}`,
  ];
}

function proposalOpenUiLines(presentation: GuardianPresentation): string[] {
  if (presentation.proposal.state === 'ABSENT') {
    return [
      'proposalContent = [proposalAbsent]',
      `proposalAbsent = Callout("warning", "No proposal", ${openUiString(presentation.proposal.reason)})`,
    ];
  }
  return [
    'proposalContent = [proposalHash, proposalPatch]',
    `proposalHash = TextContent(${openUiString(`Proposal SHA-256: ${presentation.proposal.proposal_hash_sha256}`)}, "small")`,
    `proposalPatch = CodeBlock("diff", ${openUiString(presentation.proposal.exact_patch)})`,
  ];
}

function githubLinkMarkdown(presentation: GuardianPresentation): string {
  const result = presentation.action.github_result;
  if (result.state === 'PR_CREATED' || result.state === 'PR_REUSED') {
    return `[Open remediation PR #${result.pr_number}](${result.pr_url})`;
  }
  if (result.state === 'WRITE_CONFLICT') {
    return `GitHub result: **WRITE_CONFLICT** — ${result.reason}`;
  }
  return 'GitHub result: no pull-request URL for this terminal state.';
}

export function renderGuardianOpenUi(untrustedPresentation: GuardianPresentation): string {
  const presentation = guardianPresentationSchema.parse(untrustedPresentation);
  const lines = [
    'root = Stack([guardianCard], "column", "m")',
    'guardianCard = Card([header, statusRow, terminalCallout, findingTable, evidenceDetail, verifierSection, detailsTabs, actionCallout, githubLink], "card", "column", "m")',
    `header = CardHeader("SecureOps Guardian", ${openUiString(presentation.headline)})`,
    'statusRow = Stack([statusTag, severityTag, dataAccessTag], "row", "s", "center", "start", true)',
    `statusTag = Tag(${openUiString(statusLabel[presentation.terminal_status])}, null, "md", "${statusTagVariant[presentation.terminal_status]}")`,
    `severityTag = Tag(${openUiString(`Severity ${presentation.severity}`)}, null, "md", "${presentation.severity === 'High' ? 'danger' : 'neutral'}")`,
    'dataAccessTag = Tag("Actual data access Unknown", null, "md", "warning")',
    `terminalCallout = Callout("${calloutVariant[presentation.terminal_status]}", ${openUiString(presentation.terminal_status)}, ${openUiString(presentation.headline)})`,
    'findingTable = Table([Col("Finding", findingLabels), Col("Value", findingValues)])',
    'findingLabels = ["Affected asset", "Causal commit", "Changed file", "Exposure path"]',
    `findingValues = ${JSON.stringify([
      presentation.finding.affected_asset,
      knownValue(presentation.finding.causal_commit),
      knownValue(presentation.finding.changed_file),
      knownValue(presentation.finding.exposure_path),
    ])}`,
    ...verifierOpenUiLines(presentation),
    `evidenceDetail = MarkDownRenderer(${openUiString(evidenceMarkdown(presentation))}, "clear")`,
    ...proposalOpenUiLines(presentation),
    `limitationsDetail = MarkDownRenderer(${openUiString(presentation.limitations.map((limitation) => `- ${limitation}`).join('\n'))}, "clear")`,
    'proposalTab = TabItem("proposal", "Exact proposal", proposalContent)',
    'limitationsTab = TabItem("limitations", "Limitations", [limitationsDetail])',
    'detailsTabs = Tabs([proposalTab, limitationsTab])',
    `actionCallout = Callout("${calloutVariant[presentation.terminal_status]}", ${openUiString(`Approval: ${presentation.action.approval_state}`)}, ${openUiString(presentation.action.approval_boundary)})`,
    `githubLink = MarkDownRenderer(${openUiString(githubLinkMarkdown(presentation))}, "clear")`,
  ];
  return lines.join('\n');
}

export function renderGuardianResponse(untrustedPresentation: GuardianPresentation): string {
  const presentation = guardianPresentationSchema.parse(untrustedPresentation);
  return `\`\`\`openui
${renderGuardianOpenUi(presentation)}
\`\`\``;
}

export function renderGuardianFallbackResponse(
  untrustedPresentation: GuardianPresentation,
): string {
  const presentation = guardianPresentationSchema.parse(untrustedPresentation);
  return renderGuardianMarkdown(presentation);
}
