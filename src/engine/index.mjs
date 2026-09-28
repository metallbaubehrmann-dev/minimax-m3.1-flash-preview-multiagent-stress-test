/**
 * index.mjs — Einziger Einstiegspunkt fuer die UI.
 * MODULTYP: ES-Modul (ESM, Dateiendung .mjs).
 *
 *   import { solar, shadow } from './src/engine/index.mjs'
 *   const s = solar.computeState({ utcMs: Date.now(), latDeg: 48.78, lonDeg: 9.18, tzId: 'Europe/Berlin' });
 *   const schatten = solar.projectAt(s, { x: 0, y: 0, z: 2 });
 *
 * Ausfuehrliche Konventionen (Koordinaten, NOAA-Umrechnung, Horizont-Wahl,
 * Determinismus) stehen im Kopfkommentar von solar.mjs.
 */

import * as solarCore from './solar.mjs';
import * as shadowCore from './shadow.mjs';

export const solar = { ...solarCore };
export const shadow = { ...shadowCore };

export const {
  computeState, projectAt, solarGeometry, hourAngleDeg, altitudeDegAt,
  horizontalFrom, solarDayEvents, julianDay,
  SUNRISE_HORIZON_GEOMETRIC, SUNRISE_HORIZON_REFRACTED, ZENITH_UNSTABLE_DEG,
} = solarCore;

export const { projectShadow, sunVectorFromState, shadowLengthFromAltitude } = shadowCore;

export default { solar, shadow };

/**
 * Optionale Global-Bridge fuer die UI (src/ui/engine-adapter.js sucht
 * `SW_ENGINE`, `SW.engine` oder `solar`+`shadow` im globalen Scope).
 * Wird nur im Browser gesetzt; in Node ist es ein No-Op. Wer die Engine als
 * ESM importiert, braucht diese Bruecke nicht.
 */
if (typeof window !== 'undefined') {
  window.SW_ENGINE = { solar, shadow };
}