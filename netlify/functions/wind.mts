// Hidden helper: live wind for the Explore The Range wave bars.
//
//   GET ?lat=50.91&lon=-1.40  -> { windMph, gustMph|null, dirDeg, time,
//                                   waveM|null, seaTempC|null, seaPoint|null }
//   GET ?q=Lymington          -> { name, lat, lon }   (place search)
//
// Data: MET Norway Locationforecast 2.0 + Oceanforecast 2.0 (free; NLOD 2.0 / CC BY 4.0, which
// permit commercial use with credit: "Based on data from MET Norway").
// Place search: OpenStreetMap Nominatim (ODbL, credit "© OpenStreetMap
// contributors", max 1 request/second).
//
// Both services ask for: a real identifying User-Agent, caching, and no
// direct calls from visitors' browsers -- hence this helper. Results are
// cached (wind: until MET's Expires header, max 30 min; places: 7 days),
// in Netlify Blobs when available, otherwise in memory.

const UA = 'extreme-trailers-southampton.netlify.app https://extreme-trailers-southampton.netlify.app';
const MPH = 2.23694;
const mem = new Map<string, { until: number; body: unknown }>();

async function store() {
  try {
    const { getStore } = await import('@netlify/blobs');
    return getStore('wind-cache');
  } catch { return null; }
}
async function cacheGet(key: string) {
  const m = mem.get(key);
  if (m && m.until > Date.now()) return m.body;
  try {
    const s = await store();
    const v: any = s && (await s.get(key, { type: 'json' }));
    if (v && v.until > Date.now()) { mem.set(key, v); return v.body; }
  } catch { /* blobs unavailable (local preview) */ }
  return null;
}
async function cacheSet(key: string, body: unknown, ms: number) {
  const v = { until: Date.now() + ms, body };
  mem.set(key, v);
  try { const s = await store(); if (s) await s.setJSON(key, v); } catch { /* ignore */ }
}

// ---- sea (waves) ----------------------------------------------------------
// Oceanforecast only answers for points at sea. For a place on land we look
// for the nearest sea point (two small rings around it) and remember it for a
// week -- the coastline doesn't move -- so normally this is one request.
async function oceanAt(lat: number, lon: number): Promise<any | null> {
  const r = await fetch(`https://api.met.no/weatherapi/oceanforecast/2.0/complete?lat=${lat}&lon=${lon}`, {
    headers: { 'User-Agent': UA },
  });
  if (!r.ok) return null;
  const d: any = await r.json();
  const ts: any[] = d.properties?.timeseries || [];
  if (!ts.length) return null;
  const now = Date.now();
  const cur = ts.reduce((b, t) => (Math.abs(Date.parse(t.time) - now) < Math.abs(Date.parse(b.time) - now) ? t : b), ts[0]);
  const det = cur?.data?.instant?.details || {};
  return typeof det.sea_surface_wave_height === 'number' ? det : null;
}
async function seaFor(lat: number, lon: number) {
  const ptKey = `seapt:${lat},${lon}`;
  let pt: any = await cacheGet(ptKey);
  if (pt && pt.none) return null;
  if (pt) {
    const det = await oceanAt(pt.lat, pt.lon);
    if (det) return { det, pt };
  }
  const cands: [number, number][] = [[lat, lon]];
  for (const d of [0.05, 0.12]) {
    for (let k = 0; k < 8; k++) {
      const a = (k * Math.PI) / 4;
      cands.push([+(lat + d * Math.sin(a)).toFixed(2), +(lon + (d * Math.cos(a)) / Math.cos((lat * Math.PI) / 180)).toFixed(2)]);
    }
  }
  for (const [la, lo] of cands) {
    const det = await oceanAt(la, lo);
    if (det) { await cacheSet(ptKey, { lat: la, lon: lo }, 7 * 86400e3); return { det, pt: { lat: la, lon: lo } }; }
  }
  await cacheSet(ptKey, { none: true }, 7 * 86400e3);
  return null;
}

const json = (b: unknown, status = 200, maxAge = 300) =>
  new Response(JSON.stringify(b), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': `public, max-age=${maxAge}` },
  });

export default async (req: Request) => {
  const url = new URL(req.url);

  // ---- place search ----
  const q = (url.searchParams.get('q') || '').trim().slice(0, 80);
  if (q) {
    const key = 'place2:' + q.toLowerCase(); // UK-area search (v2)
    const hit = await cacheGet(key);
    if (hit) return json(hit, 200, 86400);
    const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=jsonv2&limit=1&addressdetails=1&countrycodes=gb,ie,im,je,gg`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-GB' },
    });
    if (!r.ok) return json({ error: 'search' }, 502, 0);
    const g: any = (await r.json())[0];
    if (!g) return json({ error: 'notfound' }, 404, 600);
    const a = g.address || {};
    const town = a.town || a.city || a.village || a.hamlet || a.harbour || g.name;
    const body = { name: [town, (a.country_code || '').toUpperCase()].filter(Boolean).join(', '), lat: +(+g.lat).toFixed(4), lon: +(+g.lon).toFixed(4) };
    await cacheSet(key, body, 7 * 86400e3);
    return json(body, 200, 86400);
  }

  // ---- wind ----
  const lat = +(+(url.searchParams.get('lat') || 'NaN')).toFixed(2); // ~1km grid -> better cache sharing
  const lon = +(+(url.searchParams.get('lon') || 'NaN')).toFixed(2);
  if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return json({ error: 'coords' }, 400, 0);
  const key = `wind2:${lat},${lon}`;
  const hit = await cacheGet(key);
  if (hit) return json(hit);

  const r = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${lat}&lon=${lon}`, {
    headers: { 'User-Agent': UA },
  });
  if (!r.ok) return json({ error: 'weather', status: r.status }, 502, 0);
  const d: any = await r.json();
  const now = Date.now();
  const ts: any[] = d.properties?.timeseries || [];
  const cur = ts.reduce((best, t) =>
    Math.abs(Date.parse(t.time) - now) < Math.abs(Date.parse(best.time) - now) ? t : best, ts[0]);
  const det = cur?.data?.instant?.details || {};
  const gust = typeof det.wind_speed_of_gust === 'number' ? det.wind_speed_of_gust * MPH : null;
  let sea: any = null;
  try { sea = await seaFor(lat, lon); } catch { sea = null; }
  const body = {
    windMph: +(det.wind_speed * MPH).toFixed(1),
    gustMph: gust === null ? null : +gust.toFixed(1), // MET Norway only gives gusts in the Nordic area
    dirDeg: det.wind_from_direction,
    time: cur?.time,
    source: 'MET Norway',
    waveM: sea ? +sea.det.sea_surface_wave_height.toFixed(1) : null,
    seaTempC: sea && typeof sea.det.sea_water_temperature === 'number' ? +sea.det.sea_water_temperature.toFixed(1) : null,
    seaPoint: sea ? sea.pt : null,
  };
  const expires = Date.parse(r.headers.get('expires') || '') || now + 30 * 60e3;
  await cacheSet(key, body, Math.max(5 * 60e3, Math.min(expires - now, 30 * 60e3)));
  return json(body);
};
