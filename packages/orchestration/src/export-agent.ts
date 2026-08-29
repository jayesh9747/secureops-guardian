import { readFile, writeFile } from 'node:fs/promises';

import { SECUREOPS_GUARDIAN_AGENT_SPEC } from './agent.js';

const exportUrl = new URL('../../../exports/secureops-guardian.trueforge.json', import.meta.url);
const current = JSON.parse(await readFile(exportUrl, 'utf8')) as { id: string };
const portable = {
  id: current.id,
  ...SECUREOPS_GUARDIAN_AGENT_SPEC,
};

await writeFile(exportUrl, `${JSON.stringify(portable, null, 2)}\n`, 'utf8');
