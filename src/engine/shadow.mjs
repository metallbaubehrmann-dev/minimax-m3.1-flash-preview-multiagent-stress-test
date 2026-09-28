/**
 * shadow.mjs — Ebenenschatten-Projektion fuer die Sonnenuhr (reine Funktion).
 *
 * MODULTYP: ES-Modul (ESM, Dateiendung .mjs).
 *
 * KOORDINATEN: x = Ost, y = Nord, z = oben.
 *
 * projectShadow({px,py,pz, sx,sy,sz}) -> {x,y} | undefined
 *   Der Aufrufpunkt P = (px,py,pz) ist die Objectspitze, der Fuss steht bei
 *   (px,py,0). s = (sx,sy,sz) ist ein beliebiger (nicht normalisierter)
 *   Richtungsvektor VON DER ERDE ZUR SONNE. Der Schattenstrahl laeuft mit -s:
 *       P + t*(-s)  mit  pz - t*sz = 0   ->   t = pz/sz
 *       x = px - t*sx,  y = py - t*sy
 *   t haengt nur von sz ab, deshalb muss s nicht normiert sein.
 *   sz <= 0 (Sonne unter dem Horizont oder exakt am Horizont) -> undefined,
 *   weil es dann keinen Ebenenschatten auf z=0 gibt.
 *
 * sunVectorFromState(altitudeDeg, azimuthDeg) -> {sx,sy,sz} (Einheitsvektor)
 *   sx = cos(h)*sin(A), sy = cos(h)*cos(A), sz = sin(h)   [A ab Nord im UZS]
 *   Bei |h| < 2 Grad ist A physikalisch instabil -> unstable: true.
 *
 * Deterministisch: keine Uhr, kein Zufall, keine NaN-Ausgaben.
 */

export const ZENITH_UNSTABLE_DEG = 2;

export function sunVectorFromState(altitudeDeg, azimuthDeg) {
  const h = (altitudeDeg * Math.PI) / 180;
  const a = (azimuthDeg * Math.PI) / 180;
  return {
    sx: Math.cos(h) * Math.sin(a),
    sy: Math.cos(h) * Math.cos(a),
    sz: Math.sin(h),
  };
}

export function projectShadow({ px = 0, py = 0, pz = 0, sx, sy, sz } = {}) {
  const vals = [px, py, pz, sx, sy, sz];
  for (let i = 0; i < vals.length; i += 1) {
    if (!Number.isFinite(vals[i])) return undefined; // kein NaN nach aussen
  }
  if (!(sz > 0)) return undefined; // Sonne am oder unter dem Horizont
  const t = pz / sz;
  return { x: px - t * sx, y: py - t * sy };
}

export function shadowLengthFromAltitude(objectHeight, altitudeDeg) {
  const a = (altitudeDeg * Math.PI) / 180;
  if (!(altitudeDeg > 0)) return undefined;
  return objectHeight / Math.tan(a);
}