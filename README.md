# MiniMax M3.1 Flash Preview — Real-World Multi-Agent Engineering & Truthfulness Stress Test

Independent hands-on evaluation by **metallbaubehrmann-dev**  
Test date: **2026-09-28**  
Model: **MiniMax-M3.1-Flash-Preview**  
Runtime: MiniMax Code on Windows 11

This repository documents an early real-world stress test of MiniMax M3.1 Flash Preview one day after its preview release. It is **not an official MiniMax benchmark** and not a controlled academic leaderboard. The goal was to test whether the model can coordinate agents, build and debug a non-trivial application, research its own model, inspect a real workstation, distinguish product bugs from bad tests, and report blocked work without inventing success.

## Quick decision support: should I buy the Token Plan or use API billing?

This repository is meant to help with exactly that decision, but it does **not** give a universal buy/no-buy recommendation.

**Observed in this run:** M3.1 Flash Preview was capable of a long, tool-heavy engineering task with real multi-agent delegation, browser work, code generation, debugging, research and recovery from blocked tooling. It also made non-trivial mistakes: a real rendering defect, several bad test oracles, an incorrect research claim, and an initial agent-role mismatch. The most positive behavior was that it usually distinguished broken tests from correct product code instead of blindly changing the code to make red tests green.

**Operator note:** after this test, the operator purchased the **$20/month MiniMax Plus Token Plan** for further use. That is a personal follow-up decision, not a benchmark verdict or recommendation.

### Token Plan vs. pay-as-you-go at publication time

Official MiniMax pricing checked on 2026-09-28:

| Route | Current published information | Practical implication |
|---|---|---|
| Token Plan Plus | **$20/month** | Lowest-cost official subscription tier; shared quota, MiniMax Code included |
| Token Plan Max | **$50/month** | Higher quota / more concurrency |
| Token Plan Ultra | **$120/month** | Highest individual quota / concurrency |
| Token Plan API access | Subscription key can be used with supported coding tools / OpenAI-compatible integrations | Useful if you want M3-class models inside your own tools without normal PAYG billing |
| PAYG MiniMax-M3 ≤512k input | **$0.30/M input, $1.20/M output, $0.06/M cache read** | Metered standard API route |
| PAYG MiniMax-M3 >512k input | **$0.60/M input, $2.40/M output, $0.12/M cache read** | Long-context M3 costs more |
| PAYG MiniMax-M3.1-Flash-Preview | **No separate row was published on the official PAYG table when this report was updated** | Do not assume M3 PAYG prices apply to M3.1 |

MiniMax also states that Token Plan quota is controlled by rolling **5-hour and weekly windows**, can be rate-limited during peak traffic, and is intended for individual interactive developer use; its own pricing page recommends PAYG for production workloads.

Official pricing references:
- https://platform.minimax.io/subscribe/token-plan
- https://platform.minimax.io/docs/guides/pricing-paygo

For a more detailed buyer-oriented breakdown, see **[Detailed Token Plan vs. PAYG decision guide](PLAN_VS_API.md)**.

For this benchmark, the useful question is not just price per token: it is **cost per correctly accepted task after retries, verifier work and repairs**. This run shows that M3.1 can do substantial work, but still benefits from an independent reviewer.


## Headline result

The model performed strongly on agentic engineering and truthfulness, but the run was not flawless.

- Six real M3.1 child sessions were created and overlapped in time.
- A functional HTML/JavaScript sundial game ("Schattenwerkstatt") was built.
- An external reviewer found a real SVG shadow-direction rendering bug that the first review had missed.
- M3.1 reproduced the bug, classified it as a rendering/product defect, fixed only the rendering layer, and kept the correct astronomy engine unchanged.
- Multiple test oracles written by M3.1 itself were wrong; the model generally corrected the tests instead of bending correct code to satisfy them.
- A research claim about API availability was later found to be false; M3.1 preserved the old claim for audit history and added a correction banner.
- The original MiniMax environment had a broken working directory (D:/), which blocked shell-based tests and audits. The model repeatedly reported those items as BLOCKED / NO_PROOF rather than fabricating results.
- A later independent PC-side rerun completed the missing tests.

## Final independently rerun test results

| Suite | Final result |
|---|---:|
| Astronomy / engine tests | **41 / 41 PASS** |
| UI contract / task logic tests | **74 / 74 PASS** |
| Real browser shadow-direction cases after fix | 4 directional cases + night, reported 0.000° direction mismatch |
| Six initial child sessions | Verified on disk |
| Model/provider for six sessions | MiniMax-M3.1-Flash-Preview / minimax |
| n8n runtime | Live and healthy during independent verification |
| Obsidian full-text retrieval | Live, but index coverage incomplete |
| Reviewer challenge (12 synthetic evidence traps) | **Not executed in this release** |
| Mutation suite | **Not executed in this release** |

The last two items are intentionally not counted as PASS.

## What was built

The demo is a local, network-independent HTML application that calculates solar altitude and azimuth, declination, equation of time, true solar time, sunrise/sunset, day length, polar day/night, and planar gnomon shadow projection. It includes three interactive tasks with explicit success criteria.
The app is in index.html. Modular source is under src/ and tests are under tests/.

## Why this test is interesting

The first implementation contained a real visual defect: the numeric shadow endpoint was correct, but the black SVG polygon was mirrored vertically. An external review identified the mismatch. In the repair round, M3.1:

1. reproduced the defect in the live browser;
2. compared the numeric endpoint to the rendered polygon;
3. classified the astronomy engine as correct and the rendering layer as wrong;
4. applied a minimal rendering fix;
5. reran directional cases;
6. found an additional incorrect "near horizon" label and fixed that too.

In parallel, several red tests were traced to bad test oracles rather than product defects. Examples include expecting 24 hours of daylight at the equator during an equinox, comparing a cyclic -60 min value as 1380 min, and assuming solar elevation at a fixed UTC instant is independent of longitude.

## Multi-agent evidence

The six original child sessions are recorded in local MiniMax runtime manifests and llm-call.json files. All six resolved to:

~~~text
model    = MiniMax-M3.1-Flash-Preview
provider = minimax
api      = anthropic-messages
~~~

The first A4/A5 role assignment used read-only explorer profiles where worker behavior was required. M3.1 detected the role mismatch and relaunched those tasks using worker sessions. This is documented as recovery, not hidden.
## Independent system-side verification

After the model run, a separate reviewer with direct PC access reran and measured parts that MiniMax could not execute because of its broken D:/ working directory.

Observed on the same workstation:

- Obsidian vault: 3,583 total files, 3,401 Markdown files, 168,586,449 bytes (160.78 MB), no reparse points.
- Obsidian FTS database: 993 rows in dok.
- MemFTS database: 5,325 rows in memory_index_fts.
- Mnemosyne pilot DB contained, among others: 915 working-memory rows, 728 memoria facts, 576 gists and 69 episodic-memory rows.
- wissen_suche.py returned live Obsidian search results for multiple queries.
- hermes-n8n-pilot was live on Docker image n8nio/n8n:2.35.7 and reported healthy.
- n8n live database.sqlite existed at about 9 MB during verification.

These checks do **not** prove that every retrieval path or n8n workflow is healthy end-to-end. See the reports for boundaries.



## Other early M3.1 / likely-M3.1 reports

This repository is not the only early test. The reports below measure different things and should not be treated as directly comparable scores.

| Report | Scope | What it measures well | Main limitation relative to this repo |
|---|---|---|---|
| [bborbe/coding — M3.1 PR-review run](https://github.com/bborbe/coding/blob/9e401e103e047fa5778b0aaf5143b99ee3dbaf0d/bench/reports/b39175fb4ef92c2acf9208e1def7f0786e05eb9fd3d4bbcbf369a374bbde157c.md) | 19/20 real PR-review fixtures, 142 golden findings in scope | Very detailed code-review benchmark with per-PR results, recall/precision, hashes and wall time | Narrower task type; does not test full workstation orchestration or six-agent repair loops |
| [eastspire/MiniMax-M3.1-Flash-Preview-mc](https://github.com/eastspire/MiniMax-M3.1-Flash-Preview-mc) | Large browser voxel/Minecraft-style build | Strong evidence that M3.1 can build a substantial interactive code artifact with browser test tooling | Primarily an artifact/build showcase, not a truthfulness/system-audit benchmark |
| [AICodeKing / KingBench 3 analysis](https://www.elma.sh/blog/minimax-m3-1-flash-review) | Eight interactive app-generation tasks | Useful hands-on interaction testing; reported 53/80 (66.25%) in that test format | Secondary write-up of one underlying benchmark run, not the same methodology as this repo |
| [MoEl80/space-bunny-alpha-eval](https://github.com/MoEl80/space-bunny-alpha-eval) | Seven scored single-shot tasks, two runs each, frozen prompts and raw outputs | Methodically clean small screening; also caught grader mistakes | Space Bunny Alpha's exact checkpoint/provider identity is not proven, so treat as a proxy rather than confirmed M3.1 |
| [TechGoGo M3.1 test](https://www.techgogogo.com/2026/09/28/minimax-m3-1-flash-benchmark-report/) | Direct MiniMax Code task testing | Early direct behavior observations on instruction following and generated artifacts | Smaller scope and less runtime/evidence instrumentation |
| [CLAW-00 / Da-Claw research note](https://da-claw-journal.sea-lion.ai/research/minimax-m3-1-flash-preview-quiet-launch-coding-agent-stealth-benchmark-2026-09-28) | Launch research, access, speed/community evidence, Space Bunny discussion | Broad early ecosystem synthesis | Research synthesis rather than a controlled full end-to-end workstation test |

### What is unusual about this repository

I have not found another public M3.1 report yet that combines all of the following in one run:

- six real child-agent sessions with runtime evidence;
- overlapping multi-agent work;
- a non-trivial application built from scratch;
- browser verification;
- an externally discovered product bug followed by a repair round;
- explicit separation of product failures, test-oracle failures and harness failures;
- correction of the model's own research claim;
- inspection of a live Obsidian / Mnemosyne / MemFTS / n8n environment;
- independent PC-side reruns after the model's own shell path was blocked.

That is a statement about the public reports found as of **2026-09-28**, not a claim of being the first benchmark of M3.1.


## Repository guide

- PLAN_VS_API.md — buyer-oriented Token Plan vs. PAYG decision guide
- TEST_METHODOLOGY.md — test design and evidence rules
- RESULTS.md — result matrix
- ERRATA_AND_EXTERNAL_REVIEW.md — bugs, bad oracles and corrections
- prompts/original_stress_test.md — original stress-test prompt
- evidence/ — raw final test output and agent/session evidence
- reports/ — model research and local-system audit reports
- Browser screenshots remain in the local evidence archive; the initial public release focuses on code, raw test outputs, session metadata, and reports.
## Reproduction

Requirements: Node.js capable of ESM modules and a modern browser.

Run engine tests:

~~~powershell
node tests\engine\test_runner.js
~~~

Run UI contract tests:

~~~powershell
node tests\ui\ui-contract.test.js
~~~

Open index.html directly in a browser. No CDN, API key or network connection is required for the application itself.

## Important limitations

This was a real workstation experiment, not a standardized benchmark farm. Tool access, installed software, the existing agent stack, local data and the broken MiniMax working directory all affected the run.

The repository intentionally preserves failures and corrections instead of presenting only the final green state.

No claim is made that M3.1 is universally better than another model. The result is evidence about this workload.

## Model information

Official MiniMax documentation used during the research round:

- https://platform.minimax.io/docs/guides/text-generation
- https://platform.minimax.io/docs/api-reference/text-openai-api
- https://platform.minimax.io/docs/api-reference/text-anthropic-api

## Repository status

**Published evidence release:** final local engine suite 41/41 PASS; final local UI suite 74/74 PASS; known unexecuted reviewer-challenge and mutation suites remain explicitly open.