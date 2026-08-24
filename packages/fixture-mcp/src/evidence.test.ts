import { describe, expect, it } from 'vitest';

import { DEMO_CASE_ID } from '@guardian/shared';

import {
  getDeployment,
  getReachabilityObservations,
  getSecurityAlert,
  getServiceDependencies,
} from './evidence.js';

describe('read-only evidence accessors', () => {
  it('returns each source-native evidence contract without a conclusion field', () => {
    const results = [
      getSecurityAlert(DEMO_CASE_ID),
      getDeployment(DEMO_CASE_ID),
      getReachabilityObservations(DEMO_CASE_ID),
      getServiceDependencies(DEMO_CASE_ID),
    ];

    for (const result of results) {
      expect(result).toMatchObject({ case_id: DEMO_CASE_ID, synthetic: true });
      expect(result).not.toHaveProperty('root_cause');
      expect(result).not.toHaveProperty('severity');
      expect(result).not.toHaveProperty('remediation');
    }
  });

  it('does not expose an implicit fallback for an unknown case', () => {
    expect(getSecurityAlert('unknown-case')).toBeUndefined();
    expect(getDeployment('unknown-case')).toBeUndefined();
    expect(getReachabilityObservations('unknown-case')).toBeUndefined();
    expect(getServiceDependencies('unknown-case')).toBeUndefined();
  });
});
