import { describe, expect, it } from 'vitest';

import { PHASE_THREE_AGENT_INSTRUCTIONS, PHASE_THREE_AGENT_SPEC } from './agent.js';

describe('Phase 3 TrueForge agent boundary', () => {
  it('enables only Daytona sandbox behavior and no connectors or later-phase capabilities', () => {
    expect(PHASE_THREE_AGENT_SPEC.manifest.mcp_servers).toEqual([]);
    expect(PHASE_THREE_AGENT_SPEC.manifest.config).toMatchObject({
      sandbox: { enabled: true },
      dynamic_sub_agents: { enabled: false },
      ask_user_questions: { enabled: false },
    });
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain(
      '/workspace/candidate/checkout-networkpolicy.yaml',
    );
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain('at most one correction');
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain('nodejs-wheel-binaries==22.14.0');
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain('uv==0.12.5');
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain('NO_SAFE_REMEDIATION');
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain('Do not request approval');
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain('do not create a branch');
  });
});
