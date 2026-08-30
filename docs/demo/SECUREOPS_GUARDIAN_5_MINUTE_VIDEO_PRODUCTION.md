# SecureOps Guardian five-minute video production record

## Deliverables

- Video: [`secureops-guardian-5min-submission-demo.mp4`](./secureops-guardian-5min-submission-demo.mp4)
- Captions: [`secureops-guardian-5min-submission-demo.srt`](./secureops-guardian-5min-submission-demo.srt)
- Timed narration: [`GUARDIAN_5_MINUTE_SUBMISSION_VIDEO_SCRIPT.md`](./GUARDIAN_5_MINUTE_SUBMISSION_VIDEO_SCRIPT.md)

## Source and editorial provenance

The only product visual source is the supplied real screen recording, `Screen Recording 2026-08-30 at 12.31.36 PM.mov`: 8 minutes 36.250 seconds, 3024×1814, H.264, 120 fps, and no source audio. The five-minute cut preserves the recorded order of prompts, clicks, agent and tool activity, approval, and GitHub outcome. Inactive model and tool waits are accelerated and identified by a `Fast-forwarding real execution` badge. No product screens or results were fabricated.

The final twelve seconds use the recording's real GitHub PR sequence from 8:24 through 8:31, slowed slightly so the video finishes on the open, ready-to-merge pull request instead of the screen-recording controls.

## Narration and music

- Narration model: Gemini `gemini-2.5-flash-preview-tts`
- Voice: `Kore`, English (`en-US`)
- Music model: Gemini Lyria `lyria-3-pro-preview`
- Music treatment: original instrumental bed at low level with two-second fade-in and four-second fade-out
- Captions: 53 burned-in English cues plus an SRT sidecar

Narration is scene-generated from the approved timed script and aligned to the real UI actions. The final mix measures -16.6 LUFS integrated, 4.8 LU loudness range, and -2.2 dBTP true peak.

## Recorded facts represented

| Surface | Verified recorded value |
| --- | --- |
| Read-only investigation | 0 agents, 6 tools, 5 MCP, 0 sandbox, 0 writes, 0 approvals |
| Finding | `SEC-NET-001`: unrestricted `0.0.0.0/0` egress |
| Specialists | 2: Change Security Investigator and Exposure Evidence Investigator |
| Fixture evidence | 4 source-labelled calls: alert, deployment, reachability, dependencies |
| Daytona validation | 6 sandbox steps and four-state deterministic proof |
| GitHub route | 8 GitHub MCP steps |
| Human control | 1 approval for 1 controlled write |
| Outcome | `PR_CREATED`, recorded duration 5m 27s, pull request #2 |

## Render verification

| Property | Final value |
| --- | --- |
| Duration | 300.000 seconds |
| Frame | 1920×1080 at 30 fps |
| Video | H.264, `yuv420p` |
| Audio | AAC, 48 kHz, stereo, 192 kbps target |
| File size | 23,996,546 bytes |
| SHA-256 | `31b70a0371cda69f854b431248aafad5ab779ad8d2b8102db96a3dea15a28358` |

The final frames were visually checked at each major scene, including read-only scope, finding, confirmation, both specialists, evidence join, Daytona validation, human approval, terminal counts, and the GitHub PR ending.

## Evidence boundary

GitHub repository evidence and the pull request are real. Guardian Fixture alert, deployment, reachability, and dependency observations are owned synthetic evidence. Daytona runs deterministic static NetworkPolicy validation; it does not claim live Kubernetes admission, CNI enforcement, packet observation, deployment, data access, or exfiltration proof. Guardian creates the reviewable PR only after human approval and does not merge it.
