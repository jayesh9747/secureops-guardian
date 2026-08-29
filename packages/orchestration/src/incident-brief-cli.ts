import { createHash } from 'node:crypto';

import { renderGuardianIncidentBriefOpenUi } from '@guardian/presentation';

import { incidentBriefDecisionWordCount } from './incident-brief.js';
import { buildPhaseElevenIncidentBriefMatrix } from './incident-brief-matrix.js';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

const results = buildPhaseElevenIncidentBriefMatrix().map(({ scenario, brief, artifacts }) => ({
  scenario,
  terminal_status: brief.terminal_status,
  request_id: brief.identity.request.request_id,
  receipt_id: brief.identity.receipt.receipt_id,
  proposal_id: brief.identity.proposal?.proposal_id ?? null,
  decision_word_count: incidentBriefDecisionWordCount(brief),
  disclosure_tabs: [
    'Evidence',
    'Causal chain',
    ...(brief.disclosures.verification === null ? [] : ['Verification']),
    ...(brief.disclosures.proposed_change === null ? [] : ['Proposed change']),
    'Limitations',
    'Run receipt',
  ],
  representations: {
    openui_sha256: sha256(renderGuardianIncidentBriefOpenUi(brief)),
    markdown: {
      file_name: artifacts.markdown.file_name,
      sha256: sha256(artifacts.markdown.content),
    },
    receipt_json: {
      file_name: artifacts.receipt_json.file_name,
      sha256: sha256(artifacts.receipt_json.content),
    },
    verified_change:
      artifacts.verified_change === null
        ? null
        : {
            file_name: artifacts.verified_change.file_name,
            sha256: sha256(artifacts.verified_change.content),
          },
  },
}));

process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
