# MiniMax M3.1 Flash Preview — Token Plan vs. PAYG API

Updated: 2026-09-28.

This page is decision support for developers deciding whether to use a MiniMax Token Plan, MiniMax Code, or normal pay-as-you-go API billing. It is not financial advice and does not claim that one route is universally best.

## What this benchmark actually tells us

The stress test in this repository shows that MiniMax M3.1 Flash Preview can sustain a long, tool-heavy engineering workflow with real child agents, browser work, code generation, debugging, research, evidence review and recovery from blocked tooling.

It also made meaningful mistakes:

- one real rendering defect escaped the first review;
- several generated tests had incorrect oracles;
- one research claim about API availability was wrong and had to be corrected;
- two agents were initially launched with the wrong role profile;
- some planned reviewer-challenge and mutation tests were never executed.

The useful purchasing question is therefore not simply "how cheap are the tokens?" but:

> **What is the total cost per correctly accepted task after retries, verification and repair?**

This benchmark does not capture enough billing telemetry to calculate that number exactly.

## Official Token Plan pricing at publication time

MiniMax's official Token Plan page listed:

| Plan | Monthly price | Published monthly M3-equivalent estimate | Peak-time agent concurrency |
|---|---:|---:|---:|
| Plus | **$20/month** | ~1.7B M3 tokens/month | ~3–4 agents |
| Max | **$50/month** | ~5.1B M3 tokens/month | ~4–5 agents |
| Ultra | **$120/month** | ~12.5B M3 tokens/month | ~6–7 agents |

Important qualifiers from MiniMax:

- the included quota is governed by rolling **5-hour and weekly windows**;
- unused included quota does not carry over;
- rate limits can tighten during peak load;
- MiniMax positions the Token Plan for individual, interactive developer use;
- MiniMax recommends pay-as-you-go for production workloads;
- a Subscription Key can be used with supported external coding tools and OpenAI-compatible integrations, so the Token Plan is not limited to the MiniMax Code UI.

Official source:
https://platform.minimax.io/subscribe/token-plan

## Operator note

After completing the test documented in this repository, the operator purchased the **$20/month Plus plan** for further testing.

That is an anecdotal follow-up decision, not a recommendation and not evidence that Plus is the cheapest route for every workload.

The benchmark itself should be evaluated independently of that purchase.

## Published PAYG prices

The official PAYG table listed MiniMax-M3 at:

| Model / context | Input | Output | Cache read |
|---|---:|---:|---:|
| MiniMax-M3, ≤512k input | **$0.30/M** | **$1.20/M** | **$0.06/M** |
| MiniMax-M3, >512k input | **$0.60/M** | **$2.40/M** | **$0.12/M** |

MiniMax Priority service is listed at 1.5× the standard M3 price.

Official source:
https://platform.minimax.io/docs/guides/pricing-paygo

## The important M3.1 pricing uncertainty

At the time this document was updated, the official PAYG pricing table did **not** contain a separate row for `MiniMax-M3.1-Flash-Preview`.

Therefore:

- do not silently substitute M3 PAYG prices for M3.1;
- do not infer a M3.1 per-token price from the Token Plan;
- do not treat a working API-compatible endpoint as proof of a separately priced PAYG product.

The tested M3.1 route in this repository was MiniMax Code / MiniMax's subscription environment.

## When a Token Plan may be the more natural fit

A Token Plan is structurally attractive when the workload looks like:

- frequent interactive coding;
- multiple agent sessions;
- many retries and verifier passes;
- long context;
- sustained daily experimentation;
- use through MiniMax Code or supported external coding tools;
- predictable monthly spend is more important than per-request accounting.

This benchmark is an example of that workload shape.

## When PAYG may be the more natural fit

PAYG is structurally attractive when the workload looks like:

- production API traffic;
- low or intermittent usage;
- strict per-request cost accounting;
- workload isolation across applications/users;
- throughput requirements that do not fit subscription quota windows;
- a model with an explicitly published PAYG price.

MiniMax itself recommends PAYG for production use.

## Why this test cannot provide a clean break-even number

A responsible break-even calculation would need all of the following for the same workload:

1. input tokens;
2. cached input tokens;
3. output and reasoning tokens;
4. tool-call costs;
5. retries;
6. concurrency;
7. failed runs;
8. reviewer/repair runs;
9. quota-window throttling;
10. final acceptance rate.

The test collected strong engineering evidence, but not a complete billing ledger. A fake precision calculation would therefore be worse than leaving the break-even point open.

## Practical takeaway from this run

M3.1 Flash Preview looked capable enough in this workload to justify continued testing. The strongest behavior was not raw code generation; it was recovery and calibration:

- it did not consistently turn tool failures into fake PASS results;
- after external review it reproduced a real bug before patching;
- it often recognized incorrect test oracles instead of damaging correct product code;
- it preserved corrections rather than rewriting the historical record.

The remaining reason to keep independent review is equally clear: the model still generated bad tests, missed a visible bug on the first pass, and made a research error.

For a buyer, that means **model quality and verification cost should be considered together with token price**.
