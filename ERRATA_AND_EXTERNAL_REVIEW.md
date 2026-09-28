# Errata and External Review

This file preserves the important failures and corrections instead of hiding them behind the final green test output.

## External review finding: shadow rendering

### Original symptom

At a measured solar azimuth near 228.9 degrees (south-west), the numeric shadow endpoint was in the north-east quadrant, but the black SVG polygon visually extended south-east.

### Root cause

The UI converted the mathematical Y axis to SVG coordinates inconsistently. A Y component was inverted in the direction vector and then effectively inverted again while constructing polygon points.

### Repair

The polygon is now constructed directly from the base/end coordinates in the same SVG Y mapping used by the endpoint marker.

A publication regression assertion checks that the polygon and endpoint use consistent -Y mapping.

## Additional UI defect

The azimuth instability badge originally described "very flat sun / near horizon," while the engine relevant unstable-azimuth condition applies near zenith.

The wording was changed to derive from actual solar altitude.
## Bad test oracle: equator day length

Old expectation:

~~~text
equinox at equator ≈ 1440 min daylight
~~~

Correct physical expectation:

~~~text
approximately 720 min daylight
~~~

The engine values around 720 minutes were correct.

## Bad test oracle: cyclic solar time

A -60 min difference was wrapped to 1380 min and compared to -60.

The test was corrected to use the shortest cyclic representative in (-720, 720].

## Bad test oracle: longitude and solar elevation

A test claimed that at equal latitude and equal UTC time, solar altitude should be independent of longitude.

That is false: longitude changes true solar time and hour angle at a fixed UTC instant. Declination is location-independent; altitude is not.
## Bad test oracle: equation of time across New Year

A repaired test still expected about 2.4 minutes change from 2025-12-30 10:00 UTC to 2026-01-02 10:00 UTC.

An independent NOAA-style approximation produced about 1.35 minutes. The engine produced about 1.42 minutes.

The publication-staging test now accepts the independently checked range.

## Research erratum

Old claim:

~~~text
No public API endpoint for MiniMax-M3.1-Flash-Preview.
~~~

Corrected claim:

~~~text
Compatible API endpoints are documented.
Preview access is currently tied to Token Plan / MiniMax Code.
No separate PAYG per-token price had been established in this test.
~~~

The historical report is left intact below a prominent correction banner.

## Orchestration erratum

A4 and A5 were initially assigned read-only explorer profiles even though some requested work required worker capabilities.

The parent detected the role mismatch and relaunched the tasks using worker sessions.

This is counted as successful recovery, not as perfect initial orchestration.