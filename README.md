# SecureOps Guardian

SecureOps Guardian is a TrueForge agent that traces a post-deployment Kubernetes security regression to exact evidence, validates a least-privilege repair in a sandbox, and waits for human approval before opening a remediation pull request through the official GitHub MCP server.

This `main` branch is the reviewed planning baseline. Product implementation is developed phase-by-phase on feature branches and merged through Qodo-reviewed pull requests.

## Start here

1. Read the [active product plan](./docs/current/SECUREOPS_INCIDENT_CHANGE_GUARDIAN_HYBRID_PRODUCT_PLAN.md).
2. Read the [hackathon compliance and feasibility audit](./docs/current/HYBRID_PLAN_HACKATHON_COMPLIANCE_AND_4_DAY_FEASIBILITY.md).
3. Read the [phase index and execution contract](./plans/secureops-guardian-hackathon/README.md).
4. Follow the [development and Qodo workflow](./docs/current/DEVELOPMENT_WORKFLOW.md).

Phase 0 runtime proof is recorded in the [platform-gate evidence bundle](./docs/evidence/PHASE_0_PLATFORM_GATE.md).

The intentionally vulnerable owned fixture is maintained separately in [`jayesh9747/guardian-demo-checkout`](https://github.com/jayesh9747/guardian-demo-checkout).

## Evidence boundary

- GitHub evidence and remediation pull requests operate against the owned demo repository.
- Incident evidence is synthetic and explicitly labelled.
- Sandbox validation is a static NetworkPolicy contract check, not live-cluster proof.
- Guardian cannot merge, deploy, access a Kubernetes cluster, or claim confirmed data access.

## Runtime pin

Phase 0 starts against TrueForge fork commit `6026509d905fe255bf493e3845b1fca237bdf0fd`.

## License

MIT
