# OpenSRE adoption research for Incident Change Guardian

Research date: 24 August 2026. Repository inspected at commit [`cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d`](https://github.com/Tracer-Cloud/opensre/tree/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d). This is an engineering and license-compliance assessment, not legal advice.

## Conclusion

**Use OpenSRE as a source of evaluation and evidence-design patterns, not as Guardian's runtime, product base, or integration layer.**

OpenSRE validates the market need and contains useful patterns for evidence provenance, bounded investigations, synthetic incidents, red herrings, and turning failures into regression cases. But it is already a broad AI-SRE platform with its own agent loop, sessions, tools, integrations, approval machinery, gateways, and user surfaces. Embedding it would make TrueForge look like a thin wrapper and would make Guardian less original. OpenSRE also labels itself a public alpha whose APIs may evolve, and its README currently publishes no benchmark result, so copying a large subsystem would add substantial integration risk during a seven-day build. [OpenSRE README](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/README.md)

The recommended reuse level is therefore:

- **Adopt the ideas:** evidence envelopes, validated/unvalidated claims, bounded tool use, and adversarial fixture tests.
- **Adapt them as small Guardian-owned schemas and tests executed through TrueForge.**
- **Avoid importing or invoking OpenSRE's agent runtime.** Direct code copying is legally possible under the applicable licenses, but is unnecessary for the MVP and creates attribution, originality, dependency, and maintenance costs.

## 1. What OpenSRE actually does

OpenSRE is not a single incident-analysis model or a small library. It is a Python framework and operating environment for building and evaluating AI-SRE agents. Its advertised workflow is: receive an alert; collect logs, metrics, traces, configuration, and recent deploys; optionally mask identifiers; run a tool-calling hypothesis loop; produce an evidence-linked probable root cause; suggest or optionally execute remediation; and deliver results to terminal or messaging/incident systems. It exposes a REPL, headless CLI, one-shot investigation command, Python API, web/gateway paths, and more than 60 advertised integrations. [README: workflow and interfaces](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/README.md)

The implemented investigation pipeline has six stages:

1. resolve connected integrations;
2. classify and structure the alert;
3. plan relevant evidence tools;
4. gather evidence in a ReAct loop;
5. parse a structured diagnosis; and
6. deliver the report.

The loop caps tool schemas and iterations, caches duplicate calls, breaks stagnation, manages context budget, and can return partial evidence after an LLM failure. Diagnosis separates causal chain, validated claims, non-validated claims, remediation steps, and a validity score. [Investigation pipeline architecture](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/investigation-pipeline-architecture.md) [Pipeline source](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/tools/investigation/lifecycle.py)

OpenSRE is also an evaluation project. Its repository separates deterministic synthetic RCA scenarios from cloud-backed end-to-end cases, includes misleading/red-herring cases, and scores expected root cause and evidence. User-rated misses can be classified as retrieval, reasoning, tool, or routing/prompt failures and exported as future regression scenarios. [Test catalog](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/tests/README.md) [Synthetic scenarios](https://github.com/Tracer-Cloud/opensre/tree/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/tests/synthetic) [Closed-loop learning](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/closed-loop-learning.mdx)

Its code is organized as a layered platform: hosts and gateways, a composition root, tools and vendor integrations, shared runtime/infrastructure, and configuration. Import boundaries are CI-enforced. That is sound architecture for a multi-surface platform, but much broader than Guardian's one incident, two subagents, a few MCP tools, one sandbox verifier, and one approval-gated PR action. [OpenSRE architecture](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/ARCHITECTURE.md) [Guardian plan](../archive/INCIDENT_CHANGE_GUARDIAN_PRODUCT_PLAN.md)

### Activity and maturity

The repository is highly active: it was created in January 2026, shows roughly 3,500 commits and 10.8k stars at the research date, and publishes frequent dated `v0.1` releases. Activity is evidence of momentum, not production maturity. The project explicitly calls itself **public alpha**, warns that APIs and integrations may evolve, and its README benchmark table says **“No benchmark results yet.”** Pin any examined code to a commit rather than relying on `main`. [Repository](https://github.com/Tracer-Cloud/opensre) [Releases](https://github.com/Tracer-Cloud/opensre/releases) [GitHub repository API](https://api.github.com/repos/Tracer-Cloud/opensre)

## 2. Comparison with Incident Change Guardian

| Dimension | OpenSRE | Guardian plan | Implication |
| --- | --- | --- | --- |
| Product scope | General AI-SRE framework, training/eval environment, many tools and surfaces | One reproducible post-deploy incident and one approved remediation PR | Stay narrow; breadth would weaken the hackathon demo. |
| Runtime | Own agent loop, state, tool registry, sessions, gateways, approvals, sandbox helpers | TrueForge must own the model loop, sessions, subagents, MCP, sandbox, and approval | Never place the OpenSRE agent behind a TrueForge tool. |
| Investigation | One bounded evidence loop plus deterministic seed calls | Two visible TrueForge subagents whose evidence the root agent consolidates | Borrow boundedness and evidence contracts, retain TrueForge delegation. |
| Evidence | Per-tool provenance and explicit validated/non-validated claims | Evidence report, rule output, inference labels, and limitations | Make the plan's evidence fields machine-checkable. |
| Evaluation | Many synthetic/e2e scenarios, hidden expected answers, red herrings, scoring | One happy-path fixture plus planned failure cases | Add two small adversarial cases, not a benchmark platform. |
| Remediation | Suggestions and optional actions across many systems | Sandbox-test minimum patch, then approval-gated GitHub PR | Guardian's security-preserving validation remains the differentiating center. |
| Safety | Read-only integrations, side-effect metadata, approvals in its own surfaces | TrueForge's non-bypassable approval boundary | Use TrueForge enforcement only; do not duplicate approval state. |

## 3. Reusable product and architecture patterns

### Evidence provenance envelope

OpenSRE records a tool result with a stable key, raw data, tool name and arguments, source, timestamp, loop iteration, and optional confidence. Guardian should independently implement a smaller JSON schema containing `claim_id`, `source`, `source_ref`, `tool`, `observed_at`, `fact`, and `supports_or_refutes`. This makes the root agent cite actual MCP results instead of repeating subagent prose. [EvidenceEntry source](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/core/state/evidence.py)

### Validated versus unvalidated claims

OpenSRE deliberately separates validated and non-validated claims in diagnosis. Guardian should apply that distinction to the risky causal jump in the current plan: a changed IaC file and a failed security rule are not, by themselves, proof that the change caused checkout errors. Require an explicit chain from deployed commit, to changed runtime property, to observed symptom, to counterfactual validation of the proposed fix. [Diagnosis model](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/core/domain/diagnosis/result.py)

### Bounded investigation behavior

Useful controls are a maximum number of evidence calls, duplicate-call cache, stagnation stop, time/context budget, and an inconclusive/partial outcome. Implement these as Guardian prompt/tool policies and TrueForge session limits rather than porting OpenSRE's loop. The demo should show that missing or conflicting evidence yields “investigate further,” not fabricated certainty. [Pipeline guardrails](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/investigation-pipeline-architecture.md)

### Adversarial synthetic fixtures

OpenSRE's strongest transferable product pattern is not its generic RCA loop; it is the synthetic evaluation discipline. Guardian should keep its primary fixture and add:

1. an unrelated IaC security finding as a red herring, which the agent must label non-causal;
2. a tempting remediation that restores the functional check but violates a security invariant;
3. a denied approval case proving no PR write occurred.

Keep expected root cause and scoring assertions outside the agent-visible fixture. This directly tests Guardian's claimed differentiation: restoring availability without weakening security. [Synthetic test catalog](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/tests/README.md) [Example red-herring scenario](https://github.com/Tracer-Cloud/opensre/tree/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/tests/synthetic/rds_postgres/006-replication-lag-cpu-redherring)

### Separate proposal from execution

OpenSRE documents a GitHub workflow where reads produce a deterministic mutation proposal and only a separate approved tool executes it, with an idempotency marker. Guardian already intends this separation; add a stable proposal ID and idempotency key so reconnects or retries cannot create duplicate PRs. The approval card should contain the exact repository, base/head branches, files, diff hash, test result, and proposal ID. [GitHub workflow tools](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/github-workflow-tools.mdx)

## 4. What may legally be reused

The repository root declares Apache License 2.0 and the Python package metadata also declares `Apache-2.0`. Subject to that license, covered source code may be used, modified, and redistributed, including commercially, and includes a patent grant from contributors for necessarily infringed contributor patent claims. Candidate code areas include the small evidence model, pure alert/tool scoring utilities, diagnosis data models, and synthetic test runners/fixtures. [Root LICENSE](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/LICENSE) [Package metadata](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/pyproject.toml)

If Guardian distributes copied or modified Apache-covered code, it must:

1. give recipients a copy of Apache License 2.0;
2. mark modified upstream files with prominent change notices;
3. retain relevant copyright, patent, trademark, and attribution notices from the source;
4. reproduce relevant upstream `NOTICE` attributions if the copied revision includes a `NOTICE` file;
5. avoid using OpenSRE or Tracer Cloud names, logos, or marks as if they endorse Guardian; and
6. accept the license's warranty disclaimer and patent-litigation termination condition.

No top-level `NOTICE` file was present at the inspected commit, but this must be checked again at the exact revision copied. Absence of `NOTICE` does not remove the other Section 4 obligations. The `docs/` subtree also contains a separate MIT license with “Copyright (c) 2023 Mintlify”; do not assume documentation templates or assets are governed only by the root Apache license. Dependencies and third-party artwork can have their own licenses and require a separate audit. [Docs MIT license](https://github.com/Tracer-Cloud/opensre/blob/cf6376ae9a2db3684fd8af6e5bdc289d92e9fc1d/docs/LICENSE)

If any code is copied, the practical minimum is to pin the source commit, add an “Adapted from Tracer-Cloud/opensre” header to each copied file, preserve applicable notices, include the Apache license and a third-party notices file, list modifications, run a dependency/license scan, and disclose the reuse in the hackathon README. Prefer independent reimplementation of the patterns above: it is smaller, reduces license surface, and better demonstrates original work.

## 5. What not to copy

- **The OpenSRE agent/session/runtime.** Calling `AgentSession`, `opensre investigate`, or an OpenSRE agent through an MCP wrapper would leave TrueForge orchestrating one opaque call.
- **The six-stage pipeline implementation wholesale.** The sequence is a useful checklist but generic alert-to-RCA behavior is commodity and not Guardian's originality claim.
- **The 60+ integration catalog, configuration system, lazy registry, gateways, REPL, schedulers, hosted runtime, or messaging transports.** They solve platform-scale problems outside the seven-day MVP.
- **OpenSRE's GitHub, observability, or approval execution layers.** Guardian already needs visible TrueForge MCP calls and TrueForge approval. Duplicating them creates two policy authorities.
- **Its generic evidence-backed RCA pitch, UI copy, diagrams, product name, logos, or visual identity.** These make Guardian look derivative and may create trademark/asset-license issues.
- **Alpha `main` as an unpinned dependency.** Frequent releases and evolving APIs are a demo reliability risk; the project itself warns that it is not fully stable.
- **Opt-out product telemetry, login experiments, fleet monitoring, incident chat gateways, and closed-loop analytics.** They add data-handling and presentation risk with no MVP value.
- **A benchmark/training platform.** Guardian needs three reproducible acceptance scenarios, not an OpenSRE competitor.

## 6. Adopt / adapt / avoid

| OpenSRE element | Decision | Guardian implementation |
| --- | --- | --- |
| Evidence provenance record | **Adopt** | Create a small Guardian-owned evidence JSON schema returned by both TrueForge subagents. |
| Validated vs non-validated claims | **Adopt** | Require the final incident card to label facts, inference, counter-evidence, and unknowns. |
| Synthetic scenarios with hidden expected answer | **Adopt** | Three fixtures: causal happy path, security red herring, insecure tempting fix. |
| Duplicate/stagnation/tool-budget controls | **Adapt** | Express as bounded TrueForge prompts/session/tool policies; do not port the agent loop. |
| Miss taxonomy | **Adapt later** | During the hackathon, use four test failure labels in CI only; no analytics product. |
| Proposal/execution split and idempotency marker | **Adopt** | Read MCP tools build proposal; only TrueForge-approved PR tool executes once. |
| Reversible identifier masking | **Adapt only if needed** | Fixtures are synthetic, so redact secrets at MCP boundaries; omit a masking subsystem. |
| Integration adapters and tool registry | **Avoid** | Use the small set of TrueForge MCP tools in the existing plan. |
| Agent runtime, sessions, gateways, approvals, sandbox | **Avoid** | These are TrueForge responsibilities and must remain visible in the trace. |
| 60+ integration/product-platform scope | **Avoid** | Keep exactly one service, incident, remediation, and repository. |
| Direct code copy | **Avoid by default** | Independently implement small schemas/tests; copy only if it clearly saves time and complete license compliance first. |

## 7. Keeping TrueForge central

The judge-visible control flow should remain:

```text
TrueForge persistent root session
  ├─ delegates change/security evidence to TrueForge subagent A
  ├─ delegates incident evidence to TrueForge subagent B
  ├─ calls read-only GitHub + Incident Fixture MCP tools
  ├─ runs the proposed patch and deterministic verifiers in TrueForge sandbox
  ├─ renders an exact proposal and pauses at TrueForge approval
  └─ after approval, invokes the one GitHub PR write tool and records the result
```

Custom MCP servers should be deterministic data/policy adapters only. They must not contain another LLM, a hidden agent loop, approval state, session orchestration, or sandbox execution. Any OpenSRE-inspired evaluator belongs in offline tests or as a deterministic sandbox command. TrueForge must visibly own delegation, tool calls, isolation, persistence, approval, and the final external write.

## Recommended plan changes before implementation

1. Add the evidence schema and require every conclusion to reference evidence IDs.
2. Add a causal-proof field: `deployed change → runtime effect → symptom → counterfactual test`.
3. Replace “three generic IaC checks” with one availability contract, one security invariant, and one patch/plan validity check.
4. Add the red-herring and insecure-remediation fixtures before UI work.
5. Add proposal ID, diff hash, and idempotency behavior to the approval-gated PR tool.
6. State in the README that OpenSRE inspired the evidence/evaluation patterns; use no OpenSRE runtime code unless a later, explicitly attributed decision says otherwise.

This preserves the useful lesson from OpenSRE—an incident agent is only convincing when it is evaluated against evidence and adversarial cases—while keeping Guardian's distinctive claim and TrueForge's central role intact.
