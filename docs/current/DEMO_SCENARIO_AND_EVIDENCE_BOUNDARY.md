# Demo scenario and evidence boundary

## Scenario

SecureOps Guardian uses one owned synthetic checkout service. The last-good `checkout-api` NetworkPolicy permits required DNS traffic and PostgreSQL traffic to pods labelled `app=postgres` in `payments-data` on TCP/5432. A later, separate commit adds `0.0.0.0/0` egress while leaving the legitimate dependency path intact.

| State | Full commit SHA |
| --- | --- |
| Last good | `a6d177b43396c7b4b45aa98cb2970d0489a7a4f9` |
| Suspect regression | `7b2f2ad51f9ef97334176fbfed3138465b62fcdb` |

The fixture deployment record names the suspect revision. Synthetic alert and reachability observations occur afterward and report an allowed connection from `checkout-api` to `forbidden.example.test` (`203.0.113.10`) on TCP/443. The service catalog separately declares DNS and PostgreSQL as required dependencies.

These records are independently sourced observations. The Fixture MCP does not decide severity, causal relationship, remediation, or approval.

## Threat and claim boundary

- The asset is the owned synthetic `checkout-api` workload in the `payments` namespace.
- The declared threat is unintended egress from that workload identity to a documentation-only external test destination.
- Initial severity is `High` only when a later investigation joins the required evidence. Phase 1 does not make that decision.
- Actual data access and exfiltration are `Unknown`. Reachability is not evidence that data moved.
- Every operational and security observation is static, owned, and synthetic. No production data, user data, credential, cluster, packet capture, or live telemetry is involved.
- The Git commits and manifest are real GitHub evidence in the owned fixture repository.
- The planned verifier is deterministic static NetworkPolicy contract validation, not live-cluster reachability proof. It is not implemented in Phase 1.
- Guardian never merges, deploys, contacts a cluster, or performs containment in Phase 1.

## Failure variants

The same four read-only tool contracts accept deterministic case IDs for a missing deployment revision, missing reachability observations, and conflicting deployment revision fields. These variants expose incomplete or conflicting facts only; the MCP does not return an intended answer or terminal outcome.
