# TrueForge rules and README audit

Audited on 2026-08-30 against public repository commit [`5e0b377`](https://github.com/jayesh9747/secureops-guardian/commit/5e0b377cada9d1ffce58486f42cc64591f56f84b), which matched local `origin/main` at the time of review.

Primary sources:

- [Official hackathon rules](https://www.wemakedevs.org/hackathons/trueforge/rules)
- [Official challenge, tracks, judging, and FAQ](https://www.wemakedevs.org/hackathons/trueforge)
- [Official schedule](https://www.wemakedevs.org/hackathons/trueforge/schedule)
- [Public SecureOps Guardian repository and README](https://github.com/jayesh9747/secureops-guardian)
- [Representative Qodo-reviewed PR #3](https://github.com/jayesh9747/secureops-guardian/pull/3)

## Executive finding

No rule-mandated README section is missing. The current README is unusually strong for judging: it explains the problem, TrueForge's central role, setup, architecture, safety boundaries, AI-assistant use, judging evidence, and includes the exact `## Qodo Code Review Evidence` heading.

The most important compliance risks cannot be repaired by rewriting the README:

1. The rules require Qodo review **before every substantive merge**. Public PR history shows Qodo was paused on PRs #4 through #20, including substantive implementation PRs. The README currently discloses only paused attempts on #18–#20.
2. The official build window began at 08:00 London time on August 24 (07:00 UTC). Git records show substantive code commit [`c862000`](https://github.com/jayesh9747/secureops-guardian/commit/c862000f228b689669a917f89ab849877101bac9) at `2026-08-24T11:07:35+05:30`, or 05:37:35 UTC, before the official start. This needs organizer clarification; a README change cannot alter it.

## Rule-to-repository matrix

| Official requirement | Current evidence | Result | Action |
| --- | --- | --- | --- |
| Agent runs on TrueForge and judges can see the harness doing real work | README's “Why TrueForge is essential” maps MCP, subagents, Daytona, approvals, sessions, skills, and Generative UI to visible demo evidence | Meets README/documentation need | Ensure the submitted video visibly shows tool use, sandbox execution, and the human pause; text alone is insufficient |
| Public source repository judges can read and run | Repository is public and MIT licensed | Meets | None |
| Clear README with setup steps | “Run it” includes prerequisites, clone/install/test commands, Fixture MCP startup, health response, and TrueForge configuration steps | Meets | Optional: add a direct link to a full demo video and state where credentials are supplied without exposing them |
| About three-minute working demo | README has a timed 168.3-second walkthrough and script, but no public video link is visible | Submission action pending | Upload and submit the video; add its link near the top of README for judges |
| Short write-up explaining the agent and TrueForge use | “The problem,” “The solution,” and “Why TrueForge is essential” provide this clearly | Meets | Reuse a shorter version in the submission form |
| Exact `## Qodo Code Review Evidence` heading | Present exactly | Meets | None |
| Representative merged public PR with meaningful hackathon code | README links merged [PR #3](https://github.com/jayesh9747/secureops-guardian/pull/3), which contains core investigation and validation code | Meets | Keep PR #3 as the representative PR |
| One or two sentences describing what Qodo found and the team's decision | Current section explains the three High and two Medium findings and fixes, but uses several sentences | Substantively meets; literal format could be tighter | Condense the required outcome summary to two sentences |
| Completed Qodo review, decisions, and follow-up review against final code in the linked PR | PR #3 records the findings, replies/resolutions, and its Qodo review comment was updated through final code commit [`9b95dfb`](https://github.com/jayesh9747/secureops-guardian/commit/9b95dfb024d4408c057c9afa1138e500f5d5f7fc) | Meets for the representative link | Preserve the direct PR link; screenshots cannot replace it |
| Every substantive change goes through a Qodo-reviewed PR before merge | Qodo comments report “reviews are paused” on PRs #4–#20; [PR #4](https://github.com/jayesh9747/secureops-guardian/pull/4) is a clear substantive example and shows no completed Qodo review | Does not meet the rule as written | Operator/organizer issue; see below |
| AI coding assistants disclosed | Team section says AI assistants supported planning, implementation, testing, documentation, and review, and states the creator's responsibilities | Meets | None |
| Project built during official window | Earliest substantive code commit is recorded before the official start | Needs organizer clarification | Operator/organizer issue; see below |
| Blog link if entering the blog prize | No blog link found in README | Optional unless entering that prize | Publish and submit a post; adding the link to README is helpful but not required |

## README changes

### Required

No new required section is needed. Do not remove or rename the existing setup instructions or `## Qodo Code Review Evidence` heading, and do not replace PR #3 with a paused-review PR.

If the README is changed, its paused-review disclosure should be corrected from “PR #18, #19, and #20” to “PRs #4–#20.” That is a truthfulness correction, not a cure for the underlying review-history problem.

### Recommended replacement for the Qodo summary

Keep the exact heading and use a compact two-sentence summary:

> Representative merged [PR #3](https://github.com/jayesh9747/secureops-guardian/pull/3) contains the core investigation and evidence-validation code, with Qodo's review, our responses, and its follow-up review visible in the public history. Qodo found three High provenance gaps and two Medium clean-checkout issues; commits [`2fa5749`](https://github.com/jayesh9747/secureops-guardian/commit/2fa5749e4b07f09f131dd2f9f7ce4f3d4470edd0) and [`9b95dfb`](https://github.com/jayesh9747/secureops-guardian/commit/9b95dfb024d4408c057c9afa1138e500f5d5f7fc) fixed all five with exact diff/blob binding, complete manifest and canonical fixture validation, and adversarial regression tests.

Add a separate, factual note after those two sentences:

> **Review availability note:** Qodo completed the representative review above, then reported that reviews were paused for this user on PRs #4–#20. Those public paused responses are not claimed as completed reviews.

### Optional judging improvements

1. Add a prominent `Demo video` link beside the existing Demo script, Architecture, Release evidence, and Fixture PR links.
2. Add a `Blog post` link only after a real post is published and only if entering the blog prize.
3. Add a short “Judge quick path” with three links: demo video, representative Qodo PR, and exact run/setup section.
4. Keep the current judging table. It accurately mirrors the six equally weighted criteria: impact, originality, technical excellence, sponsor-tool use, control/safety, and presentation.
5. Keep the honest synthetic/static limitations prominent. They support the rules requiring authorized data/accounts and help judges distinguish real GitHub work from owned fixture evidence.

## Operator-only and non-code actions

These cannot be solved by a README PR:

1. **Ask the organizers for a written decision on the Qodo outage.** Explain that PR #3 contains a completed Qodo review trail, while Qodo itself posted paused notices on PRs #4–#20. The rules provide no documented outage exception and say judges may inspect other substantive merges.
2. **Ask the organizers about the pre-start commit timestamp.** The commit contains 2,894 added lines of workspace and MCP code and predates 07:00 UTC. Do not rewrite public history or alter timestamps; request an explicit eligibility ruling and retain the response.
3. **Submit before August 30 at 20:00 London time.** The form must include the public repository, about-three-minute working demo, and short agent/TrueForge write-up.
4. **Publish the blog before submitting its link** if entering the blog prize. The official guidance asks for what was built, the agent's job, how TrueForge was wired in, and what broke or was learned; screenshots and a demo clip help.
5. **Keep secrets and protected data out of the repository and video.** Only owned or authorized tools, accounts, and data may be connected.
6. **Be ready to explain the code, architecture, and technical decisions.** The rules permit AI assistance but may reject entirely AI-generated work without meaningful participant contribution, verification, and understanding.

## Recommended PR scope

A README-only PR should remain narrow:

- condense the Qodo result to the two-sentence version above;
- correct the paused-review range to PRs #4–#20;
- add real demo/blog URLs only if they already exist; and
- avoid claiming that this documentation PR fixes historical Qodo or timing compliance.

Because Qodo is currently paused, this new README PR may itself receive only a paused notice. Do not merge it while representing it as Qodo-reviewed; get organizer guidance first.
