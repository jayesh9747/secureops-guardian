import { readFile, writeFile } from 'node:fs/promises';

import { canonicalJson } from './canonical.js';
import { PolicyContractError, parsePolicyContract } from './contract.js';
import { buildEligibleProposal, verifyFourStates } from './proof.js';
import { evaluateCandidateAttempt } from './workflow.js';

interface CliArguments {
  candidate: string;
  contract: string;
  attempt: 1 | 2;
  lastGood?: string;
  suspect?: string;
  denyAll?: string;
  proposalOutput?: string;
}

class CliArgumentError extends Error {}

function parseArguments(argumentsList: string[]): CliArguments {
  const values = new Map<string, string>();
  for (let index = 0; index < argumentsList.length; index += 2) {
    const flag = argumentsList[index];
    const value = argumentsList[index + 1];
    if (flag === undefined || !flag.startsWith('--') || value === undefined) {
      throw new CliArgumentError('Every CLI flag must have one explicit value.');
    }
    if (values.has(flag)) throw new CliArgumentError(`Duplicate flag: ${flag}`);
    values.set(flag, value);
  }
  const allowed = new Set([
    '--candidate',
    '--contract',
    '--attempt',
    '--last-good',
    '--suspect',
    '--deny-all',
    '--proposal-output',
  ]);
  for (const flag of values.keys()) {
    if (!allowed.has(flag)) throw new CliArgumentError(`Unknown flag: ${flag}`);
  }
  const candidate = values.get('--candidate');
  const contract = values.get('--contract');
  if (candidate === undefined || contract === undefined) {
    throw new CliArgumentError('--candidate and --contract are required.');
  }
  const attemptText = values.get('--attempt') ?? '1';
  if (attemptText !== '1' && attemptText !== '2') {
    throw new CliArgumentError('--attempt must be 1 or 2; a third attempt is prohibited.');
  }
  const proofPaths = [values.get('--last-good'), values.get('--suspect'), values.get('--deny-all')];
  const proofPathCount = proofPaths.filter((value) => value !== undefined).length;
  if (proofPathCount !== 0 && proofPathCount !== 3) {
    throw new CliArgumentError('--last-good, --suspect, and --deny-all must be supplied together.');
  }
  if (values.has('--proposal-output') && proofPathCount !== 3) {
    throw new CliArgumentError('--proposal-output requires all three proof fixture paths.');
  }

  return {
    candidate,
    contract,
    attempt: Number(attemptText) as 1 | 2,
    lastGood: values.get('--last-good'),
    suspect: values.get('--suspect'),
    denyAll: values.get('--deny-all'),
    proposalOutput: values.get('--proposal-output'),
  };
}

async function readRequired(path: string, code: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch {
    throw new CliArgumentError(`${code}: unable to read the explicit path.`);
  }
}

function emit(value: unknown): void {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`);
}

async function run(): Promise<number> {
  let cli: CliArguments;
  try {
    cli = parseArguments(process.argv.slice(2));
  } catch (error) {
    emit({
      schema_version: 1,
      outcome: 'CLI_ARGUMENT_ERROR',
      message: error instanceof Error ? error.message : 'Invalid CLI arguments.',
    });
    return 2;
  }

  try {
    const [candidateYaml, contractJson] = await Promise.all([
      readRequired(cli.candidate, 'CANDIDATE_READ_ERROR'),
      readRequired(cli.contract, 'CONTRACT_READ_ERROR'),
    ]);
    const contract = parsePolicyContract(contractJson);
    const attempt = evaluateCandidateAttempt(candidateYaml, contract, cli.attempt);
    if (attempt.outcome !== 'SECURITY_REMEDIATION_READY') {
      emit({ schema_version: 1, ...attempt });
      return 1;
    }
    if (cli.lastGood === undefined || cli.suspect === undefined || cli.denyAll === undefined) {
      emit({ schema_version: 1, ...attempt });
      return 0;
    }

    const [lastGoodYaml, suspectYaml, denyAllYaml] = await Promise.all([
      readRequired(cli.lastGood, 'LAST_GOOD_READ_ERROR'),
      readRequired(cli.suspect, 'SUSPECT_READ_ERROR'),
      readRequired(cli.denyAll, 'DENY_ALL_READ_ERROR'),
    ]);
    const proof = verifyFourStates(
      { lastGoodYaml, suspectYaml, denyAllYaml, candidateYaml },
      contract,
    );
    const proposal = buildEligibleProposal({ candidateYaml, suspectYaml, proof });
    if (proposal === undefined) {
      emit({
        schema_version: 1,
        outcome: 'PROOF_REJECTED',
        attempts_used: cli.attempt,
        four_state_verifier_result: proof,
      });
      return 1;
    }
    if (cli.proposalOutput !== undefined) {
      try {
        await writeFile(cli.proposalOutput, canonicalJson(proposal), 'utf8');
      } catch {
        throw new CliArgumentError('PROPOSAL_WRITE_ERROR: unable to write the explicit path.');
      }
    }
    emit({
      schema_version: 1,
      outcome: 'SECURITY_REMEDIATION_READY',
      attempts_used: cli.attempt,
      four_state_verifier_result: proof,
      proposal,
    });
    return 0;
  } catch (error) {
    const outcome = error instanceof PolicyContractError ? 'CONTRACT_INVALID' : 'CLI_IO_ERROR';
    emit({
      schema_version: 1,
      outcome,
      message: error instanceof Error ? error.message : 'Verifier CLI failed.',
    });
    return 2;
  }
}

void run().then((exitCode) => {
  process.exitCode = exitCode;
});
