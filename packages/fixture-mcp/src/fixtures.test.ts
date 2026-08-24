import { describe, expect, it } from 'vitest';

import {
  CONFLICTING_REVISION_CASE_ID,
  DEMO_CASE_ID,
  LAST_GOOD_COMMIT_SHA,
  MISSING_DEPLOYMENT_REVISION_CASE_ID,
  MISSING_REACHABILITY_CASE_ID,
  SUSPECT_COMMIT_SHA,
  getFixture,
  listCaseIds,
} from './fixtures.js';

describe('incident fixtures', () => {
  it('keeps the normal case internally consistent and joined to the suspect revision', () => {
    const fixture = getFixture(DEMO_CASE_ID);
    expect(fixture).toBeDefined();
    if (fixture === undefined) throw new Error('Expected the normal fixture.');

    expect(fixture.deployment.details.revision).toBe(SUSPECT_COMMIT_SHA);
    expect(fixture.deployment.details.workload_annotation_revision).toBe(SUSPECT_COMMIT_SHA);
    expect(fixture.security_alert.details.actual_data_access).toBe('Unknown');

    const deploymentTime = Date.parse(fixture.deployment.details.deployed_at);
    expect(Date.parse(fixture.security_alert.observed_at)).toBeGreaterThan(deploymentTime);
    for (const observation of fixture.reachability_observations) {
      expect(Date.parse(observation.observed_at)).toBeGreaterThan(deploymentTime);
    }

    const evidenceIds = [
      fixture.security_alert.evidence_id,
      fixture.deployment.evidence_id,
      ...fixture.reachability_observations.map((item) => item.evidence_id),
      ...fixture.service_dependencies.map((item) => item.evidence_id),
    ];
    expect(new Set(evidenceIds).size).toBe(evidenceIds.length);
    expect(evidenceIds.every((evidenceId) => evidenceId.length > 0)).toBe(true);
  });

  it('selects every failure variant deterministically', () => {
    expect(listCaseIds()).toEqual([
      DEMO_CASE_ID,
      MISSING_DEPLOYMENT_REVISION_CASE_ID,
      MISSING_REACHABILITY_CASE_ID,
      CONFLICTING_REVISION_CASE_ID,
    ]);

    expect(getFixture(MISSING_DEPLOYMENT_REVISION_CASE_ID)?.deployment.details).toMatchObject({
      revision: null,
      workload_annotation_revision: null,
    });
    expect(getFixture(MISSING_REACHABILITY_CASE_ID)?.reachability_observations).toEqual([]);
    expect(getFixture(CONFLICTING_REVISION_CASE_ID)?.deployment.details).toMatchObject({
      revision: SUSPECT_COMMIT_SHA,
      workload_annotation_revision: LAST_GOOD_COMMIT_SHA,
    });
  });

  it('returns defensive copies so callers cannot mutate fixture state', () => {
    const firstRead = getFixture(DEMO_CASE_ID);
    if (firstRead === undefined) throw new Error('Expected the normal fixture.');
    firstRead.deployment.details.revision = null;
    firstRead.reachability_observations.splice(0);

    const secondRead = getFixture(DEMO_CASE_ID);
    expect(secondRead?.deployment.details.revision).toBe(SUSPECT_COMMIT_SHA);
    expect(secondRead?.reachability_observations).toHaveLength(2);
  });

  it('fails closed for an unknown case ID', () => {
    expect(getFixture('unknown-case')).toBeUndefined();
  });
});
