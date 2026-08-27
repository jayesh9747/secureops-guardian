# Expansion Phase 2 verifier skill bundle evidence

Date: 27 August 2026.

## Result

Expansion Phase 2 replaces the primary five-file upload ceremony with one immutable TrueForge skill bundle. It adds no verifier pack, workload rule, UI redesign, live Kubernetes access, public download fallback, or TrueForge upstream change.

The product branch is `expansion-phase-2/verifier-skill-bundle` from Phase 8 merge `08684b89ef97d5487b236ea94e894bdda77e5c4c`. The separate public skill repository is [`jayesh9747/secureops-guardian-verifier-skill`](https://github.com/jayesh9747/secureops-guardian-verifier-skill), branch `expansion-phase-2/verifier-skill-bundle`, commit `ade2d1453bba033dd3300a7c7aede6e28b97582d`, immutable tag `guardian-network-egress-v1.0.4`, and unmerged skill PR [#1](https://github.com/jayesh9747/secureops-guardian-verifier-skill/pull/1).

## Immutable bundle identity

| Field | Pinned value |
| --- | --- |
| TrueForge skill | `guardian-network-egress-v1` |
| Pack ID | `k8s-network-egress-v1` |
| Pack version | `1.0.4` |
| Source revision | `guardian-network-egress-v1.0.4` |
| Skill source commit | `ade2d1453bba033dd3300a7c7aede6e28b97582d` |
| Manifest SHA-256 | `e70853b49715a949f61ae7584ef963b15267026051091a169e78a27249a869fe` |
| Bundle SHA-256 | `028172c2b937dc95e1d406db49d5801d5742a5636b5360dc99bd1d6b4c0049f9` |
| Proposal SHA-256 | `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` |
| Pack-binding SHA-256 | `3afb251833539c6383a999c2255934c76648994505857e543bc5d3959b7c9e20` |

The manifest contains exactly six payload files:

| Path | SHA-256 |
| --- | --- |
| `SKILL.md` | `2cc6f7c74dbc77d6d98b1d41a8787b768953220205cdcd5e8e6fc9077b2356da` |
| `verifier.bundle.cjs` | `028172c2b937dc95e1d406db49d5801d5742a5636b5360dc99bd1d6b4c0049f9` |
| `fixtures/expected-contract.json` | `a78eca23e3fb80f8922f227cc544811cd0c0fc8c23961efa8ee392cbed909a7b` |
| `fixtures/suspect.yaml` | `7209dbcc30d389e671307cd92d6fd6b5133781d090181cd56116594e616613d7` |
| `fixtures/deny-all.yaml` | `ff123d62fa5f5b110ae4f6a2c27c88f180ef272a34fc9373ed4f87e41e66088a` |
| `fixtures/last-good.yaml` | `c282434c506a45e93e39d2329b33c8466ba7a8a1d5d238817530678d975ad165` |

The bundle rejects a missing manifest, a missing payload, an extra manifest entry, a digest mismatch, a wrong pack/version/revision, or a scope mismatch. Its CLI also rejects every `--pack-root` except the runtime-proven absolute root, so a generated or repository copy with a self-computed digest cannot cross the trust boundary. It never searches another path or accepts generated, downloaded, repository, package, or upload content as a substitute.

## Actual TrueForge mount path

The checked-in TrueForge documentation describes `/opt/tfy/skills/{name}` while the running Phase 9 container announced and materialized this registered skill under `/opt/tf/skills/guardian-network-egress-v1`. Runtime evidence therefore controls the saved contract.

The first discovery session was `01m10wm7m05mmed1jb0bzwcmsv`, turn `01m10wmf0wx0qzm0b4bdzg1mrq.9ziser`. It proved the announced root with the initial inert commit before the final payload was pinned.

The accepted final v1.0.4 staging is part of PREPARE session `01m11567dc0w2sr2m1dd605a2v`, turn `01m1156hn89rqprh1sswr7pdwq.ueyhrn`. After both support/evidence children completed, its first two sandbox executions were:

1. exact `test -f` checks for `SKILL.md`, `manifest.json`, `verifier.bundle.cjs`, and all four fixtures, followed by the pinned `uv==0.12.5` install;
2. root-pinned manifest and bundle `sha256sum -c` checks, followed by the pinned bundled verifier's pack-validation operation.

Both checksum lines returned `OK`; the verifier returned `VERIFIER_PACK_READY` with the exact pack ID, version, source revision, and manifest digest above. Only then did the model write the candidate. The initial candidate passed before the full-proof operation read the expected contract and four reference states.

The earlier v1.0.0 final-staging turn `01m10yexx7zfnn5gva7ytq1krj.ueyhrn`, v1.0.1 traces, and v1.0.2 review evidence are retained only as pre-final evidence. A clean build exposed a manifest/bundle digest cycle in v1.0.1. The cycle-free trust-anchor module deliberately excludes manifest and bundle digests. v1.0.3 PREPARE session `01m114vkyafm1x54tfd14rzyw2`, turn `01m114vxf9jyd16bm4ngwnp24w.ueyhrn`, then exposed a stale compiled-metadata resolution in the skill packager: both file digests passed, but the bundle correctly rejected manifest version 1.0.3 because it still pinned 1.0.2. The packager now runs the product build before bundling, and two clean v1.0.4 product/skill rebuilds reproduced both final digests above. No immutable tag was rewritten.

One earlier final-payload staging attempt, session `01m10ycgbnpasgevay3qdaq6w0`, turn `01m10ycgd786f6rgkf3k84zmjb.ueyhrn`, was rejected as evidence because the model used exploratory filesystem commands after a missing direct Node executable. It ended `error`; no result from that trace is used as an acceptance claim.

## Contract migration and retained gates

- Natural-language and exact-JSON remediation requests no longer require verifier uploads. A valid historical `verifier_inputs` object remains accepted as a deprecated compatibility shape, cannot select any file or pack, and is omitted from the executable `GuardianRequest`.
- `ANALYSIS_ONLY` does not enter Daytona, so the attached skill is not materialized into a sandbox. The exact remediation support gate alone selects the one pinned pack.
- Pack validation completes before candidate generation. Candidate generation completes before semantic inspection of the expected contract or reference policies.
- Candidate verification retains one initial attempt plus at most one diagnostics-only correction. Two failures return `NO_SAFE_REMEDIATION`.
- A passing candidate still requires last-good and candidate `SECURE_AND_FUNCTIONAL`, suspect `EXPOSED`, and deny-all `SECURE_BUT_OPERATIONALLY_REJECTED`.
- The historical proposal hash is unchanged. The separate pack-binding digest binds that proposal hash to the complete pack identity.
- Four-state proof, proposal, pre-mutation presentation, PR body, action receipt, run receipt, reliability record, OpenUI/Markdown, and reuse gate carry or validate the pack identity and binding.

## Saved agent and live evidence

Saved agent `secureops-guardian_v0` (`01m0w6s2eyqtzyb6q4y6ppsta9`) was updated from `exports/secureops-guardian.trueforge.json` and read back. The portable and saved manifests canonicalize byte-for-byte to SHA-256 `4ee60f192d6abfa1f46ba4e8c9f8b79cd825ac043d874305ae779a06931848e6`; both attach exactly `guardian-network-egress-v1` and retain the existing tools and three write approvals. The registered skill record separately read back source commit `ade2d1453bba033dd3300a7c7aede6e28b97582d` and path `guardian-network-egress-v1`.

Final accepted v1.0.4 execution evidence is:

| Outcome | Turn | Evidence |
| --- | --- | --- |
| PREPARE remediation | Session `01m11567dc0w2sr2m1dd605a2v`, turn `01m1156hn89rqprh1sswr7pdwq.ueyhrn` | The primary request omitted `verifier_inputs`. Both bounded investigators completed before Daytona. The mounted files and root digests passed, the skill returned v1.0.4 `VERIFIER_PACK_READY`, the first candidate passed, the four-state proof passed, and proposal/UI carried the exact proposal hash, pack identity, and binding. No GitHub write or approval occurred. |
| PR reuse | Session `01m115w1s6ch6384my54bqy6ev`, turn `01m115wbze3tm6xkfm93kapny3.ueyhrn` | A fresh OPEN_PR run repeated both investigations and the full sandbox proof, then used exactly six reconciliation reads: base/head branch and PR listing, base file/commit, and remediation file/commit. It returned `PR_REUSED` for fixture PR #1 with zero write calls and zero approval events. The remote legacy body was not claimed to contain pack fields; the fresh proof, action receipt, run receipt, and UI carried v1.0.4 and its binding. |

Natural-language session `01m112s4dp592vx6w6fk3z5hd3`, interpretation turn `01m112s4f8gf2yy1ddd8tggstr.ueyhrn`, separately proved the primary compiler asks only for scope/capability confirmation and never for five verifier files. Its subsequent execution turn stopped after one child with an empty response and is explicitly rejected as execution evidence; it performed no sandbox or write. The first v1.0.4 OPEN_PR attempt, session `01m115esk161q65hahtaezvs8e`, turn `01m115f48sv72182dyx6h310yv.ueyhrn`, is also excluded because it stopped reuse reconciliation after four reads. That trace led to the explicit six-read saved-agent contract and regression assertion used by the accepted replay.

Separate final v1.0.4 `ANALYSIS_ONLY` session `01m1167epfyq0vjj4sc94pxb1q`, turn `01m1167pxjc8cq8tv88jed4v2z.ueyhrn`, completed with the six bounded official GitHub reads plus result rendering, zero `sandbox.created` events, zero Fixture tool calls, zero write calls, and zero approval events. TrueForge preloaded both configured MCP connectors, but preloading is not a Fixture call or skill materialization.

The fixture PR remained open and unmerged at `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3`. No Kubernetes API, cluster, merge, deployment, branch deletion, public fallback, or product-repository write was attempted by the live Guardian sessions.

## Verification

The product gate passed formatting, lint, typecheck, build, bundle generation, `git diff --check`, all 246 Vitest tests, and the Phase 5, Phase 6, and Phase 7 deterministic matrices. Rebuilding `packages/policy-verifier/dist/cli.bundle.cjs` produced the exact pinned bundle digest `028172c2b937dc95e1d406db49d5801d5742a5636b5360dc99bd1d6b4c0049f9`. Rebuilding the skill then reproduced manifest digest `e70853b49715a949f61ae7584ef963b15267026051091a169e78a27249a869fe`. The skill repository's `npm test` independently validated its complete identity and scope, exact manifest file set, and every payload digest.

## Rollback

Rollback is fail-closed and preserves immutable evidence:

1. Do not merge either Expansion Phase 2 PR. Closing the unmerged product PR leaves `main` at the Phase 8 contract. Closing the skill PR does not delete its public commit or immutable tag.
2. Before another live run, replace saved agent `01m0w6s2eyqtzyb6q4y6ppsta9` with the Phase 8 manifest from `origin/main:exports/secureops-guardian.trueforge.json` using `PUT /api/v1/agents/{id}` and read it back. That detaches the skill and restores the previous upload-gated live contract. Do not edit a persisted in-flight session; create a new session after rollback.
3. Leave the registered skill record, repository, commit, and tag intact for auditability. A detached registered skill has no Guardian execution authority. Do not repoint the tag or substitute a new source revision under the old version.
4. If rollback is required after a future merge, open a normal product revert PR plus a saved-agent reconciliation; never reset `main`, rewrite the skill tag, or mutate fixture PR #1.

Rollback success requires a read-back match to the Phase 8 export, a new-session check that no skill is attached, and confirmation that fixture PR #1 remains unchanged and unmerged.
