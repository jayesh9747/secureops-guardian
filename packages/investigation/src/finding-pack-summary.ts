import type { FindingPackAnalysis, FindingPackPresentation } from './finding-packs.js';

export function presentFindingPackAnalysis(analysis: FindingPackAnalysis): FindingPackPresentation {
  return {
    pack_label: `${analysis.pack.pack_id}@${analysis.pack.pack_version}`,
    terminal_status: analysis.findings.length === 0 ? 'NO_DETERMINISTIC_FINDING' : 'FINDINGS',
    finding_count: analysis.findings.length,
    headline:
      analysis.findings.length === 0
        ? 'No deterministic finding in the supported manifest scope'
        : `${String(analysis.findings.length)} deterministic security finding(s)`,
    next_action:
      analysis.capability === 'ANALYSIS_ONLY'
        ? 'Review the cited repository evidence; no remediation route is available.'
        : 'Use only the separately gated verifier and remediation route for this pack.',
  };
}
