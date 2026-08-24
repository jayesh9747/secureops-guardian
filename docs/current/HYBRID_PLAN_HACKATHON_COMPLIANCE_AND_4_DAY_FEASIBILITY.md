# SecureOps Incident Change Guardian: hackathon compliance and four-day feasibility

Updated: 24 August 2026.

## Verdict

The product is a strong conceptual fit for **Best Use of TrueForge**, but the current plan earns only a **conditional pass**. A reduced, judge-visible slice is achievable in four focused days; the complete plan is not a responsible solo-developer commitment.

## Official requirements and fit

The hackathon expects a public, open-source repository with a runnable README, a roughly three-minute working demo, and a short explanation of what the project does and how it uses TrueForge. The work must use permitted accounts and data, keep secrets out of the repository and demo, disclose AI use, and be built during the event window. The project concept satisfies the substantive safety and product requirements, but those submission artifacts still have to be created and evidenced. [Official overview and prizes](https://www.wemakedevs.org/hackathons/trueforge#prizes) · [Official rules](https://www.wemakedevs.org/hackathons/trueforge/rules)

The Best Use track is the natural target. The planned flow makes the required harness behavior visible: real MCP access, generated work tested in a sandbox, a human approval pause before a write, subagent delegation, and a reconnectable session. These capabilities are documented by TrueForge. [TrueForge introduction](https://trueforge.dev/introduction) · [MCP setup](https://trueforge.dev/mcp-servers) · [Sandbox setup](https://trueforge.dev/sandbox) · [Subagents](https://trueforge.dev/key-features/subagents) · [Agent approvals](https://trueforge.dev/create-agent/overview)

Qodo is formally required for the Best Code Quality prize, not for every prize, although using it from the start remains useful evidence of sponsor-tool adoption. [Official rules](https://www.wemakedevs.org/hackathons/trueforge/rules)

## Claims that must be corrected

- Remove the unofficial `29/30` prediction. The official judging criteria do not define that scoring scale.
- Do not claim the sandbox has a native shell-command allowlist. The documented isolation boundary is a Daytona sandbox; the plan can expose only one checked-in verifier command by convention, but that is not the same platform guarantee. [TrueForge sandbox](https://trueforge.dev/sandbox)
- A hidden expected answer is not hidden if it is readable in the public repository or shared sandbox. Prefer transparent deterministic contract tests.
- Dynamic subagents are model-selected and share the root agent's MCP tools and sandbox; TrueForge does not document hard per-role tool isolation. [TrueForge subagents](https://trueforge.dev/key-features/subagents)
- `create_security_remediation_pull_request` is custom product code. The official GitHub MCP exposes lower-level branch, file-update, and pull-request operations; true one-transaction idempotency requires a wrapper or careful recovery logic. [GitHub MCP server](https://github.com/github/github-mcp-server)
- Describe the verifier as **static NetworkPolicy contract validation**, not proof of live-cluster reachability.
- Use `High` severity unless the owned fixture explicitly supports `Critical`. State that exfiltration is possible while actual data access remains unknown.
- Replace the placeholder `4c21` with a real commit SHA or clearly label it as a short demo alias.
- Security-auditor and incident-investigator examples already exist in the official cookbook. The security-regression/least-privilege combination is differentiated, but originality is moderate rather than near-perfect. [TrueForge example cookbook](https://github.com/truefoundry/trueforge/tree/examples/agent-cookbook/examples)

## Four-day cut line

### Keep for the winning core

1. One repository, one NetworkPolicy regression, one synthetic alert.
2. Real GitHub MCP reads and a tiny read-only incident fixture MCP.
3. One deterministic unrestricted-egress rule with file/rule evidence.
4. An agent-generated candidate YAML patch.
5. A sandbox comparison of suspect, deny-all, and repaired states.
6. One approval-gated GitHub remediation path and a visible denial/no-write path.
7. One or two subagents only after the direct root-agent flow works reliably.
8. Public README, architecture/safety notes, AI disclosure, repeatable setup, and a rehearsed three-minute demo.

### Defer unless the core is already stable

- Hidden oracle infrastructure.
- Full typed evidence ledger and five terminal outcomes; keep `READY` and `INCONCLUSIVE`.
- Custom result-card UI.
- Bespoke pending-approval persistence.
- Strong one-transaction PR idempotency if using lower-level GitHub MCP writes.
- CPU red-herring branch, elaborate blast-radius claims, and multiple generated repairs.
- All thirteen acceptance tests; retain the happy path, denial/no-write, missing-evidence, and deterministic validator tests.

## Estimate

The complete plan is roughly **50–80 focused engineering hours**, depending on existing TrueForge, model, Daytona, GitHub, MCP-hosting, and Qodo setup. A reduced slice is approximately **30–40 hours**.

- Solo developer: reduced core is possible but tight; complete plan is not realistic.
- Two developers: reduced core is feasible if integration is proven on Day 1; the full plan remains risky.
- Three developers: most of the complete flow is feasible, but demo reliability and polish still justify the cut line.

Day 1 is a go/no-go gate: TrueForge must call the real GitHub tool, call the fixture MCP, run one sandbox command, and display one approval pause. Daytona is the documented sandbox provider, and approval selection beyond tool annotations is configured through the API. [TrueForge sandbox](https://trueforge.dev/sandbox) · [TrueForge agent configuration](https://trueforge.dev/create-agent/overview)

## Recommendation

Target **Best Use of TrueForge** and build the reduced core first. The winning story is not “many features”; it is one security regression where judges visibly see evidence gathering, a bad containment rejected, a least-privilege patch tested, and a human retaining control of the write.
