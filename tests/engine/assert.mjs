/**
 * assert.mjs — minimaler Prüf-Helfer für die Engine-Tests.
 * KEIN Framework, KEINE Abhängigkeiten. Wird NICHT ausgeführt (kein bash in
 * dieser Sitzung) — die Testfaelle sind lauffähig geschrieben, siehe
 * tests/engine/test_runner.js.
 */

export function ok(cond, label) {
  if (!cond) throw new Error(`FEHLGESCHLAGEN: ${label}`);
}

export function close(actual, expected, tol, label) {
  if (!Number.isFinite(actual)) throw new Error(`FEHLGESCHLAGEN: ${label} — actual=${actual} ist nicht endlich`);
  if (!(Math.abs(actual - expected) <= tol)) {
    throw new Error(`FEHLGESCHLAGEN: ${label} — erwartet ${expected} ±${tol}, gemessen ${actual}`);
  }
}

export function between(v, lo, hi, label) {
  if (!Number.isFinite(v)) throw new Error(`FEHLGESCHLAGEN: ${label} — v=${v} ist nicht endlich`);
  if (!(v >= lo && v <= hi)) throw new Error(`FEHLGESCHLAGEN: ${label} — erwartet ${lo}..${hi}, gemessen ${v}`);
}

/** Für "HH:MM"-Strings (lexikografisch = chronologisch bei gleicher Länge). */
export function betweenStr(v, lo, hi, label) {
  if (typeof v !== 'string' || v.length !== 5) throw new Error(`FEHLGESCHLAGEN: ${label} — "${v}" ist kein HH:MM-String`);
  if (!(v >= lo && v <= hi)) throw new Error(`FEHLGESCHLAGEN: ${label} — erwartet ${lo}..${hi}, gemessen ${v}`);
}

export function finite(v, label) {
  if (!Number.isFinite(v)) throw new Error(`FEHLGESCHLAGEN: ${label} — Wert ${v} ist nicht endlich`);
}

/** Rekursiv prüfen, dass kein Feld NaN/Infinity enthält. */
export function noNaNDeep(value, label, path = '') {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new Error(`FEHLGESCHLAGEN: ${label} — ${path} ist nicht endlich (${value})`);
    return;
  }
  if (value && typeof value === 'object') {
    for (const k of Object.keys(value)) noNaNDeep(value[k], label, path ? `${path}.${k}` : k);
  }
}