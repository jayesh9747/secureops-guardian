# Finding pack support contract

Updated: 29 August 2026.

This table is the implementation boundary for Expansion Phase 3. Repository content is
untrusted evidence. Unsupported or malformed YAML returns `INCONCLUSIVE`; it never falls
through to model-authored security opinion.

## Registry

| Pack | Version | Supported input | Maximum capability | Verifier |
| --- | --- | --- | --- | --- |
| `k8s-network-egress-v1` | `1.0.4` | Existing bounded `networking.k8s.io/v1` `NetworkPolicy` contract | `OPEN_PR_ELIGIBLE` | Pinned `guardian-network-egress-v1` bundle |
| `k8s-workload-security-v1` | `1.0.0` | One `v1/Pod` or `apps/v1/Deployment` document with Linux or unspecified Pod OS | `ANALYSIS_ONLY` | None |

The workload pack has no verifier, remediation, proposal, approval, branch, commit, or pull-request
route. A request above `ANALYSIS_ONLY` fails closed before analysis. A changed-file set matching more
than one pack is ambiguous and returns `INCONCLUSIVE`.

## Workload rules

The rule source is the Kubernetes [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/).
Guardian evaluates repository manifests against the documented Baseline and Restricted controls;
it does not claim Pod Security Admission behavior.

| Rule | Deterministic condition | Containers | Profile source | Severity |
| --- | --- | --- | --- | --- |
| `K8S-WORKLOAD-001` | `securityContext.privileged` is `true` | regular, init, ephemeral | Baseline: Privileged Containers | `High` |
| `K8S-WORKLOAD-002` | `allowPrivilegeEscalation` is missing or not `false` | regular, init, ephemeral | Restricted: Privilege Escalation | `High` |
| `K8S-WORKLOAD-003` | Pod or container `runAsUser` is `0`, including a contradiction with effective `runAsNonRoot: true` | Pod and regular, init, ephemeral | Restricted: Running as Non-root user | `High` |
| `K8S-WORKLOAD-004` | `capabilities.drop` does not include `ALL`, or `capabilities.add` contains anything except `NET_BIND_SERVICE` | regular, init, ephemeral | Restricted: Capabilities | `High` |
| `K8S-WORKLOAD-005` | `hostNetwork`, `hostPID`, or `hostIPC` is `true` | Pod | Baseline: Host Namespaces | `High` |
| `K8S-WORKLOAD-006` | A volume has a non-null `hostPath` | Pod | Baseline: HostPath Volumes | `High` |

## Evidence and claim boundary

Every conclusive result is bound to repository, full revision, file, SHA-256-bound unified patch,
Git blob identity, Kubernetes object identity, exact container identity where applicable, stable
JSONPath, evidence ID, and source reference. Patch hunks must contain a mutation and match the exact
postimage blob; context-only or unrelated hunks are rejected. Repository-only analysis may
establish only manifest facts. Deployment, admission, runtime Pod state, exploitability,
reachability, data access, exfiltration, and live-cluster behavior remain `Unknown`.
