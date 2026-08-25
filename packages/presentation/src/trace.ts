export const GUARDIAN_TRACE_LABELS = {
  rootAgent: 'SecureOps Guardian',
  githubChild: 'change-security-investigator — official GitHub MCP evidence',
  fixtureChild: 'exposure-evidence-investigator — Fixture MCP evidence',
  sandbox: 'Daytona sandbox — deterministic four-state policy verification',
  approval: 'TrueForge approval required — official GitHub MCP write',
  githubResult: 'Official GitHub MCP result or deterministic PR reuse',
} as const;

export const GUARDIAN_TRACE_SEQUENCE = [
  GUARDIAN_TRACE_LABELS.githubChild,
  GUARDIAN_TRACE_LABELS.fixtureChild,
  GUARDIAN_TRACE_LABELS.sandbox,
  GUARDIAN_TRACE_LABELS.approval,
  GUARDIAN_TRACE_LABELS.githubResult,
] as const;
