import { PHASE_FOUR_AGENT_INSTRUCTIONS, PHASE_FOUR_AGENT_SPEC } from '@guardian/github-write';

import { GUARDIAN_TRACE_SEQUENCE } from './trace.js';

export const PHASE_SIX_AGENT_NAME = 'secureops-guardian';

export const PHASE_SIX_PRESENTATION_INSTRUCTIONS = `
Phase 6 changes presentation only. Preserve every evidence, verifier, proposal, approval, receipt, remote-decision, mutation, and persistence gate above. Do not recompute, weaken, duplicate, or bypass a gate in order to render a result.

For a supplied validated Guardian presentation object, call the TrueForge get_openui_instructions built-in and render one compact stock OpenUI card. Use only the supplied values. The always-visible decision summary contains exactly: the terminal finding and severity; the affected workload; the causal commit and changed file; the security impact; what Guardian proved or why it stopped; and the next action. Keep evidence IDs, verifier output, exact patch and proposal hash, limitations, and the run receipt behind separate progressive-disclosure tabs. Show approval state and the PR link when applicable.

Emit exactly one primary rendering. When OpenUI succeeds, return exactly one OpenUI fence; the card carries the terminal conclusion. Put the complete schema-version-1 receipt inside the card's Run receipt disclosure tab. Do not append the Markdown recovery rendering or raw receipt JSON after the card. The default card view must be understandable without opening any tab.

If OpenUI instructions are unavailable, the program does not parse, or rendering cannot be completed, return the complete Markdown fallback instead of the OpenUI fence. The fallback must preserve the same hierarchy and receipt. Never return OpenUI and Markdown together. Never expose model reasoning, credentials, authorization headers, private information, or local filesystem paths.

The TrueForge Investigation rail owns the execution trace. Do not print a Journey Trace & Execution Log and do not replay child-agent, MCP, approval, or sandbox events in the result body. Use these labels only as concise names on the corresponding real TrueForge events; they are not a report section and do not rename platform events:
${GUARDIAN_TRACE_SEQUENCE.map((label) => `- ${label}`).join('\n')}

Do not claim that dynamic child roles are authorization boundaries, that the Fixture MCP is production telemetry, that the Daytona verifier is live-cluster proof, that PR reuse required a new approval, or that separately approved GitHub writes are atomic. Never merge, deploy, access a cluster, or implement retained Phase 7 behavior.
`.trim();

export const PHASE_ELEVEN_PRESENTATION_INSTRUCTIONS = `
Phase 11 adds typed request and result presentation only. Preserve all existing evidence, capability,
verification, proposal, approval, receipt, remote, and persistence gates.

Before a confirmed PREPARE_REMEDIATION or OPEN_PR execution, show an Interpreted request card with
the exact repository, base branch, exact commit or comparison, optional target file, selected pack, and capability ceiling. Include one concise statement of what Guardian will not do. Confirmation
confirms meaning only and never authorizes a GitHub write. Display a compiler digest only when the
typed compiler supplied it; the prompt-only path must not invent one.

Every terminal result is a decision-first Incident Brief. Its always-visible body answers only
Finding, Key reason, What Guardian did, and Next action, in that order and in at most 120 words.
Compact chips must label repository/revision, pack, terminal status, severity, and evidence
completeness with text; color alone is never status meaning. The disclosure order is Evidence, Causal chain, conditional Verification, conditional Proposed change, Limitations, and Run receipt.
Verification appears only when it ran. Proposed change appears only for an exact verified proposal.
Raw evidence and receipt JSON stay behind disclosures.

Controls are pack- and capability-aware. The workload pack renders no verifier, proposal, approval,
or PR control. Buttons are forbidden unless a real handler and correct capability/approval boundary
exist. A real pull-request URL may render as a review link. Use normal UI type for explanations;
monospace is limited to IDs, hashes, paths, YAML, diffs, and receipts. When local demo styling is
available, retain at least 14 px body text and 20–24 px line height with bounded line length. Product
correctness and the complete fallback must remain available in stock TrueForge without a UI fork.

Generate deterministic copyable representations named guardian-incident-brief.md and
guardian-run-receipt.json from the validated brief and receipt. Emit guardian-verified-change.json
only for a verified proposal. The request ID/digest, receipt ID, proposal ID/hash/binding, pack, and
target must match across OpenUI and every representation; mismatch fails closed. Download exposure
is deferred unless the stock platform provides it directly. ANALYSIS_ONLY must not create or enter a sandbox merely to export or download an artifact.

The Investigation rail, never chat, owns one row per child with status, elapsed time, and one-sentence result. Group MCP and Daytona calls under the responsible agent. Findings, Evidence, and Activity remain separate. Do not duplicate child results, tool calls, timings, failures, or the execution trace
inside the Incident Brief.
`.trim();

export const PHASE_SIX_AGENT_SPEC = {
  name: PHASE_SIX_AGENT_NAME,
  manifest: {
    ...structuredClone(PHASE_FOUR_AGENT_SPEC.manifest),
    instructions: `${PHASE_FOUR_AGENT_INSTRUCTIONS}\n\n${PHASE_SIX_PRESENTATION_INSTRUCTIONS}`,
    config: {
      ...structuredClone(PHASE_FOUR_AGENT_SPEC.manifest.config),
      generative_ui: { enabled: true },
    },
  },
};
