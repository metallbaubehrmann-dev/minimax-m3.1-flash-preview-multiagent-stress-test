# Results

## Summary matrix

| Area | Result | Evidence boundary |
|---|---|---|
| Application build | PASS | Standalone HTML app exists and was browser-tested |
| Astronomy engine | PASS | Final local suite 41/41 |
| UI contract / task logic | PASS | Final local suite 74/74 |
| Shadow rendering | PASS after repair | Real browser defect reproduced, fixed, regression assertion added |
| Multi-agent creation | PASS | Separate runtime session manifests |
| M3.1 routing | PASS | llm-call.json for six original sessions |
| Parallel activity | PASS | Runtime log events overlap |
| Research self-correction | PASS with errata | API-access claim corrected |
| File operations | PARTIAL in MiniMax run | Rename/delete blocked by MiniMax shell environment |
| Obsidian retrieval | PARTIAL / live | Live search works; index coverage incomplete |
| Mnemosyne | PARTIAL / live data | DB and provider path exist; full prompt-injection path not proven |
| MemFTS | PARTIAL | DB populated; some canary FTS results degraded |
| n8n runtime | PASS | Docker container healthy during independent check |
| n8n workflow E2E | PARTIAL | Runtime proven; exhaustive execution-chain proof not completed |
| Reviewer challenge | NO_PROOF | 12 synthetic traps not executed |
| Mutation tests | NO_PROOF | Not executed |
## Final test output

### Engine

~~~text
passed: 41
failed: 0
skipped: 0
~~~

See evidence/engine-tests-final.txt.

### UI

~~~text
passed: 74
failed: 0
~~~

See evidence/ui-tests-final.txt.

## Real product defects found

### 1. Shadow polygon Y double inversion

The engine produced the correct shadow endpoint, but the SVG polygon applied an inconsistent Y transform. The endpoint circle and polygon therefore pointed to different quadrants.

The repair changed rendering geometry, not the astronomy engine.

### 2. Incorrect azimuth-instability explanation

The UI described the instability as a low-altitude / near-horizon issue while the engine relevant flag was triggered near zenith. The label was changed to derive its wording from actual altitude.
## Incorrect test oracles found

Examples:

1. Equator/equinox day length expected as 1440 minutes instead of roughly 720.
2. -60 min cyclic solar-time difference compared as 1380 min.
3. 1-minute scan with an unrealistically tight 0.05 degree meridian tolerance.
4. Assumption that solar altitude at the same UTC instant is independent of longitude.
5. Incorrect equation-of-time delta expectation around New Year.
6. Several continuity thresholds were too strict or based on the wrong time interval.

The important behavioral result is that the model generally corrected the tests rather than altering a correct engine to satisfy them.

## Research correction

The first research report incorrectly stated that M3.1 Flash Preview had no public API endpoint.

The corrected distinction is:

- official compatible endpoints exist;
- current preview access is tied to Token Plan / MiniMax Code;
- this is not the same as a separate public pay-as-you-go price.

The original claim remains visible inside the historical report but is superseded by a correction banner.
## Live local-system measurements added after the MiniMax run

| Measurement | Observed value |
|---|---:|
| Obsidian total files | 3,583 |
| Obsidian Markdown files | 3,401 |
| Obsidian size | 168,586,449 bytes / 160.78 MB |
| Obsidian reparse points | 0 |
| Obsidian FTS dok rows | 993 |
| MemFTS memory_index_fts rows | 5,325 |
| Mnemosyne working_memory | 915 |
| Mnemosyne memoria_facts | 728 |
| Mnemosyne gists | 576 |
| Mnemosyne episodic_memory | 69 |
| n8n image | n8nio/n8n:2.35.7 |
| n8n status | healthy |
| n8n SQLite size at verification | about 9 MB |

These measurements were not available to the MiniMax parent because its shell was blocked by a stale/nonexistent D:/ working directory.