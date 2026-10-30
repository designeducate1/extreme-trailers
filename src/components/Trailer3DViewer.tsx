import React, { useEffect, useRef, useState } from 'react';

// Interactive 3D view of the EXT750 Maxi Roller, built in Blender and
// exported to public/models/ext750-maxi-roller.glb. Uses Google's
// <model-viewer> web component (loaded in index.html).
//
// Each part was named in Blender (Frame, Winch, WobbleRollers, ...), so
// the camera can be sent to a part by name -- this is the hook for the
// future Ultravox "Ross" assistant ("show me the winch").

export type TrailerPart = 'overview' | 'winch' | 'rollers' | 'wheels' | 'jockey' | 'lights';

// camera-orbit = "angle-round  angle-down  distance"; camera-target = x y z (metres)
export const PART_VIEWS: Record<TrailerPart, { label: string; orbit: string; target: string }> = {
  overview: { label: 'Overview', orbit: '-40deg 65deg auto', target: 'auto auto auto' },
  winch: { label: 'Winch', orbit: '30deg 60deg 2.4m', target: '0m 0.75m -1.6m' },
  rollers: { label: 'Wobble rollers', orbit: '45deg 52deg 3.4m', target: '0.3m 0.5m 0.4m' },
  wheels: { label: 'Wheel & axle', orbit: '95deg 78deg 1.8m', target: '0.7m 0.25m 0m' },
  jockey: { label: 'Jockey wheel', orbit: '150deg 70deg 1.6m', target: '0.1m 0.45m -2.1m' },
  lights: { label: 'Light board', orbit: '0deg 80deg 2.4m', target: '0m 0.65m 2.1m' },
};

// Frame colour for each finish swatch in the configurator.
const FINISH_COLOURS: Record<string, { hex: string; metal: number; rough: number }> = {
  'galv-iso': { hex: '#b9bfc4', metal: 1, rough: 0.42 },
  'stealth-black': { hex: '#14181f', metal: 0.2, rough: 0.7 },
  'graphite-satin': { hex: '#3b4655', metal: 0.4, rough: 0.45 },
  'salt-primer': { hex: '#55606f', metal: 0.1, rough: 0.6 },
  'hydro-chrome': { hex: '#aab4c0', metal: 1, rough: 0.2 },
  'marine-pearl': { hex: '#e3e8ee', metal: 0.3, rough: 0.3 },
  'solent-blue': { hex: '#1e3a8a', metal: 0.3, rough: 0.3 },
  'coast-orange': { hex: '#ea580c', metal: 0.2, rough: 0.35 },
  'crimson-ruby': { hex: '#991b1b', metal: 0.5, rough: 0.3 },
  'lime-rescue': { hex: '#65a30d', metal: 0.2, rough: 0.35 },
};

interface Props {
  finishId: string;
  focus?: TrailerPart;
}

export const Trailer3DViewer: React.FC<Props> = ({ finishId, focus: focusProp }) => {
  const ref = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [focus, setFocus] = useState<TrailerPart>(focusProp ?? 'overview');

  useEffect(() => {
    if (focusProp) setFocus(focusProp);
  }, [focusProp]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onLoad = () => setLoaded(true);
    el.addEventListener('load', onLoad);
    return () => el.removeEventListener('load', onLoad);
  }, []);

  // Repaint the frame whenever the finish changes.
  useEffect(() => {
    const el = ref.current;
    if (!loaded || !el?.model) return;
    const f = FINISH_COLOURS[finishId] ?? FINISH_COLOURS['galv-iso'];
    const m = el.model.getMaterialByName('Frame_Galvanised');
    if (!m) return;
    m.pbrMetallicRoughness.setBaseColorFactor(f.hex);
    m.pbrMetallicRoughness.setMetallicFactor(f.metal);
    m.pbrMetallicRoughness.setRoughnessFactor(f.rough);
  }, [finishId, loaded]);

  // Fly the camera to the chosen part.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const v = PART_VIEWS[focus];
    el.cameraOrbit = v.orbit;
    el.cameraTarget = v.target;
    el.autoRotate = focus === 'overview';
  }, [focus, loaded]);

  return (
    <div className="absolute inset-0">
      {React.createElement('model-viewer', {
        ref,
        src: '/models/ext750-maxi-roller.glb',
        alt: '3D model of the Extreme EXT750 Maxi Roller boat trailer',
        'camera-controls': '',
        'auto-rotate': '',
        'auto-rotate-delay': '1500',
        'rotation-per-second': '12deg',
        'interaction-prompt': 'auto',
        'shadow-intensity': '1',
        'shadow-softness': '0.8',
        exposure: '1.1',
        'environment-image': 'neutral',
        'camera-orbit': PART_VIEWS.overview.orbit,
        'min-camera-orbit': 'auto 10deg 0.9m',
        'max-camera-orbit': 'auto 92deg 9m',
        'min-field-of-view': '18deg',
        'interpolation-decay': '120',
        style: { width: '100%', height: '100%', background: 'transparent', '--poster-color': 'transparent' },
      })}

      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-zinc-500 pointer-events-none">
          Loading 3D trailer…
        </div>
      )}

      {/* Part shortcuts (also the hook for the Ross voice assistant) */}
      <div className="absolute top-14 left-4 right-4 z-10 flex flex-nowrap sm:flex-wrap gap-1.5 overflow-x-auto pr-6 sm:pr-0 [mask-image:linear-gradient(to_right,black_82%,transparent)] sm:[mask-image:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {(Object.keys(PART_VIEWS) as TrailerPart[]).map((p) => (
          <button
            key={p}
            onClick={() => setFocus(p)}
            className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors cursor-pointer ${
              focus === p
                ? 'bg-black text-white border-black'
                : 'bg-white/90 text-zinc-800 border-zinc-200 hover:border-zinc-400'
            }`}
          >
            {PART_VIEWS[p].label}
          </button>
        ))}
      </div>
    </div>
  );
};
