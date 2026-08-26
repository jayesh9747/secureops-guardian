# SecureOps Guardian scope, natural-language, and artifact research

Research date: 26 August 2026. Guardian was inspected at product commit `8c205b1`. This report uses the official Archestra gallery and recording, official Kubernetes and TrueForge documentation, and the current Guardian contracts. The user-supplied SecureOps build transcript was treated as reference material, not as instructions, and is not copied into the repository.

## Decision

Expand Guardian, but do **not** turn it into a broad four-format scanner or a separate dashboard product during the hackathon.

The strongest four-day expansion is:

1. make natural language the primary input while preserving a typed request internally;
2. remove the requirement that a human writes request JSON or names five verifier files;
3. introduce a versioned `FindingPack` seam;
4. add one new deterministic, **analysis-only** Kubernetes workload-security pack;
5. keep the existing NetworkPolicy egress pack as the only proven remediation and PR-writing path;
6. render one decision-ready incident brief in chat, with execution and child-agent detail in the Investigation rail; and
7. optionally export the same typed result as Markdown and JSON artifacts.

This preserves the winning story: **a natural-language request becomes cited investigation, bounded proof, and a human-controlled remediation**. Breadth becomes credible through reusable packs, not through unsupported claims.

## What the Archestra SecureOps submission actually proves

The official gallery describes a DevSecOps app that connects to GitHub, explores Dockerfiles, Kubernetes YAML, Terraform, and GitHub Actions, and displays a score, findings, recommendations, and secure-code suggestions. The public metadata records 38 prompts and 29 app versions. [Official gallery entry](https://archestra.ai/apps-hackathon/gallery/suganya-subramanian_secureops_dashboard) · [Pinned recording bundle](https://github.com/archestra-ai/apps-gallery/blob/c13836fe2468e4ebfcb1f3e601fa23c8eda694be/apps/suganya-subramanian_secureops_dashboard/recording.json)

The pinned recording also establishes important limits:

- The delivered snapshot is a single HTML/JavaScript app rather than a React component tree, despite the earlier build request asking for React.
- Its repository connection asks for a PAT in a browser prompt, fetches only the repository root through the GitHub REST API, and displays every root-level file rather than recursively discovering only supported infrastructure files.
- `Analyze Security` calls an MCP `open` tool with the configuration text, but the returned tool text only says that an app is opening. The page then renders a fixed `85 / Low` score, a fixed `Critical / Root User Detected` finding, generic recommendation text, and a placeholder secure-code suggestion without reading the MCP response.
- The visible `Copy` and `Apply` buttons have no handlers in the recorded snapshot.

Those are facts about the public replay, not claims about versions or services that were not recorded. The gallery repository publishes a recording for this submission, not a separately documented SecureOps source application. [Submission directory](https://github.com/archestra-ai/apps-gallery/tree/c13836fe2468e4ebfcb1f3e601fa23c8eda694be/apps/suganya-subramanian_secureops_dashboard) · [Apps Gallery repository](https://github.com/archestra-ai/apps-gallery/tree/c13836fe2468e4ebfcb1f3e601fa23c8eda694be)

### Borrow

- A two-surface experience: input/context on one side, decision-ready result on the other.
- A recognizable flow: repository context → progress → finding → recommendation → secure change.
- Strong hierarchy, short cards, readable severity, useful empty/loading states, and visible repository identity.
- An immediate result that a judge can understand without reading the trace.

### Do not borrow

- An opaque numeric score. The recorded `85 / Low` next to a `Critical` finding is internally confusing.
- Generic findings, recommendations, or placeholder secure code.
- Buttons that imply mutation without a real approval-backed action.
- Browser-side PAT prompts or direct GitHub API calls; Guardian already uses the official GitHub MCP and TrueForge approvals.
- Breadth that is not backed by deterministic rules, fixtures, evidence contracts, and honest capability labels.

The product lesson is **presentation clarity**, not the recorded scanner depth.

## Guardian today

The current root agent already has a stronger control plane than the recorded dashboard:

- conversation-only greetings and capability questions return without tools;
- an exact `GuardianRequest` selects `ANALYSIS_ONLY`, `PREPARE_REMEDIATION`, or `OPEN_PR`;
- any authorized repository can enter GitHub-only read preflight;
- the supported checkout NetworkPolicy fixture can join GitHub and synthetic incident evidence, run static four-state proof in Daytona, bind an exact proposal, and create or reuse a separately approved PR;
- stock OpenUI gives one compact result with Evidence, Verification, Exact proposal, Limitations, and Run receipt tabs; and
- the Investigation rail owns subagent, MCP, sandbox, approval, timing, and failure detail.

Sources: [request schema](../../packages/orchestration/src/scope.ts), [run planning](../../packages/orchestration/src/plan.ts), [root-agent contract](../../packages/orchestration/src/agent.ts), [OpenUI renderer](../../packages/presentation/src/render.ts), [architecture](../current/ARCHITECTURE.md), and [implementation status](../current/IMPLEMENTATION_STATUS.md).

The current hard limits remain important:

- natural-language investigation still funnels users toward an exact JSON object;
- remediation requests require a same-turn declaration and upload of five named verifier inputs;
- deterministic remediation supports only the allowlisted NetworkPolicy fixture;
- arbitrary-repository analysis is repository evidence, not proof of deployment or runtime behavior;
- Guardian has no live-cluster, pod-log, event, CNI, packet, merge, or deployment access; and
- the enhanced agent workspace in the TrueForge fork is a progressive UI branch, not a capability the product should depend on until merged and deployed.

## Recommended product boundary

| Surface | Current | Four-day target | Post-hackathon |
| --- | --- | --- | --- |
| User input | Exact request JSON for runs | Natural language or GitHub commit URL; JSON remains an advanced/internal view | Saved organization defaults and richer case intake |
| Read breadth | Any authorized GitHub repository | Same, with explicit pack classification | Dockerfile, Actions, Terraform, Helm, and live-cluster evidence packs |
| Deterministic analysis | NetworkPolicy `SEC-NET-001` | Add Kubernetes workload privilege/misconfiguration rules | More independently tested packs |
| Proven remediation | One NetworkPolicy fixture | Preserve exactly this boundary | Add a second remediation pack only after its own proof contract passes |
| Result UI | Compact OpenUI result | Typed incident brief + repository/revision chip + evidence/proof tabs | Searchable multi-case dashboard if recurring use proves the need |
| Execution UI | Investigation rail | Keep child-agent work and tool activity here; improve summaries only | General upstream trace UX |
| Artifact | Run receipt in OpenUI | Optional receipt JSON and incident-brief Markdown downloads | Signed/shareable case bundle |
| Kubernetes runtime | None | None; say so visibly | Namespace-scoped read-only cluster investigation first |

## Natural-language request compiler

Natural language should be a usability layer above the existing safety contract, not a replacement for it.

### Flow

1. **Classify intent without tools.** Greeting, explanation, and capability questions stay conversation-only. Investigation verbs begin request extraction.
2. **Extract a draft.** Recognize repository URLs or `owner/repo`, full commit SHAs or comparison endpoints, optional target file, and requested action.
3. **Map action to a ceiling.** `inspect`, `check`, or `investigate` means `ANALYSIS_ONLY`; `prepare`, `propose`, or `draft a fix` means `PREPARE_REMEDIATION`; `open/create a PR` means `OPEN_PR`.
4. **Validate deterministically.** Convert the draft into the existing typed scope. Never let the model invent a repository, branch, SHA, file, or demo fixture.
5. **Ask only for missing facts.** One concise TrueForge question should request the missing repository, branch, or revision. No MCP, child, sandbox, or write happens first.
6. **Show an interpreted-request card.** For remediation/write modes, show repository, revision, target, mode, and capability boundary. The user confirms the meaning, not raw JSON.
7. **Execute the existing typed journey.** Put the generated request JSON in an Advanced/Run receipt disclosure for auditability.

Examples:

- “Check whether commit `7b2f…` in `jayesh9747/guardian-demo-checkout` introduced a Kubernetes security risk.”
- “Prepare a safe fix for the NetworkPolicy changed by this GitHub commit URL; base branch is `main`.”
- “Open a PR only if your verifier proves the repair; otherwise stop.”

### Typed seam

Add an untrusted `GuardianIntentDraft`, but keep `GuardianRequest` as the only executable input:

```text
user text
  -> model extraction: GuardianIntentDraft
  -> deterministic normalization + missing-field report
  -> user confirmation for remediation/write
  -> validated GuardianRequest
  -> existing planGuardianRun / journey gates
```

The compiler must not use GitHub to guess missing scope before validation. A pasted commit URL can supply repository and SHA; a missing base branch still produces one question instead of silently defaulting to `main`.

### Remove verifier filenames from user input

The five verifier files are implementation assets, not user intent. Package the current verifier and fixtures as supporting files in a versioned `guardian-network-egress-v1` TrueForge skill repository, register it once, and attach it to the saved Guardian agent. TrueForge skills are Git-backed directories whose supporting files are mounted into the sandbox when the skill is selected. The bundle manifest should contain every filename, source revision, and SHA-256 digest. After the exact support gate passes, Guardian selects the attached pack and Daytona verifies its manifest and file digests before running it. [TrueForge skills](https://trueforge.dev/skills)

The user sees `Verifier pack: Network egress v1`, not filenames. The proposal and run receipt retain the pack version and digest. If staging or digest verification fails, the run stops before candidate generation and writes.

This is simpler and safer than copying large bundle text through the model, asking users to upload internal files, or adding an ad hoc runtime download. It also keeps the exact verifier reproducible.

## Finding-pack architecture

Do not add more conditionals to the root prompt. Add a small registry with one deep interface:

```text
FindingPack
  id + version
  supported scope and file kinds
  required evidence
  deterministic rules
  analysis result schema
  optional verifier bundle
  optional remediation policy
  allowed runtime claims
  presentation adapter
```

Every pack returns the same outer result:

- `pack_id` and version;
- rule/finding ID;
- repository, revision, manifest identity, and stable field location such as a YAML JSONPath;
- severity and evidence-linked finding;
- known, refuted, and unknown claims;
- capability level: `ANALYSIS_ONLY`, `REMEDIATION_PROVEN`, or `OPEN_PR_ELIGIBLE`;
- verifier/proposal references when available; and
- explicit runtime limitations.

Use manifest identity plus JSONPath as the primary location. Line numbers can be supplementary because YAML formatting changes make them unstable.

## Feature-pack priority

| Priority | Pack | Rules / value | Hackathon capability |
| --- | --- | --- | --- |
| P0 preserve | `k8s-network-egress-v1` | Unrestricted egress, causal incident evidence, four-state least-privilege proof | Full analysis, remediation, approval-gated PR |
| P0 add | `k8s-workload-security-v1` | `privileged`, privilege escalation, root execution, unsafe capabilities, host namespaces, and `hostPath` | Deterministic analysis only |
| P1 stretch | `k8s-startup-risk-v1` | Changed command/args, missing ConfigMap/Secret references, and obviously unsafe probe configuration | Repository analysis only; actual CrashLoop remains Unknown |
| Post-event | `dockerfile-hardening-v1` | Root user and a small number of independently testable build/runtime controls | Analysis first, remediation later |
| Post-event | `github-actions-security-v1` | Workflow permissions, unsafe expression use, and action pinning | Analysis first |
| Post-event | `terraform-exposure-v1` | A very small provider-specific public-exposure rule set | Analysis first |

The Kubernetes workload-security pack is the best second pack because Kubernetes already defines portable Baseline and Restricted controls for privileged containers, host namespaces, host paths, privilege escalation, non-root execution, seccomp, and capabilities. Guardian can cite those controls without pretending to be a live admission controller. [Kubernetes Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/)

The startup-risk pack is useful but less conclusive. Kubernetes documents that probes, commands, and configuration affect container startup and readiness, yet repository text alone cannot prove a real pod entered `CrashLoopBackOff`. [Kubernetes probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) · [Container command and arguments](https://kubernetes.io/docs/tasks/inject-data-application/define-command-argument-container/)

Do not implement all four Archestra formats now. Docker, GitHub Actions, and Terraform each need their own evidence vocabulary, parsers, rule ownership, fixtures, and remediation proof. Official guidance is available, but adding shallow checks would weaken Guardian's evidence standard. [Docker build best practices](https://docs.docker.com/build/building/best-practices/) · [GitHub Actions secure-use reference](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions)

## UI and artifact plan

Build a **per-run Incident Brief**, not a second persistent dashboard.

### Main chat: decision surface

Always-visible content:

- repository/revision and pack chip;
- terminal status, severity, and evidence-completeness status;
- Finding;
- Key reason;
- What Guardian did; and
- Next action.

Keep the existing under-120-word rule. Do not show raw JSON, every tool call, or a numeric score here.

Progressive tabs:

1. **Evidence** — exact commit/file/manifest references and source IDs.
2. **Causal chain** — changed field → security mechanism → observed or unknown effect.
3. **Verification** — four-state matrix when a verifier actually ran.
4. **Proposed change** — exact diff and proposal hash only when eligible.
5. **Limitations** — one honest runtime boundary.
6. **Run receipt** — generated internal request, stages, tool-event references, pack version/digest, approval/write outcome.

TrueForge Generative UI already supports streamed cards, tables, forms, and charts without executing arbitrary UI code, so the result can be dashboard-like while remaining inside the agent session. [TrueForge agent capabilities](https://trueforge.dev/create-agent/overview)

### Investigation rail: execution surface

Keep subagents and tool activity out of the final narrative. The rail should show:

- one row per child agent with status and elapsed time;
- a one-sentence returned finding;
- Findings, Evidence, and Activity tabs;
- MCP and Daytona calls grouped beneath the responsible agent; and
- approval/failure states at the exact step where they occurred.

Clicking a child should open its work in the rail, not inject another long block into chat. The stock OpenUI result must remain fully useful if the enhanced rail is unavailable.

### Exported artifacts

Generate from validated typed data, not from a second free-form model summary:

- `guardian-incident-brief.md` for a reviewer;
- `guardian-run-receipt.json` for audit/replay; and
- the exact candidate/diff only when a verified proposal exists.

Artifact bytes should hash back to the same result/proposal IDs displayed in chat. Downloads are useful; a custom searchable case database is not required for the hackathon. TrueForge already supports sandbox artifact downloads, and its quickstart demonstrates optional interactive web artifacts, but a separate web artifact builder would add another moving part to the critical demo. [TrueForge quickstart](https://trueforge.dev/quickstart)

### Typography and visual rules

- Use normal UI text for explanations and monospace only for IDs, paths, YAML, diffs, and receipts.
- Use at least a 14 px body size, 20–24 px line height, and clear contrast for secondary text.
- Keep line length bounded; do not let raw receipts expand the chat width.
- Use color plus text/icon for severity and status so meaning does not depend on color alone.
- Prefer `High`, `Inconclusive`, `Verified`, and `Approval required` chips over a synthetic score.

## Four-day solo plan (36–40 hours)

| Order | Time | Deliverable | Exit gate |
| --- | ---: | --- | --- |
| 1 | 7 h | Natural-language intent draft, deterministic normalizer, confirmation/missing-field UX, backward-compatible JSON input | Greetings make zero tool calls; ten paraphrases normalize identically; missing facts make one question and no MCP call |
| 2 | 5 h | Versioned TrueForge skill bundle, verifier-pack manifest, and automatic Daytona staging for the existing egress pack | A natural-language remediation run needs no user-supplied verifier filenames; bad/missing digest fails closed |
| 3 | 7 h | `FindingPack` registry plus `k8s-workload-security-v1` deterministic analysis pack | Positive, negative, malformed, and prompt-injection fixtures pass; pack can never enter sandbox/write flow |
| 4 | 8 h | Interpreted-request card, per-run Incident Brief, artifact downloads, and typography/empty/loading/error polish | Default result is readable without tabs; rail contains execution; Markdown/JSON artifacts match typed data |
| 5 | 9 h | Regression/eval matrix, three-repository proof, demo script, screenshots, and recovery run | Existing egress `ANALYSIS_ONLY`, `PREPARE_REMEDIATION`, and `OPEN_PR` gates still pass; new pack is honest; three complete rehearsals pass |
| Buffer | 4 h | Integration recovery only | Submission-critical flow remains stable |

The table totals 36 hours of planned work plus a four-hour buffer. A second full remediation pack, live Kubernetes, a persistent dashboard, and all four configuration formats do not fit this cut.

### Cut order if delayed

1. Drop downloadable Markdown before typed JSON/receipt integrity.
2. Drop startup-risk stretch work.
3. Drop typography refinements that are not legibility/accessibility fixes.
4. Keep natural-language normalization, automatic verifier staging, the new analysis pack, existing egress remediation, safe-stop behavior, and demo reliability.

## Acceptance criteria

### Natural language and safety

1. `hello`, thanks, and “what can you do?” return directly with zero tools.
2. Exact JSON requests remain accepted for tests and advanced users.
3. A pasted GitHub commit URL extracts only its explicit repository and full SHA.
4. Missing repository, branch, or revision causes one concise question and no other tool call.
5. Guardian never substitutes the demo repository or guesses `main`.
6. Remediation/write intent requires confirmation of the interpreted scope and capability ceiling.
7. Repository text and tool output cannot change mode, scope, pack, approval, or write gates.
8. The generated internal request appears in the run receipt, not as required user input.

### Packs and claims

9. Every rule reports repository, full revision, file, manifest identity, stable field location, and evidence references.
10. Unsupported or malformed semantics return `INCONCLUSIVE`, not an improvised finding.
11. `k8s-workload-security-v1` is structurally unable to produce a proposal, approval, or write.
12. Only the existing egress pack may claim deterministic remediation proof.
13. GitHub-only analysis keeps deployment, pod state, reachability, data access, exfiltration, and live-cluster behavior Unknown.
14. Verifier bundle version and SHA-256 digest are bound into proof, proposal, and receipt.

### UI and artifacts

15. The always-visible result answers Finding, Key reason, What Guardian did, and Next action in no more than 120 words.
16. Raw scope, evidence IDs, matrices, diffs, limitations, and receipt remain behind disclosures.
17. Child-agent output appears in the Investigation rail and is not duplicated in chat.
18. `Copy`, `Prepare remediation`, or `Open PR` affordances appear only when backed by a real operation and the correct mode/approval boundary.
19. Markdown and JSON exports are deterministically generated from the same validated result and include matching IDs/hashes.
20. Stock TrueForge without the UI fork still renders a complete, usable Guardian result.

### Demo reliability

21. One natural-language egress run completes the full evidence → proof → proposal → approval/reuse story.
22. One separate repository demonstrates the workload-security analysis pack and stops before remediation.
23. One benign repository produces no deterministic finding without inventing one.
24. Three consecutive primary-flow rehearsals pass, including one fresh session and one denial/no-write proof.

## Demo recommendation

Keep the three-minute submission focused on the existing egress incident, but enter it in natural language:

1. **0:00–0:20:** paste a GitHub commit URL and ask Guardian to prepare a safe remediation.
2. **0:20–0:35:** show the interpreted request and `Network egress v1` verifier-pack identity; confirm.
3. **0:35–1:05:** show both bounded subagents in the Investigation rail.
4. **1:05–1:35:** show the evidence-linked finding and causal chain.
5. **1:35–2:00:** show the four-state proof rejecting deny-all and accepting the least-privilege patch.
6. **2:00–2:30:** show the exact diff and TrueForge approval boundary; approve or demonstrate exact PR reuse.
7. **2:30–2:50:** download/open the brief or receipt and show the PR.
8. **2:50–3:00:** state the boundary: GitHub evidence is real, runtime fixture evidence is synthetic, verification is static, and Guardian did not deploy or access a cluster.

Use the extra workload-security repository as backup/README evidence of extensibility, not as a second story in the main video. The TrueForge hackathon explicitly recommends one narrow, end-to-end job and evaluates visible MCP, sandbox, approval, subagent, session, safety, and presentation value. [Official hackathon overview and prizes](https://www.wemakedevs.org/hackathons/trueforge#prizes) · [Official rules](https://www.wemakedevs.org/hackathons/trueforge/rules)

## Final product statement

> SecureOps Guardian lets an on-call engineer describe a risky infrastructure change in ordinary language. It turns the request into an auditable scope, delegates evidence gathering, identifies supported Kubernetes security regressions, and—only for a proven remediation pack—tests the smallest safe patch and waits for human approval before opening a PR.

This is meaningfully broader than “egress checker,” but still concrete enough to build and demonstrate honestly in four days.
