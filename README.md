# SecureOps Guardian

SecureOps Guardian helps an on-call platform/security engineer turn a post-deployment Kubernetes egress exposure into a cited, sandbox-verified least-privilege remediation while retaining human control of every GitHub write.

The demo joins real GitHub commit evidence from the public [`guardian-demo-checkout`](https://github.com/jayesh9747/guardian-demo-checkout) repository with explicitly synthetic incident observations. Unlike a generic incident summary, Guardian identifies one changed NetworkPolicy rule, rejects deny-all containment because it breaks checkout's database path, proves an exact replacement against four policy states, and creates or deterministically reuses one reviewable pull request only at the approval boundary.

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
Engineer in stock TrueForge chat
  +-- change-security-investigator -> official GitHub MCP reads
  +-- exposure-evidence-investigator -> guardian-fixture MCP reads
  +-- evidence-linked High finding with explicit Unknowns
  +-- Daytona sandbox -> candidate + four-state static verifier
  +-- stock OpenUI result card (or Markdown recovery rendering)
  `-- TrueForge approval -> exact official GitHub MCP write or read-only reuse
```

TrueForge is the sole agent harness. The repository retains the reviewed phase-scoped manifests for investigation, sandbox verification, and GitHub write. Phase 6 layers presentation onto the frozen write manifest; it does not combine stages into a new workflow. Dynamic child roles are instruction-scoped and share attached resources, not enforced authorization boundaries.

| TrueForge capability | Guardian use |
| --- | --- |
| Model routing | `google-gemini/gemini-3-6-flash`, temperature `0` |
| Dynamic sub-agents | Exactly two investigation child threads |
| MCP | Official GitHub MCP plus read-only `guardian-fixture` |
| Daytona | Credential-free candidate and verifier execution |
| Tool approval | Separate human decision for each of three GitHub writes |
| Persistence | Reconnect/retry preserves proposal and pending action |
| Generative UI | Stock OpenUI card; no frontend fork or dashboard |

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

Configure the Gemini provider through TrueForge settings, select `google-gemini/gemini-3-6-flash`, and set temperature to `0`. Configure Daytona through TrueForge settings and confirm provider state `ready`. Keep all credentials only in TrueForge's secret configuration. The sandbox receives verifier inputs only.

### Official GitHub MCP

Create a Streamable HTTP connector named `github` with endpoint `https://api.githubcopilot.com/mcp/`. Put its authenticated header in the TrueForge secret field. Use a fine-grained credential limited to the fixture repository, with metadata read and only the Contents and Pull Requests permissions required by the demo.

Investigation uses bounded read tools. The final idempotency check uses direct `list_pull_requests` with `state=open`, base `main`, and exact head `jayesh9747:guardian/fix-checkout-egress`; GitHub search is not the final reuse check.

Enable only these writes and list all three separately under `require_approval_for_tools`:

- `create_branch`
- `create_or_update_file`
- `create_pull_request`

Do not enable merge, branch deletion, Actions, secrets, administration, issues, or deployment tools.

### Stock Generative UI

Use [`PHASE_SIX_AGENT_SPEC`](./packages/presentation/src/agent.ts). It inherits the exact frozen Phase 4 MCP tools and approval gates, then enables `generative_ui`. Keep the stock TrueForge frontend. The result renderer uses built-in card, tag, table, code, tabs, callout, and Markdown components.

## Demo prompt and expected outcome

> Investigate the owned `checkout-networkpolicy-egress-exposure` case. Join the exact GitHub change with synthetic exposure evidence, preserve actual data access as Unknown, verify the least-privilege candidate in Daytona, and present the exact proposal. Do not write unless the exact TrueForge approval boundary is reached. If the matching remediation already exists, verify its branch, content, proposal hash, base, and open PR, then return deterministic reuse without a write.

With the preserved fixture state, expect:

- `High` finding for `checkout-api` at suspect commit `7b2f2ad51f9ef97334176fbfed3138465b62fcdb`;
- changed file `k8s/checkout-networkpolicy.yaml` and exposure `checkout-api -> forbidden.example.test:443/TCP`;
- actual data access `Unknown` and a passing four-state proof;
- proposal hash `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15`;
- `PR_REUSED` with [`guardian-demo-checkout#1`](https://github.com/jayesh9747/guardian-demo-checkout/pull/1);
- zero write calls and zero approvals on the reuse path.

Run the deterministic matrices:

```sh
pnpm phase5:matrix
pnpm phase6:matrix
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
git diff --check
```

Candidate replay:

```sh
node packages/policy-verifier/dist/cli.bundle.cjs \
  --candidate docs/evidence/PHASE_3_CANDIDATE.yaml \
  --contract packages/policy-verifier/fixtures/expected-contract.json
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

## AI-assistance disclosure

AI coding assistants supported planning, implementation, tests, documentation, and review. The operator retained responsibility for scope, credentials, approvals, writes, evidence interpretation, review acceptance, recording, visibility, and submission. A paused Qodo response is never presented as approval.

## Known limitations and retained roadmap

- One owned repository, one synthetic incident, one NetworkPolicy, one rule, two child investigations, and one remediation PR are supported.
- The preserved public state safely demonstrates PR reuse, not a new live creation or denial sequence.
- Phase-scoped saved agents remain separate; Phase 6 adds no combined workflow or second application.
- There is no live cluster, production telemetry, CVE scan, packet capture, penetration test, compliance assessment, general incident response, or autonomous containment.
- Phase 7 is retained only: broader rules, repositories, workflows, history, analytics, and other extensions are not implemented.

## Frozen references

| Artifact | Reference |
| --- | --- |
| Product Phase 6 base / merged Phase 5 | `fce4424be5461b2272dfbdd15c3d545d0c1e06e1` |
| Frozen Phase 5 core | `263e6a27307a667f08bfa832b436a754c0848a2e` |
| Phase 5 documentation | `1777bfd070ac1ebd34e23a604767ae2e703c36ad` |
| Fixture remediation | `44fb8c7f5e99f835c6779f5e7b777c1b016af5b3` |
| Proposal SHA-256 | `2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` |
| TrueForge runtime | `6026509d905fe255bf493e3845b1fca237bdf0fd` |

## License

[MIT](./LICENSE)
