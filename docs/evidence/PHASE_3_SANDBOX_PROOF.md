# Phase 3 sandbox-proof evidence

Date: 24 August 2026

Branch: `phase-3/sandbox-proof`

Scope: Phase 3 only

## Result

Phase 3 passes its prerequisite, implementation, deterministic-test, and TrueForge/Daytona trace gates. A pure TypeScript verifier classifies the required four states from manifest content, a single explicit-path CLI emits stable JSON, and the bounded workflow permits at most one correction before terminal `NO_SAFE_REMEDIATION`.

The accepted TrueForge trace starts from the supported Phase 2 `High` finding, creates a Daytona sandbox, writes the model-generated candidate to exactly `/workspace/candidate/checkout-networkpolicy.yaml` before verification, passes the candidate on attempt one, produces the exact four-state proof, and creates proposal `proposal:sha256:b0292c9aa6290e5ca84e9ede5458d094a645fe1976a10b61827ef8a9c0a45925` only after the proof passes.

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
- Narrow validation for one `networking.k8s.io/v1` `NetworkPolicy`, exact target identity, required DNS UDP/TCP 53 path, required `payments-data/postgres` TCP/5432 path, unrestricted IPv4/IPv6 egress, and the declared forbidden IPv4 destination.
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
- An unrestricted peer hidden beside the intended PostgreSQL peer.
- Malformed YAML and wrong Kubernetes kind.
- Deterministic repeated output.
- First-attempt diagnostics, passing one correction, second-failure `NO_SAFE_REMEDIATION`, and rejection of attempt 3.
- Stable proposal reproduction, one-byte canonical candidate change producing a different hash, and no proposal for a failed candidate.
- Stable CLI output and non-zero failure exits.

## Accepted TrueForge trace

| Item | Safe identifier |
| --- | --- |
| Saved agent | `secureops-guardian-phase-3`; `01m0swktkc85xkpj0tet5zmdqf` |
| Session | `01m0swzfsdrqyxtfpq4xx8n8ch` |
| Turn | `01m0sx01f8dszrfrrv8h48vkg2.336t3a` |
| Daytona sandbox | Suffix `…6e92` |
| Terminal state | `done`; no required actions |
| Pinned TrueForge runtime | `6026509d905fe255bf493e3845b1fca237bdf0fd` |
| Verifier bundle SHA-256 | `5fc82645462a5894be0065b1192f777dbd495042141795815fa2bf39c5944ede` |

The turn input names the already-completed Phase 2 supported finding, immutable suspect SHA, file, rule, asset, and `Unknown` data-access/exfiltration boundary. The completed Phase 2 session/turn in the preceding evidence record predates this Phase 3 session.

### Trace order

| Time (UTC) | Event/call | Observed boundary |
| --- | --- | --- |
| Before Phase 3 | Phase 2 accepted turn `01m0srsx3prre1779j20jb0taw.336t3a` | Supported `High` finding completed before remediation work |
| `12:47:50.716` | `sandbox.created`; event `01m0sx05xvgmvjx1s94vr5f3xf` | Daytona sandbox created after the supported finding input |
| `12:48:01.826` | `call_7127196` | Installed only pinned runtime bootstrap and wrote the candidate at the exact required path; did not read last-good or run verifier |
| `12:48:09.198` | `call_4721370` | First verifier execution with explicit candidate and contract paths |
| `12:48:12.736` | First verifier result | Exit `0`; `SECURITY_REMEDIATION_READY`; attempt `1`; candidate `SECURE_AND_FUNCTIONAL` |
| `12:48:17.469` | `call_862894` | Same bundled CLI invoked with explicit last-good, suspect, deny-all, candidate, contract, and proposal paths |
| `12:48:18.412` | Full proof result | Exit `0`; large stable JSON offloaded by TrueForge; proposal file created |
| `12:48:41.162` | Final model message | Returned both sandbox artifacts, exact proposal hash, matrix, evidence IDs, and limitations |

There was one candidate write and one candidate verification attempt. No correction was needed. The trace contains no candidate read from `last-good.yaml` before the write and no third-attempt path.

Two earlier setup runs are excluded: the first discovered that the stock sandbox lacked Node, and the second exposed an ESM bundle compatibility issue. Neither produced an eligible proposal. The accepted trace uses the corrected CommonJS bundle and is the only pass evidence.

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
- Canonical proposal: [`PHASE_3_PROPOSAL.json`](./PHASE_3_PROPOSAL.json), file SHA-256 `d451ad9f9d1da6fc368bcc43e31ab891d3aedc22fec9f85e944d782b22d25ad4`.
- Proposal SHA-256: `b0292c9aa6290e5ca84e9ede5458d094a645fe1976a10b61827ef8a9c0a45925`.
- Proposal ID: `proposal:sha256:b0292c9aa6290e5ca84e9ede5458d094a645fe1976a10b61827ef8a9c0a45925`.

The proposal artifact contains the canonical candidate YAML, canonical diff deleting only the unrestricted CIDR rule, target repository/base/deterministic future remediation branch/file, suspect SHA, nine supporting evidence IDs, complete four-state and candidate verifier results, three explicit limitations, and the expected Phase 4 GitHub MCP sequence as inert data. It does not implement or authorize that sequence.

Downloading both sandbox artifacts and rerunning the bundled verifier locally reproduced the proposal byte-for-byte and the same internal hash. The candidate is byte-for-byte equal to the checked-in last-good fixture, but the trace proves it was generated from the supplied suspect and explicit contract before last-good was read; it was not copied from a hidden expected answer.

## Limitations and safety boundary

- GitHub commit/diff evidence is real. Deployment, alert, reachability, and dependency observations are owned synthetic fixtures.
- The verifier is a deterministic static model for one owned NetworkPolicy contract. It does not prove Kubernetes admission, CNI enforcement, DNS resolution, packets, application behavior, live reachability, data access, or exfiltration.
- Actual data access and exfiltration remain `Unknown`.
- Runtime bootstrap contacted public package infrastructure without credentials. The sandbox received no GitHub, cloud, cluster, SSH, model, or responder credentials.
- Proposal eligibility authorizes presentation only. It does not authorize approval, a remediation branch/PR, merge, deployment, or cluster action.

## Quality and review gate

Local quality checks and Qodo review are recorded here after the development PR review completes. Until then, Phase 3 remains open and unmerged.

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
| Approval/GitHub remediation/merge/deployment/cluster/later-phase behavior | Not implemented |

Phase 3 implementation and trace gates pass. The development PR/Qodo review remains open, and no Phase 4 or later behavior has started.
