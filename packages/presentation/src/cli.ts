import { createHash } from 'node:crypto';

import { buildPhaseSixPresentationMatrix } from './matrix.js';
import { renderGuardianFallbackResponse, renderGuardianResponse } from './render.js';

const results = buildPhaseSixPresentationMatrix().map(({ scenario, presentation }) => {
  const response = renderGuardianResponse(presentation);
  const fallback = renderGuardianFallbackResponse(presentation);
  return {
    scenario,
    terminal_status: presentation.terminal_status,
    openui_first_statement: response.split('\n')[1],
    markdown_fallback_available:
      fallback.includes(`\`${presentation.terminal_status}\``) &&
      (presentation.proposal.state === 'ABSENT' ||
        fallback.includes(presentation.proposal.proposal_hash_sha256)),
    response_sha256: createHash('sha256').update(response).digest('hex'),
    fallback_sha256: createHash('sha256').update(fallback).digest('hex'),
  };
});

process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
