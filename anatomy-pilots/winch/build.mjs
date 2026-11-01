// Fig 1: a manual trailer winch. Run: node build.mjs [--light]
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./kit/iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--light") ? "light" : "dark";
const kitSource = readFileSync(join(HERE, "kit/iso-kit.mjs"), "utf8").replace(/^export /gm, "");

// ---- the model + the moving parts. One source, run here and in the page. ----
const DYN = String.raw`
const WN = { C: [-34, 0], PN: [6, 0], NG: 36, NP: 9, RPG: 32, RPP: 8, ADD: 1.6, MAXT: 12, U: 2, CRANK: 9, HUB: 5.8, TH: 0.3,
  Q: [-50, 36], FX: -76, HOOK0: -118, HOOKK: 0.14, NR: 12, RT: 13, RR: 10.5, PHI: (100 * Math.PI) / 180, ARM: 18 };
function wModel(turns) {
  const dr = turns / (WN.NG / WN.NP), th = dr * 2 * Math.PI;
  const rcm = WN.HUB + WN.TH * dr;
  const len = WN.HUB * th + (WN.TH * th * th) / (4 * Math.PI);
  return { turns, dr, th, rcm, len, ma: ((WN.NG / WN.NP) * WN.CRANK) / rcm };
}
function wTeeth(cx, cy, n, rp, phase, add) {
  const p = (2 * Math.PI) / n, out = [];
  for (let j = 0; j < n; j++) {
    const c = phase + j * p;
    for (const [da, r] of [[-0.3, rp - add], [-0.14, rp + add], [0.14, rp + add], [0.3, rp - add], [0.5, rp - add]]) out.push([cx + r * Math.cos(c + da * p), cy + r * Math.sin(c + da * p)]);
  }
  return out;
}
function wPolar(cx, cy, r, a) { return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }
function wBar(a, b, half) {
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = (-dy / l) * half, ny = (dx / l) * half;
  return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]];
}
function wCapsule(a, b, half) {
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), out = [];
  for (let i = 0; i <= 8; i++) out.push(wPolar(b[0], b[1], half, ang - Math.PI / 2 + (i / 8) * Math.PI));
  for (let i = 0; i <= 8; i++) out.push(wPolar(a[0], a[1], half, ang + Math.PI / 2 + (i / 8) * Math.PI));
  return out;
}
function wFrame(turns) {
  const m = wModel(turns), U = WN.U, [cx, cy] = WN.C, [px, py] = WN.PN;
  const aH = -turns * 2 * Math.PI, aG = -aH / (WN.NG / WN.NP);
  const S = (ring, z, h, style) => solidSvg(extrude(ring, z, h, P, { convex: false }), style);
  const Cy = (x, y, r, z, h, style, n = 40) => solidSvg(cylinder(x, y, r, z, h, P, n), style);
  const L = (d, style) => lineSvg(d, style);
  const spokes = (x, y, a, r0, r1, z, n) => Array.from({ length: n }, (_, i) => lineOnTop(wPolar(x, y, r0, a + (i * 2 * Math.PI) / n), wPolar(x, y, r1, a + (i * 2 * Math.PI) / n), z, P)).join("");
  // gear on the drum shaft
  let gear = Cy(cx, cy, 6, 4, 2, { tone: "lo" }, 24);
  gear += S(wTeeth(cx, cy, WN.NG, WN.RPG, aG, WN.ADD), 6, 4, { tone: "mid", crease: "lo" });
  gear += L(ring(cx, cy, WN.RPG - 5, 10, P, 56) + ring(cx, cy, 6, 10, P, 24), { tone: "lo" });
  gear += L(spokes(cx, cy, aG, 6, WN.RPG - 5, 10, 5), { tone: "faint" });
  // drum stack: flanges, wound strap, ratchet wheel
  const r = m.rcm * U;
  let drum = Cy(cx, cy, 16, 10, 3, { tone: "mid" }, 56);
  drum += Cy(cx, cy, r, 13, 18, { tone: "hi", lit: true, crease: "none" }, 56);
  drum += Cy(cx, cy, 16, 31, 3, { tone: "mid" }, 56);
  drum += L(ring(cx, cy, 14.6, 34, P, 56), { tone: "faint" });
  const bolts = [0, 1, 2, 3].map((i) => iso([...wPolar(cx, cy, 14.6, aG + (i * Math.PI) / 2), 34], P));
  drum += dotsSvg(bolts, { size: 0.5 });
  const pitch = (2 * Math.PI) / WN.NR, rat = [];
  for (let j = 0; j < WN.NR; j++) { rat.push(wPolar(cx, cy, WN.RT, aG + j * pitch)); rat.push(wPolar(cx, cy, WN.RR, aG + (j + 0.8) * pitch)); }
  drum += S(rat, 34, 3, { tone: "mid", crease: "lo" });
  drum += L(ring(cx, cy, 5.5, 37, P, 24), { tone: "lo" });
  drum += dotsSvg([0, 1, 2].map((i) => iso([...wPolar(cx, cy, 8, aG + (i * 2 * Math.PI) / 3), 37], P)), { size: 0.45 });
  drum += Cy(cx, cy, 3.4, 37, 2, { tone: "hi" }, 6);
  // strap tail + hook (hook travel drawn at HOOKK of true strap length)
  const hx = WN.HOOK0 + m.len * U * WN.HOOKK, ty = -r;
  let tail = solidSvg(slabOf({ x: hx + 6, y: ty - 0.3, w: cx - hx - 6, d: 0.6, r: 0.2 }, 14, 16, P, 2), { tone: "hi", lit: true, crease: "none" });
  tail += solidSvg(slabOf({ x: hx, y: ty - 3, w: 6, d: 6, r: 1 }, 14, 16, P, 3, 0.4), { tone: "hi", lit: true });
  tail += solidSvg(slabOf({ x: hx - 14, y: ty - 1.4, w: 14, d: 2.8, r: 1 }, 20, 4, P, 3, 0.3), { tone: "mid" });
  tail += Cy(hx - 19, ty, 5, 20, 4, { tone: "mid" }, 28);
  tail += L(ring(hx - 19, ty, 2.8, 24, P, 20), { tone: "lo" });
  // pawl on its pivot post, spring seat above
  const [qx, qy] = WN.Q, ph = WN.PHI;
  const psi = (((ph - aG) % pitch) + pitch) % pitch / pitch;
  const rc = psi < 0.8 ? WN.RT - ((WN.RT - WN.RR) * psi) / 0.8 : WN.RR + ((WN.RT - WN.RR) * (psi - 0.8)) / 0.2;
  const tip = wPolar(cx, cy, rc, ph);
  let pawl = Cy(qx, qy, 2.6, 4, 30, { tone: "mid", crease: "none" }, 20);
  pawl += S(wBar([qx, qy], tip, 1.6), 34, 3, { tone: "hi", crease: "lo" });
  pawl += solidSvg(slabOf({ x: qx - 2.6, y: qy - 2.6, w: 14, d: 5.2, r: 1.8 }, 37, 3, P, 3, 0.4), { tone: "mid" });
  const seat = [qx + 10, qy, 40], mid = [qx + (tip[0] - qx) * 0.55, qy + (tip[1] - qy) * 0.55, 37];
  const sd = Math.hypot(mid[0] - seat[0], mid[1] - seat[1]), ux = (mid[0] - seat[0]) / sd, uy = (mid[1] - seat[1]) / sd, zig = [iso(seat, P)];
  for (let i = 1; i < 6; i++) { const q = i / 6, s = i % 2 ? 1.1 : -1.1; zig.push(iso([seat[0] + (mid[0] - seat[0]) * q - uy * s, seat[1] + (mid[1] - seat[1]) * q + ux * s, seat[2] + (mid[2] - seat[2]) * q], P)); }
  zig.push(iso(mid, P));
  pawl += L("M" + zig.map(([x, y]) => x.toFixed(1) + " " + y.toFixed(1)).join("L"), { tone: "lo" });
  pawl += dotsSvg([iso(seat, P), iso(mid, P), iso([qx, qy, 40], P)], { size: 0.5 });
  // crank: pinion, arm, grip
  const H = wPolar(px, py, WN.ARM, aH);
  let crank = Cy(px, py, 5, 4, 2, { tone: "lo" }, 24);
  crank += S(wTeeth(px, py, WN.NP, WN.RPP, aH, WN.ADD), 6, 4, { tone: "mid", crease: "lo" });
  crank += L(ring(px, py, 4.2, 10, P, 24), { tone: "lo" });
  crank += Cy(px, py, 3.8, 10, 3, { tone: "mid" }, 24);
  crank += Cy(px, py, 2.2, 13, 9, { tone: "mid", crease: "none" }, 20);
  crank += S(wCapsule([px, py], H, 3), 22, 3, { tone: "mid" });
  crank += L(ring(px, py, 1.6, 25, P, 16) + ring(H[0], H[1], 1.4, 25, P, 16) + lineOnTop(wPolar(px, py, 1.6, aH), wPolar(px, py, WN.ARM - 1.4, aH), 25, P), { tone: "faint" });
  crank += Cy(px, py, 3.4, 25, 2, { tone: "mid" }, 6);
  crank += Cy(H[0], H[1], 2.5, 25, 11, { tone: "hi" }, 24);
  crank += L(knurl(H[0], H[1], 2.5, 25, 36, 12, P), { tone: "lo" });
  crank += Cy(H[0], H[1], 1.8, 36, 2, { tone: "mid" }, 16);
  return { gear, drum, tail, pawl, crank, m };
}
`;

const mk = new Function(...Object.keys(k), "P", DYN + "; return { WN, wModel, wFrame };");
const WIDTH = 720, HEIGHT = 400;
const PLATE = { x: -92, y: -42, w: 152, d: 84, r: 6 };
const BEAM = { x: -98, y: -38, w: 164, d: 76, r: 2 };
const P = k.fitProjection(
  [...k.boxCorners(BEAM, -16, 0), ...k.boxCorners({ x: -146, y: -20, w: 12, d: 40 }, 14, 30), [6, 0, 42], [-34, 36, 42]],
  WIDTH, HEIGHT, { pad: 26, azimuth: 42 },
);
const { WN, wFrame } = mk(...Object.values(k), P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const at = (p) => k.iso(p, P);

function base() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BEAM, -16, 16, P)}"/>`];
  out.push(S(k.slabOf(BEAM, -16, 16, P, 3, 1), { tone: "lo" }));
  for (const x of [BEAM.x, BEAM.x + BEAM.w - 6]) out.push(S(k.slabOf({ x, y: BEAM.y - 1, w: 6, d: BEAM.d + 2, r: 1 }, -17, 18, P, 3, 0.5), { tone: "lo" }));
  out.push(S(k.slabOf(PLATE, 0, 4, P, 8, 0.8), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(PLATE, 4), 4, P), { tone: "faint" }));
  const strip = { x: 6, y: 29, w: 48, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 4, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const t = k.topTicks(strip.x + 3, strip.x + strip.w - 3, 4, 5, strip.y, 4.6, [2, 7.5], P);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  const bolts = [[-82, -32], [50, -32], [-82, 32], [50, 32]].sort((a, b) => k.depthOf([a[0], a[1], 0], P) - k.depthOf([b[0], b[1], 0], P));
  for (const [x, y] of bolts) {
    out.push(S(k.cylinder(x, y, 4.4, 4, 0.8, P, 24), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 3, 4.8, 3, P, 6), { tone: "mid" }));
  }
  return out.join("");
}
const roller = (y) => S(k.cylinder(WN.FX, y, 3.4, 4, 2, P, 20), { tone: "lo" }) + S(k.cylinder(WN.FX, y, 2.4, 6, 26, P, 20), { tone: "mid", crease: "none" });
const fairA = roller(-22);
const fairB = roller(-2) + S(k.slabOf({ x: WN.FX - 3.5, y: -25.5, w: 7, d: 28, r: 1.5 }, 32, 3, P, 3, 0.4), { tone: "mid" }) + D([at([WN.FX, -22, 35]), at([WN.FX, -2, 35])], { size: 0.5 });

const f0 = wFrame(0);
const mkg = (name, html) => `<g data-part="${name}">${html}</g>`;
const svg = k.figureSvg({
  width: WIDTH, height: HEIGHT,
  label: "A manual boat-trailer winch on a trailer beam. A hand crank turns a small pinion gear that drives a drum gear four times its size on the strap drum, so four turns of the handle wind one turn of webbing onto the drum. A spring pawl clicks over a ratchet wheel and stops the drum unwinding.",
  body: [base(), fairA, mkg("gear", f0.gear), mkg("tail", f0.tail), fairB, mkg("drum", f0.drum), mkg("pawl", f0.pawl), mkg("crank", f0.crank)],
});

const fmt = (m) => `turns ${m.turns.toFixed(2)} · strap ${m.len.toFixed(1)} cm · MA ×${m.ma.toFixed(1)}`;
const live = `
const P = ${JSON.stringify(P)};
${DYN}
const MAXT = WN.MAXT;
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const groups = Object.fromEntries(["gear", "tail", "drum", "pawl", "crank"].map((n) => [n, svg.querySelector('[data-part="' + n + '"]')]));
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
let t = 0, target = 0, touring = !still.matches, releasing = false, fullFor = 0, visible = false, frame = 0, last = 0, idle = 0, drag = null;
const fmt = (m) => "turns " + m.turns.toFixed(2) + " · strap " + m.len.toFixed(1) + " cm · MA ×" + m.ma.toFixed(1);
function draw() {
  const f = wFrame(t);
  for (const n of Object.keys(groups)) groups[n].innerHTML = f[n];
  const text = fmt(f.m);
  if (readout.textContent !== text) readout.textContent = text;
  stage.setAttribute("aria-valuenow", String(Math.round(t * 10) / 10));
  stage.setAttribute("aria-valuetext", text);
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  if (releasing) {
    t += (0 - t) * (1 - Math.exp(-dt / 0.3));
    if (t < 0.01) { t = 0; target = 0; releasing = false; fullFor = 0; }
  } else {
    if (touring) target = Math.min(MAXT, target + dt * 0.7);
    t = still.matches ? target : t + (target - t) * (1 - Math.exp(-dt / 0.1));
    if (Math.abs(target - t) < 0.0005) t = target;
    if (t >= MAXT - 0.001) { fullFor += dt; if (fullFor > 1.4) releasing = true; }
  }
  draw();
  const settled = !touring && !releasing && t === target && fullFor === 0;
  frame = visible && !settled ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const engage = () => { touring = false; clearTimeout(idle); idle = setTimeout(() => { touring = !still.matches; run(); }, 4000); };
// the pawl only lets the drum wind in: turning back does nothing
const crank = (by) => { if (releasing) return; engage(); target = Math.min(MAXT, target + Math.max(0, by)); run(); };
const worldAt = (event) => {
  const pt = svg.createSVGPoint(); pt.x = event.clientX; pt.y = event.clientY;
  const s = pt.matrixTransform(svg.getScreenCTM().inverse()), c = cameraOf(P);
  const u = (s.x - P.origin[0]) / c.k, v = ((s.y - P.origin[1]) / c.k + 25 * c.cosE) / c.sinE;
  return Math.atan2(-u * c.cosA + v * c.sinA - WN.PN[1], u * c.sinA + v * c.cosA - WN.PN[0]);
};
stage.addEventListener("pointerdown", (event) => { stage.setPointerCapture(event.pointerId); drag = worldAt(event); });
stage.addEventListener("pointermove", (event) => {
  if (drag === null) return;
  const now = worldAt(event);
  let d = now - drag; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
  drag = now; crank(-d / (2 * Math.PI));
});
const drop = () => { drag = null; };
stage.addEventListener("pointerup", drop); stage.addEventListener("pointercancel", drop);
stage.addEventListener("keydown", (event) => {
  if (["ArrowRight", "ArrowUp", " "].includes(event.key)) { event.preventDefault(); crank(0.25); }
  else if (["ArrowLeft", "ArrowDown"].includes(event.key)) event.preventDefault();
});
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);
draw();
`;

const body = k.plateHtml({
  fig: "Fig 1",
  title: "How a trailer winch pulls your boat on",
  hint: "Drag round the handle, or press →",
  readout: fmt(f0.m),
  keys: [
    { mark: "lit", label: "Webbing strap: what the crank pulls in" },
    { mark: "raised", label: "Pawl and ratchet: wind in, never back" },
  ],
  caption: "Four turns of the 9-tooth pinion turn the 36-tooth drum gear once, and the 9 cm handle works against the strap's radius, so the pull is multiplied (friction ignored). As the strap piles up the drum radius grows and the advantage falls. The hook travel is drawn shortened.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Trailer winch: drag around the handle or press the right arrow key to crank" aria-valuemin="0" aria-valuemax="${WN.MAXT}" aria-valuenow="0">${svg}</div>`,
});
const name = theme === "light" ? "winch-light.html" : "winch.html";
writeFileSync(join(HERE, name), k.pageHtml({ title: "Fig 1 · How a trailer winch pulls your boat on", theme, body, script: kitSource + live }));
console.log("wrote", name, "solids:", (svg.match(/iso-solid/g) || []).length);
