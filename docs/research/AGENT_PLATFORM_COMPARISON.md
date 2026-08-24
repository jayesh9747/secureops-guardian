# TrueForge vs. agent-building frameworks and managed platforms

Research date: 21 August 2026. This is a product/architecture comparison, not a claim that one tool universally replaces another. The important distinction is the **layer** being chosen: an SDK/library, an orchestration runtime, an agent harness, or a managed cloud platform.

## Executive answer

For **Incident Change Guardian**, choose **TrueForge as the agent harness** for the hackathon. It gives the project’s differentiators—MCP connectors, isolated sandbox execution, tool-level human approvals, subagents, persistent sessions, bundled chat UI/API—without requiring us to assemble each operational capability ourselves. It is also the required sponsor technology.

Use **Codex or Claude Code to help write the project**, but do not confuse them with the runtime that the submitted agent uses. If this were a production product outside the hackathon, LangGraph would be the strongest alternative when we needed a deeply custom deterministic workflow/state machine; a managed service such as Vertex AI Agent Engine or Amazon Bedrock Agents would be attractive when the organization is already committed to that cloud and accepts its provider boundaries.

## The layers: why comparisons can be misleading

```text
Application UI/API
      |
Agent harness / runtime          TrueForge, LangGraph (+ your app), managed cloud services
      |
Agent SDK / framework            LangChain, OpenAI Agents SDK, AutoGen, CrewAI
      |
Models + tools                   OpenAI / Anthropic / Gemini / local models + MCP / APIs
      |
Infrastructure                   sandbox, database, identity, observability, deployment
```

- **Framework/SDK:** helps developers write agent behavior in application code. It may supply tools, handoffs, sessions, or tracing, but the team commonly owns the surrounding server, identity, deployment, and safety UX.
- **Orchestration runtime:** makes state, transitions, checkpoints, retries, and long-running execution first-class. LangGraph is the clearest example in this set.
- **Agent harness:** runs the whole agent loop and packages the operational pieces around it—models, tools, context, session state, safety controls, and often a UI/API. TrueForge’s project README describes this directly.
- **Managed platform:** a cloud vendor operates much of the runtime and deployment; speed and cloud integration increase, while portability and low-level control usually decrease.

## Capability comparison

| Product | Primary layer | Control and workflow design | Tools / MCP | State and human approval | Sandboxing and deployment | Model/vendor flexibility | Best fit |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **TrueForge** | Self-hostable agent harness/runtime | Configure an agent and capabilities; includes context engineering/subagents rather than requiring a graph for every flow. | Native remote MCP connections (including OAuth); skills and tools can be selected per agent. | Persistent sessions; configurable approval for all/write/destructive or named tools. | Sandbox as an isolated tool (Daytona currently); local, Docker Compose, and Helm paths; bundled chat UI, HTTP API, TS SDK, embeddable UI. | Bring a provider: OpenAI, Anthropic, Gemini, catalog providers, or OpenAI-compatible endpoints. | A product whose core story is controlled tool use, sandboxed work, approvals, and durable sessions. |
| **LangGraph** | Low-level orchestration framework/runtime | Highest explicit control: model steps and deterministic steps are nodes/edges in your graph. | Use your own tool integration or LangChain integrations; MCP is available through the surrounding ecosystem rather than a turnkey connector catalog. | Durable execution, persistence, and interrupts/human-in-the-loop are core features. | You choose and integrate sandboxing; local code execution is your responsibility. Deploy yourself or add LangSmith deployment/observability products. | Model/tool agnostic; LangGraph can be used without LangChain. | Complex, bespoke, auditable state machines such as claims, compliance, or multi-stage operations flows. |
| **LangChain** | Higher-level agent framework | `create_agent` composes a model, prompt, tools, and middleware; lower ceremony than a graph. | Broad provider/tool integrations; MCP adapters are available in the ecosystem. | Built on LangGraph, so durable execution/HITL/persistence can be used; exact policy and UX remain application work. | No opinionated agent sandbox/deployment in the base library; integrate these yourself or use LangSmith products. | Strong multi-provider interface, including hosted and local model integrations. | Fast custom Python/JS agent development where the team wants the LangChain ecosystem. |
| **OpenAI Agents SDK** | Application SDK | Code-first agents, tools, handoffs, guardrails, tracing, and a runner. | Supports function tools and hosted, Streamable HTTP, SSE, and stdio MCP servers. | Human-in-the-loop tool approval pauses a run and a serializable run state can resume it; application selects the persistence and approval experience. | Sandbox agents are a separate capability/service; durable failure recovery needs an external integration (for example a workflow/runtime or database). Deployment/identity remain app-team work. | Defaults to OpenAI but supports non-OpenAI providers/model adapters; capability parity can vary by provider. | OpenAI-centric teams wanting a compact code-first SDK, including voice/realtime paths. |
| **Microsoft AutoGen** | Multi-agent framework/runtime primitives | Message-driven agents, teams, and event-driven/distributed patterns; developer builds the control plane. | Tool/function integration and extensions; choose/integrate MCP support where needed. | Stateful agents and multi-agent teams; `UserProxyAgent` supplies a human-feedback point, but policy/persistence are application design. | Code execution and container isolation are integrations/components, not a hosted safety boundary supplied by every app. Deploy and operate your system. | Model-client abstraction allows multiple model providers. | Research/prototyping or sophisticated message-driven multi-agent systems, especially Microsoft/.NET/Python teams. |
| **CrewAI** | High-level multi-agent framework | Role/task-oriented **Crews** and event-driven **Flows**; easy to express a team of specialists. | Tools and MCP-server support. | Flow state/persistence and human-in-the-loop support exist, but approval policy and app UX are your design. | Local/enterprise deployment options; sandboxed code execution is a configured tool capability rather than a universal harness boundary. | Supports multiple model providers through its LLM configuration. | Rapid role-based automation when the workflow maps cleanly to named specialists and tasks. |
| **Vertex AI Agent Engine** | Google-managed agent runtime/platform | Managed runtime/deploy/scale for agents from selected frameworks; less infrastructure to operate, more GCP design constraints. | Google integrations and MCP can be used as an open-standard tool/data route. | Managed sessions/context, evaluation, tracing/monitoring/logging options; approval policy is composed with application/cloud controls. | Google runs the runtime; deploy/operate within GCP. Code execution in an isolated sandbox is a separate preview capability. | Strong Gemini/GCP alignment; supports selected frameworks/models but is not cloud-neutral in operations. | Enterprises already on GCP needing managed scale, IAM, observability, and governance. |
| **Amazon Bedrock Agents / AgentCore** | AWS-managed agent service and runtime | Bedrock Agents configures instructions, action groups, knowledge bases, orchestration, and multi-agent teams; AgentCore can host custom/framework code. | Bedrock action groups invoke APIs/Lambda; AgentCore Gateway supports MCP tools/resources/prompts. | AgentCore Runtime provides session management; confirmation/authorization must be composed in the application/action design. | AWS runs the service; AgentCore Runtime provides isolated microVMs and Code Interpreter provides a containerized code sandbox. | Bedrock model catalog and AWS runtime integrations, not a cloud-neutral operational plane. | AWS-native enterprise automations tied to AWS IAM, VPC, data, and operational services. |

## What each choice means for the Guardian

### TrueForge: the right hackathon choice

The Guardian needs five things visible in a three-minute demo: GitHub MCP reads, parallel investigations, a real isolated test, a non-bypassable approval before a PR write, and a session that survives the pause/reopen. TrueForge is designed as the runtime around those exact concerns: model calls, MCP tools, skills, sandboxing, approvals, context management, and session state. Its README also states that it exposes the runtime through chat UI, HTTP API/TypeScript SDK, and an embeddable UI.

This means the project team spends its time on the *product decision*—which evidence is needed, what a safe remediation looks like, which writes require approval—instead of first building session persistence, tool approval cards, an MCP registry, and sandbox plumbing.

### LangGraph: strongest alternative if the workflow becomes a strict state machine

LangGraph describes itself as a low-level runtime for long-running stateful agents, explicitly mixing deterministic and LLM-driven steps, with persistence and human oversight. It would be excellent if a future version needed a formally constrained workflow such as `collect evidence -> policy gate -> canary test -> CAB approval -> deployment`, with every path coded as a node/edge.

Trade-off: we would still need to build or integrate the MCP connector management, sandbox provider, approval UI/policy, durable API surface, and deployment setup. For this hackathon that is unnecessary work and provides less obvious TrueForge sponsor-tool use.

### LangChain, AutoGen, and CrewAI: frameworks, not complete operational products

These can absolutely implement a Guardian. LangChain is a configurable agent harness on LangGraph; AutoGen emphasizes multi-agent/message-driven patterns; CrewAI makes role/task teams easy. They are attractive when their programming model best matches the team’s experience. But an incident agent must have a reliable boundary around **write actions** and **untrusted code execution**. With these frameworks, we would deliberately assemble and prove that boundary ourselves.

For example, simply having an `Incident Analyst` and a `SecureOps Scanner` as CrewAI roles does not automatically prove that a GitHub write is approval-gated, or that a patch test runs in an isolated environment. The same is true for a basic LangChain or AutoGen demo.

### OpenAI Agents SDK: close feature overlap, different product boundary

The OpenAI Agents SDK provides agents, tools, handoffs, guardrails, sessions, MCP, tracing, and current sandbox-agent capabilities. It is a good choice when OpenAI is the intended model/runtime provider and you want to write the product control plane in code. It can also be appealing if a voice experience becomes central because its documentation covers Realtime and voice agents.

It is still an SDK, not the hackathon’s required harness. We would own the service/UI/deployment integration and should not use Codex or ChatGPT login tokens as model credentials. For the Guardian demo, use TrueForge as the runtime; an OpenAI model can remain one configurable provider beneath it.

### Vertex AI Agent Engine / Bedrock Agents: choose them only with a cloud commitment

Managed agent platforms remove operational work and integrate naturally with cloud identity, logging, networks, data stores, and vendor model catalogs. They are sensible for a company already standardized on GCP or AWS. The cost is lock-in: execution, IAM, observability, networking, model access, and action integrations follow the cloud provider’s model. They are a poor fit for a hackathon where TrueForge must be central and portable demo setup matters.

## Decision matrix for this project

| Requirement | Best choice | Why |
| --- | --- | --- |
| Win the **TrueForge** hackathon | **TrueForge** | It is the required sponsor technology and makes the requested harness capabilities demonstrable. |
| Build a highly constrained production workflow later | **LangGraph, possibly beneath/alongside a product runtime** | Explicit graph/state-machine control. |
| Build a small OpenAI-focused agent quickly | **OpenAI Agents SDK** | Compact code-first primitives, tools, sessions, tracing, handoffs. |
| Build a role-based multi-agent prototype | **CrewAI** | Fast Crew/Flow programming model. |
| Build an event-driven distributed multi-agent system | **AutoGen** | Agent/team/message runtime primitives. |
| Existing organization is all-in on GCP or AWS | **Vertex Agent Engine or Bedrock Agents** | Managed cloud identity, operation, and integration story. |

## Recommended architecture and scope

Build **a productized agent on TrueForge**, not a TrueForge competitor and not a generic dashboard:

```text
On-call engineer
      |
      v
Incident Change Guardian (TrueForge session)
  |- GitHub MCP: issue, diff, configuration, PR creation
  |- Subagent A: incident/log and blast-radius analysis
  |- Subagent B: SecureOps scan of changed IaC
  |- Sandbox: validate a narrow proposed patch against fixtures
  `- Approval policy: PR creation is explicitly gated
      |
      v
Evidence report -> human Allow/Deny -> remediation PR -> durable audit trail
```

The custom UI is optional. Start with TrueForge’s chat UI so the judge can see trace, sandbox, subagents, and approval. Add a small bespoke evidence panel only if it makes the decision clearer. Voice is an optional post-MVP notification tool, not the approval mechanism and not the project’s core value.

## Sources (official documentation)

- [TrueForge repository README](https://github.com/truefoundry/trueforge) — agent loop, MCP, sandbox, approvals, subagents, session state, providers, UI/API/SDK, deployment.
- [TrueForge introduction](https://trueforge.dev/introduction), [MCP servers](https://trueforge.dev/mcp-servers), [sandbox](https://trueforge.dev/sandbox), [subagents](https://trueforge.dev/key-features/subagents), and [agent creation / approvals](https://trueforge.dev/create-agent/overview).
- [LangGraph overview](https://docs.langchain.com/oss/python/langgraph/overview) — low-level orchestration, durable execution, persistence, HITL, deployment.
- [LangChain overview](https://docs.langchain.com/oss/python/langchain/overview) — configurable `create_agent`, provider interface, LangGraph foundation.
- [OpenAI Agents SDK: MCP](https://openai.github.io/openai-agents-python/mcp/), [human-in-the-loop](https://openai.github.io/openai-agents-python/human_in_the_loop/), and [running agents](https://openai.github.io/openai-agents-python/running_agents/) — tool approval/resumption, MCP transports, and durable-run integration requirements.
- [Microsoft AutoGen AgentChat](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/agents.html), [teams](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/index.html), and [human-in-the-loop](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/tutorial/human-in-the-loop.html).
- [CrewAI documentation](https://docs.crewai.com/) and [agents](https://docs.crewai.com/core-concepts/Agents) — Crews, Flows, tools, state/persistence, human-in-the-loop, deployment.
- [Google Agent Engine overview](https://cloud.google.com/vertex-ai/generative-ai/docs/reasoning-engine/overview) and [monitoring](https://cloud.google.com/agent-builder/agent-engine/manage/monitoring) — managed Google runtime/platform and observability.
- [Amazon Bedrock Agents](https://docs.aws.amazon.com/bedrock/latest/userguide/agents-create.html), [AgentCore Runtime](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-how-it-works.html), [Gateway MCP](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-using.html), and [Code Interpreter](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/code-interpreter-tool.html).

## Important caveat

Features evolve rapidly, especially MCP, sandboxing, and managed-agent offerings. Before choosing a production platform, verify the exact SDK version, cloud region, pricing, security/IAM constraints, data residency requirements, and the implementation of a **real approval enforcement point**. A UI confirmation button alone is not a safety control; the server/tool policy must refuse the write until the approval event is recorded.
