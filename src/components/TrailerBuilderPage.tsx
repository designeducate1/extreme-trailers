import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MODELS, type RangeModel } from '../data/range';

// Trailer Builder: a simpler take on a car configurator (Rivian's R1S
// builder). Each product's picture is 36 photoreal studio renders (Blender
// Cycles, ~/ross-trolley-model) that turn as you drag. Colour choices
// recolour the photos in the browser using a matching ID mask per view
// (red and green channels = the two colourable parts), so no extra
// rendering is needed per colour. AR rebuilds the 3D model in the chosen
// colours.

const N = 36, W = 1400, H = 875;
const pad = (i: number) => String(i).padStart(3, '0');

export const COLOURS: { name: string; hex: string | null }[] = [
  { name: 'Standard', hex: null }, { name: 'Black', hex: '#16181d' }, { name: 'White', hex: '#f2f2f2' },
  { name: 'Grey', hex: '#8a9099' }, { name: 'Red', hex: '#c62828' }, { name: 'Orange', hex: '#ef6c00' },
  { name: 'Yellow', hex: '#f9c80e' }, { name: 'Green', hex: '#2e7d32' }, { name: 'Navy', hex: '#0f1f4d' },
];

// How a part is found in the photo: 'blue' parts (moulded rollers) by
// their colour within the mask; 'mask' parts (silver rims) by the mask
// alone, with shading taken from the photo's brightness.
type Mode = 'blue' | 'mask';
interface Part { id: string; label: string; short: string; standard: { name: string; swatch: string }; mode: Mode; ref: number; view: number; material?: string }
interface Extra { id: string; name: string; note: string; price: number; from: boolean }
interface Product {
  id: 'trolley' | 'super-roller';
  title: string; tab: string; blurb: string; dir: string;
  models: RangeModel[]; modelNote?: string;
  /** parts[0] = mask red channel, parts[1] = mask green channel. */
  parts: [Part, Part];
  extras: Extra[];
  view: number;
  ar: { file: string; title: string; how: 'texture' | 'material' };
}

const PRODUCTS: Product[] = [
  {
    id: 'trolley', title: 'Launching Trolley', tab: 'Launching Trolley', dir: '/builder',
    blurb: 'Built in Southampton, hot-dip galvanised. For launching and recovering dinghies and tenders; not for road use.',
    models: MODELS.filter((m) => m.family === 'launcher' && !m.roadLegal),
    parts: [
      { id: 'wheels', label: 'Wheel colour', short: 'Wheels', standard: { name: 'Extreme Blue', swatch: '#1f3fbf' }, mode: 'blue', ref: 0.42, view: 31 },
      { id: 'rollers', label: 'Roller colour', short: 'Rollers', standard: { name: 'Extreme Blue', swatch: '#1f3fbf' }, mode: 'blue', ref: 0.42, view: 5 },
    ],
    extras: [
      { id: 'all-terrain', name: 'All-terrain wheels', note: 'For soft sand and shingle', price: 75, from: false },
      { id: 'straps', name: 'Ratchet straps', note: 'Price per strap', price: 14.95, from: true },
    ],
    view: 4,
    ar: { file: '/builder/trolley-ar.glb', title: 'Extreme launching trolley', how: 'texture' },
  },
  {
    id: 'super-roller', title: 'Super Roller', tab: 'Super Roller', dir: '/builder/super-roller',
    blurb: 'Braked road trailer with 24 wobble rollers on rocking banks, for planing hulls and RIBs. Built in Southampton, hot-dip galvanised.',
    // The picture is the single-axle, 24-roller layout.
    models: MODELS.filter((m) => m.family === 'super-roller' && m.supports === 24),
    modelNote: 'Larger 32-roller and twin-axle Super Rollers coming soon.',
    parts: [
      { id: 'rims', label: 'Wheel rim colour', short: 'Rims', standard: { name: 'Silver', swatch: '#c5c8cd' }, mode: 'mask', ref: 0.62, view: 7, material: 'rim_steel' },
      { id: 'rollers', label: 'Roller colour', short: 'Rollers', standard: { name: 'Extreme Blue', swatch: '#1f3fbf' }, mode: 'blue', ref: 0.57, view: 3, material: 'roller_blue' },
    ],
    extras: [
      { id: 'spare', name: 'Spare wheel with bracket', note: 'Matching wheel, mounted on the frame', price: 78, from: true },
      { id: 'lock-nuts', name: 'Locking wheel nuts', note: 'Set for both wheels', price: 29, from: false },
      { id: 'coupling-lock', name: 'Lockable coupling', note: 'Hitch lock', price: 10, from: true },
      { id: 'straps', name: 'Ratchet straps', note: 'Price per strap', price: 14.95, from: true },
    ],
    view: 1,
    ar: { file: '/builder/super-roller/super-roller-ar.glb', title: 'Extreme Super Roller', how: 'material' },
  },
];

const gbp = (n: number) => '£' + n.toLocaleString('en-GB', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 });

// ---- Recolouring ------------------------------------------------------------
const toLin = new Float32Array(256).map((_, i) => { const c = i / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
const toSrgb8 = new Uint8ClampedArray(4096).map((_, i) => { const l = i / 4095; return 255 * (l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055); });
const hexLin = (hex: string) => [1, 3, 5].map((k) => toLin[parseInt(hex.slice(k, k + 2), 16)]);
const S = (v: number) => toSrgb8[v <= 0 ? 0 : v >= 1 ? 4095 : (v * 4095) | 0];

// Swap the chosen parts of one photo for new colours, keeping the photo's
// own shading. Gloss highlights stay bright (shade can exceed 1), and
// anything outside the mask -- steel, tyres -- is left as rendered.
function recolour(photo: ImageData, mask: ImageData, parts: [Part, Part], cols: [number[] | null, number[] | null]) {
  const d = photo.data, m = mask.data;
  for (let p = 0; p < d.length; p += 4) {
    let R = 0, G = 0, B = 0, keep = 1, touched = false;
    const r = toLin[d[p]], g = toLin[d[p + 1]], b = toLin[d[p + 2]];
    for (let k = 0; k < 2; k++) {
      const c = cols[k]; if (!c) continue;
      const mv = m[p + k]; if (mv < 6) continue;
      const part = parts[k];
      let w: number, sh: number;
      if (part.mode === 'blue') {
        const bl = (b - (r > g ? r : g)) / (b > 1e-4 ? b : 1e-4);
        if (bl <= 0.15) continue;
        let x = (bl - 0.15) / 0.35; if (x > 1) x = 1;
        w = x * x * (3 - 2 * x); sh = Math.min(b / part.ref, 1.5);
      } else {
        w = 1; sh = Math.min((0.2126 * r + 0.7152 * g + 0.0722 * b) / part.ref, 1.6);
      }
      w *= mv / 255; keep -= w; touched = true;
      R += c[0] * sh * w; G += c[1] * sh * w; B += c[2] * sh * w;
    }
    if (!touched) continue;
    if (keep < 0) keep = 0;
    d[p] = S(r * keep + R); d[p + 1] = S(g * keep + G); d[p + 2] = S(b * keep + B);
  }
}

// ---- AR -----------------------------------------------------------------------
// iPhone/iPad: rebuild the AR model in the chosen colours and open it in
// AR Quick Look (real size). Android: Scene Viewer, which needs a hosted
// file, so it shows the standard colours. Desktop: a QR code that opens
// this build on a phone.
const CDN = 'https://cdn.jsdelivr.net/npm/three@0.160.0';
async function buildUsdz(product: Product, cols: [string | null, string | null]): Promise<ArrayBuffer> {
  const [THREE, { GLTFLoader }, { DRACOLoader }, { USDZExporter }] = await Promise.all([
    import(/* @vite-ignore */ `${CDN}/+esm`),
    import(/* @vite-ignore */ `${CDN}/examples/jsm/loaders/GLTFLoader.js/+esm`),
    import(/* @vite-ignore */ `${CDN}/examples/jsm/loaders/DRACOLoader.js/+esm`),
    import(/* @vite-ignore */ `${CDN}/examples/jsm/exporters/USDZExporter.js/+esm`),
  ]);
  const loader = new GLTFLoader();
  const draco = new DRACOLoader(); draco.setDecoderPath(`${CDN}/examples/jsm/libs/draco/gltf/`);
  loader.setDRACOLoader(draco);
  const gltf = await loader.loadAsync(product.ar.file);
  const meshes: any[] = [];
  gltf.scene.traverse((o: any) => { if (o.isMesh) meshes.push(o); });

  if (product.ar.how === 'material') {
    // Separate parts with their own materials: just recolour those.
    product.parts.forEach((part, k) => {
      const hex = cols[k]; if (!hex) return;
      for (const m of meshes) {
        if (m.material?.name !== part.material) continue;
        m.material = m.material.clone();
        m.material.color.set(hex);
        if (part.mode === 'mask') { m.material.metalness = 0.3; m.material.roughness = 0.35; }   // painted rims
      }
    });
    gltf.scene.updateMatrixWorld(true);
    return new USDZExporter().parse(gltf.scene, { quickLookCompatible: true });
  }

  // One shared colour texture (the trolley): bake each part's colour into
  // a copy of it, swapping the blue texels.
  const bake = (hex: string | null) => {
    const src = meshes[0].material.map.image, size = 1024;
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d')!; g.drawImage(src, 0, 0, size, size);
    if (hex) {
      const img = g.getImageData(0, 0, size, size), d = img.data, tc = hexLin(hex);
      for (let i = 0; i < d.length; i += 4) {
        const r = toLin[d[i]], gg = toLin[d[i + 1]], b = toLin[d[i + 2]];
        const bl = (b - Math.max(r, gg)) / Math.max(b, 1e-4);
        const x = Math.min(1, Math.max(0, (bl - 0.3) / 0.3)), w = x * x * (3 - 2 * x);
        if (w <= 0) continue;
        const k = Math.min(1.6, b / 0.45);
        d[i] = S(r + (tc[0] * k - r) * w); d[i + 1] = S(gg + (tc[1] * k - gg) * w); d[i + 2] = S(b + (tc[2] * k - b) * w);
      }
      g.putImageData(img, 0, 0);
    }
    const tex = new THREE.CanvasTexture(c); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  };
  const maps = [bake(cols[0]), bake(cols[1])];
  const root = new THREE.Group();
  for (const m of meshes) {
    const mat = new THREE.MeshStandardMaterial({ map: m.name.startsWith('wheel') ? maps[0] : maps[1],
      roughnessMap: m.material.roughnessMap, metalnessMap: m.material.metalnessMap, roughness: 1, metalness: 1 });
    const copy = new THREE.Mesh(m.geometry, mat);
    copy.position.copy(m.position); copy.quaternion.copy(m.quaternion); copy.scale.copy(m.scale);
    root.add(copy);
  }
  // The exporter reads world matrices; these copies are never rendered.
  root.updateMatrixWorld(true);
  return new USDZExporter().parse(root, { quickLookCompatible: true });
}
function loadQrLib(): Promise<any> {
  const w = window as any;
  if (w.qrcode) return Promise.resolve(w.qrcode);
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.js';
    s.onload = () => res(w.qrcode); s.onerror = rej; document.head.appendChild(s);
  });
}

function Swatches({ part, value, onPick }: { part: Part; value: string | null; onPick: (hex: string | null) => void }) {
  return (
    <div className="flex flex-wrap gap-2.5" role="radiogroup">
      {COLOURS.map((c) => {
        const on = value === c.hex, name = c.hex ? c.name : part.standard.name;
        return (
          <button key={c.name} type="button" role="radio" aria-checked={on} aria-label={name} title={name}
            onClick={() => onPick(c.hex)}
            className={`w-10 h-10 rounded-full border transition-shadow ${on ? 'ring-2 ring-offset-2 ring-[#12306b] border-transparent' : 'border-zinc-300 hover:ring-2 hover:ring-offset-2 hover:ring-zinc-300'}`}
            style={{ background: c.hex ?? part.standard.swatch }} />
        );
      })}
    </div>
  );
}

function Section({ title, value, children }: { title: string; value?: string; children: React.ReactNode }) {
  return (
    <section className="py-7 border-b border-zinc-200">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {value && <span className="text-sm text-zinc-500">{value}</span>}
      </div>
      {children}
    </section>
  );
}

// ---- Page -------------------------------------------------------------------
export const TrailerBuilderPage: React.FC = () => {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const fromHex = (v: string | null) => (v && COLOURS.some((c) => c.hex === '#' + v) ? '#' + v : null);
  const [productId, setProductId] = useState<Product['id']>(() => PRODUCTS.find((p) => p.id === params.get('product'))?.id ?? 'trolley');
  const product = PRODUCTS.find((p) => p.id === productId)!;
  const [modelId, setModelId] = useState(() => product.models.find((t) => t.id === params.get('model'))?.id ?? product.models[0].id);
  const [cols, setCols] = useState<[string | null, string | null]>(() => [fromHex(params.get(product.parts[0].id)), fromHex(params.get(product.parts[1].id))]);
  const [extras, setExtras] = useState<string[]>([]);
  const [soon, setSoon] = useState(false);
  const [ar, setAr] = useState<'idle' | 'busy' | 'qr'>('idle');
  const [qr, setQr] = useState('');
  const [loaded, setLoaded] = useState(0);

  const model = product.models.find((t) => t.id === modelId) ?? product.models[0];
  const chosenExtras = product.extras.filter((e) => extras.includes(e.id));
  const total = model.priceIncVat + chosenExtras.reduce((n, e) => n + e.price, 0);
  const colourName = (k: 0 | 1) => (cols[k] ? COLOURS.find((c) => c.hex === cols[k])!.name : product.parts[k].standard.name);

  const switchProduct = (id: Product['id']) => {
    if (id === productId) return;
    const next = PRODUCTS.find((p) => p.id === id)!;
    setProductId(id); setModelId(next.models[0].id); setCols([null, null]); setExtras([]);
  };

  // ---- Turntable
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const st = useRef({ pos: product.view as number, vel: 0, auto: true, dragging: false, lastX: 0, lastT: 0, target: null as number | null, shown: '' });
  const imgs = useRef<{ f: HTMLImageElement[]; m: HTMLImageElement[] }>({ f: [], m: [] });
  const cache = useRef(new Map<string, HTMLCanvasElement>());
  const view = useRef({ product, key: '', lin: [null, null] as [number[] | null, number[] | null] });
  view.current = { product, key: `${productId}|${cols[0]}|${cols[1]}`, lin: [cols[0] ? hexLin(cols[0]) : null, cols[1] ? hexLin(cols[1]) : null] };

  useEffect(() => {
    let done = 0, live = true;
    const bump = () => { if (live) { done++; setLoaded(done); } };
    setLoaded(0); cache.current.clear(); st.current.shown = '';
    imgs.current = { f: [], m: [] };
    for (let i = 0; i < N; i++) {
      const f = new Image(); f.onload = f.onerror = bump; f.src = `${product.dir}/frames/f${pad(i)}.jpg`; imgs.current.f.push(f);
      const m = new Image(); m.onload = m.onerror = bump; m.src = `${product.dir}/masks/m${pad(i)}.png`; imgs.current.m.push(m);
    }
    const s = st.current; s.auto = true; s.target = null; s.pos = product.view;
    return () => { live = false; };
  }, [product]);

  const scratch = useMemo(() => {
    const a = document.createElement('canvas'); a.width = W; a.height = H;
    const b = document.createElement('canvas'); b.width = W; b.height = H;
    return { ga: a.getContext('2d', { willReadFrequently: true })!, gb: b.getContext('2d', { willReadFrequently: true })! };
  }, []);

  const frameFor = useCallback((i: number): CanvasImageSource | null => {
    const f = imgs.current.f[i], m = imgs.current.m[i], v = view.current;
    if (!f?.complete || !f.naturalWidth) return null;
    if (!v.lin[0] && !v.lin[1]) return f;
    const key = `${i}|${v.key}`, hit = cache.current.get(key);
    if (hit) { cache.current.delete(key); cache.current.set(key, hit); return hit; }
    if (!m?.complete || !m.naturalWidth) return f;
    scratch.ga.drawImage(f, 0, 0, W, H);
    scratch.gb.drawImage(m, 0, 0, W, H);
    const photo = scratch.ga.getImageData(0, 0, W, H);
    recolour(photo, scratch.gb.getImageData(0, 0, W, H), v.product.parts, v.lin);
    const out = document.createElement('canvas'); out.width = W; out.height = H;
    out.getContext('2d')!.putImageData(photo, 0, 0);
    cache.current.set(key, out);
    while (cache.current.size > 16) cache.current.delete(cache.current.keys().next().value!);
    return out;
  }, [scratch]);

  useEffect(() => {
    let raf = 0;
    const g = canvasRef.current!.getContext('2d')!;
    const tick = () => {
      const s = st.current;
      if (!s.dragging) {
        if (s.target !== null) {
          let d = s.target - s.pos; d = ((d % N) + N * 1.5) % N - N / 2;
          if (Math.abs(d) < 0.05) { s.pos = s.target; s.target = null; } else s.pos += d * 0.12;
        } else if (s.auto) s.pos += 0.05;
        else if (Math.abs(s.vel) > 0.01) { s.pos += s.vel; s.vel *= 0.92; }
        else { s.vel = 0; s.pos += (Math.round(s.pos) - s.pos) * 0.2; }
      }
      const i = ((Math.round(s.pos) % N) + N) % N, key = `${i}|${view.current.key}`;
      if (key !== s.shown) {
        const img = frameFor(i);
        if (img) { g.drawImage(img, 0, 0, W, H); s.shown = key; }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [frameFor]);

  const glide = (frame: number) => { const s = st.current; s.auto = false; s.vel = 0; s.target = frame; };
  const onDown = (e: React.PointerEvent) => {
    const s = st.current; s.dragging = true; s.auto = false; s.vel = 0; s.target = null; s.lastX = e.clientX; s.lastT = performance.now();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onMove = (e: React.PointerEvent) => {
    const s = st.current; if (!s.dragging) return;
    const now = performance.now(), px = Math.max(8, (e.currentTarget as HTMLElement).clientWidth / 90);
    const d = (s.lastX - e.clientX) / px;
    s.pos += d; s.vel = d / Math.max(1, (now - s.lastT) / 16); s.lastX = e.clientX; s.lastT = now;
  };
  const onUp = () => { st.current.dragging = false; };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); glide(Math.round(st.current.pos) + (e.key === 'ArrowRight' ? 1 : -1)); }
  };
  const pick = (k: 0 | 1, hex: string | null) => {
    setCols((c) => (k === 0 ? [hex, c[1]] : [c[0], hex]));
    glide(product.parts[k].view);
  };

  // ---- AR
  const ios = useMemo(() => document.createElement('a').relList.supports('ar'), []);
  const android = /android/i.test(navigator.userAgent);
  const shareUrl = () => {
    const q = new URLSearchParams({ builder: '', product: productId, model: modelId });
    product.parts.forEach((p, k) => { if (cols[k]) q.set(p.id, cols[k]!.slice(1)); });
    return `${location.origin}/?${q.toString().replace('builder=', 'builder')}`;
  };
  const viewInAr = async () => {
    if (ios) {
      setAr('busy');
      try {
        const usdz = await buildUsdz(product, cols);
        const a = document.createElement('a'); a.rel = 'ar';
        a.href = URL.createObjectURL(new Blob([usdz], { type: 'model/vnd.usdz+zip' }));
        a.appendChild(document.createElement('img')); a.click();
      } catch (err) { console.error(err); alert('Sorry, AR could not be prepared on this device.'); }
      setAr('idle');
    } else if (android) {
      const file = `${location.origin}${product.ar.file}`;
      location.href = `intent://arvr.google.com/scene-viewer/1.2?file=${encodeURIComponent(file)}&mode=ar_preferred&title=${encodeURIComponent(product.ar.title)}` +
        `#Intent;scheme=https;package=com.google.ar.core;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(location.href)};end;`;
    } else if (ar === 'qr') setAr('idle');
    else {
      try { const qrcode = await loadQrLib(); const q = qrcode(0, 'M'); q.addData(shareUrl()); q.make(); setQr(q.createDataURL(6, 2)); setAr('qr'); }
      catch { alert('Sorry, the QR code could not be made.'); }
    }
  };
  // Keep an open QR code in step with the build.
  useEffect(() => { if (ar === 'qr') setAr('idle'); }, [productId, modelId, cols]); // eslint-disable-line react-hooks/exhaustive-deps

  const addToBasket = () => { setSoon(true); setTimeout(() => setSoon(false), 2200); };
  const ready = loaded >= N * 2;

  return (
    <div className="relative z-20 w-full min-h-screen bg-white text-zinc-900 font-sf lg:grid lg:grid-cols-[1fr_420px]">
      {/* The trailer */}
      <div className="relative bg-[#f4f5f7] lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] flex flex-col justify-center">
        <div className="relative w-full cursor-grab active:cursor-grabbing touch-pan-y select-none outline-none focus-visible:ring-2 focus-visible:ring-[#12306b]"
          tabIndex={0} role="img"
          aria-label={`${model.name} with ${colourName(0)} ${product.parts[0].short.toLowerCase()} and ${colourName(1)} ${product.parts[1].short.toLowerCase()}. Drag or use the arrow keys to turn it.`}
          onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}>
          <canvas ref={canvasRef} width={W} height={H} className="block w-full h-auto" />
          {!ready && (
            <div className="absolute inset-0 grid place-items-center text-sm text-zinc-500 bg-[#f4f5f7]/60">
              <div className="text-center">Loading studio views
                <div className="mt-2 w-40 h-[3px] rounded bg-zinc-200 overflow-hidden"><div className="h-full bg-[#12306b] transition-[width]" style={{ width: `${(loaded / (N * 2)) * 100}%` }} /></div>
              </div>
            </div>
          )}
        </div>
        <div className="absolute left-4 right-4 bottom-4 flex items-end justify-between gap-3 pointer-events-none">
          <p className="text-xs text-zinc-500">Drag to turn · studio render</p>
          <div className="relative pointer-events-auto">
            <button type="button" onClick={viewInAr} disabled={ar === 'busy'}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white border border-zinc-200 text-sm font-semibold shadow-sm hover:border-zinc-400 disabled:opacity-60">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l9 5v10l-9 5-9-5V7z" /><path d="M12 22V12M21 7l-9 5-9-5" /></svg>
              {ar === 'busy' ? 'Preparing…' : 'View in AR'}
            </button>
            {ar === 'qr' && qr && (
              <div className="absolute right-0 bottom-12 w-56 p-3 rounded-2xl bg-white border border-zinc-200 shadow-xl text-center">
                <img src={qr} alt="QR code to open this build on your phone" className="w-full" />
                <p className="mt-1.5 text-xs text-zinc-500">Scan with your phone&rsquo;s camera to see it in your space, in these colours.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Options */}
      <div className="px-6 sm:px-8 pt-8 pb-32 lg:pb-12 lg:border-l lg:border-zinc-200">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#13306b]">Trailer Builder</p>
        <div className="mt-3 grid grid-cols-2 gap-1 p-1 rounded-full bg-zinc-100" role="tablist" aria-label="Product">
          {PRODUCTS.map((p) => (
            <button key={p.id} type="button" role="tab" aria-selected={p.id === productId} onClick={() => switchProduct(p.id)}
              className={`h-10 rounded-full text-sm font-semibold transition-colors ${p.id === productId ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-800'}`}>
              {p.tab}
            </button>
          ))}
        </div>
        <h1 className="mt-6 text-3xl sm:text-4xl font-bold tracking-tighter">{product.title}</h1>
        <p className="mt-2 text-zinc-500">{product.blurb}</p>

        <Section title="Model" value={gbp(model.priceIncVat)}>
          <div className="space-y-2.5" role="radiogroup">
            {product.models.map((t) => {
              const on = t.id === model.id;
              return (
                <button key={t.id} type="button" role="radio" aria-checked={on} onClick={() => { setModelId(t.id); glide(product.view); }}
                  className={`w-full text-left rounded-2xl border p-4 transition-colors ${on ? 'border-[#12306b] ring-1 ring-[#12306b]' : 'border-zinc-200 hover:border-zinc-400'}`}>
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="font-semibold">{t.name}</span>
                    <span className="text-sm font-semibold">{gbp(t.priceIncVat)}</span>
                  </span>
                  <span className="mt-1 block text-sm text-zinc-500">
                    Boats up to {t.maxBoatM} m · {t.capacityKg} kg{t.roadLegal ? ` · ${t.lengthM} m long · ${t.tyre} tyres` : ` · ${t.supports} supports`}
                  </span>
                </button>
              );
            })}
          </div>
          {product.modelNote && <p className="mt-3 text-xs text-zinc-500">{product.modelNote}</p>}
        </Section>

        {product.parts.map((part, k) => (
          <Section key={part.id} title={part.label} value={colourName(k as 0 | 1)}>
            <Swatches part={part} value={cols[k]} onPick={(h) => pick(k as 0 | 1, h)} />
            {k === 1 && <p className="mt-4 text-xs text-zinc-500">Colours are a preview. Availability, and any extra cost, confirmed by Extreme.</p>}
          </Section>
        ))}

        <Section title="Extras">
          <div className="space-y-2.5">
            {product.extras.map((x) => {
              const on = extras.includes(x.id);
              return (
                <label key={x.id} className={`flex items-center gap-3 rounded-2xl border p-4 cursor-pointer ${on ? 'border-[#12306b] ring-1 ring-[#12306b]' : 'border-zinc-200 hover:border-zinc-400'}`}>
                  <input type="checkbox" className="w-4 h-4 accent-[#12306b]" checked={on}
                    onChange={() => setExtras((e) => (on ? e.filter((v) => v !== x.id) : [...e, x.id]))} />
                  <span className="flex-1"><span className="font-semibold">{x.name}</span><span className="block text-sm text-zinc-500">{x.note}</span></span>
                  <span className="text-sm font-semibold whitespace-nowrap">{x.from ? 'from ' : '+'}{gbp(x.price)}</span>
                </label>
              );
            })}
          </div>
        </Section>

        <section className="pt-7">
          <h2 className="text-lg font-bold tracking-tight mb-4">Your build</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-zinc-500">{model.name}</dt><dd>{gbp(model.priceIncVat)}</dd></div>
            {product.parts.map((p, k) => (
              <div key={p.id} className="flex justify-between"><dt className="text-zinc-500">{p.short}</dt><dd>{colourName(k as 0 | 1)}</dd></div>
            ))}
            {chosenExtras.map((x) => (
              <div key={x.id} className="flex justify-between"><dt className="text-zinc-500">{x.name}</dt><dd>{gbp(x.price)}</dd></div>
            ))}
            <div className="flex justify-between pt-3 mt-3 border-t border-zinc-200 text-base font-bold"><dt>Total inc VAT</dt><dd>{gbp(total)}</dd></div>
          </dl>
          <div className="hidden lg:flex mt-6 gap-2">
            <button type="button" onClick={addToBasket} className="flex-1 h-12 rounded-full bg-[#12306b] text-white font-semibold hover:-translate-y-px transition-transform">
              {soon ? 'Basket coming soon' : 'Add to basket'}
            </button>
            <a href="tel:+442380632535" className="h-12 px-5 rounded-full border border-zinc-200 font-semibold inline-flex items-center hover:border-zinc-400">Call</a>
          </div>
          <p className="mt-4 text-xs text-zinc-400">RRP including VAT from Extreme&rsquo;s 1 January 2026 price list; subject to change.</p>
        </section>
      </div>

      {/* Phone: total and basket always in reach */}
      <div className="lg:hidden fixed left-0 right-0 bottom-0 z-30 bg-white/95 backdrop-blur border-t border-zinc-200 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-zinc-500 truncate">{model.name}</p>
          <p className="font-bold">{gbp(total)}</p>
        </div>
        <button type="button" onClick={addToBasket} className="h-11 px-5 rounded-full bg-[#12306b] text-white text-sm font-semibold">
          {soon ? 'Basket coming soon' : 'Add to basket'}
        </button>
      </div>
    </div>
  );
};
