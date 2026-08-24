import { describe, expect, it } from 'vitest';

import { caseMetadataSchema, evidenceItemSchema, incidentFixtureSchema } from './index.js';

describe('shared evidence schemas', () => {
  it('requires an explicit synthetic metadata boundary', () => {
    const result = caseMetadataSchema.safeParse({
      case_id: 'checkout-networkpolicy-egress-exposure',
      fixture_version: '2',
      synthetic: true,
      summary: 'Owned synthetic platform-security incident fixture.',
    });

    expect(result.success).toBe(true);
  });

  it('rejects evidence with an invalid kind-specific details object', () => {
    const result = evidenceItemSchema.safeParse({
      evidence_id: 'evidence:invalid:001',
      kind: 'deployment',
      source: 'synthetic-ledger',
      source_ref: 'deployment:001',
      observed_at: '2026-08-24T09:00:00.000Z',
      fact: 'A deployment record was observed.',
      supports: [],
      refutes: [],
      limitations: ['Owned synthetic evidence.'],
      details: { revision: 'not-a-full-sha' },
    });

    expect(result.success).toBe(false);
  });

  it('rejects a fixture that is not labelled synthetic', () => {
    const result = incidentFixtureSchema.safeParse({
      case_id: 'unbounded-case',
      fixture_version: '2',
      synthetic: false,
    });

    expect(result.success).toBe(false);
  });
});
