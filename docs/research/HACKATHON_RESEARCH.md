# TrueForge Agent Harness Hackathon - research and strategy

Research date: 2026-08-21. This note distinguishes published event rules from strategic recommendations.

## Bottom line

The two hackathons share one important idea: make an AI system useful by connecting it to real tools over MCP. They are **not** the same kind of competition.

- The completed Archestra event rewarded a publicly shareable app generated largely through chat: interface, useful workflow, connected MCP data, and a compelling gallery entry.
- The TrueForge event rewards an **engineered agent that can safely act**. The agent must run on TrueForge, visibly use the harness rather than merely wrapping an LLM call, work with real tools, run code safely, and pause for human approval before an irreversible action.

For the main TrueForge prize, build a narrow but realistic operational agent where all five harness abilities are necessary and plainly demonstrated: MCP tools, sandbox code execution, approval checkpoint, delegated subagent work, and a session that survives reconnect/review. A developer, DevOps, security, or incident-response workflow is a particularly strong fit.

## Official event facts

| Item | Archestra Apps Hackathon (completed) | TrueForge Agent Harness Hackathon (current) |
| --- | --- | --- |
| Dates | July 22-29, 2026; winners announced August 4 | August 24-30, 2026; Monday 08:00 to Sunday 20:00 London time |
| Format | Online, worldwide | Online worldwide; optional in-person day in San Francisco on August 29 |
| Team | Solo or team; one PR author/app; multiple apps permitted | Solo or up to four; each participant can be on only one team |
| Required platform | Archestra app built in chat, connected to tools/data through MCP | Agent must run on TrueForge and a judge must see the harness doing real work |
| Deliverable | Public app, build recording, prompts, connected MCP servers; submission PR | Public source repo, clear setup README, about three-minute demo of the agent working, short TrueForge write-up; blog link if entering blog prize |
| Submission deadline | July 29, 23:59 UTC | August 30, 20:00 London time |
| Main prizes | $1,000 Most Useful; $750 Best Weird; $500 + swag Community Buzz | $5,000 NVIDIA DGX Spark for Best Use of TrueForge; $1,000 Mac Mini for Best Code Quality; also keyboard blog prize, mouse GitHub-star draw, and top-10 social swag |
| Main judging | Founders selected Most Useful and Best Weird; community selected Community Buzz | Six equally weighted criteria: impact, originality, technical excellence, sponsor-tool use, control/safety, and presentation |

Sources: [Archestra event/winners](https://archestra.ai/apps-hackathon/), [Archestra quickstart](https://archestra.ai/apps-hackathon/quickstart), [TrueForge overview](https://www.wemakedevs.org/hackathons/trueforge), and [TrueForge rules](https://www.wemakedevs.org/hackathons/trueforge/rules).

## What Archestra's winning entry teaches

The winner, [SecureOps Dashboard](https://archestra.ai/apps-hackathon/gallery/suganya-subramanian_secureops_dashboard), audited Dockerfiles, Kubernetes YAML, and Terraform using GitHub-backed integrations. The winner announcement praised the practical end-to-end workflow, specific findings, and suggested fixes. It demonstrates a good general rule: a strong hackathon entry picks a real job, consumes real data, returns a decision-ready result, and has a visual narrative.

For TrueForge, do not reproduce it as only a dashboard. Turn that pattern into an agent that investigates, safely tests a proposed remediation in a sandbox, asks before changing anything, and leaves an audit-ready report.

## What TrueForge provides (and what should show in the demo)

TrueForge is an open-source agent harness: the runtime around an LLM that manages the agent loop, tools, safety controls, and state. It provides:

- MCP servers, including OAuth-capable remote servers, plus built-in tools and web search.
- A sandbox as a tool for isolated code/file execution; secrets stay in the harness.
- Human checkpoints: tool approval and asking questions before sensitive actions.
- Subagents, deferred tool loading, Code Mode, large-result offloading, compaction, and persistent sessions.
- Model choice, skills, a built-in chat UI, HTTP API/TypeScript SDK, and embeddable UI.
- Local SQLite mode or Docker Compose/Helm with Postgres and Redis for hosted/multi-replica deployment.

Sources: [TrueForge official repository and docs index](https://github.com/truefoundry/trueforge), [TrueForge quickstart](https://trueforge.dev/quickstart), and [official launch explanation](https://www.truefoundry.com/blog/engineering/trueforge-open-source-agent-harness/). Archestra's contrasting app architecture is described in [its platform-apps documentation](https://archestra.ai/docs/platform-apps).

## Rules that should shape the project

The following are requirements, not optional polish:

1. Build the project during the event; pre-event ideation, diagrams, and architecture planning are allowed, but coding/design must occur during the event.
2. Use TrueForge centrally. A thin UI around one model call is explicitly insufficient.
3. Use only accounts, tools, and data you own or have permission to use. Never put private data, credentials, or login-protected information in the repository or demo.
4. Submit open source code that judges can read and run.
5. Disclose AI coding-assistant use, understand the implementation, and verify it. Fully AI-generated/unverified work can be rejected.
6. One entry can be considered for both judged tracks, but a team can win only one. Qodo is necessary only for the Best Code Quality track.

For the Qodo track specifically: install Qodo at the start, develop through multiple pull requests rather than direct-to-main commits, let Qodo review each PR, and resolve or explain findings before merge. Judges inspect the review history.

Source: [official rules](https://www.wemakedevs.org/hackathons/trueforge/rules).

## Recommended project: Incident Change Guardian

**One-sentence pitch:** An approval-gated incident-response agent that investigates a production alert using real engineering tools, writes and runs a diagnostic/remediation plan in an isolated sandbox, then waits for a human before any destructive production change.

Why it is a strong fit:

| Judging criterion | Concrete proof in this project |
| --- | --- |
| Potential impact | Reduces time from an incident alert to a safe, explainable action plan. |
| Originality | It is a change-control agent, not a generic chatbot or dashboard. |
| Technical excellence | Clear typed tool contracts, tested risk policy, reproducible fixture incident, and a small focused scope. |
| Sponsor-tool use | TrueForge drives the long-running session, MCP calls, sandbox, subagent delegation, and approval. |
| Control and safety | Risk classifier blocks writes; sandbox evaluates commands/patches; an explicit approval gate is required before a simulated rollback, ticket update, or PR creation. |
| Presentation | A three-minute story can show alert -> evidence -> parallel investigation -> safe validation -> approval -> action -> audit log. |

### Minimum viable demo flow

1. Start with a reproducible simulated alert (for example, checkout errors rising after deployment `4c21`). Use a demo GitHub repository and a small mock observability/incident MCP service you control.
2. The parent TrueForge agent reads alert data via MCP and delegates two bounded tasks: one subagent inspects the recent deployment/diff; another analyzes logs/metrics. Display both task results.
3. The agent generates a diagnostic script or patch and runs it in the TrueForge sandbox against fixture data. Show the isolated command output and that it does not contact production.
4. The agent presents evidence, alternatives, expected impact, and a proposed action. Make the irreversible action a real approval-gated tool, such as creating a remediation PR or performing a clearly simulated rollback.
5. Click/reply with approval. Only then execute the action through MCP. Show a durable session/audit summary and reconnect/reopen the session if practical.

The demo should use a non-sensitive, reproducible test environment. The safety decision needs to be visible, not merely claimed in the README.

## Build plan

### Before August 24 (allowed planning only)

1. Register, star the TrueForge repository, read the rules, and decide solo versus team.
2. Write a one-page design: user, painful job, tools, irreversible action, approval policy, fixture data, and success metric.
3. Prepare only legal planning artifacts: architecture diagram, screen/storyboard, demo script, task board, and list of safe public/sample data. Do not start project coding/design before the event.
4. If targeting Best Code Quality, create a GitHub repository and install Qodo at the event start, then work through meaningful PRs from the first day.

### Day 1: establish the harness proof

1. Create the public repository, README skeleton, license, threat-model/safety note, and AI-assistance disclosure.
2. Run TrueForge locally, connect a model, and prove a small MCP read-only call.
3. Connect a sandbox provider and make one agent-generated diagnostic script execute in it.
4. Add the approval-gated write tool before adding visual polish. Record a short screen capture as backup evidence.

### Days 2-3: deliver the end-to-end vertical slice

1. Build the fixed incident scenario and fixtures.
2. Add subagents with separate, narrow responsibilities and show their outputs in the parent session.
3. Build the risk policy: read-only actions auto-run; action changes require explicit confirmation; high-risk actions are denied outside the demo environment.
4. Add automated tests for the policy and demo fixture.

### Days 4-5: make it judgeable

1. Improve the explanation and UI only where it clarifies what the harness is doing.
2. Add failure handling: unavailable MCP tool, sandbox failure, missing approval, rejected approval, and reconnect/resume.
3. Use Qodo reviews on each PR if pursuing that track; address findings in the PR discussion.
4. Publish one useful social progress clip and tag WeMakeDevs, TrueFoundry, and Qodo for the swag category.

### Days 6-7: evidence and submission

1. Freeze a clean demo environment and run the full flow several times.
2. Record a crisp ~3-minute video: problem (15 sec), real evidence/tool calls (30 sec), subagents (20 sec), sandbox proof (25 sec), approval gate (25 sec), approved action/audit (20 sec), architecture/why TrueForge (25 sec), result (20 sec).
3. Complete the README: prerequisites, one-command setup, environment variable template, architecture, safety model, test command, demo fixtures, and AI-use disclosure.
4. Publish the short write-up/blog with screenshots and add it to the submission. Submit before the London-time deadline; do not leave video upload or public-repo visibility to the final hour.

## Anti-patterns to avoid

- A generic chat interface that happens to call an LLM.
- Mocked tool calls presented as real integrations.
- Sandboxing that never executes code during the demo.
- A confirmation dialog that does not actually prevent a write action.
- Connecting a personal production account or leaking secrets in screenshots/repo history.
- A polished dashboard with no agent autonomy/control story.
- A single final commit or last-minute Qodo installation when competing for Best Code Quality.

## Practical decision

Aim for **Best Use of TrueForge**, not maximum feature count. One convincing operational workflow with real MCP reads, sandboxed validation, an unskippable approval boundary, subagents, durable session evidence, tests, and an excellent demo aligns directly with all six equally weighted criteria. Add Qodo PR discipline from the first day if you can sustain it, but do not sacrifice the harness proof to chase both tracks.
