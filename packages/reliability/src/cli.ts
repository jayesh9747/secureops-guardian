import { phaseFiveRecordPassed, runPhaseFiveMatrix } from './harness.js';

const records = runPhaseFiveMatrix();
process.stdout.write(`${JSON.stringify(records, null, 2)}\n`);
if (!records.every(phaseFiveRecordPassed)) process.exitCode = 1;
