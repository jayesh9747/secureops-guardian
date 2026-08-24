import { describe, expect, it } from 'vitest';

import { DEMO_CASE_ID, getCaseMetadata } from './metadata.js';

describe('getCaseMetadata', () => {
  it('returns explicitly synthetic metadata for the owned demo case', () => {
    expect(getCaseMetadata(DEMO_CASE_ID)).toEqual({
      caseId: DEMO_CASE_ID,
      fixtureVersion: '1',
      synthetic: true,
      summary: 'Owned synthetic post-deployment NetworkPolicy exposure fixture.',
    });
  });

  it('does not disclose a fallback case for unknown identifiers', () => {
    expect(getCaseMetadata('unknown-case')).toBeUndefined();
  });
});
