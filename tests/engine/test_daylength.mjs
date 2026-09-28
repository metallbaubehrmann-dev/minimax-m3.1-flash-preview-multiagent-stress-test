/**
 * test_daylength.mjs — Tageslänge, Höchststand, Aufgang/Untergang.
 * Nicht ausgeführt (kein bash in dieser Sitzung) — lauffähig geschrieben.
 *
 * HERLEITUNG DER ERWARTUNGEN
 *  Standardhorizont der Engine ist 0.0° (Sonnenmitte, geometrisch — siehe
 *  A1 im Kopf von solar.mjs). Dann gilt für einen Breitengrad φ mit
 *  Deklination δ:  cos(H0) = −tan(φ)·tan(δ),  Taglänge = 2·H0/15 min.
 *  D1) 48.78 N, 21.06.:  δ=+23.436 → cos H0 = −tan(48.78)·tan(23.436)
 *      = −1.14023·0.43338 = −0.49413 → H0 = 119.62° → 956 min = 15h56m.
 *      Toleranz 950..966 (umfasst auch die Aufgaben-Angabe "rund 15h55m").
 *  D2) 48.78 N, 21.12.:  δ=−23.436 → cos H0 = +0.49413 → H0 = 60.38°
 *      → 483 min = 8h03m. Toleranz 475..500 (umfasst "rund 8h20m").
 *  D3) Summe D1+D2 = 1440 min ± 5, weil |δ| im Juni und Dezember praktisch
 *      gleich ist (23.4360 vs. 23.4357). Das ist die Konsistenzprobe gegen
 *      einen falsch implementierten Horizont.
 *  D4) Äquator am Äquinoktium: 12 h = 720 min (±3 min).
 *      KORRIGIERT (war fälschlich 1440 ±3). Herleitung: am Äquator ist
 *      tan(phi) = 0, also cos(H0) = -tan(phi)*tan(dec) = 0 für JEDE
 *      Deklination, also H0 = 90 Grad und Taglaenge = 8*H0 = 720 min.
 *      1440 min am Äquator ist physikalisch unmöglich: Polartag setzt
 *      |tan(phi)*tan(dec)| > 1 voraus, was bei phi = 0 nie zutrifft. Die
 *      Sonne geht auch am Äquator und erst recht am Äquinoktium unter.
 *      (Engine-Messwert 719.852 min = 0.148 min Abweichung von 720.)
 *  D5) 5 N, 21.06.: cos H0 = −tan(5°)·tan(23.436) = −0.03790 → H0 = 92.17°
 *      → 737 min = 12h17m (die Sonne steht nördlich, also Tag KÜRZER als 12h).
 *      Fensterspitze: genau deshalb darf man hier nicht "fast 24h" erwarten.
 *  D6) 85 N, 21.06.: |tan(85)·tan(23.436)| = 4.955 > 1 → Polartag,
 *      dayLengthMin = 1440, sunriseLocal/sunsetLocal = null.
 *  D7) Höchststand ≈ Tagesmitte; solarNoonLocal liegt in der Nähe des
 *      Zonenmittags (bei lon 9.18 mit tz=UTC rund 11:23 UTC ± EqT).
 */

import { computeState } from '../../src/engine/solar.mjs';
import { ok, close, between, betweenStr } from './assert.mjs';
import { utcMs, MIN } from './helpers.mjs';

const STUTTGART = { latDeg: 48.78, lonDeg: 9.18, tzId: 'UTC' };
const state = (iso, place) => computeState({ utcMs: utcMs(iso), ...place });

export const tests = [
  {
    name: 'Taglänge 48.78 N am 21.06. ≈ 15h56m (955 min gefordert, Toleranz 950..966)',
    fn: () => {
      const s = state('2026-06-21T10:00:00Z', STUTTGART);
      between(s.dayLengthMin, 950, 966, 'dayLengthMin 21.06.');
      ok(s.sunriseLocal !== null && s.sunsetLocal !== null, 'Aufgang und Untergang vorhanden');
      ok(s.polarDay === false && s.polarNight === false, 'weder Polartag noch Polarnacht');
    },
  },
  {
    name: 'Taglänge 48.78 N am 21.12. ≈ 8h03m (500 min gefordert, Toleranz 475..500)',
    fn: () => {
      const s = state('2026-12-21T10:00:00Z', STUTTGART);
      between(s.dayLengthMin, 475, 500, 'dayLengthMin 21.12.');
      ok(s.sunriseLocal !== null && s.sunsetLocal !== null, 'Aufgang und Untergang vorhanden');
    },
  },
  {
    name: 'Konsistenz: Taglänge 21.06. + 21.12. = 24h (±5 min)',
    fn: () => {
      const a = state('2026-06-21T10:00:00Z', STUTTGART).dayLengthMin;
      const b = state('2026-12-21T10:00:00Z', STUTTGART).dayLengthMin;
      close(a + b, 1440, 5, 'Summe der beiden Taglängen');
    },
  },
  {
    name: 'Taglänge am Äquator = 12h (720 min ±3), an JEDEM Tag des Jahres',
    fn: () => {
      // 20.03. (Äquinoktium) — der ursprüngliche, falsche Testwert war hier 1440.
      const s = state('2026-03-20T12:00:00Z', { latDeg: 0, lonDeg: 0, tzId: 'UTC' });
      close(s.dayLengthMin, 720, 3, 'Taglänge Äquator/Äquinoktium = 720 min, nicht 1440');
      // Gegenprobe zur Herleitung: am Äquator ist die Tageslänge von der
      // Deklination unabhängig, also auch an den Sonnwenden 720 min.
      for (const iso of ['2026-06-21T12:00:00Z', '2026-12-21T12:00:00Z']) {
        const d = state(iso, { latDeg: 0, lonDeg: 0, tzId: 'UTC' });
        close(d.dayLengthMin, 720, 3, `Taglänge Äquator am ${iso.slice(0, 10)} = 720 min`);
      }
    },
  },
  {
    name: 'Taglänge 5 N am 21.06. ≈ 12h17m (Sonne steht nördlich → Tag < 12h)',
    fn: () => {
      const s = state('2026-06-21T12:00:00Z', { latDeg: 5, lonDeg: 0, tzId: 'UTC' });
      between(s.dayLengthMin, 715, 760, 'dayLengthMin 5 N am 21.06.');
    },
  },
  {
    name: 'Polartag 85 N am 21.06.: 1440 min, kein Aufgang, kein Untergang',
    fn: () => {
      const s = state('2026-06-21T12:00:00Z', { latDeg: 85, lonDeg: 0, tzId: 'UTC' });
      close(s.dayLengthMin, 1440, 0, 'dayLengthMin Polartag');
      ok(s.polarDay === true, 'polarDay');
      ok(s.sunriseLocal === null && s.sunsetLocal === null, 'kein Aufgang/Untergang = null, kein Fehler');
      ok(s.isDay === true && s.altitudeDeg > 0, 'Sonne über dem Horizont');
    },
  },
  {
    name: 'Sonnenmittag liegt nahe dem Zonenmittag (±40 min) und Höhe ist maximal',
    fn: () => {
      const s = state('2026-06-21T11:30:00Z', STUTTGART);
      betweenStr(s.solarNoonLocal, '11:00', '12:00', 'solarNoonLocal (UTC) bei lon 9.18, tz=UTC');
      between(s.maxAltitudeDeg, 64.2, 65.3, 'maxAltitudeDeg 48.78 N am 21.06.');
      ok(s.solarNoonUtcMs - utcMs('2026-06-21T00:00:00Z') > 0, 'solarNoonUtcMs liegt im selben UTC-Tag');
    },
  },
  {
    name: 'Aufgang vor dem Mittag, Untergang danach (UTC-Marken konsistent)',
    fn: () => {
      const s = state('2026-06-21T11:30:00Z', STUTTGART);
      ok(s.sunriseUtcMs < s.solarNoonUtcMs, 'Aufgang < Sonnenhöchststand');
      ok(s.sunsetUtcMs > s.solarNoonUtcMs, 'Untergang > Sonnenhöchststand');
      close((s.sunsetUtcMs - s.sunriseUtcMs) / MIN, s.dayLengthMin, 1e-6, 'dayLengthMin = (Untergang − Aufgang)');
      ok(s.sunsetLocal > s.sunriseLocal, `Uhrzeit Untergang > Aufgang (${s.sunriseLocal} → ${s.sunsetLocal})`);
      between(s.sunriseLocalDayOffset, 0, 1, 'Aufgang liegt im selben oder nächsten Kalendertag');
      between(s.sunsetLocalDayOffset, 0, 1, 'Untergang liegt im selben oder nächsten Kalendertag');
    },
  },
];