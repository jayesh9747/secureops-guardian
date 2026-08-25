import { PHASE_FOUR_AGENT_INSTRUCTIONS, PHASE_FOUR_AGENT_SPEC } from '@guardian/github-write';

import { GUARDIAN_TRACE_SEQUENCE } from './trace.js';

export const PHASE_SIX_AGENT_NAME = 'secureops-guardian';

export const PHASE_SIX_PRESENTATION_INSTRUCTIONS = `
Phase 6 changes presentation only. Preserve every evidence, verifier, proposal, approval, receipt, remote-decision, mutation, and persistence gate above. Do not recompute, weaken, duplicate, or bypass a gate in order to render a result.

For a supplied validated Guardian presentation object, call the TrueForge get_openui_instructions built-in and render one compact stock OpenUI card. Use only the supplied values. The card hierarchy is: terminal status and High severity when supported; affected asset, causal commit, and changed file; exposure path and actual-data-access Unknown; evidence IDs grouped as official GitHub MCP and Incident Fixture MCP; verifier result; exact patch and proposal hash when present; limitations; approval or denial state; and PR link when present.

If OpenUI instructions are unavailable, the program does not parse, or rendering cannot be completed, return the complete Markdown fallback instead of the OpenUI fence. The fallback must preserve the same hierarchy. Never expose model reasoning, credentials, authorization headers, private information, or local filesystem paths.

Keep these judge-visible trace descriptions next to the corresponding real TrueForge events. They are explanatory captions, not renamed platform events:
${GUARDIAN_TRACE_SEQUENCE.map((label) => `- ${label}`).join('\n')}

Do not claim that dynamic child roles are authorization boundaries, that the Fixture MCP is production telemetry, that the Daytona verifier is live-cluster proof, that PR reuse required a new approval, or that separately approved GitHub writes are atomic. Never merge, deploy, access a cluster, or implement retained Phase 7 behavior.
`.trim();

export const PHASE_SIX_AGENT_SPEC = {
  name: PHASE_SIX_AGENT_NAME,
  manifest: {
    ...PHASE_FOUR_AGENT_SPEC.manifest,
    instructions: `${PHASE_FOUR_AGENT_INSTRUCTIONS}\n\n${PHASE_SIX_PRESENTATION_INSTRUCTIONS}`,
    config: {
      ...PHASE_FOUR_AGENT_SPEC.manifest.config,
      generative_ui: { enabled: true },
    },
  },
};
