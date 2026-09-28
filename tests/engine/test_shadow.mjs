/**
 * test_shadow.mjs — Schattenprojektion (Ebene z=0).
 * Nicht ausgeführt (kein bash in dieser Sitzung) — lauffähig geschrieben.
 *
 * HERLEITUNG DER ERWARTUNGEN
 *  S1) synthetischer State: Höhe 45°, Azimut 90° (Osten) → Sonnenrichtung
 *      s = (cos45·sin90, cos45·cos90, sin45) = (0.7071, 6.1e-17, 0.7071).
 *      Objekt (0,0,2): t = pz/sz = 2/0.7071 = 2.8284,
 *      x = 0 − 2.8284·0.7071 = −2.000, y ≈ 0, Länge = 2/tan(45°) = 2.
 *      Also: Höhe 45° ⇒ Schattenlänge = Objekthöhe, horizontal nach Westen.
 *  S2) Vor dem Sonnenhöchststand (H<0) steht die Sonne im Osten ⇒ sx>0 ⇒
 *      Schatten zeigt nach Westen ⇒ x < 0. Geprüft wird zuerst die
 *      Azimutlage (0°..180°), damit die Erwartung nicht aus der Engine selbst
 *      stammt.
 *  S3) Nach dem Höchststand (H>0, Azimut 180°..360°) ⇒ Schatten zeigt nach
 *      Osten ⇒ x > 0.
 *  S4) sz<=0 (Sonne am oder unter dem Horizont) ⇒ undefined, kein NaN.
 *  S5) Nacht: isDay=false, altitudeDeg<0, projectAt ⇒ undefined.
 *  S6) Die Richtung des Schattenvektors ist exakt antiparallel zur
 *      horizontalen Sonnenrichtung (cos des Winkels ≈ −1).
 */

import { computeState, projectAt } from '../../src/engine/solar.mjs';
import { projectShadow, sunVectorFromState } from '../../src/engine/shadow.mjs';
import { ok, close, between } from './assert.mjs';
import { utcMs } from './helpers.mjs';

const STUTTGART = { latDeg: 48.78, lonDeg: 9.18, tzId: 'UTC' };
const st = (iso) => computeState({ utcMs: utcMs(iso), ...STUTTGART });

const H45 = { altitudeDeg: 45, azimuthDeg: 90, azimuthUnstable: false };

export const tests = [
  {
    name: 'Schatten: Höhe 45° ⇒ Länge = Objekthöhe, horizontal nach Westen',
    fn: () => {
      const p = projectShadow({ px: 0, py: 0, pz: 2, sx: sunVectorFromState(45, 90).sx, sy: sunVectorFromState(45, 90).sy, sz: sunVectorFromState(45, 90).sz });
      ok(p !== undefined, 'Schatten wird projiziert');
      close(p.x, -2, 1e-9, 'x = −2 (nach Westen)');
      close(p.y, 0, 1e-9, 'y = 0 (kein Nord-Süd-Anteil bei Azimut 90)');
      const a = projectAt(H45, { x: 0, y: 0, z: 2 });
      close(a.length, 2, 1e-9, 'Länge = Höhe/tan(45°) = Höhe');
      close(Math.hypot(a.x - 0, a.y - 0), 2, 1e-9, 'Betrag des Schattenvektors = Länge');
    },
  },
  {
    name: 'Schatten: Objektposition verschiebt den Schatten 1:1 (px, py)',
    fn: () => {
      const a = projectAt(H45, { x: 5, y: -3, z: 2 });
      close(a.x, 3, 1e-9, 'x = px − Höhe/tan(h)·cos(h)·sin(A)');
      close(a.y, -3, 1e-9, 'y = py bei Azimut 90 (rein westlich)');
    },
  },
  {
    name: 'Schatten: Sonne im Osten (21.06., 08:00 UTC Stuttgart) ⇒ x negativ',
    fn: () => {
      const s = st('2026-06-21T08:00:00Z');
      ok(s.isDay === true, 'Tag');
      between(s.altitudeDeg, 30, 60, 'Höhe 42.7° (Erwartung)');
      between(s.azimuthDeg, 0, 180, 'Azimut in der Ost-Hälfte (H<0)');
      ok(s.hourAngleDeg < 0, 'H < 0 (vor dem Höchststand)');
      const p = projectAt(s, { x: 0, y: 0, z: 2 });
      ok(p !== undefined, 'Schatten vorhanden');
      ok(p.x < 0, `Schatten zeigt nach Westen (x=${p.x})`);
      close(p.length, 2 / Math.tan((s.altitudeDeg * Math.PI) / 180), 1e-9, 'Länge = Höhe/tan(Höhe)');
    },
  },
  {
    name: 'Schatten: Sonne im Westen (21.06., 15:00 UTC Stuttgart) ⇒ x positiv',
    fn: () => {
      const s = st('2026-06-21T15:00:00Z');
      between(s.azimuthDeg, 180, 360, 'Azimut in der West-Hälfte (H>0)');
      ok(s.hourAngleDeg > 0, 'H > 0 (nach dem Höchststand)');
      const p = projectAt(s, { x: 0, y: 0, z: 2 });
      ok(p.x > 0, `Schatten zeigt nach Osten (x=${p.x})`);
    },
  },
  {
    name: 'Schatten: Richtung exakt antiparallel zur horizontalen Sonnenrichtung',
    fn: () => {
      for (const iso of ['2026-06-21T08:00:00Z', '2026-06-21T15:00:00Z', '2026-12-21T09:00:00Z']) {
        const s = st(iso);
        const v = sunVectorFromState(s.altitudeDeg, s.azimuthDeg);
        const p = projectAt(s, { x: 2, y: 4, z: 3 });
        const dx = p.x - 2;
        const dy = p.y - 4;
        const lenA = Math.hypot(dx, dy);
        const lenB = Math.hypot(v.sx, v.sy);
        close((dx * v.sx + dy * v.sy) / (lenA * lenB), -1, 1e-9, `Schattenrichtung antiparallel (${iso})`);
        close(lenA / 3, 1 / Math.tan((s.altitudeDeg * Math.PI) / 180), 1e-9, `Länge/Objekthöhe = 1/tan(h) (${iso})`);
      }
    },
  },
  {
    name: 'Schatten: undefined bei sz <= 0 (Sonne am oder unter dem Horizont)',
    fn: () => {
      ok(projectShadow({ px: 0, py: 0, pz: 2, sx: 0, sy: 0, sz: 0 }) === undefined, 'sz=0 ⇒ undefined');
      ok(projectShadow({ px: 0, py: 0, pz: 2, sx: 0.5, sy: 0.5, sz: -0.5 }) === undefined, 'sz<0 ⇒ undefined');
      ok(projectShadow({ px: 0, py: 0, pz: 2, sx: 0, sy: 0, sz: -1 }) === undefined, 'sz=−1 ⇒ undefined');
      ok(projectShadow({ px: 0, py: 0, pz: 2, sx: NaN, sy: 0, sz: 1 }) === undefined, 'NaN ⇒ undefined statt NaN-Ausgabe');
      ok(projectAt({ altitudeDeg: 0, azimuthDeg: 180 }, { x: 0, y: 0, z: 2 }) === undefined, 'Höhe 0 ⇒ undefined');
    },
  },
  {
    name: 'Nacht: isDay=false, Höhe negativ, kein Schatten, keine NaN',
    fn: () => {
      const s = st('2026-06-21T23:30:00Z');
      ok(s.isDay === false, 'isDay=false');
      ok(s.altitudeDeg < -10, `Höhe deutlich negativ (war ${s.altitudeDeg})`);
      ok(Number.isFinite(s.altitudeDeg) && Number.isFinite(s.azimuthDeg), 'Höhe/Azimut endlich');
      ok(projectAt(s, { x: 0, y: 0, z: 2 }) === undefined, 'kein erfundener Schatten');
      ok(s.shadowAvailable === false, 'shadowAvailable=false');
    },
  },
  {
    name: 'Zenitdurchgang: azimuthUnstable=true, aber Azimut bleibt endlich (0..360)',
    fn: () => {
      const s = computeState({ utcMs: utcMs('2026-03-20T12:07:30Z'), latDeg: 0, lonDeg: 0, tzId: 'UTC' });
      ok(s.altitudeDeg > 88, `Zenitdistanz < 2 Grad (Höhe ${s.altitudeDeg})`);
      ok(s.azimuthUnstable === true, 'azimuthUnstable=true');
      between(s.azimuthDeg, 0, 360, 'Azimut trotzdem endlich');
      const p = projectAt(s, { x: 0, y: 0, z: 2 });
      ok(p !== undefined && p.azimuthUnstable === true, 'Schatten vorhanden, aber als instanz markiert');
    },
  },
];