# Test Methodology

## Purpose

This experiment tests agentic engineering behavior rather than a single-shot benchmark score.

The model was asked to operate on a real Windows workstation and to combine coding, file work, research, browser verification, local-system inspection and multi-agent delegation.

## Core truth rule

The test used the distinction:

~~~text
claimed success != action executed != result verified != work accepted
~~~

Important technical states were separated as:

~~~text
PRESENT -> CONFIGURED -> REGISTERED -> RUNNING -> INVOKED -> RESULT VERIFIED -> PERSISTENT
~~~

A worker report was not accepted as proof by itself.
## Original task groups

The original stress test required:

1. a standalone HTML "Schattenwerkstatt" sundial application;
2. a real file-read/write/edit/rename/delete exercise;
3. live inspection of Obsidian, Mnemosyne, MemFTS and related retrieval paths;
4. n8n inspection including real execution evidence where available;
5. research into MiniMax M3.1 Flash Preview itself;
6. six separate child agents;
7. browser verification;
8. independent review and repair loops;
9. mutation and reviewer-trap cases.

## Agent roles

- A1 — UI / rendering coder
- A2 — test-oracle auditor
- A3 — independent astronomy verifier
- A4 — Obsidian / memory auditor
- A5 — n8n / file-operations auditor
- A6 — research / source reviewer

The parent acted as orchestrator/integrator.
## Test-failure classification

A red test was not assumed to mean product code was wrong.

Every failure was classified into one of:

- PRODUCT_FAIL
- TEST_ORACLE_FAIL
- TEST_HARNESS_FAIL
- RESEARCH_FAIL
- INFRA_FAIL
- OPEN / NO_PROOF

This became important because several original test expectations were themselves incorrect.

## Independent review round

A separate reviewer read the live code and screenshots and found a rendering defect:

- calculated shadow endpoint: correct;
- displayed endpoint marker: correct;
- black SVG shadow polygon: mirrored in Y.

The repair round required M3.1 to reproduce the issue before changing code.
## Final rerun

Because the MiniMax parent session inherited a nonexistent D:/ working directory, Node/shell tests could not run there.

A later independent PC-side run executed:

~~~powershell
node tests\engine\test_runner.js
node tests\ui\ui-contract.test.js
~~~

Before publication, two remaining incorrect engine test oracles and one UI regex were corrected in a publication staging copy. A regression assertion for the shadow polygon Y mapping was added.

Final publication-staging results:

~~~text
Engine: 41 passed, 0 failed, 0 skipped
UI:     74 passed, 0 failed
~~~

Raw outputs are under evidence/.

## What is not claimed

- No academic benchmark score.
- No global model ranking.
- No proof that every n8n workflow is healthy.
- No proof that every memory/retrieval path reaches the final agent prompt.
- No executed 12-case reviewer challenge in this release.
- No executed mutation suite in this release.