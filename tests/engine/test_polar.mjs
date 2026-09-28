/**
 * test_polar.mjs — Polarnacht / Polarkreis / Breitenbereich 5..85 N.
 * Nicht ausgeführt (kein bash in dieser Sitzung) — lauffähig geschrieben.
 *
 * HERLEITUNG DER ERWARTUNGEN
 *  P1) Höchststand φ=78, δ=−23.436: 90 − 78 − 23.436 = −11.44°. Die Sonne
 *      erreicht den Horizont nie → isDay=false, dayLengthMin=0,
 *      sunriseLocal=sunsetLocal=null, altitudeDeg<0. Fenster −9..−14.
 *  P2) φ=68 (deutlich jenseits des Polarkreises 66.56°): Höchststand
 *      90 − 68 − 23.436 = −1.44° → Polarnacht.
 *  P3) Genau am Polarkreis φ=66.5 liegt der Höchststand bei
 *      90 − 66.5 − 23.436 = +0.064°: Sonne streift den Horizont, also
 *      0 < dayLengthMin < 120 min. Das ist der Stabilitätsnachweis "66.5 Grad
 *      läuft" (kein Fehler, kein NaN, keine Endlosschleife).
 *  P4) φ=70 am 21.06.: 90 − 70 + 23.436 = 43.44° Sonne, aber Polartag
 *      (cos H0 = −tan70·tan23.436 = −2.847 < −1) → dayLengthMin = 1440.
 *  P5) Der ganze Bereich 5..85 N muss bei vier Jahreszeiten endliche Werte
 *      liefern, altitudeDeg ∈ [−90,90], azimuthDeg ∈ [0,360], isDay boolean.
 */

import { computeState, projectAt } from '../../src/engine/solar.mjs';
import { ok, close, between, noNaNDeep } from './assert.mjs';
import { utcMs } from './helpers.mjs';

const noon = (latDeg, iso) => computeState({ utcMs: utcMs(iso), latDeg, lonDeg: 0, tzId: 'UTC' });

export const tests = [
  {
    name: 'Polarnacht 78 N am 21.12.: isDay=false, kein Aufgang, negativer Höchststand',
    fn: () => {
      const s = noon(78, '2026-12-21T12:00:00Z');
      ok(s.isDay === false, 'isDay=false');
      ok(s.polarNight === true, 'polarNight erkannt (kein Fehler)');
      close(s.dayLengthMin, 0, 0, 'dayLengthMin = 0');
      ok(s.sunriseLocal === null, 'sunriseLocal = null (kein Aufgang)');
      ok(s.sunsetLocal === null, 'sunsetLocal = null');
      ok(s.sunriseUtcMs === null && s.sunsetUtcMs === null, 'UTC-Zeitstempel null');
      between(s.altitudeDeg, -14, -9, 'Höhe um die Mittagszeit (Erwartung -11.44)');
      ok(s.altitudeDeg < 0, 'Höhe negativ in der Nacht');
      ok(projectAt(s, { x: 0, y: 0, z: 2 }) === undefined, 'kein Schatten in der Polarnacht');
      noNaNDeep(s, 'State Polarnacht');
    },
  },
  {
    name: 'Polarnacht 68 N am 21.12. (jenseits des Polarkreises)',
    fn: () => {
      const s = noon(68, '2026-12-21T12:00:00Z');
      ok(s.isDay === false && s.polarNight === true, 'Polarnacht bei 68 N');
      close(s.dayLengthMin, 0, 0, 'Taglänge 0');
      ok(s.altitudeDeg < 0, 'Höhe negativ');
    },
  },
  {
    name: 'Genau am Polarkreis 66.5 N am 21.12.: Sonne streift den Horizont, Tag > 0',
    fn: () => {
      const s = noon(66.5, '2026-12-21T12:00:00Z');
      ok(s.dayLengthMin > 0, `Taglänge > 0 (war ${s.dayLengthMin})`);
      between(s.dayLengthMin, 1, 120, 'Taglänge am Polarkreis (Erwartung ~31 min)');
      ok(s.polarNight === false, 'nicht als Polarnacht gewertet');
      ok(s.sunriseLocal !== null && s.sunsetLocal !== null, 'Aufgang/untergang gefunden statt Fehler');
      noNaNDeep(s, 'State Polarkreis');
    },
  },
  {
    name: 'Polartag 70 N am 21.06.: 1440 min, Höhe +43.4 Grad',
    fn: () => {
      const s = noon(70, '2026-06-21T12:00:00Z');
      close(s.dayLengthMin, 1440, 0, 'Taglänge Polartag');
      ok(s.polarDay === true, 'polarDay');
      ok(s.sunriseLocal === null && s.sunsetLocal === null, 'kein Aufgang/untergang');
      between(s.altitudeDeg, 42.5, 44.5, 'Höhe 70 N am 21.06. (Erwartung 43.44)');
    },
  },
  {
    name: 'Breitenbereich 5..85 N bleibt über das ganze Jahr stabil und endlich',
    fn: () => {
      const dates = ['2026-03-20T12:00:00Z', '2026-06-21T12:00:00Z', '2026-09-22T12:00:00Z', '2026-12-21T12:00:00Z'];
      for (const iso of dates) {
        for (let lat = 5; lat <= 85; lat += 5) {
          const s = computeState({ utcMs: utcMs(iso), latDeg: lat, lonDeg: 0, tzId: 'UTC' });
          noNaNDeep(s, `State lat=${lat} ${iso}`);
          between(s.altitudeDeg, -90, 90, `altitudeDeg lat=${lat} ${iso}`);
          between(s.azimuthDeg, 0, 360, `azimuthDeg lat=${lat} ${iso}`);
          ok(typeof s.isDay === 'boolean', 'isDay ist boolean');
          ok(s.isDay === (s.altitudeDeg >= 0), 'isDay entspricht Höhe >= Horizont (0 Grad)');
          ok(s.dayLengthMin >= 0 && s.dayLengthMin <= 1440, 'Taglänge in [0,1440]');
          if (s.altitudeDeg > 0) ok(projectAt(s, { x: 1, y: 1, z: 1.5 }) !== undefined, 'Schatten vorhanden');
          else ok(projectAt(s, { x: 1, y: 1, z: 1.5 }) === undefined, 'kein Schatten bei Höhe <= 0');
        }
      }
    },
  },
];