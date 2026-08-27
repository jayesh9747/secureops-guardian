import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { VERIFIER_PACK_ROOT } from '@guardian/shared/verifier-pack-metadata';

import { canonicalJson } from './canonical.js';
import { PolicyContractError, parsePolicyContract } from './contract.js';
import {
  loadVerifierPack,
  PINNED_VERIFIER_PACK_METADATA,
  VerifierPackValidationError,
} from './pack.js';
import { buildEligibleProposal, verifyFourStates } from './proof.js';
import { evaluateCandidateAttempt } from './workflow.js';

interface CliArguments {
  packRoot: string;
  expectedManifestSha256: string;
  candidate?: string;
  attempt: 1 | 2;
  fullProof: boolean;
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
    '--pack-root',
    '--expected-manifest-sha256',
    '--candidate',
    '--attempt',
    '--full-proof',
    '--proposal-output',
  ]);
  for (const flag of values.keys()) {
    if (!allowed.has(flag)) throw new CliArgumentError(`Unknown flag: ${flag}`);
  }
  const packRoot = values.get('--pack-root');
  const expectedManifestSha256 = values.get('--expected-manifest-sha256');
  if (packRoot === undefined || expectedManifestSha256 === undefined) {
    throw new CliArgumentError('--pack-root and --expected-manifest-sha256 are required.');
  }
  if (packRoot !== VERIFIER_PACK_ROOT) {
    throw new CliArgumentError(`--pack-root must be exactly ${VERIFIER_PACK_ROOT}.`);
  }
  if (!/^[0-9a-f]{64}$/u.test(expectedManifestSha256)) {
    throw new CliArgumentError('--expected-manifest-sha256 must be 64 lowercase hex characters.');
  }
  const attemptText = values.get('--attempt') ?? '1';
  if (attemptText !== '1' && attemptText !== '2') {
    throw new CliArgumentError('--attempt must be 1 or 2; a third attempt is prohibited.');
  }
  const fullProofText = values.get('--full-proof') ?? 'false';
  if (fullProofText !== 'true' && fullProofText !== 'false') {
    throw new CliArgumentError('--full-proof must be true or false.');
  }
  const candidate = values.get('--candidate');
  if (candidate === undefined && (fullProofText === 'true' || values.has('--proposal-output'))) {
    throw new CliArgumentError('--full-proof and --proposal-output require --candidate.');
  }
  if (values.has('--proposal-output') && fullProofText !== 'true') {
    throw new CliArgumentError('--proposal-output requires --full-proof true.');
  }

  return {
    packRoot,
    expectedManifestSha256,
    candidate,
    attempt: Number(attemptText) as 1 | 2,
    fullProof: fullProofText === 'true',
    proposalOutput: values.get('--proposal-output'),
  };
}

async function readRequired(path: string, code: string): Promise<string> {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    throw new CliArgumentError(`${code}: unable to read the explicit path.`, { cause: error });
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
    const verifierPack = await loadVerifierPack({
      pack_root: cli.packRoot,
      expected: {
        ...PINNED_VERIFIER_PACK_METADATA,
        manifest_sha256: cli.expectedManifestSha256,
      },
    });
    if (cli.candidate === undefined) {
      emit({ schema_version: 1, outcome: 'VERIFIER_PACK_READY', verifier_pack: verifierPack });
      return 0;
    }

    const [candidateYaml, contractJson] = await Promise.all([
      readRequired(cli.candidate, 'CANDIDATE_READ_ERROR'),
      readRequired(join(cli.packRoot, 'fixtures/expected-contract.json'), 'CONTRACT_READ_ERROR'),
    ]);
    const contract = parsePolicyContract(contractJson);
    const attempt = evaluateCandidateAttempt(candidateYaml, contract, cli.attempt);
    if (attempt.outcome !== 'SECURITY_REMEDIATION_READY') {
      emit({ schema_version: 1, verifier_pack: verifierPack, ...attempt });
      return 1;
    }
    if (!cli.fullProof) {
      emit({ schema_version: 1, verifier_pack: verifierPack, ...attempt });
      return 0;
    }

    const [lastGoodYaml, suspectYaml, denyAllYaml] = await Promise.all([
      readRequired(join(cli.packRoot, 'fixtures/last-good.yaml'), 'LAST_GOOD_READ_ERROR'),
      readRequired(join(cli.packRoot, 'fixtures/suspect.yaml'), 'SUSPECT_READ_ERROR'),
      readRequired(join(cli.packRoot, 'fixtures/deny-all.yaml'), 'DENY_ALL_READ_ERROR'),
    ]);
    const proof = verifyFourStates(
      { lastGoodYaml, suspectYaml, denyAllYaml, candidateYaml },
      contract,
      verifierPack,
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
      } catch (error) {
        throw new CliArgumentError('PROPOSAL_WRITE_ERROR: unable to write the explicit path.', {
          cause: error,
        });
      }
    }
    emit({
      schema_version: 1,
      outcome: 'SECURITY_REMEDIATION_READY',
      attempts_used: cli.attempt,
      verifier_pack: verifierPack,
      four_state_verifier_result: proof,
      proposal,
    });
    return 0;
  } catch (error) {
    if (error instanceof VerifierPackValidationError) {
      emit({
        schema_version: 1,
        outcome: 'VERIFIER_PACK_INVALID',
        code: error.code,
        message: error.message,
      });
      return 2;
    }
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
