import { DEMO_REPOSITORY, SUSPECT_COMMIT_SHA, TARGET_NETWORK_POLICY_FILE } from '@guardian/shared';

import { REQUIRED_VERIFIER_INPUTS } from './intent.js';
import { buildCurrentFixtureJourneyContext, runCurrentFixtureJourney } from './journey.js';

const scope = {
  schema_version: 1 as const,
  repository: DEMO_REPOSITORY,
  base_branch: 'main',
  suspect: { kind: 'commit' as const, commit_sha: SUSPECT_COMMIT_SHA },
  target_file: TARGET_NETWORK_POLICY_FILE,
};

const receipts = ['ANALYSIS_ONLY', 'PREPARE_REMEDIATION', 'OPEN_PR'].map((mode) => {
  const input = {
    mode,
    scope,
    ...(mode === 'ANALYSIS_ONLY' ? {} : { verifier_inputs: REQUIRED_VERIFIER_INPUTS }),
  };
  return runCurrentFixtureJourney(input, buildCurrentFixtureJourneyContext(input));
});

process.stdout.write(
  `${JSON.stringify(
    receipts.map(({ receipt }) => receipt),
    null,
    2,
  )}\n`,
);
