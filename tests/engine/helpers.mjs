/**
 * helpers.mjs — gemeinsame, uhrenunabhaengige Hilfsfunktionen für die Tests.
 * Alle Zeitpunkte kommen als ISO-String mit Z (UTC) herein; Date.parse ist ein
 * reiner Parser und liest NICHT die PC-Uhr.
 */

import { computeState } from '../../src/engine/solar.mjs';

export const MIN = 60000;

/**
 * Analytische Tageslaenge — die geschlossene Form, gegen die die numerisch
 * gescannte Tageslaenge der Engine geprueft wird.
 *
 * HERLEITUNG
 *   Aufgang/Untergang bei Sonnenhoehe 0 gilt
 *       sin(alt) = sin(phi)*sin(dec) + cos(phi)*cos(dec)*cos(H) = 0
 *   =>  cos(H0) = -tan(phi)*tan(dec)          (H0 = halber Tagesbogen)
 *   Der Stundenwinkel laeuft mit 15 Grad pro Stunde, also
 *       Taglaenge = 2*H0/15 h = 2*H0*4 min = 8*H0[deg] min.
 *   Aequator (phi = 0):  cos(H0) = 0  ->  H0 = 90 Grad  ->  720 min, und zwar
 *   an JEDEM Tag des Jahres unabhaengig von der Deklination. 1440 min kann am
 *   Aequator physikalisch nicht auftreten (Polartag braucht |tan(phi)*tan(dec)|>1).
 *   Deklination +/-23.44:  |tan(phi)*tan(dec)| > 1  ->  Polartag (1440) bzw.
 *   Polarnacht (0).
 *
 * Genau dieselbe Definition (Standardhorizont 0 Grad, Sonnenmitte) wie
 * solar.mjs A1 — sonst waere der Vergleich nicht fair.
 */
export function analyticDayLengthMin(latDeg, declDeg) {
  const RAD = Math.PI / 180;
  const c = -Math.tan(latDeg * RAD) * Math.tan(declDeg * RAD);
  if (c <= -1) return 1440; // Polartag
  if (c >= 1) return 0;     // Polarnacht
  return 8 * Math.acos(c) / RAD;
}

export function utcMs(iso) {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) throw new Error(`Ungültiger ISO-Zeitpunkt: ${iso}`);
  return t;
}

/** Minuten seit UTC-Mitternacht für einen absoluten Zeitpunkt (UTC-Tag des Punkts). */
export function utcMinuteOfDay(ms) {
  return Math.floor(ms / MIN) % 1440;
}

export function maxAltitudeOver(latDeg, lonDeg, fromIso, toIso, tzId = 'UTC') {
  const from = utcMs(fromIso);
  const to = utcMs(toIso);
  let max = -Infinity;
  for (let t = from; t <= to; t += MIN) {
    const a = computeState({ utcMs: t, latDeg, lonDeg, tzId }).altitudeDeg;
    if (a > max) max = a;
  }
  return max;
}

/** true, wenn die tzdata der Laufzeit die Zone kennt (small-icu kann sie ablehnen). */
export function tzAvailable(tzId) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tzId });
    return true;
  } catch {
    return false;
  }
}