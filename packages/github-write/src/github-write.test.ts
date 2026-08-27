import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

import {
  buildEligibleProposal,
  canonicalJson,
  parsePolicyContract,
  verifyFourStates,
} from '@guardian/policy-verifier';
import { VERIFIER_PACK_IDENTITY } from '@guardian/shared';
import { describe, expect, it } from 'vitest';

import { PHASE_FOUR_AGENT_SPEC } from './agent.js';
import { bindEligibleProposal } from './binding.js';
import {
  PHASE_FOUR_TARGET,
  PHASE_THREE_PROPOSAL_HASH,
  SUSPECT_CANDIDATE_GIT_BLOB_SHA,
  VERIFIED_CANDIDATE_GIT_BLOB_SHA,
  VERIFIED_CANDIDATE_SHA256,
  VERIFIED_CANDIDATE_YAML,
} from './constants.js';
import {
  decideWrite,
  evaluateRemoteSnapshot,
  expectedWriteCall,
  writeCallMatchesProposal,
  type RemoteSnapshot,
} from './contract.js';
import { buildPreMutationPresentation } from './presentation.js';
import { buildPhaseFourReceiptArtifacts } from './receipt-artifacts.js';
import { buildActionReceipt } from './receipt.js';

const candidateArtifact = readFileSync(
  new URL('../../../docs/evidence/PHASE_3_CANDIDATE.yaml', import.meta.url),
  'utf8',
);
const policyFixture = (name: string) =>
  readFileSync(new URL(`../../policy-verifier/fixtures/${name}`, import.meta.url), 'utf8');
const suspectArtifact = policyFixture('suspect.yaml');
const proof = verifyFourStates(
  {
    lastGoodYaml: candidateArtifact,
    suspectYaml: suspectArtifact,
    denyAllYaml: policyFixture('deny-all.yaml'),
    candidateYaml: candidateArtifact,
  },
  parsePolicyContract(policyFixture('expected-contract.json')),
  VERIFIER_PACK_IDENTITY,
);
const proposal = buildEligibleProposal({
  candidateYaml: candidateArtifact,
  suspectYaml: suspectArtifact,
  proof,
});
if (proposal === undefined) throw new Error('Expected the controlling eligible proposal.');
const bindingResult = bindEligibleProposal(proposal);
if (bindingResult.status !== 'BOUND') throw new Error(bindingResult.reason);
const binding = bindingResult.binding;
const baseCommitSha = '7b2f2ad51f9ef97334176fbfed3138465b62fcdb';
const candidateCommitSha = '44fb8c7f5e99f835c6779f5e7b777c1b016af5b3';

function snapshot(overrides: Partial<RemoteSnapshot> = {}): RemoteSnapshot {
  return {
    base: {
      commitSha: baseCommitSha,
      targetFileGitBlobSha: SUSPECT_CANDIDATE_GIT_BLOB_SHA,
    },
    branch: null,
    pullRequest: null,
    ...overrides,
  };
}

describe('Phase 4 proposal binding and presentation', () => {
  it('byte-matches the displayed candidate to the merged sandbox-verified artifact', () => {
    const candidateBytes = Buffer.from(binding.candidateYaml);
    const candidateGitBlobSha = createHash('sha1')
      .update(`blob ${String(candidateBytes.byteLength)}\0`)
      .update(candidateBytes)
      .digest('hex');
    expect(binding.candidateYaml).toBe(candidateArtifact);
    expect(binding.candidateYaml).toBe(VERIFIED_CANDIDATE_YAML);
    expect(binding.candidateSha256).toBe(VERIFIED_CANDIDATE_SHA256);
    expect(binding.candidateGitBlobSha).toBe(VERIFIED_CANDIDATE_GIT_BLOB_SHA);
    expect(createHash('sha256').update(candidateBytes).digest('hex')).toBe(
      VERIFIED_CANDIDATE_SHA256,
    );
    expect(candidateGitBlobSha).toBe(VERIFIED_CANDIDATE_GIT_BLOB_SHA);
  });

  it('fails closed for a mismatched proposal hash or target', () => {
    expect(bindEligibleProposal({ ...proposal, proposal_hash_sha256: '0'.repeat(64) }).status).toBe(
      'WRITE_CONFLICT',
    );
    expect(
      bindEligibleProposal({
        ...proposal,
        target: { ...proposal.target, repository: 'jayesh9747/secureops-guardian' },
      }).status,
    ).toBe('WRITE_CONFLICT');
    expect(
      decideWrite({ ...proposal, proposal_hash_sha256: '0'.repeat(64) }, snapshot()).status,
    ).toBe('WRITE_CONFLICT');
    expect(
      bindEligibleProposal({
        ...proposal,
        verifier_pack: { ...proposal.verifier_pack, manifest_sha256: 'f'.repeat(64) },
      }).status,
    ).toBe('WRITE_CONFLICT');
  });

  it('rejects proof rows whose security flags contradict their classification', () => {
    const inconsistentProof = structuredClone(proposal);
    const candidate = inconsistentProof.four_state_verifier_result.states.find(
      ({ state }) => state === 'candidate',
    );
    if (candidate === undefined) throw new Error('Expected candidate proof row.');
    candidate.result.secure = false;
    expect(bindEligibleProposal(inconsistentProof).status).toBe('WRITE_CONFLICT');
  });

  it('presents every decision field before mutation', () => {
    const presentation = buildPreMutationPresentation(binding);
    expect(presentation).toContain(PHASE_FOUR_TARGET.repository);
    expect(presentation).toContain(PHASE_FOUR_TARGET.remediationBranch);
    expect(presentation).toContain(binding.proposal.canonical_diff);
    expect(presentation).toContain(binding.candidateYaml);
    expect(presentation).toContain(PHASE_THREE_PROPOSAL_HASH);
    expect(presentation).toContain(binding.proposal.verifier_pack.pack_id);
    expect(presentation).toContain(binding.proposal.verifier_pack.pack_version);
    expect(presentation).toContain(binding.proposal.verifier_pack.source_revision);
    expect(presentation).toContain(binding.proposal.verifier_pack.manifest_sha256);
    expect(presentation).toContain(binding.proposal.verifier_pack_binding_sha256);
    expect(presentation).toContain('evidence:security-alert:checkout-egress:001');
    expect(presentation).toContain('SECURE_BUT_OPERATIONALLY_REJECTED');
    expect(presentation).toContain('retry-safe, not atomic');
  });
});

describe('Phase 4 ordered write contract', () => {
  it('binds every approved write argument to the eligible proposal', () => {
    for (const step of ['CREATE_BRANCH', 'UPDATE_FILE', 'CREATE_PR'] as const) {
      const call = expectedWriteCall(binding, step);
      expect(writeCallMatchesProposal(binding, step, call)).toBe(true);
      expect(JSON.stringify(call)).toContain(PHASE_FOUR_TARGET.repo);
    }
    expect(JSON.stringify(expectedWriteCall(binding, 'UPDATE_FILE'))).toContain(
      PHASE_THREE_PROPOSAL_HASH,
    );
    expect(JSON.stringify(expectedWriteCall(binding, 'CREATE_PR'))).toContain(
      PHASE_THREE_PROPOSAL_HASH,
    );
  });

  it('rejects broader repository permissions, targets, files, and tools', () => {
    const update = expectedWriteCall(binding, 'UPDATE_FILE');
    expect(
      writeCallMatchesProposal(binding, 'UPDATE_FILE', {
        ...update,
        arguments: { ...update.arguments, repo: 'secureops-guardian' },
      }),
    ).toBe(false);
    expect(
      writeCallMatchesProposal(binding, 'UPDATE_FILE', {
        ...update,
        arguments: { ...update.arguments, path: 'README.md' },
      }),
    ).toBe(false);
    expect(
      writeCallMatchesProposal(binding, 'CREATE_PR', {
        tool: 'create_or_update_file',
        arguments: expectedWriteCall(binding, 'CREATE_PR').arguments,
      }),
    ).toBe(false);
  });

  it('requires remote candidate verification before PR creation', () => {
    const unmodifiedBranch = snapshot({
      branch: {
        commitSha: baseCommitSha,
        targetFileGitBlobSha: SUSPECT_CANDIDATE_GIT_BLOB_SHA,
        commitMessage: 'fixture base',
      },
    });
    expect(evaluateRemoteSnapshot(binding, unmodifiedBranch)).toEqual({
      status: 'WRITE_REQUIRED',
      step: 'UPDATE_FILE',
    });

    const verifiedBranch = snapshot({
      branch: {
        commitSha: candidateCommitSha,
        targetFileGitBlobSha: VERIFIED_CANDIDATE_GIT_BLOB_SHA,
        commitMessage: binding.commitMessage,
      },
    });
    expect(evaluateRemoteSnapshot(binding, verifiedBranch)).toEqual({
      status: 'WRITE_REQUIRED',
      step: 'CREATE_PR',
    });
  });

  it('reuses the original matching PR without duplication', () => {
    const decision = evaluateRemoteSnapshot(
      binding,
      snapshot({
        branch: {
          commitSha: candidateCommitSha,
          targetFileGitBlobSha: VERIFIED_CANDIDATE_GIT_BLOB_SHA,
          commitMessage: binding.commitMessage,
        },
        pullRequest: {
          number: 7,
          url: 'https://github.com/jayesh9747/guardian-demo-checkout/pull/7',
          title: binding.pullRequestTitle,
          base: PHASE_FOUR_TARGET.baseBranch,
          head: PHASE_FOUR_TARGET.remediationBranch,
          body: binding.pullRequestBody,
        },
      }),
    );
    expect(decision).toEqual({
      status: 'PR_REUSED',
      remoteCommitSha: candidateCommitSha,
      prNumber: 7,
      prUrl: 'https://github.com/jayesh9747/guardian-demo-checkout/pull/7',
    });

    const alteredBody = snapshot({
      branch: {
        commitSha: candidateCommitSha,
        targetFileGitBlobSha: VERIFIED_CANDIDATE_GIT_BLOB_SHA,
        commitMessage: binding.commitMessage,
      },
      pullRequest: {
        number: 7,
        url: 'https://github.com/jayesh9747/guardian-demo-checkout/pull/7',
        title: binding.pullRequestTitle,
        base: PHASE_FOUR_TARGET.baseBranch,
        head: PHASE_FOUR_TARGET.remediationBranch,
        body: `${binding.pullRequestBody} `,
      },
    });
    expect(evaluateRemoteSnapshot(binding, alteredBody).status).toBe('WRITE_CONFLICT');
  });

  it('fails closed instead of overwriting mismatched remote work', () => {
    const mismatchedContent = evaluateRemoteSnapshot(
      binding,
      snapshot({
        branch: {
          commitSha: 'd'.repeat(40),
          targetFileGitBlobSha: 'f'.repeat(40),
          commitMessage: binding.commitMessage,
        },
      }),
    );
    expect(mismatchedContent.status).toBe('WRITE_CONFLICT');

    const changedBase = evaluateRemoteSnapshot(
      binding,
      snapshot({
        base: { commitSha: 'c'.repeat(40), targetFileGitBlobSha: 'e'.repeat(40) },
      }),
    );
    expect(changedBase.status).toBe('WRITE_CONFLICT');

    expect(() =>
      evaluateRemoteSnapshot(binding, {
        ...snapshot(),
        base: { commitSha: 'base-commit', targetFileGitBlobSha: 'e'.repeat(40) },
      }),
    ).toThrow();
  });
});

describe('Phase 4 truthful receipts and TrueForge policy', () => {
  it('keeps every committed receipt byte-semantically derived from the receipt builder', () => {
    for (const receiptCase of buildPhaseFourReceiptArtifacts(binding)) {
      const committed = JSON.parse(
        readFileSync(
          new URL(`../../../docs/evidence/${receiptCase.fileName}`, import.meta.url),
          'utf8',
        ),
      ) as unknown;
      const {
        verifier_pack: historicalPackMigration,
        verifier_pack_binding_sha256: historicalPackBindingMigration,
        ...historicalReceipt
      } = receiptCase.receipt;
      expect(historicalPackMigration.pack_id).toBe('k8s-network-egress-v1');
      expect(historicalPackBindingMigration).toMatch(/^[0-9a-f]{64}$/u);
      expect(canonicalJson(committed)).toBe(canonicalJson(historicalReceipt));
    }
  });

  it('proves denial performs zero writes and claims no mutation', () => {
    const receipt = buildActionReceipt(binding, {
      status: 'DENIED',
      deniedToolCallReferences: ['call_denied_branch'],
      githubResultReferences: ['read_before', 'read_after'],
      remoteCandidateVerified: false,
      baseBranchUnchanged: true,
      deterministicBranchAbsent: true,
      matchingPullRequestAbsent: true,
    });
    expect(receipt.status).toBe('DENIED');
    expect(receipt.approved_tool_call_references).toEqual([]);
    expect(receipt.denied_tool_call_references).toEqual(['call_denied_branch']);
    expect(receipt.verifier_pack).toEqual(binding.proposal.verifier_pack);
    expect(receipt.verifier_pack_binding_sha256).toBe(
      binding.proposal.verifier_pack_binding_sha256,
    );
    expect(receipt).not.toHaveProperty('remote_commit_sha');
    expect(receipt).not.toHaveProperty('pr_url');

    expect(() =>
      buildActionReceipt(binding, {
        status: 'DENIED',
        deniedToolCallReferences: ['call_denied_branch'],
        githubResultReferences: ['read_after'],
        remoteCandidateVerified: false,
        baseBranchUnchanged: true,
        deterministicBranchAbsent: false,
        matchingPullRequestAbsent: true,
      }),
    ).toThrow();
  });

  it('never claims mutations unsupported by GitHub and TrueForge results', () => {
    expect(() =>
      buildActionReceipt(binding, {
        status: 'PR_CREATED',
        approvedToolCallReferences: ['branch', 'file'],
        githubResultReferences: ['branch-result', 'file-result'],
        remoteCandidateVerified: false,
        baseBranchUnchanged: true,
        remoteCommitSha: candidateCommitSha,
        prNumber: 7,
        prUrl: 'https://github.com/jayesh9747/guardian-demo-checkout/pull/7',
      }),
    ).toThrow();

    expect(() =>
      buildActionReceipt(binding, {
        status: 'WRITE_CONFLICT',
        reason: 'Existing remote work differs.',
        githubResultReferences: ['conflict-read'],
        remoteCandidateVerified: false,
        baseBranchUnchanged: true,
        prNumber: 7,
        prUrl: 'https://github.com/jayesh9747/guardian-demo-checkout/pull/7',
      }),
    ).toThrow();
  });

  it('enables only minimum GitHub tools and approval-gates every write', () => {
    const github = PHASE_FOUR_AGENT_SPEC.manifest.mcp_servers[0];
    expect(github?.enable_tools).toEqual([
      'list_branches',
      'list_pull_requests',
      'get_file_contents',
      'get_commit',
      'create_branch',
      'create_or_update_file',
      'create_pull_request',
    ]);
    expect(github?.require_approval_for_tools).toEqual([
      'create_branch',
      'create_or_update_file',
      'create_pull_request',
    ]);
    expect(github?.enable_tools).not.toContain('merge_pull_request');
    expect(JSON.stringify(PHASE_FOUR_AGENT_SPEC)).not.toContain('delete_file');
    expect(PHASE_FOUR_AGENT_SPEC.manifest.config).toMatchObject({
      sandbox: { enabled: false },
      dynamic_sub_agents: { enabled: false },
    });
  });
});
