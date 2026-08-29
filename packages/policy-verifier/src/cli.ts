import { VERIFIER_PACK_ROOT } from '@guardian/shared/verifier-pack-metadata';

import { runVerifierCli } from './cli-runner.js';

void runVerifierCli({
  argumentsList: process.argv.slice(2),
  requiredPackRoot: VERIFIER_PACK_ROOT,
  emit: (value) => process.stdout.write(`${JSON.stringify(value, null, 2)}\n`),
}).then((exitCode) => {
  process.exitCode = exitCode;
});
