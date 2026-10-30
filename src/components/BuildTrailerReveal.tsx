import React, { useEffect, useRef, useState } from 'react';
import sr1900 from '../assets/1900sr-blue.jpg';
import sr2600 from '../assets/2600sr-blue.jpg';
import sr3500 from '../assets/3500srblue-ext.png';
import bunk from '../assets/categories/bunk.jpg';
import launcher from '../assets/categories/launcher.jpg';
import pwc from '../assets/categories/pwc.jpg';
import beach from '../assets/scenes/beach.jpg';
import firstBeach from '../assets/scenes/first-beach.jpg';
import lake from '../assets/scenes/lake.jpg';

// "Build The Right Trailer" interstitial: a composed collage of large,
// rounded trailer cards around the headline -- sharp cards in front,
// big soft-focus cards behind them, soft shadows where they overlap.
// It dissolves in once the section is on screen, sways with the mouse
// (front and back layers shift by different amounts), then disperses
// outwards past the camera as you scroll, releasing into the next
// section. An original WebGL take on the floating-cards header idea
// (prag-matt-ic/imagen-header-rebuild is unlicensed and WebGPU-only, so
// none of its code is used).
//
// three.js loads from the CDN only when the section approaches.
// Reduced motion: the headline block shows as a plain section.

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const SCROLL_HEIGHT = '250vh';

// Card slots: position as a fraction of the view (x, y in -1..1 at the
// card's depth), width as a fraction of the view width, card aspect
// (w/h), tilt, and layer: 'front' sharp cards or 'back' soft ones.
type Slot = { src: string; x: number; y: number; w: number; aspect: number; ry: number; rz: number; layer: 'front' | 'back' };
// Arranged as a ring that leaves the headline's box clear (x within
// about +-0.45, y within +-0.45), cards only kissing its corners.
const DESKTOP: Slot[] = [
  { src: lake, x: -0.84, y: 0.06, w: 0.2, aspect: 1.15, ry: 0.2, rz: 0.02, layer: 'back' },
  { src: sr2600, x: 0.66, y: 0.74, w: 0.24, aspect: 1.3, ry: -0.25, rz: -0.02, layer: 'back' },
  { src: firstBeach, x: -0.4, y: -0.84, w: 0.24, aspect: 1.45, ry: 0.15, rz: 0.03, layer: 'back' },
  { src: pwc, x: 0.95, y: -0.72, w: 0.2, aspect: 1.3, ry: -0.2, rz: 0, layer: 'back' },
  { src: launcher, x: -0.98, y: 0.86, w: 0.16, aspect: 1.2, ry: 0.25, rz: 0, layer: 'back' },
  { src: beach, x: -0.74, y: 0.68, w: 0.18, aspect: 1.1, ry: 0.22, rz: 0.05, layer: 'front' },
  { src: sr1900, x: 0.06, y: 0.82, w: 0.16, aspect: 1.05, ry: -0.08, rz: -0.01, layer: 'front' },
  { src: lake, x: 0.88, y: -0.06, w: 0.22, aspect: 1.45, ry: -0.32, rz: -0.03, layer: 'front' },
  { src: sr3500, x: -0.7, y: -0.44, w: 0.15, aspect: 0.95, ry: 0.28, rz: -0.03, layer: 'front' },
  { src: bunk, x: 0.14, y: -0.86, w: 0.22, aspect: 1.45, ry: -0.05, rz: 0.03, layer: 'front' },
];
// Portrait: cards above and below the headline block only.
const MOBILE: Slot[] = [
  { src: lake, x: 0.1, y: 0.92, w: 0.62, aspect: 1.4, ry: 0, rz: 0.02, layer: 'back' },
  { src: firstBeach, x: -0.8, y: -0.9, w: 0.5, aspect: 1.2, ry: 0.2, rz: 0, layer: 'back' },
  { src: sr2600, x: 0.85, y: -0.95, w: 0.5, aspect: 1.3, ry: -0.2, rz: 0, layer: 'back' },
  { src: beach, x: -0.45, y: 0.72, w: 0.48, aspect: 1.15, ry: 0.2, rz: 0.04, layer: 'front' },
  { src: sr1900, x: 0.5, y: 0.66, w: 0.4, aspect: 1.05, ry: -0.2, rz: -0.03, layer: 'front' },
  { src: sr3500, x: -0.45, y: -0.74, w: 0.42, aspect: 1.0, ry: 0.22, rz: -0.03, layer: 'front' },
  { src: bunk, x: 0.48, y: -0.8, w: 0.48, aspect: 1.35, ry: -0.18, rz: 0.03, layer: 'front' },
];
const FRONT_Z = 0, BACK_Z = -3.2, CAM_Z = 7, FOV = 40;

interface Props {
  children: React.ReactNode;
}

export default function BuildTrailerReveal({ children }: Props) {
  const sectionRef = useRef<HTMLElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const [reduced] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    const section = sectionRef.current, host = hostRef.current;
    if (reduced || !section || !host) return;
    let disposed = false;
    let cleanup = () => {};
    const io = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      const url = THREE_URL;
      import(/* @vite-ignore */ url)
        .then((THREE) => { if (!disposed) cleanup = buildScene(THREE, host, section); })
        .catch((err) => console.warn('[BuildTrailerReveal] 3D unavailable:', err));
    }, { rootMargin: '800px 0px' });
    io.observe(section);
    return () => { disposed = true; io.disconnect(); cleanup(); };
  }, [reduced]);

  if (reduced) {
    return (
      <section className="relative z-20 w-full bg-[#eef2f8] text-zinc-900 pt-[140px] sm:pt-[190px] md:pt-[220px] pb-10 sm:pb-0 px-6 flex flex-col items-center justify-center font-sf text-center">
        {children}
      </section>
    );
  }
  return (
    <section ref={sectionRef} className="relative z-20 w-full bg-[#eef2f8]" style={{ height: SCROLL_HEIGHT }}>
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 30% 26% at 50% 50%, rgba(238,242,248,0.85) 0%, rgba(238,242,248,0.5) 50%, rgba(238,242,248,0) 80%)' }}
        />
        <div className="relative z-10 h-full flex items-center justify-center px-6 text-zinc-900 font-sf text-center">{children}</div>
      </div>
    </section>
  );
}

const VERTEX = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
// Card: cover-cropped photo in a rounded rectangle, dissolving in through
// value noise, blending to a pre-blurred copy for soft focus.
const CARD_FRAGMENT = `
  uniform sampler2D uMap, uBlurMap;
  uniform float uReveal, uBlur, uOpacity, uSeed;
  uniform vec2 uSize, uUvScale, uUvOffset;
  varying vec2 vUv;
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
  }
  float roundedBox(vec2 uv, vec2 size, float radius) {
    vec2 q = abs((uv - 0.5) * size) - (size * 0.5 - radius);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }
  void main() {
    float r = 0.09 * min(uSize.x, uSize.y);
    float d = roundedBox(vUv, uSize, r);
    float edge = mix(0.004, 0.05, uBlur) * min(uSize.x, uSize.y);
    float corner = 1.0 - smoothstep(-edge, edge, d);
    float n = 0.6 * noise(vUv * 4.0 + uSeed) + 0.4 * noise(vUv * 11.0 - uSeed);
    float soft = mix(0.06, 0.25, uBlur);
    float shown = smoothstep(n - soft, n + soft, uReveal * (1.0 + 2.0 * soft) - soft);
    vec2 uv = vUv * uUvScale + uUvOffset;
    vec3 col = mix(texture2D(uMap, uv).rgb, texture2D(uBlurMap, uv).rgb, uBlur);
    gl_FragColor = vec4(col, shown * corner * uOpacity);
  }`;
// Soft drop shadow under a front card.
const SHADOW_FRAGMENT = `
  uniform float uOpacity;
  uniform vec2 uSize;
  varying vec2 vUv;
  void main() {
    vec2 q = abs((vUv - 0.5) * uSize) - uSize * 0.32;
    float d = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    float a = 1.0 - smoothstep(0.0, 0.16 * min(uSize.x, uSize.y), d);
    gl_FragColor = vec4(0.06, 0.09, 0.16, a * 0.32 * uOpacity);
  }`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildScene(THREE: any, host: HTMLDivElement, section: HTMLElement) {
  const mobile = window.innerWidth < 700;
  const slots = mobile ? MOBILE : DESKTOP;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // photos pass straight through
  renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%';
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);

  const loadPhoto = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src;
  });
  const shrink = (img: HTMLImageElement | HTMLCanvasElement, width: number, height: number) => {
    const c = document.createElement('canvas'); c.width = width; c.height = height;
    const g = c.getContext('2d')!; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, width, height);
    return c;
  };
  const texture = (canvas: HTMLCanvasElement) => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.NoColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
    return t;
  };

  // View size at a depth, for placing slots as fractions of the screen.
  const viewAt = (z: number) => {
    const h = 2 * (CAM_Z - z) * Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    return { w: h * camera.aspect, h };
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cards: any[] = [];
  let seed = 11;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  slots.forEach((slot, i) => {
    const back = slot.layer === 'back';
    const uniforms = {
      uMap: { value: null }, uBlurMap: { value: null }, uReveal: { value: 0 }, uBlur: { value: back ? 1 : 0 },
      uOpacity: { value: 1 }, uSeed: { value: rand() * 50 }, uSize: { value: new THREE.Vector2(1, 1) },
      uUvScale: { value: new THREE.Vector2(1, 1) }, uUvOffset: { value: new THREE.Vector2(0, 0) },
    };
    const card = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
      vertexShader: VERTEX, fragmentShader: CARD_FRAGMENT, uniforms, transparent: true, depthWrite: false,
    }));
    card.renderOrder = back ? 0 : 2;
    const group = new THREE.Group();
    group.add(card);
    let shadow = null;
    if (!back) {
      shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
        vertexShader: VERTEX, fragmentShader: SHADOW_FRAGMENT, transparent: true, depthWrite: false,
        uniforms: { uOpacity: { value: 0 }, uSize: { value: new THREE.Vector2(1, 1) } },
      }));
      shadow.renderOrder = 1;
      group.add(shadow);
    }
    group.visible = false;
    scene.add(group);
    const z = (back ? BACK_Z : FRONT_Z) + (rand() - 0.5) * 0.5;
    cards.push({ slot, group, card, shadow, z, delay: i * 0.09 + (back ? 0 : 0.25) });
    loadPhoto(slot.src).then((img) => {
      const sw = Math.min(1100, img.naturalWidth), sh = Math.round(sw * img.naturalHeight / img.naturalWidth);
      uniforms.uMap.value = texture(shrink(img, sw, sh));
      uniforms.uBlurMap.value = texture(shrink(shrink(img, 18, Math.max(2, Math.round(18 * sh / sw))), 256, Math.round(256 * sh / sw)));
      // Cover-crop the photo to the card's aspect.
      const imgAspect = img.naturalWidth / img.naturalHeight;
      if (imgAspect > slot.aspect) { const s = slot.aspect / imgAspect; uniforms.uUvScale.value.set(s, 1); uniforms.uUvOffset.value.set((1 - s) / 2, 0); }
      else { const s = imgAspect / slot.aspect; uniforms.uUvScale.value.set(1, s); uniforms.uUvOffset.value.set(0, (1 - s) / 2); }
      group.visible = true;
    }).catch(() => {});
  });

  const layout = () => {
    for (const c of cards) {
      const v = viewAt(c.z);
      const w = c.slot.w * v.w;
      const h = w / c.slot.aspect;
      c.base = new THREE.Vector3(c.slot.x * v.w / 2, c.slot.y * v.h / 2, c.z);
      c.card.scale.set(w, h, 1);
      c.card.material.uniforms.uSize.value.set(w, h);
      if (c.shadow) {
        c.shadow.scale.set(w * 1.25, h * 1.3, 1);
        c.shadow.position.set(w * 0.04, -h * 0.09, -0.06);
        c.shadow.material.uniforms.uSize.value.set(w * 1.25, h * 1.3);
      }
      c.group.rotation.set(0, c.slot.ry, c.slot.rz);
    }
  };
  const resize = () => {
    const w = host.clientWidth, h = host.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    layout();
  };
  window.addEventListener('resize', resize);
  resize();

  // Mouse parallax: the camera drifts with the pointer and keeps looking
  // at the centre, so front and back cards shift by different amounts.
  let px = 0, py = 0;
  const onPointer = (e: PointerEvent) => { px = (e.clientX / window.innerWidth - 0.5) * 2; py = (e.clientY / window.innerHeight - 0.5) * 2; };
  window.addEventListener('pointermove', onPointer, { passive: true });

  // Intro: cards dissolve in, staggered, once the section is well on screen.
  let introStart = -1;
  const clamp = (t: number) => Math.min(1, Math.max(0, t));
  const ease = (t: number) => t * t * (3 - 2 * t);
  let camX = 0, camY = 0, raf = 0, spread = 0;
  const clock = new THREE.Clock();
  const tick = () => {
    raf = requestAnimationFrame(tick);
    const rect = section.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > window.innerHeight) return;
    const now = clock.getElapsedTime();
    if (introStart < 0 && rect.top < window.innerHeight * 0.45) introStart = now;
    // Scroll: 0 while the section arrives, 1 once it has been scrolled through.
    const progress = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight));
    spread += (ease(progress) - spread) * 0.12;
    const sway = mobile ? 0.25 : 0.9;
    camX += (px * sway - camX) * 0.06; camY += (-py * sway * 0.6 - camY) * 0.06;
    camera.position.set(camX, camY, CAM_Z);
    camera.lookAt(0, 0, -1);
    for (const c of cards) {
      if (!c.base) continue;
      const reveal = introStart < 0 ? 0 : clamp((now - introStart - c.delay) / 1.1);
      // Disperse: out along the card's own direction from the centre and
      // towards the camera; front cards go faster, then fade.
      const back = c.slot.layer === 'back';
      const out = spread * (back ? 0.6 : 0.9);
      const dir = new THREE.Vector2(c.base.x, c.base.y).normalize();
      c.group.position.set(c.base.x * (1 + out * 0.35) + dir.x * out, c.base.y * (1 + out * 0.35) + dir.y * out, c.base.z + spread * (back ? 1.5 : 3.5));
      const fade = 1 - clamp((spread - 0.72) / 0.26);
      const u = c.card.material.uniforms;
      u.uReveal.value = reveal;
      u.uOpacity.value = fade;
      if (!back) u.uBlur.value = clamp((spread - 0.35) / 0.5);   // front cards blur as they rush past
      if (c.shadow) c.shadow.material.uniforms.uOpacity.value = reveal * fade * (1 - u.uBlur.value);
    }
    renderer.render(scene, camera);
  };
  tick();

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', onPointer);
    for (const c of cards) {
      const u = c.card.material.uniforms;
      u.uMap.value?.dispose(); u.uBlurMap.value?.dispose();
      c.card.geometry.dispose(); c.card.material.dispose();
      if (c.shadow) { c.shadow.geometry.dispose(); c.shadow.material.dispose(); }
    }
    renderer.dispose();
    renderer.domElement.remove();
  };
}
