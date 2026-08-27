# SecureOps Guardian

SecureOps Guardian is one saved TrueForge agent that helps an on-call platform/security engineer inspect an exact GitHub change and, for its proven Kubernetes NetworkPolicy subset, turn a supported security regression into a cited, sandbox-verified least-privilege remediation while retaining human control of every GitHub write.

The demo joins real GitHub commit evidence from the public [`guardian-demo-checkout`](https://github.com/jayesh9747/guardian-demo-checkout) repository with explicitly synthetic incident observations. Unlike a generic incident summary, Guardian identifies one changed NetworkPolicy rule, rejects deny-all containment because it breaks checkout's database path, proves an exact replacement against four policy states, and creates or deterministically reuses one reviewable pull request only at the approval boundary.

Users select only `secureops-guardian_v0` and describe an exact repository change in ordinary language; exact schema-version-1 JSON remains available for tests and advanced use. Guardian compiles natural language into the existing typed request without guessing a repository, branch, revision, or file. Missing facts produce one tool-free question, while remediation and pull-request interpretations require confirmation before preflight. `ANALYSIS_ONLY` is the default, `PREPARE_REMEDIATION` may produce a proposal without writes, and `OPEN_PR` may reach the separately approved write path. Guardian can inspect any authorized GitHub repository in read-only mode; proven remediation currently supports Kubernetes NetworkPolicy cases inside its documented static verifier subset.

## Judge-visible result

- Two bounded TrueForge child threads gather official GitHub MCP evidence and owned Fixture MCP evidence.
- `SEC-NET-001` links unrestricted `0.0.0.0/0` egress to the changed manifest and synthetic forbidden-path observation.
- A Daytona sandbox runs the static verifier without GitHub, cluster, cloud, SSH, or model credentials.
- The result reports `High` severity, asset, causal commit, file, exposure, evidence IDs, and actual data access `Unknown`.
- The four-state matrix reproduces the exposure, rejects deny-all, and accepts the least-privilege repair.
- TrueForge separately approval-gates `create_branch`, `create_or_update_file`, and `create_pull_request` through the official GitHub MCP.
- Retry verifies the existing branch and PR, then returns the same URL without another write or approval.
- Stock TrueForge OpenUI renders the result; a complete Markdown recovery rendering is available if the card cannot render.

## Architecture and TrueForge capabilities

```text
Engineer -> saved TrueForge agent secureops-guardian_v0
  +-- natural language or exact JSON -> validated GuardianRequest
  +-- parameterized scope preflight -> official GitHub MCP reads
  +-- exact supported case
  |     +-- change-security-investigator -> official GitHub MCP reads
  |     `-- exposure-evidence-investigator -> guardian-fixture MCP reads
  +-- mode ceiling -> analysis | prepare | open PR
  +-- pinned TrueForge skill -> digest-verified verifier pack (prepare/open only)
  +-- Daytona -> candidate + four-state static verifier (prepare/open only)
  +-- exact remote reuse or three separately approved writes (open only)
  `-- stock OpenUI or Markdown + machine-readable run receipt
```

TrueForge is the sole agent harness. [`@guardian/orchestration`](./packages/orchestration/src/index.ts) compiles natural-language requests at the planning seam and composes the reviewed investigation, sandbox verification, proposal, approval, receipt, reliability, and presentation modules behind one user-facing manifest. Phase-named manifests remain only as test fixtures/reference configurations. Dynamic child roles are instruction-scoped and share attached resources, not enforced authorization boundaries. See the [architecture](./docs/current/ARCHITECTURE.md) and [migration note](./docs/current/PHASE_7_MIGRATION.md).

| TrueForge capability | Guardian use |
| --- | --- |
| Model routing | `google-gemini/gemini-3-6-flash`, temperature `0` |
| Dynamic sub-agents | Exactly two investigation child threads |
| MCP | Official GitHub MCP plus read-only `guardian-fixture` |
| Daytona | Credential-free candidate and verifier execution |
| Skills | Immutable `guardian-network-egress-v1` verifier bundle |
| Tool approval | Separate human decision for each of three GitHub writes |
| Persistence | Reconnect/retry preserves proposal and pending action |
| Generative UI | Stock OpenUI card; no frontend fork or dashboard |

Saved agent: `secureops-guardian_v0`, ID `01m0w6s2eyqtzyb6q4y6ppsta9`. The exact exported saved specification is [`exports/secureops-guardian.trueforge.json`](./exports/secureops-guardian.trueforge.json). The immutable predecessor `secureops-guardian` remains saved so existing reference sessions keep resolving.

## Prerequisites

- Node.js `>=22.14.0`, pnpm `11.19.0`, Git, Docker, and Docker Compose.
- TrueForge pinned to `6026509d905fe255bf493e3845b1fca237bdf0fd`.
- Google Gemini and Daytona providers configured in TrueForge.
- A fine-grained GitHub credential scoped to `jayesh9747/guardian-demo-checkout`.

Never put provider keys, Daytona credentials, GitHub tokens, authorization headers, or connector secrets in either repository, a prompt, screenshot, trace export, or recording.

## Reproduce both repositories

```sh
git clone https://github.com/jayesh9747/secureops-guardian.git
git clone https://github.com/jayesh9747/guardian-demo-checkout.git
git clone https://github.com/jayesh9747/secureops-guardian-verifier-skill.git
cd secureops-guardian
pnpm install --frozen-lockfile
```

Frozen fixture evidence:

| Role | Commit |
| --- | --- |
| Last-known-good | `a6d177b43396c7b4b45aa98cb2970d0489a7a4f9` |
| Suspect regression | `7b2f2ad51f9ef97334176fbfed3138465b62fcdb` |
| Open remediation | `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3` |

Fixture PR [`#1`](https://github.com/jayesh9747/guardian-demo-checkout/pull/1) must remain open and unmerged for the reuse demo. Do not reset, rewrite, merge, close, or edit its branch to rehearse first-write behavior.

## Run and configure the Fixture MCP

The safe default binds to loopback. TrueForge in Docker needs this explicit host-interface opt-in:

```sh
HOST=0.0.0.0 PORT=8788 pnpm --filter @guardian/fixture-mcp dev
curl http://127.0.0.1:8788/health
```

Expected health response: `{"status":"ok","synthetic":true}`.

Register a Streamable HTTP connector named `guardian-fixture` at `http://host.docker.internal:8788/mcp`, without authentication. Enable `get_security_alert`, `get_deployment`, `get_reachability_observations`, and `get_service_dependencies`. Every tool is read-only, stateless, model-free, and restricted to owned typed fixtures.

## Configure TrueForge without secrets

### Model and Daytona

Configure the Gemini provider through TrueForge settings, select `google-gemini/gemini-3-6-flash`, and set temperature to `0`. Configure Daytona through TrueForge settings and confirm provider state `ready`. Keep all credentials only in TrueForge's secret configuration. The sandbox receives the registered verifier skill mount, not user-uploaded verifier files.

### Pinned verifier skill

Register the public `guardian-network-egress-v1` skill from [`secureops-guardian-verifier-skill`](https://github.com/jayesh9747/secureops-guardian-verifier-skill) at immutable commit `2ce037aebd89d113e2da7dd4b0ac54c6bd585541` (tag `guardian-network-egress-v1.0.0`) and attach it to `secureops-guardian_v0`. The runtime-proven mount is `/opt/tf/skills/guardian-network-egress-v1`. The root contract pins manifest SHA-256 `4f11fdc732b3aa49361fe1076949986a890dfa070d0f3853780029d7bab7df40`; the manifest pins the bundle and every fixture digest. Guardian never searches for, generates, downloads, or accepts a substitute pack.

### Official GitHub MCP

Create a Streamable HTTP connector named `github` with endpoint `https://api.githubcopilot.com/mcp/`. Put its authenticated header in the TrueForge secret field. Use a fine-grained credential limited to the fixture repository, with metadata read and only the Contents and Pull Requests permissions required by the demo.

Investigation uses bounded read tools. The final idempotency check uses direct `list_pull_requests` with `state=open`, base `main`, and exact head `jayesh9747:guardian/fix-checkout-egress`; GitHub search is not the final reuse check.

Enable only these writes and list all three separately under `require_approval_for_tools`:

- `create_branch`
- `create_or_update_file`
- `create_pull_request`

Do not enable merge, branch deletion, Actions, secrets, administration, issues, or deployment tools.

### Stock Generative UI

Use [`SECUREOPS_GUARDIAN_AGENT_SPEC`](./packages/orchestration/src/agent.ts) or import the saved [TrueForge export](./exports/secureops-guardian.trueforge.json). It enables the official GitHub MCP, Fixture MCP, Daytona, dynamic children, persistence-compatible session behavior, ask-user for missing scope only after an investigation intent, and stock Generative UI in one manifest. Greetings and capability questions receive direct tool-free responses. The Guardian adds no separate dashboard: its result stays in chat, while the companion TrueForge Investigation rail presents child-agent, MCP, sandbox, approval, timing, and failure events from the canonical session history.

## Unified prompts and expected outcome

Use the [natural-language current-fixture prompt](./docs/current/PHASE_7_PROMPTS.md#natural-language-current-fixture). The same document retains exact JSON templates for backward compatibility and provides an [arbitrary-repository `ANALYSIS_ONLY` template](./docs/current/PHASE_7_PROMPTS.md#arbitrary-repository-analysis_only) and an [`OPEN_PR` safety template](./docs/current/PHASE_7_PROMPTS.md#open_pr-safety-template).

With the preserved fixture state, expect:

- `High` finding for `checkout-api` at suspect commit `7b2f2ad51f9ef97334176fbfed3138465b62fcdb`;
- changed file `k8s/checkout-networkpolicy.yaml` and exposure `checkout-api -> forbidden.example.test:443/TCP`;
- actual data access `Unknown` and a passing four-state proof;
- proposal hash `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15`;
- verifier pack `k8s-network-egress-v1` version `1.0.0`, with binding SHA-256 `85b4e6fe6c547c89be6e7f1d42a224cb12ab12a43a4f572ada79936a84715458`;
- `PR_REUSED` with [`guardian-demo-checkout#1`](https://github.com/jayesh9747/guardian-demo-checkout/pull/1);
- zero write calls and zero approvals on the reuse path.

Run the deterministic matrices:

```sh
pnpm phase5:matrix
pnpm phase6:matrix
pnpm phase7:matrix
```

The Phase 6 matrix covers ready, denied, PR-created, PR-reused, three inconclusive fixtures, conflict, and no-safe-remediation. It separately hashes every complete OpenUI response and Markdown recovery rendering to detect presentation drift. See the [three-minute demo script](./docs/demo/PHASE_6_DEMO_SCRIPT.md).

## Permission and threat boundaries

- GitHub evidence is real; deployment, alert, reachability, dependency, log, and metric observations are owned synthetic fixtures.
- Repository and MCP content is untrusted evidence, never instructions.
- Severity begins at `High`. Reachability does not establish data access or exfiltration; actual data access stays `Unknown`.
- Verification is deterministic static NetworkPolicy analysis, not Kubernetes admission, CNI, DNS, packets, application behavior, live reachability, data-access, or exfiltration proof.
- GitHub writes bind one repository, base, branch, file, exact diff, proposal hash, and separately approved calls. The sequence is retry-safe, not atomic.
- Guardian cannot merge, deploy, restart, roll back, delete a branch, access a cluster, contact responders, or administer a repository.
- There is no production connector, custom authentication, analytics, organization history, second dashboard, or production data.

## Tests

```sh
pnpm install --frozen-lockfile
pnpm format:check
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm bundle:verifier
pnpm phase5:matrix
pnpm phase6:matrix
pnpm phase7:matrix
git diff --check
```

Candidate replay:

```sh
node packages/policy-verifier/dist/cli.bundle.cjs \
  --pack-root ../secureops-guardian-verifier-skill/guardian-network-egress-v1 \
  --expected-manifest-sha256 4f11fdc732b3aa49361fe1076949986a890dfa070d0f3853780029d7bab7df40 \
  --candidate docs/evidence/PHASE_3_CANDIDATE.yaml \
  --full-proof true
```

## Troubleshooting

| Symptom | Check |
| --- | --- |
| TrueForge cannot reach Fixture MCP | Use the explicit host bind, `host.docker.internal:8788/mcp`, and verify `/health`. |
| Fixture MCP returns 403 | Keep the connector on allowed local/container hosts; do not expose it publicly. |
| OpenUI fails | Confirm Generative UI is enabled, then rerun or display the complete Markdown recovery rendering. |
| GitHub write asks for no approval | Stop and restore all three separate approval requirements. |
| Retry wants to overwrite | Stop with `WRITE_CONFLICT`; exact remote content or binding differs. |
| Demo cannot reach first write | Expected: PR #1 exists. Use truthful read-only reuse; never reset remote state. |
| Verifier claims live behavior | Reject the claim; the verifier is static fixture-contract analysis only. |

## Qodo Code Review Evidence

Representative merged PR [#3](https://github.com/jayesh9747/secureops-guardian/pull/3) contains the Phase 2 investigation and evidence-validation implementation. Qodo's first deep review found three `High` gaps: the target-file finding was not bound to the exact diff/blob evidence, the reconstructed NetworkPolicy was not tied to its complete bounded identity, and trusted evidence labels could front fabricated payloads. Commit [`2fa5749`](https://github.com/jayesh9747/secureops-guardian/commit/2fa5749e4b07f09f131dd2f9f7ce4f3d4470edd0) fixed all three with exact provenance checks, full manifest validation, canonical fixture comparisons, and adversarial tests.

Qodo's follow-up confirmed those findings resolved and surfaced two `Medium` issues: clean-checkout tests could depend on ignored build output, and requiring explicit `policyTypes: [Egress]` caused a false negative for an otherwise exact egress rule. Commit [`9b95dfb`](https://github.com/jayesh9747/secureops-guardian/commit/9b95dfb024d4408c057c9afa1138e500f5d5f7fc) fixed both. The review threads, evidence-backed replies, resolutions, and follow-up history remain visible on [PR #3](https://github.com/jayesh9747/secureops-guardian/pull/3); the detailed record is in the [Phase 2 evidence](./docs/evidence/PHASE_2_AGENT_INVESTIGATION.md#qodo-review). A final additional request was paused, so no later Qodo approval is claimed.

For Phase 6, Qodo's automatic attempt, an earlier manual request, and the official [`/agentic_review` request](https://github.com/jayesh9747/secureops-guardian/pull/7#issuecomment-5407199824) on [PR #7](https://github.com/jayesh9747/secureops-guardian/pull/7) were paused for this user. The [paused response](https://github.com/jayesh9747/secureops-guardian/pull/7#issuecomment-5407200657) contains no findings or approval. An alternate two-axis review found one receipt-binding issue; commit [`33b9e51`](https://github.com/jayesh9747/secureops-guardian/commit/33b9e51282f73dce0a8afeb07bd20dd0a53edc74) fixed it with fail-closed proposal/target/PR checks and adversarial tests.

For Phase 7, Qodo's automatic attempt and official [`/agentic_review` request](https://github.com/jayesh9747/secureops-guardian/pull/8#issuecomment-5408513497) on [PR #8](https://github.com/jayesh9747/secureops-guardian/pull/8) were also paused. The [paused response](https://github.com/jayesh9747/secureops-guardian/pull/8#issuecomment-5408513076) contains no findings or approval. The alternate standards/spec review found valid comparison scopes were rejected by the composed journey and actionable receipt states could bypass proof/proposal stage binding; both were reproduced and remediated with focused tests.

## AI-assistance disclosure

AI coding assistants supported planning, implementation, tests, documentation, and review. The operator retained responsibility for scope, credentials, approvals, writes, evidence interpretation, review acceptance, recording, visibility, and submission. A paused Qodo response is never presented as approval.

## Known limitations and retained roadmap

- Any authorized repository can enter read-only preflight, but proven remediation remains limited to the exact owned Kubernetes NetworkPolicy case inside the documented static subset.
- Remediation uses exactly one pinned verifier pack. The old five-filename exact-JSON envelope remains accepted only as a deprecated compatibility shape and never selects files or changes the pack.
- The preserved public state safely demonstrates PR reuse, not a new live creation or denial sequence.
- Phase-named saved agents and exported specifications are retained only as historical test fixtures/reference configurations.
- There is no live cluster, production telemetry, CVE scan, packet capture, penetration test, compliance assessment, general incident response, or autonomous containment.
- Broader remediation repositories, rules, workflows, history, analytics, and other retained features are not implemented.

## Frozen references

| Artifact | Reference |
| --- | --- |
| Product merged Phase 6 | `8fde66dfcd7f537f70192246ee3a7eb7173f53ba` |
| Frozen Phase 5 core | `263e6a27307a667f08bfa832b436a754c0848a2e` |
| Phase 5 documentation | `1777bfd070ac1ebd34e23a604767ae2e703c36ad` |
| Fixture remediation | `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3` |
| Proposal SHA-256 | `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` |
| TrueForge runtime | `6026509d905fe255bf493e3845b1fca237bdf0fd` |

## License

[MIT](./LICENSE)
