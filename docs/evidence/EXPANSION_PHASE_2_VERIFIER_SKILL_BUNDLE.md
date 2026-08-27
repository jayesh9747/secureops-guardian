# Expansion Phase 2 verifier skill bundle evidence

Date: 27 August 2026.

## Result

Expansion Phase 2 replaces the primary five-file upload ceremony with one immutable TrueForge skill bundle. It adds no verifier pack, workload rule, UI redesign, live Kubernetes access, public download fallback, or TrueForge upstream change.

The product branch is `expansion-phase-2/verifier-skill-bundle` from Phase 8 merge `08684b89ef97d5487b236ea94e894bdda77e5c4c`. The separate public skill repository is [`jayesh9747/secureops-guardian-verifier-skill`](https://github.com/jayesh9747/secureops-guardian-verifier-skill), branch `expansion-phase-2/verifier-skill-bundle`, commit `2ce037aebd89d113e2da7dd4b0ac54c6bd585541`, immutable tag `guardian-network-egress-v1.0.0`, and unmerged skill PR [#1](https://github.com/jayesh9747/secureops-guardian-verifier-skill/pull/1).

## Immutable bundle identity

| Field | Pinned value |
| --- | --- |
| TrueForge skill | `guardian-network-egress-v1` |
| Pack ID | `k8s-network-egress-v1` |
| Pack version | `1.0.0` |
| Source revision | `guardian-network-egress-v1.0.0` |
| Skill source commit | `2ce037aebd89d113e2da7dd4b0ac54c6bd585541` |
| Manifest SHA-256 | `4f11fdc732b3aa49361fe1076949986a890dfa070d0f3853780029d7bab7df40` |
| Bundle SHA-256 | `0cd2df8bde7f0377325f6f8338335f9a33a6ae4ad869b94f3bfc5458e9b05991` |
| Proposal SHA-256 | `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` |
| Pack-binding SHA-256 | `85b4e6fe6c547c89be6e7f1d42a224cb12ab12a43a4f572ada79936a84715458` |

The manifest contains exactly six payload files:

| Path | SHA-256 |
| --- | --- |
| `SKILL.md` | `2cc6f7c74dbc77d6d98b1d41a8787b768953220205cdcd5e8e6fc9077b2356da` |
| `verifier.bundle.cjs` | `0cd2df8bde7f0377325f6f8338335f9a33a6ae4ad869b94f3bfc5458e9b05991` |
| `fixtures/expected-contract.json` | `a78eca23e3fb80f8922f227cc544811cd0c0fc8c23961efa8ee392cbed909a7b` |
| `fixtures/suspect.yaml` | `7209dbcc30d389e671307cd92d6fd6b5133781d090181cd56116594e616613d7` |
| `fixtures/deny-all.yaml` | `ff123d62fa5f5b110ae4f6a2c27c88f180ef272a34fc9373ed4f87e41e66088a` |
| `fixtures/last-good.yaml` | `c282434c506a45e93e39d2329b33c8466ba7a8a1d5d238817530678d975ad165` |

The bundle rejects a missing file, an extra manifest entry, a digest mismatch, a wrong pack/version/revision, or a scope mismatch. It never searches another path or accepts generated, downloaded, repository, package, or upload content as a substitute.

## Actual TrueForge mount path

The checked-in TrueForge documentation describes `/opt/tfy/skills/{name}` while the running Phase 9 container announced and materialized this registered skill under `/opt/tf/skills/guardian-network-egress-v1`. Runtime evidence therefore controls the saved contract.

The first discovery session was `01m10wm7m05mmed1jb0bzwcmsv`, turn `01m10wmf0wx0qzm0b4bdzg1mrq.9ziser`. It proved the announced root with the initial inert commit before the final payload was pinned.

The accepted final staging session was `01m10yextc3a062bmtg9mwp88f`, turn `01m10yexx7zfnn5gva7ytq1krj.ueyhrn`. Its trace contains exactly two sandbox executions after skill injection:

1. exact `test -f` checks for `SKILL.md`, `manifest.json`, `verifier.bundle.cjs`, and all four fixtures, followed by the pinned `uv==0.12.5` install;
2. root-pinned manifest and bundle `sha256sum -c` checks, followed by the pinned bundled verifier's pack-validation operation.

Both checksum lines returned `OK`; the verifier returned `VERIFIER_PACK_READY` with the exact pack ID, version, source revision, and manifest digest above. No candidate or semantic reference read occurred in this staging-only replay.

One earlier final-payload staging attempt, session `01m10ycgbnpasgevay3qdaq6w0`, turn `01m10ycgd786f6rgkf3k84zmjb.ueyhrn`, was rejected as evidence because the model used exploratory filesystem commands after a missing direct Node executable. It ended `error`; no result from that trace is used as an acceptance claim.

## Contract migration and retained gates

- Natural-language and exact-JSON remediation requests no longer require verifier uploads. A valid historical `verifier_inputs` object remains accepted as a deprecated compatibility shape, cannot select any file or pack, and is omitted from the executable `GuardianRequest`.
- `ANALYSIS_ONLY` neither selects nor materializes the skill. The exact remediation support gate alone selects the one pinned pack.
- Pack validation completes before candidate generation. Candidate generation completes before semantic inspection of the expected contract or reference policies.
- Candidate verification retains one initial attempt plus at most one diagnostics-only correction. Two failures return `NO_SAFE_REMEDIATION`.
- A passing candidate still requires last-good and candidate `SECURE_AND_FUNCTIONAL`, suspect `EXPOSED`, and deny-all `SECURE_BUT_OPERATIONALLY_REJECTED`.
- The historical proposal hash is unchanged. The separate pack-binding digest binds that proposal hash to the complete pack identity.
- Four-state proof, proposal, pre-mutation presentation, PR body, action receipt, run receipt, reliability record, OpenUI/Markdown, and reuse gate carry or validate the pack identity and binding.

## Saved agent and live evidence

Saved agent `secureops-guardian_v0` (`01m0w6s2eyqtzyb6q4y6ppsta9`) was updated from `exports/secureops-guardian.trueforge.json` and read back. The portable and saved manifests canonicalize byte-for-byte to SHA-256 `09e8c720078cac591f123aafa9de3428add30f1669a776577a3a4ddacc95d317`; both attach exactly `guardian-network-egress-v1` and retain the existing tools and three write approvals.

Live natural-language evidence used session `01m10yhd29xy7pesjn0nsn53ff`:

| Outcome | Turn | Evidence |
| --- | --- | --- |
| PREPARE interpretation | `01m10yhd36k53dmfmc4xnf68f5.ueyhrn` | One ask-user confirmation showed the exact scope and PREPARE ceiling; it requested no files and authorized no write. |
| PREPARE remediation | `01m1101vszs121yh2yjx959wb0.ueyhrn` | Both bounded investigators completed, the skill returned `VERIFIER_PACK_READY`, the first candidate passed, the four-state proof passed, and the result carried the exact proposal hash, pack identity, and pack-binding digest. No GitHub write or approval occurred. |
| OPEN_PR interpretation | `01m110cpfmzvgzvxvtzycqgk4w.ueyhrn` | A complete new natural-language request required a new OPEN_PR confirmation. |
| PR reuse | `01m110fygfcp1fj7abm447n97v.ueyhrn` | Exact base/head, PR, branch candidate, proposal hash, and pack binding reconciled. It returned `PR_REUSED` for fixture PR #1 using seven reads and `get_openui_instructions`, with zero write calls and zero approval events. |

The fixture PR remained open and unmerged at `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3`. No Kubernetes API, cluster, merge, deployment, branch deletion, public fallback, or product-repository write was attempted by the live Guardian sessions.

## Verification

The product gate passed formatting, lint, typecheck, build, bundle generation, `git diff --check`, all 241 Vitest tests, and the Phase 5, Phase 6, and Phase 7 deterministic matrices. Rebuilding `packages/policy-verifier/dist/cli.bundle.cjs` produced the exact pinned bundle digest `0cd2df8bde7f0377325f6f8338335f9a33a6ae4ad869b94f3bfc5458e9b05991`. The skill repository's `npm test` independently validated its manifest and every payload digest.

## Rollback

Rollback is fail-closed and preserves immutable evidence:

1. Do not merge either Expansion Phase 2 PR. Closing the unmerged product PR leaves `main` at the Phase 8 contract. Closing the skill PR does not delete its public commit or immutable tag.
2. Before another live run, replace saved agent `01m0w6s2eyqtzyb6q4y6ppsta9` with the Phase 8 manifest from `origin/main:exports/secureops-guardian.trueforge.json` using `PUT /api/v1/agents/{id}` and read it back. That detaches the skill and restores the previous upload-gated live contract. Do not edit a persisted in-flight session; create a new session after rollback.
3. Leave the registered skill record, repository, commit, and tag intact for auditability. A detached registered skill has no Guardian execution authority. Do not repoint the tag or substitute a new source revision under the old version.
4. If rollback is required after a future merge, open a normal product revert PR plus a saved-agent reconciliation; never reset `main`, rewrite the skill tag, or mutate fixture PR #1.

Rollback success requires a read-back match to the Phase 8 export, a new-session check that no skill is attached, and confirmation that fixture PR #1 remains unchanged and unmerged.
