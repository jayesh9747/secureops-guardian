import type { PolicyContract, VerificationResult } from './types.js';
import { verifyNetworkPolicy } from './verifier.js';

export type CandidateAttemptOutcome =
  | {
      outcome: 'SECURITY_REMEDIATION_READY';
      attempts_used: 1 | 2;
      verifier_result: VerificationResult;
    }
  | {
      outcome: 'CORRECTION_REQUIRED';
      attempts_used: 1;
      attempts_remaining: 1;
      verifier_result: VerificationResult;
      diagnostics: string[];
    }
  | {
      outcome: 'NO_SAFE_REMEDIATION';
      attempts_used: 2;
      attempts_remaining: 0;
      verifier_result: VerificationResult;
      diagnostics: string[];
    };

export type BoundedCandidateWorkflowOutcome =
  | {
      outcome: 'SECURITY_REMEDIATION_READY';
      attempts: readonly CandidateAttemptOutcome[];
    }
  | {
      outcome: 'NO_SAFE_REMEDIATION';
      attempts: readonly [
        Extract<CandidateAttemptOutcome, { outcome: 'CORRECTION_REQUIRED' }>,
        Extract<CandidateAttemptOutcome, { outcome: 'NO_SAFE_REMEDIATION' }>,
      ];
    };

function failedDiagnostics(result: VerificationResult): string[] {
  return result.checks
    .filter((check) => !check.passed)
    .map((check) => `${check.id}: ${check.message}`);
}

export function evaluateCandidateAttempt(
  candidateYaml: string,
  contract: PolicyContract,
  attempt: 1,
): Extract<
  CandidateAttemptOutcome,
  { outcome: 'SECURITY_REMEDIATION_READY' | 'CORRECTION_REQUIRED' }
>;
export function evaluateCandidateAttempt(
  candidateYaml: string,
  contract: PolicyContract,
  attempt: 2,
): Extract<
  CandidateAttemptOutcome,
  { outcome: 'SECURITY_REMEDIATION_READY' | 'NO_SAFE_REMEDIATION' }
>;
export function evaluateCandidateAttempt(
  candidateYaml: string,
  contract: PolicyContract,
  attempt: 1 | 2,
): CandidateAttemptOutcome;
export function evaluateCandidateAttempt(
  candidateYaml: string,
  contract: PolicyContract,
  attempt: 1 | 2,
): CandidateAttemptOutcome {
  const verifierResult = verifyNetworkPolicy(candidateYaml, contract);
  if (verifierResult.eligible) {
    return {
      outcome: 'SECURITY_REMEDIATION_READY',
      attempts_used: attempt,
      verifier_result: verifierResult,
    };
  }
  if (attempt === 1) {
    return {
      outcome: 'CORRECTION_REQUIRED',
      attempts_used: 1,
      attempts_remaining: 1,
      verifier_result: verifierResult,
      diagnostics: failedDiagnostics(verifierResult),
    };
  }
  return {
    outcome: 'NO_SAFE_REMEDIATION',
    attempts_used: 2,
    attempts_remaining: 0,
    verifier_result: verifierResult,
    diagnostics: failedDiagnostics(verifierResult),
  };
}

export function runBoundedCandidateWorkflow(
  candidateYamls: readonly [initial: string, corrected: string],
  contract: PolicyContract,
): BoundedCandidateWorkflowOutcome {
  const firstAttempt = evaluateCandidateAttempt(candidateYamls[0], contract, 1);
  if (firstAttempt.outcome === 'SECURITY_REMEDIATION_READY') {
    return { outcome: firstAttempt.outcome, attempts: [firstAttempt] };
  }
  const secondAttempt = evaluateCandidateAttempt(candidateYamls[1], contract, 2);
  if (secondAttempt.outcome === 'SECURITY_REMEDIATION_READY') {
    return { outcome: secondAttempt.outcome, attempts: [firstAttempt, secondAttempt] };
  }
  return {
    outcome: 'NO_SAFE_REMEDIATION',
    attempts: [firstAttempt, secondAttempt],
  };
}
