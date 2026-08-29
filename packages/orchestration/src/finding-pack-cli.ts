import { readFileSync } from 'node:fs';

import { buildPhaseTenEvidenceMatrix } from './finding-pack-evidence.js';

const suspect = readFileSync(
  new URL('../../investigation/fixtures/workload/privileged-deployment.yaml', import.meta.url),
  'utf8',
);
const benign = readFileSync(
  new URL('../../investigation/fixtures/workload/benign-deployment.yaml', import.meta.url),
  'utf8',
);

process.stdout.write(
  `${JSON.stringify(buildPhaseTenEvidenceMatrix({ suspect, benign }), null, 2)}\n`,
);
