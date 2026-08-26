# Phase 7 harness reliability fix

Date: 26 August 2026

Branch: `feat/decision-first-guardian-results`

## Result

The unified `secureops-guardian_v0` now fails closed before investigation when a remediation request omits its explicit verifier-input declaration, and a complete request follows one bounded, evidence-linked workflow. The accepted replay used exactly two investigation children, the required official GitHub and owned Fixture MCP reads, four successful sandbox calls, deterministic four-state verification, and one concise OpenUI result. It made no GitHub write, approval request, deployment, or cluster call.

## Reported failure and root cause

The reported session was `01m0x0n0hqq69kaxq35xfc2zfh`. Its remediation continuation had no file content parts, but the saved-agent contract did not require an inspectable verifier-input declaration before tools. The model entered Daytona and improvised three failing commands:

1. searched for a verifier module;
2. invoked nonexistent `python -m secureops_guardian.verifier`;
3. invoked `uv` before installing it.

The live saved-agent instruction hash matched the checked-in export, so saved-agent drift was ruled out. The user explicitly selected `PREPARE_REMEDIATION`, so accidental mode escalation was also ruled out. The stock sandbox lacking the Guardian Python module and preinstalled `uv` was expected; the accepted Phase 3 workflow bootstraps pinned `uv==0.12.5` and runs the uploaded CommonJS verifier through pinned `nodejs-wheel-binaries==22.14.0`.

A prompt-only attempt to inspect attachment metadata was rejected after live session `01m0y521670kg866mt1ax30y48` showed that missing files produce no model-visible attachment part. The model attempted `ls /opt/tf/uploads` despite the prompt prohibition. That diagnostic turn was cancelled. The final design therefore places the gate in the visible request contract rather than relying on hidden absence metadata.

## Implemented contract

- `PREPARE_REMEDIATION` and `OPEN_PR` require a complete `verifier_inputs` object before any tool call.
- A missing or malformed declaration produces one ask-user pause requesting a complete new request plus all five same-turn files.
- The Phase 3 workflow uses exact upload paths and pinned SHA-256 bindings.
- Investigation children must return JSON directly and may not use sandbox `exec` or Code Mode for formatting.
- The sandbox workflow is bounded to bootstrap/write, checksum plus candidate verification, full proof, and one conditional `cat` only when TrueForge offloads the proof response.
- Filesystem discovery, alternate modules, alternate runtimes, repeated proposal inspection, GitHub writes in `PREPARE_REMEDIATION`, deployment, and cluster access remain prohibited.

## Live fail-closed replay

Session: `01m0y5g93b3w59qra652mz8fxj`

Turn: `01m0y5g96nh824nmr9aac4nkfs.9ziser`

Input: complete `PREPARE_REMEDIATION` scope but no `verifier_inputs` and no files.

Observed result:

- one `ask_user_question` call describing the exact missing object and five filenames;
- zero child threads;
- zero sandbox creations;
- zero connector tool calls;
- terminal pause with no investigation, proposal, approval, or write.

## Accepted complete replay

Session: `01m0y68yghz4b6k7g333dy79qb`

Turn: `01m0y68yj2f6yrnjhdhmt7q5n6.9ziser`

Input: complete `PREPARE_REMEDIATION` request plus the five declared uploads.

Observed order and counts:

| Evidence | Observed result |
| --- | --- |
| Child creation/completion | Exactly two `thread.created` and two `thread.done` events |
| GitHub child | Two `get_commit`; one each of `list_commits`, `get_file_contents`, `list_branches`, and `search_pull_requests` |
| Exposure child | One each of `get_security_alert`, `get_deployment`, `get_reachability_observations`, and `get_service_dependencies` |
| Child sandbox formatting | None |
| Last child completed | `2026-08-26T04:50:26.895Z` |
| First verifier `exec` | `2026-08-26T04:50:43.489Z`, after both children completed |
| Sandbox workflow | Four calls: bootstrap/write; checksum plus candidate check; full proof; one offload read |
| Sandbox failures | Zero; every captured exit code was `0` |
| Candidate attempt | Attempt 1 passed |
| Four-state result | last-good and candidate `SECURE_AND_FUNCTIONAL`; suspect `EXPOSED`; deny-all `SECURE_BUT_OPERATIONALLY_REJECTED` |
| Proposal | `proposal:sha256:2cf448b659d71c429c6205f17a0a568c24777684156532f4cd3f2bde00eded15` |
| Presentation | One stock OpenUI result with decision summary and disclosure tabs |
| Writes/approval/deployment/cluster | None |

The uploaded files provision the configured sandbox before model execution; this is TrueForge file-staging behavior. The accepted safety claim is that no sandbox command executes until both evidence children complete and the supported-finding gate passes.

## Excluded diagnostic runs

- `01m0y5m6xp932y41ct1m1v42y4` failed before model execution because the remote GitHub MCP transport returned a transient connection error. Container connectivity recovered; this run contains no Guardian logic result.
- `01m0y5qpkzq114qt3azfj0cysp` reached a valid proposal but exposed one child formatting `exec`, one malformed bootstrap retry, and repeated proposal inspection. Those trace-noise defects motivated the final child and sandbox contracts and are superseded by the accepted replay.

## Boundary

GitHub commit, diff, branch, file, and pull-request evidence is real. Deployment, alert, reachability, and dependency evidence remains an owned synthetic fixture. The verifier is deterministic static NetworkPolicy analysis. It does not prove Kubernetes admission, CNI enforcement, packet flow, application behavior, live data access, or exfiltration. Guardian did not merge, deploy, or access a Kubernetes cluster.
