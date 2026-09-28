/**
 * test_equator_equinox.mjs — Äquator/Äquinoktium und Zenitdurchgang.
 * Nicht ausgeführt (kein bash in dieser Sitzung) — lauffähig geschrieben.
 *
 * HERLEITUNG DER ERWARTUNGEN (Faustregel je Fall)
 *  E1) Am Äquator gilt um die Frühlings-Tagundnachtgleiche Zenitdurchgang und
 *      H=0. Der Meridian-Durchgang in Greenwich liegt bei mittlerer
 *      Sonnenoedzeit = 12:00 UTC, verschoben um die Zeitgleichung:
 *      UTC = 720 − EqT. Am 20.03. ist EqT ≈ −7.4 min, also ≈ 12:07 UTC.
 *      Fenster 11:50–12:25 UTC ist bewusst grosszügig (±15 min um die
 *      physikalisch begründete 12:00-UTC±EqT-Lage).
 *  E2) |H| < 0.05° an der Scan-Stelle: der 1-min-Scan allein begrenzt die
 *      Restunsicherheit auf 0.5 min = 0.125° (dH/dt ≈ 0.25 Grad/min, siehe
 *      Herleitung in meridianCrossing). 0.05° ist auf diesem Raster also
 *      NICHT systematisch erreichbar. Der Test verfeinert den Schnitt daher
 *      per Bisektion auf <1e-9 min; danach ist |H| < 1e-3 Grad (= 0.004 min
 *      = 0.24 s) eine echte, belastbare Forderung. Die Gittergrenze selbst
 *      wird als Konstante GRID_ABS_H_MAX dokumentiert.
 *  E3) Zenitdistanz < 0.5° am Äquator beim Äquinoktium (Vorgabe der Aufgabe:
 *      "Delta < 0,5 Grad"). Rechnerisch 90° − sqrt(δ²+H²) mit δ≈−0.043°, H≈0
 *      → ≈0.066°. Grenze 0.5 ist also 7x Reserve.
 *  E4) ORTSZEIT == WAHRE SONNENZEIT heisst hier H=0 (Sonne im lokalen
 *      Meridian), NICHT dass der Uhrziffer == Sonnenuhr steht: bei lon=0 und
 *      tz=UTC ist Zonenzeit = wahre Sonnenzeit nur bis auf die Zeitgleichung
 *      (die zur Frühlings-Tagundnachtgleiche rund −7.4 min beträgt). Geprüft
 *      wird deshalb die Identität (Identitätstest) und der Ort des H=0.
 *  E5) Vor dem Meridian-Durchgang ist H<0 (Morgen, Sonne im Osten), danach
 *      H>0 (Nachmittag, Westen). Das prüft die Vorzeichenkonvention ohne
 *      Uhrzeitwissen.
 *  E6) Höchststand 48.78 N am 21.06. = 90° − 48.78 + 23.436 = 64.66°
 *      (Sonne nie im Zenit) — Fenster 64.2..65.3.
 */

import { computeState } from '../../src/engine/solar.mjs';
import { ok, close, between, noNaNDeep } from './assert.mjs';
import { utcMs, utcMinuteOfDay, MIN } from './helpers.mjs';

/** Gittergrenze des groben 1-min-Scans: 0.5 min Restunsicherheit x 0.25 Grad/min. */
const GRID_ABS_H_MAX = 0.125;

function meridianCrossing(latDeg, lonDeg, isoFrom, isoTo) {
  const from = utcMs(isoFrom);
  const to = utcMs(isoTo);
  const stateAt = (t) => computeState({ utcMs: t, latDeg, lonDeg, tzId: 'UTC' });
  let best = null;
  for (let t = from; t <= to; t += MIN) {
    const s = stateAt(t);
    const a = Math.abs(s.hourAngleDeg);
    if (!best || a < best.absH) best = { absH: a, t, s };
  }
  if (!best) throw new Error('meridianCrossing: Scanfenster ist leer');
  // VERFEINERUNG (siehe E2 im Kopf): H = wahreSonnenzeit/4 - 180 waechst
  // nahe dem Meridianschnitt streng monoton mit dH/dt = (1 + dEqT/dt)/4
  // ~ +0.25 Grad/min. Die Nullstelle liegt deshalb sicher im Fenster
  // [t-1min, t+1min] um das grobste Minimum und wird per Bisektion auf
  // <1e-9 min bestimmt. Ohne diese Verfeinerung quantelt das 1-min-Raster
  // |H| auf bis zu 0.5 min = 0.125 Grad — 0.05 Grad waere auf diesem Raster
  // nicht systematisch erreichbar, sondern nur mit ~40 % Wahrscheinlichkeit.
  let lo = Math.max(from, best.t - MIN);
  let hi = Math.min(to, best.t + MIN);
  let hLo = stateAt(lo).hourAngleDeg;
  const hHi = stateAt(hi).hourAngleDeg;
  if (!(hLo * hHi <= 0)) return best; // keine Nullstelle im Fenster
  for (let i = 0; i < 60; i += 1) {
    const m = (lo + hi) / 2;
    const hm = stateAt(m).hourAngleDeg;
    if ((hLo <= 0) === (hm <= 0)) { lo = m; hLo = hm; } else { hi = m; }
  }
  const t = Math.round((lo + hi) / 2);
  const s = stateAt(t);
  return { absH: Math.abs(s.hourAngleDeg), t, s };
}

export const tests = [
  {
    name: 'Äquator/Äquinoktium: Meridianschnitt H=0 am 20.03.2026 zwischen 11:50 und 12:25 UTC',
    fn: () => {
      const b = meridianCrossing(0, 0, '2026-03-20T11:00:00Z', '2026-03-20T13:00:00Z');
      between(utcMinuteOfDay(b.t), 710, 745, 'Meridian-Durchgang liegt bei 720 − EqT (UTC-Minuten)');
      close(b.absH, 0, 1e-3, '|Stundenwinkel| am bisektiv verfeinerten Meridianschnitt');
      ok(Math.abs(b.absH) <= GRID_ABS_H_MAX,
        `Gittergrenze eingehalten (${GRID_ABS_H_MAX} Grad = halbe 1-min-Aufloesung)`);
      close(b.s.trueSolarTimeMin, 720, 0.3, 'wahre Sonnenzeit am Meridianschnitt = 720 min');
      ok(b.s.isDay === true, 'am Meridianschnitt ist Tag');
      noNaNDeep(b.s, 'State am Meridianschnitt');
    },
  },
  {
    name: 'Äquator/Äquinoktium: Zenitdistanz < 0.5 Grad und Deklination ~0',
    fn: () => {
      const b = meridianCrossing(0, 0, '2026-03-20T11:00:00Z', '2026-03-20T13:00:00Z');
      between(90 - b.s.altitudeDeg, 0, 0.5, 'Zenitdistanz am Äquator beim Äquinoktium < 0.5 Grad');
      between(b.s.declinationDeg, -0.1, 0.1, 'Deklination beim Meridianschnitt ~ 0');
      ok(b.s.azimuthUnstable === true, 'bei Zenitdurchgang muss azimuthUnstable=true gelten');
    },
  },
  {
    name: 'Zeitgleichung: Zonenzeit vs. wahre Sonnenzeit sind strikt getrennt (Identität)',
    fn: () => {
      // localCivil-Minuten (tz=UTC) − wahre Sonnenzeit = −4·lon − EqT
      const cases = [
        ['2026-03-20T12:00:00Z', 0],
        ['2026-06-21T10:00:00Z', 9.18],
        ['2026-12-21T08:00:00Z', -74.0],
        ['2026-09-23T18:30:00Z', 151.2],
      ];
      for (const [iso, lon] of cases) {
        const s = computeState({ utcMs: utcMs(iso), latDeg: 48.78, lonDeg: lon, tzId: 'UTC' });
        const civilMin = s.localCivilParts.hour * 60 + s.localCivilParts.minute;
        const solarMod = ((civilMin - s.trueSolarTimeMin) % 1440 + 1440) % 1440;
        const expected = (((-4 * lon - s.equationOfTimeMin) % 1440) + 1440) % 1440;
        close(solarMod, expected, 1e-9, `Identität Zonenzeit/wahre Sonnenzeit bei lon=${lon} (${iso})`);
        close(s.hourAngleDeg, s.trueSolarTimeMin / 4 - 180, 1e-9, 'H = wahreSonnenzeit/4 − 180');
      }
    },
  },
  {
    name: 'Zeitgleichung: Deklination wechselt am 20.03.2026 das Vorzeichen',
    fn: () => {
      const a = computeState({ utcMs: utcMs('2026-03-20T03:00:00Z'), latDeg: 0, lonDeg: 0 });
      const b = computeState({ utcMs: utcMs('2026-03-21T03:00:00Z'), latDeg: 0, lonDeg: 0 });
      ok(a.declinationDeg < 0, `Deklination am 20.03. 03:00 UTC < 0 (war ${a.declinationDeg})`);
      ok(b.declinationDeg > 0, `Deklination am 21.03. 03:00 UTC > 0 (war ${b.declinationDeg})`);
      between(b.declinationDeg - a.declinationDeg, 0.1, 1.0, 'Deklinationszuwachs über 24h an der Tagundnachtgleiche');
    },
  },
  {
    name: 'Zenitdurchgang: 48.78 N erreicht am 21.06. nur ~64.7 Grad, nie 90',
    fn: () => {
      let max = -Infinity;
      for (let t = utcMs('2026-06-21T08:00:00Z'); t <= utcMs('2026-06-21T15:00:00Z'); t += MIN) {
        max = Math.max(max, computeState({ utcMs: t, latDeg: 48.78, lonDeg: 9.18 }).altitudeDeg);
      }
      between(max, 64.2, 65.3, 'Höchststand 48.78 N am 21.06. = 90 − 48.78 + 23.44');
      ok(max < 89.9, 'in Mitteleuropa gibt es keinen Zenitdurchgang');
    },
  },
  {
    name: 'Zenitdurchgang: 45 N erreicht am 21.06. nur ~68.4 Grad',
    fn: () => {
      let max = -Infinity;
      for (let t = utcMs('2026-06-21T09:00:00Z'); t <= utcMs('2026-06-21T16:00:00Z'); t += MIN) {
        max = Math.max(max, computeState({ utcMs: t, latDeg: 45, lonDeg: 0 }).altitudeDeg);
      }
      between(max, 67.8, 69.0, 'Höchststand 45 N = 90 − 45 + 23.44');
    },
  },
  {
    name: 'Zenitdurchgang: am Äquator max. Höhe an der Tagundnachtgleiche ~90 Grad',
    fn: () => {
      const b = meridianCrossing(0, 0, '2026-03-20T11:00:00Z', '2026-03-20T13:00:00Z');
      ok(b.s.altitudeDeg > 89.8, `Höhe am Äquator > 89.8 (war ${b.s.altitudeDeg})`);
      ok(b.s.altitudeDeg <= 90 + 1e-9, 'Höhe kann 90 Grad nicht übersteigen');
    },
  },
  {
    name: 'Höchststand ist ein Maximum: Höhe vor/nach Meridian kleiner, H wechselt das Vorzeichen',
    fn: () => {
      const t0 = meridianCrossing(48.78, 9.18, '2026-06-21T08:00:00Z', '2026-06-21T14:00:00Z').t;
      const before = computeState({ utcMs: t0 - 60 * MIN, latDeg: 48.78, lonDeg: 9.18 });
      const at = computeState({ utcMs: t0, latDeg: 48.78, lonDeg: 9.18 });
      const after = computeState({ utcMs: t0 + 60 * MIN, latDeg: 48.78, lonDeg: 9.18 });
      ok(before.hourAngleDeg < 0, 'H < 0 eine Stunde vor dem Höchststand (Morgen/Osten)');
      ok(after.hourAngleDeg > 0, 'H > 0 eine Stunde nach dem Höchststand (Nachmittag/Westen)');
      ok(at.altitudeDeg > before.altitudeDeg && at.altitudeDeg > after.altitudeDeg, 'Höhe am Höchststand ist das Maximum');
    },
  },
];