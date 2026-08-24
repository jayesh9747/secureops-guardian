# Phase 0 — platform gate

Timebox: 4 hours.

## Goal

Prove every external dependency required by the winning path before product implementation expands. This phase answers whether the environment can execute the intended trace, not whether Guardian is feature-complete.

## Entry conditions

- The two intended public repository names are available.
- The builder has a GitHub account that can create and administer both repositories.
- Model-provider and Daytona credentials are available outside source control.
- The current TrueForge fork commit can be pinned.

If any credential is unavailable, stop this phase and resolve that dependency; later phases cannot substitute for it.

## Deliverables

- Empty `secureops-guardian` product repository with a TypeScript/pnpm workspace, license, `.gitignore`, and initial README boundary statement.
- Empty `guardian-demo-checkout` fixture repository with a license and a statement that all content is owned synthetic demo material.
- Qodo enabled before the first implementation PR.
- Pinned TrueForge runtime revision recorded in the product README.
- Connected model provider, Daytona sandbox provider, and official GitHub MCP.
- Fine-grained GitHub credential restricted to `guardian-demo-checkout` with only required Contents and Pull Requests access.
- Minimal Fixture MCP skeleton reachable by TrueForge through Streamable HTTP and returning owned case metadata.
- A platform-gate evidence record containing screenshots or trace references, never secrets.

## Execution steps

### 0.1 Create the repository boundary

Create the product and fixture repositories separately. Initialize all implementation work in the product repository. Keep the intentionally vulnerable manifest and its Git history only in the fixture repository.

Completion criterion: both public repository URLs resolve; their READMEs state their distinct roles; no Guardian implementation lives in the TrueForge fork.

### 0.2 Establish quality history

Enable Qodo and use small PRs from the first implementation change. Add baseline scripts for formatting, linting, type checking, tests, and build even when the initial packages are skeletal.

Completion criterion: the first product PR has a Qodo review record and the baseline quality commands exit successfully.

### 0.3 Boot the pinned TrueForge runtime

Run the current fork without adding Guardian-specific platform changes. Configure a model and open the stock TrueForge UI. Record the upstream/fork commit used for the demo.

Completion criterion: a saved test agent completes a plain response and the UI shows the session.

### 0.4 Prove the official GitHub MCP read path

Attach GitHub MCP to a temporary test agent and request metadata from `guardian-demo-checkout`. Use the fine-grained credential intended for the final demo.

Completion criterion: the TrueForge trace contains a successful GitHub MCP read with the exact owner and repository; access to an unrelated repository is not granted by the credential.

### 0.5 Prove the custom MCP transport

Implement only a typed `get_case_metadata` Fixture MCP tool returning a synthetic case ID and fixture version. Register its Streamable HTTP endpoint in TrueForge.

Completion criterion: TrueForge calls the tool and displays its structured result; no incident answer or model loop exists inside the server.

### 0.6 Prove the sandbox

Configure Daytona, enable the sandbox on the test agent, create a small file, execute a deterministic command, and read the result in the trace.

Completion criterion: the trace contains `sandbox.created`, a successful command, and the created file remains available in a second turn in the same session.

### 0.7 Prove dynamic subagents

Ask the test agent to delegate a bounded metadata lookup. Keep the task small and read-only.

Completion criterion: one child thread is visible and returns a result to the root. The evidence record states that child and root share attached resources.

### 0.8 Prove approval and reconnect behavior

Configure GitHub MCP write tools to require approval. Trigger a clearly labelled, harmless fixture-repository setup write. First deny it and confirm no write occurred. Trigger it again, refresh or reconnect while the approval is pending, then approve and confirm the scoped write.

Completion criterion: the trace shows approval-required, denial/no-write, pending state after reconnect, and one approved write confined to the fixture repository.

## Exit gate

Phase 0 passes only when one trace or evidence bundle proves all five TrueForge primitives: real MCP, custom MCP, sandbox execution, subagent delegation, approval/persistence. Record the pinned runtime commit and connector names.

## Recovery route

- GitHub OAuth or token failure: use a fine-grained token on the official MCP server; preserve repository-only permissions.
- Fixture MCP networking failure: use a local container reachable from TrueForge or a temporary HTTPS tunnel; keep the same Streamable HTTP contract.
- Daytona failure: spend at most the phase timebox diagnosing credentials and provider configuration, then treat the build as blocked because sandbox proof is competition-core.
- Pending approval does not survive refresh: record the actual TrueForge behavior and move reconnect proof to Phase 5; approval itself must still pass this gate.

## Excluded from this phase

Incident fixtures, policy logic, result UI, full agent prompts, production hosting, and remediation PR behavior begin in later phases.

