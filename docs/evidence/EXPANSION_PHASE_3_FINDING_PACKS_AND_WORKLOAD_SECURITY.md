# Expansion Phase 3 — FindingPack registry and workload security evidence

Status: implementation evidence on `expansion-phase-3/finding-packs`; PR and review evidence are
added during phase handoff. Updated 29 August 2026.

## Scope and entry gate

Work began from current `origin/main` at
`5d4eaff1676c4496b37da9321baab778f304a54f`, the merged Expansion Phase 2 product revision. The
branch is `expansion-phase-3/finding-packs`. This phase adds only the two-pack registry and bounded
workload analysis. It does not add workload remediation, Dockerfile/Terraform/Actions rules, a
score, a UI-fork dependency, or live Kubernetes access.

The implementation contract was written first in
[`FINDING_PACKS.md`](../current/FINDING_PACKS.md). Tests were then developed in red/green vertical
slices at the public registry, natural-language routing, presentation, and deterministic evidence
matrix seams.

## Rule source

The workload rules use the official Kubernetes
[Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/),
read on 29 August 2026. The implemented subset maps to these documented controls:

| Guardian rule | Kubernetes control |
| --- | --- |
| `K8S-WORKLOAD-001` | Baseline — Privileged Containers |
| `K8S-WORKLOAD-002` | Restricted — Privilege Escalation |
| `K8S-WORKLOAD-003` | Restricted — Running as Non-root user |
| `K8S-WORKLOAD-004` | Restricted — Capabilities |
| `K8S-WORKLOAD-005` | Baseline — Host Namespaces |
| `K8S-WORKLOAD-006` | Baseline — HostPath Volumes |

Kubernetes states that policy instantiation is separate from policy definition. Guardian therefore
reports repository manifest facts only and does not claim Pod Security Admission behavior.

## Registry and capability proof

The immutable registry exposes exactly:

- `k8s-network-egress-v1@1.0.4`, `OPEN_PR_ELIGIBLE`, with the existing pinned verifier; and
- `k8s-workload-security-v1@1.0.0`, `ANALYSIS_ONLY`, with `verifier_pack: null`.

The workload pack's generic type fixes verifier, proposal, approval, and GitHub-write routes to
`false`/empty. Its module interface exposes analysis and presentation only; it has no verify,
propose, approve, or write operation. Runtime requests for `REMEDIATION_PROVEN` or
`OPEN_PR_ELIGIBLE` return `INCONCLUSIVE` with all higher routes false.

The retained SEC-NET-001 synthesizer now enters through the registry. Focused regression tests
reproduce the same legacy egress rule result and frozen proposal SHA-256
`2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15`.

## Live GitHub repository evidence

Read-only GitHub API checks under account `jayesh9747` observed the public repository
[`guardian-demo-privileged-api`](https://github.com/jayesh9747/guardian-demo-privileged-api):

| Evidence | Observed identity |
| --- | --- |
| Main/suspect commit | `2c7bdb3e07714e08d9504b3504587fbf18847f29` |
| Exact parent | `d2ee0cdc4e27cc8af671f4c0de15081d1c996e36` |
| Only changed file | `k8s/api-deployment.yaml`, status `modified` |
| Suspect Git blob | `b1a60bb96fad7f93bc95536d08381e5629a6a7bd`, 749 bytes |
| Benign Git blob | `3e8b0f62ef1ba0553b1b4b310444f9a207b9fc9a` |

The suspect diff changes Pod-template `runAsNonRoot` from true to false and `runAsUser` from 10001
to 0, enables `allowPrivilegeEscalation` and `privileged`, removes `drop: [ALL]`, and adds
`SYS_ADMIN`. The deterministic matrix produces five `High` findings at:

1. `$.spec.template.spec.containers[0].securityContext.privileged`
2. `$.spec.template.spec.containers[0].securityContext.allowPrivilegeEscalation`
3. `$.spec.template.spec.securityContext.runAsUser`
4. `$.spec.template.spec.containers[0].securityContext.capabilities.drop`
5. `$.spec.template.spec.containers[0].securityContext.capabilities.add[0]`

Every finding is bound to the exact repository, full revision, file, Git blob, Deployment identity
`apps/v1/Deployment commerce/catalog-api`, container identity when applicable, patch/blob evidence
references, severity, Claims, and limitations. The exact benign parent produces zero deterministic
findings. In both results, deployment, admission behavior, runtime Pod state, exploitability,
reachability, data access, exfiltration, and live-cluster behavior remain `Unknown`.

## Live TrueForge replay

Saved agent `secureops-guardian_v0` (`01m0w6s2eyqtzyb6q4y6ppsta9`) was reconciled to the portable
Phase 10 manifest. Its canonical saved/export manifest SHA-256 is
`1388136250f4b8ba9077b048d808d020280d0265139c771905f8755686620ec9`.

TrueForge session `01m160ykwk93kqkxva95cazah2`, turn
`01m160ykz5x2jr90qb4s1rph72.ueyhrn`, analyzed the exact suspect repository, revision, and target
above. The completed trace contains only official GitHub MCP reads (`get_commit`,
`get_file_contents`, and `list_commits`) followed by stock `get_openui_instructions`. It contains
no `exec`, sandbox creation, Fixture MCP, verifier, proposal, approval, GitHub write, or Kubernetes
call. The terminal OpenUI mapped the same five rule IDs and exact JSONPaths emitted by the
deterministic matrix, retained `ANALYSIS_ONLY`, and kept deployment/runtime claims Unknown. The
typed registry and `pnpm phase10:matrix`, rather than model prose, remain the rule-evaluation
authority.

## Adversarial coverage

Fixtures cover positive and negative cases for every rule family, malformed YAML, unsupported kind,
multiple YAML documents, malformed security-context types, multiple regular containers, init and
ephemeral containers, exact evidence-identity mismatch, ambiguity, and prompt text in comments,
labels, annotations, and commands. Prompt text cannot alter selection, findings, capability, or
routes. Unsupported or ambiguous input returns `INCONCLUSIVE`; it never produces a model-authored
finding.

## Presentation and no-live boundary

The pack presentation adapter maps the same typed result to stock OpenUI and Markdown with pack
identity, repository/revision/file, Kubernetes identity, exact JSONPaths, evidence, Unknown Claims,
limitations, and an analysis-only next action. It exposes no remediation or PR affordance and adds
no dependency on a frontend fork.

No Kubernetes API, cluster, `kubectl`, Pod log, CNI, packet, deployment, merge, branch, commit, or
pull-request write was used for workload evidence.

## Deterministic gate

Run:

```sh
pnpm phase10:matrix
```

The gate must reproduce the five suspect findings, zero benign findings, the workload higher-route
stop, and the frozen egress proposal hash above.
