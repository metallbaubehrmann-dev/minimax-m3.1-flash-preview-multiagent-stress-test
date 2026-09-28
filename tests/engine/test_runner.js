/**
 * test_runner.js — führt alle Engine-Tests ohne Framework aus.
 * MODULTYP: CommonJS (Endung .js, kein package.json im Projekt ⇒ Node lädt .js
 * als CJS). Die Testmodule selbst sind ESM (.mjs) und werden dynamisch
 * importiert.
 *
 * AUFRUFEN:   node tests/engine/test_runner.js
 * EXIT-CODE:  0 = alles bestanden (Übersprungen zählen nicht als Fehler)
 *             1 = mindestens ein Testfall fehlgeschlagen
 *
 * WICHTIG: In der Bau-Sitzung war kein bash/Node verfügbar — dieser Runner
 * wurde ausgeführt GESCHRIEBEN, aber NICHT ausgeführt. Es gibt deshalb von
 * hier KEIN Testergebnis, nur den Code und die Ableitungen in den Kommentaren
 * der Testmodule.
 */

'use strict';

const path = require('path');
const { pathToFileURL } = require('url');

const MODULES = [
  './test_equator_equinox.mjs',
  './test_daylength.mjs',
  './test_polar.mjs',
  './test_shadow.mjs',
  './test_time_and_boundaries.mjs',
];

async function main() {
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const failures = [];

  for (const rel of MODULES) {
    const href = pathToFileURL(path.join(__dirname, rel)).href;
    process.stdout.write(`\n--- ${rel} ---\n`);
    let mod;
    try {
      mod = await import(href);
    } catch (err) {
      failed += 1;
      failures.push(`${rel} (Import): ${err && err.message}`);
      process.stdout.write(`  FEHLER beim Import: ${err && err.message}\n`);
      continue;
    }
    if (!mod || !Array.isArray(mod.tests)) {
      failed += 1;
      failures.push(`${rel}: export const tests fehlt`);
      process.stdout.write('  FEHLER: export const tests fehlt\n');
      continue;
    }
    for (const t of mod.tests) {
      const started = process.hrtime.bigint();
      try {
        const out = t.fn();
        if (out && typeof out.then === 'function') await out;
        passed += 1;
        process.stdout.write(`  OK    ${t.name}\n`);
      } catch (err) {
        const msg = String((err && err.message) || err);
        if (msg.startsWith('ÜBERSPRUNGEN:')) {
          skipped += 1;
          process.stdout.write(`  SKIP  ${t.name} — ${msg}\n`);
        } else {
          failed += 1;
          failures.push(`${rel} :: ${t.name} — ${msg}`);
          process.stdout.write(`  FAIL  ${t.name}\n        ${msg}\n`);
        }
      }
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      if (ms > 2000) process.stdout.write(`        (langsam: ${ms.toFixed(0)} ms)\n`);
    }
  }

  process.stdout.write(`\n=========================================\n`);
  process.stdout.write(`bestanden: ${passed}   fehlgeschlagen: ${failed}   übersprungen: ${skipped}\n`);
  if (failures.length) {
    process.stdout.write('\nFehlgeschlagene Fälle:\n');
    for (const f of failures) process.stdout.write(`  - ${f}\n`);
  }
  process.stdout.write(`=========================================\n`);
  process.exitCode = failed === 0 ? 0 : 1;
}

main().catch((err) => {
  process.stdout.write(`RUNNER-ABBRUCH: ${(err && err.stack) || err}\n`);
  process.exitCode = 1;
});