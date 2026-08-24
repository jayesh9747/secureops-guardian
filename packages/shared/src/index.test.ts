import { describe, expect, it } from 'vitest';

import { caseMetadataSchema } from './index.js';

describe('caseMetadataSchema', () => {
  it('requires an explicit synthetic boundary', () => {
    const result = caseMetadataSchema.safeParse({
      caseId: 'checkout-networkpolicy-egress-exposure',
      fixtureVersion: '1',
      synthetic: true,
      summary: 'Owned synthetic platform-security incident fixture.',
    });

    expect(result.success).toBe(true);
  });

  it('rejects metadata that is not labelled synthetic', () => {
    const result = caseMetadataSchema.safeParse({
      caseId: 'checkout-networkpolicy-egress-exposure',
      fixtureVersion: '1',
      synthetic: false,
      summary: 'Unlabelled incident fixture.',
    });

    expect(result.success).toBe(false);
  });
});
