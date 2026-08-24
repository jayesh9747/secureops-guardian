# Phase 3 sandbox-proof evidence

Date: 24 August 2026

Branch: `phase-3/sandbox-proof`

Scope: Phase 3 only

## Result

Phase 3 passes its prerequisite, implementation, deterministic-test, and TrueForge/Daytona trace gates. A pure TypeScript verifier classifies the required four states from manifest content, a single explicit-path CLI emits stable JSON, and the bounded workflow permits at most one correction before terminal `NO_SAFE_REMEDIATION`.

The accepted TrueForge trace starts from the supported Phase 2 `High` finding, creates a Daytona sandbox, writes the model-generated candidate to exactly `/workspace/candidate/checkout-networkpolicy.yaml` before verification, passes the candidate on attempt one, produces the exact four-state proof, and creates proposal `proposal:sha256:2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` only after the proof passes.

No MCP connector, GitHub read/write, approval, remediation branch/PR, merge, deployment, Kubernetes API, cluster, SSH endpoint, or external responder was used in the accepted run. Credential-free public package retrieval was used only to bootstrap pinned `uv==0.12.5` and `nodejs-wheel-binaries==22.14.0` inside the stock sandbox image.

## Entry-gate verification

| Prerequisite | Observed evidence | Result |
| --- | --- | --- |
| Product PR #3 merged | `jayesh9747/secureops-guardian#3` is `MERGED`; merge commit `05a07dc812b3b7e7ae7dce5534311f7f26f3ad1b` | Pass |
| Updated `main` contains Phase 2 head | `fec1463146a8bceb233e4e126acca4acb68e14cb` is an ancestor of `origin/main` | Pass |
| Supported finding available | Phase 2 evidence records `SUPPORTED_SECURITY_FINDING`, severity `High`, all four causal links, and actual data access/exfiltration `Unknown` | Pass |
| Last-good fixture commit available | `a6d177b43396c7b4b45aa98cb2970d0489a7a4f9` exists and is an ancestor of fixture `origin/main` | Pass |
| Suspect fixture commit available | `7b2f2ad51f9ef97334176fbfed3138465b62fcdb` exists and is an ancestor of fixture `origin/main` | Pass |
| Three worktrees inspected | Product was clean before branching; fixture was clean; TrueForge remained pinned at `6026509d905fe255bf493e3845b1fca237bdf0fd` | Pass |
| Operator-owned change preserved | TrueForge `docker-compose.yml` retained its existing `HOST: 0.0.0.0` change and was not staged or modified | Pass |
| Correct branch point | `phase-3/sandbox-proof` merge base is updated product `main` at `05a07dc812b3b7e7ae7dce5534311f7f26f3ad1b` | Pass |

Fixture repository history was not modified.

## Deterministic implementation

The new `@guardian/policy-verifier` workspace contains:

- A pure `verifyNetworkPolicy(candidateYaml, contract)` evaluator with no filesystem, shell, network, environment, or clock access.
- Fail-closed validation for the exact owned `networking.k8s.io/v1` `NetworkPolicy` subset, including exact selector semantics, peer and port shapes, valid CIDRs, exact target identity, exact DNS UDP/TCP 53 and `payments-data/postgres` TCP/5432 paths, unrestricted IPv4/IPv6 egress, and the declared forbidden IPv4 destination.
- One CLI requiring explicit `--candidate` and `--contract` paths. Optional explicit proof paths run the same evaluator for all four states and write the exact proposal artifact.
- A first-failure `CORRECTION_REQUIRED` result with named diagnostics, one remaining attempt, and terminal `NO_SAFE_REMEDIATION` on a failed `--attempt 2`. The CLI rejects attempt 3.
- Canonical YAML, deterministic full-file unified diff, stable canonical JSON, and SHA-256 proposal binding.

Checked-in inputs:

| Fixture | Role | SHA-256 |
| --- | --- | --- |
| `packages/policy-verifier/fixtures/last-good.yaml` | Secure and functional baseline | `c282434c506a45e93e39d2329b33c8466ba7a8a1d5d238817530678d975ad165` |
| `packages/policy-verifier/fixtures/suspect.yaml` | Functional unrestricted-egress regression | `7209dbcc30d389e671307cd92d6fd6b5133781d090181cd56116594e616613d7` |
| `packages/policy-verifier/fixtures/deny-all.yaml` | Secure but non-functional containment | `ff123d62fa5f5b110ae4f6a2c27c88f180ef272a34fc9373ed4f87e41e66088a` |
| `packages/policy-verifier/fixtures/expected-contract.json` | Explicit target, dependency, and forbidden-destination contract | `a78eca23e3fb80f8922f227cc544811cd0c0fc8c23961efa8ee392cbed909a7b` |

The last-good and suspect files are byte-for-byte copies of their immutable fixture-commit versions.

## Adversarial and workflow tests

Tests invoke the evaluator directly without shell or network. They cover:

- Required last-good, suspect, deny-all, and candidate classifications derived from content rather than labels or file names.
- Reintroduced `0.0.0.0/0` and a bounded CIDR containing `203.0.113.10`.
- Missing DNS.
- Wrong PostgreSQL namespace selector.
- Wrong PostgreSQL port and wrong protocol.
- Additional PostgreSQL ports or peers outside the exact dependency contract.
- Target `matchExpressions` outside the supported `matchLabels` subset.
- Structurally invalid `ipBlock` CIDRs.
- An unrestricted peer hidden beside the intended PostgreSQL peer.
- Malformed YAML and wrong Kubernetes kind.
- Deterministic repeated output.
- First-attempt diagnostics, passing one correction, second-failure `NO_SAFE_REMEDIATION`, and rejection of attempt 3.
- Stable proposal reproduction, one-byte canonical candidate change producing a different hash, and no proposal for a failed candidate.
- Stable CLI output and non-zero failure exits.

## Review remediation and root cause

The read-only review of PR #4 identified four false-positive or cross-phase contract defects. The root causes were:

1. The supported-subset validator checked container types but did not reject unmodeled selector and peer fields, so Kubernetes semantics such as target `matchExpressions` or an invalid `ipBlock` CIDR could be ignored.
2. Required paths were matched as subsets, so a rule containing the required peer/port plus additional peers or ports remained eligible.
3. The deterministic remediation branch was an independent Phase 3 literal that had drifted from the authoritative Phase 4 contract.

Regression tests reproduced all four defects before the repair. The verifier now rejects selector semantics and peer structures outside the exact owned subset, validates CIDR syntax, and requires exact peer and port sets for dependency rules. The canonical proposal now binds `guardian/fix-checkout-egress`. The original combined reproduction and all focused tests pass after the repair.

## Accepted TrueForge trace

| Item | Safe identifier |
| --- | --- |
| Saved agent | `secureops-guardian-phase-3`; `01m0swktkc85xkpj0tet5zmdqf` |
| Session | `01m0t1nsjd2czp5axrxpk23j3k` |
| Turn | `01m0t1nskctevzz7sdbb4dh5ya.336t3a` |
| Daytona sandbox | Suffix `…bd33` |
| Terminal state | `done`; no required actions |
| Pinned TrueForge runtime | `6026509d905fe255bf493e3845b1fca237bdf0fd` |
| Verifier bundle SHA-256 | `e13d646d13efa59e187715da98e6f8ff5253fda3af2caf8242beb36c4505a969` |

The turn input names the already-completed Phase 2 supported finding, immutable suspect SHA, file, rule, asset, and `Unknown` data-access/exfiltration boundary. The completed Phase 2 session/turn in the preceding evidence record predates this Phase 3 session.

### Trace order

| Time (UTC) | Event/call | Observed boundary |
| --- | --- | --- |
| Before Phase 3 | Phase 2 accepted turn `01m0srsx3prre1779j20jb0taw.336t3a` | Supported `High` finding completed before remediation work |
| `14:09:39.613` | `sandbox.created`; event `01m0t1nzrw6a5zcnp18wth5wwv` | Daytona sandbox created after the supported finding input |
| `14:09:52.067` | `call_5961836` | Installed only pinned runtime bootstrap and wrote the candidate at the exact required path; did not read last-good or run verifier |
| `14:10:00.915` | `call_7127073` | First verifier execution with explicit candidate and contract paths |
| `14:10:05.408` | First verifier result | Exit `0`; `SECURITY_REMEDIATION_READY`; attempt `1`; candidate `SECURE_AND_FUNCTIONAL` |
| `14:10:12.079` | `call_1300203` | Same bundled CLI invoked with explicit last-good, suspect, deny-all, candidate, contract, and proposal paths |
| `14:10:13.461` | Full proof result | Exit `0`; large stable JSON offloaded by TrueForge; proposal file created |
| `14:10:19.549` | `call_7494215` | Read the already-created proposal artifact after proof; no candidate or proposal mutation |
| `14:10:35.040` | Final model message | Returned both sandbox artifacts, exact proposal hash, matrix, evidence IDs, and limitations |

There was one candidate write and one candidate verification attempt. No correction was needed. The trace contains no candidate read from `last-good.yaml` before the write and no third-attempt path. The final sandbox call only read the proposal after the proof had created it.

Two earlier setup runs are excluded: the first discovered that the stock sandbox lacked Node, and the second exposed an ESM bundle compatibility issue. Neither produced an eligible proposal. The earlier Phase 3 passing trace is superseded because it used the pre-review verifier bundle and proposal branch. The accepted trace above uses the repaired CommonJS bundle and is the controlling pass evidence.

## Four-state result

| State | Classification | Secure | Functional | Eligible |
| --- | --- | --- | --- | --- |
| last-good | `SECURE_AND_FUNCTIONAL` | Yes | Yes | Yes |
| suspect | `EXPOSED` | No | Yes | No |
| deny-all | `SECURE_BUT_OPERATIONALLY_REJECTED` | Yes | No | No |
| candidate | `SECURE_AND_FUNCTIONAL` | Yes | Yes | Yes |

All eight named candidate checks pass. Suspect fails `NO_UNRESTRICTED_EGRESS` and `FORBIDDEN_DESTINATION_EXCLUDED`. Deny-all passes both security checks but fails `DNS_REQUIRED_PATH` and `POSTGRES_REQUIRED_PATH`.

## Exact proposal artifacts

- Model-written candidate: [`PHASE_3_CANDIDATE.yaml`](./PHASE_3_CANDIDATE.yaml), SHA-256 `c282434c506a45e93e39d2329b33c8466ba7a8a1d5d238817530678d975ad165`.
- Canonical proposal: [`PHASE_3_PROPOSAL.json`](./PHASE_3_PROPOSAL.json), file SHA-256 `1fda8108cd599fc3ddc5f38bb02c8a6c6bcffe7321d9c145d1694bb34b2bde27`.
- Proposal SHA-256: `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15`.
- Proposal ID: `proposal:sha256:2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15`.

The proposal artifact contains the canonical candidate YAML, canonical diff deleting only the unrestricted CIDR rule, target repository/base/deterministic future remediation branch/file, suspect SHA, nine supporting evidence IDs, complete four-state and candidate verifier results, three explicit limitations, and the expected Phase 4 GitHub MCP sequence as inert data. It does not implement or authorize that sequence.

Downloading both sandbox artifacts and rerunning the bundled verifier locally reproduced the proposal byte-for-byte and the same internal hash. The candidate is byte-for-byte equal to the checked-in last-good fixture, but the trace proves it was generated from the supplied suspect and explicit contract before last-good was read; it was not copied from a hidden expected answer.

## Limitations and safety boundary

- GitHub commit/diff evidence is real. Deployment, alert, reachability, and dependency observations are owned synthetic fixtures.
- The verifier is a deterministic static model for one owned NetworkPolicy contract. It does not prove Kubernetes admission, CNI enforcement, DNS resolution, packets, application behavior, live reachability, data access, or exfiltration.
- Actual data access and exfiltration remain `Unknown`.
- Runtime bootstrap contacted public package infrastructure without credentials. The sandbox received no GitHub, cloud, cluster, SSH, model, or responder credentials.
- Proposal eligibility authorizes presentation only. It does not authorize approval, a remediation branch/PR, merge, deployment, or cluster action.

## Quality and review gate

| Command/check | Observed result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Pass; lockfile already up to date |
| `pnpm format:check` | Pass |
| `pnpm lint` | Pass |
| `pnpm typecheck` | Pass |
| `pnpm test` | Pass; 9 files and 62 tests |
| `pnpm build` | Pass |
| `pnpm bundle:verifier` | Pass; CommonJS sandbox bundle built |
| Downloaded-artifact/local proposal reproduction | Pass; byte-for-byte equal proposal and identical internal hash |
| Committed-file secret scan | Pass |
| Committed-file local absolute-path scan | Pass |
| `git diff --check` | Pass |
| GitGuardian Security Checks | Pass on PR #4 |

Development PR: `jayesh9747/secureops-guardian#4`, open and unmerged.

Qodo automatically attempted its review after PR creation and posted `Qodo reviews are paused for this user.` No Qodo review or findings were produced. This matches the already-recorded account limitation from Phase 2. The record does not infer a zero-finding review, and the PR remains open.

## Exit-gate conclusion

| Gate | Result |
| --- | --- |
| Pure deterministic TypeScript verifier | Pass |
| One explicit-path stable-JSON CLI | Pass |
| Checked-in contract and last-good/suspect/deny-all fixtures | Pass |
| Content-derived four-state proof | Pass |
| Exact sandbox candidate path and ordering | Pass |
| At most one correction and terminal second-failure behavior | Pass |
| Canonical candidate/diff/hash/evidence/result/limitations | Pass |
| Required adversarial tests | Pass |
| Eligible proposal created only after passing proof | Pass |
| Frozen install, format, lint, typecheck, tests, build, scans | Pass |
| Qodo review | Attempted; externally unavailable because reviews are paused for this user |
| Approval/GitHub remediation/merge/deployment/cluster/later-phase behavior | Not implemented |

Phase 3 implementation, deterministic proof, TrueForge trace, and local quality gates pass. PR #4 remains open and unmerged because Qodo review is externally unavailable, and no Phase 4 or later behavior has started.
