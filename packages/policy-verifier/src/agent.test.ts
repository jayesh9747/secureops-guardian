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

  it('validates only the announced pinned skill root before candidate generation', () => {
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain('/opt/tf/skills/guardian-network-egress-v1');
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain('k8s-network-egress-v1');
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain('guardian-network-egress-v1.0.2');
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain('VERIFIER_PACK_READY');
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain('--expected-manifest-sha256');
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain('--full-proof true');
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain(
      'If pack validation fails, return INCONCLUSIVE before writing a candidate',
    );
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain(
      'If a required path check fails in the first command, return INCONCLUSIVE',
    );
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain(
      'Never search the filesystem or installed packages for an alternative verifier',
    );
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain(
      'Never invoke python -m secureops_guardian.verifier',
    );
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain(
      'pip install --root-user-action=ignore --quiet uv==0.12.5',
    );
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain(
      'uv run --quiet --with nodejs-wheel-binaries==22.14.0 python -m nodejs_wheel',
    );
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).not.toContain('/opt/tf/uploads');
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain('sha256sum -c -');
    expect(PHASE_THREE_AGENT_INSTRUCTIONS).toContain(
      'Never make multiple proposal-inspection calls',
    );
  });
});
