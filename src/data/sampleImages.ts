/**
 * Curated high-fidelity fine art & architectural SVG imagery
 * Crisp vector artworks that load instantaneously with zero external network dependencies
 */

function createSvgDataUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

export interface TransitionImage {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  src: string;
  alt: string;
}

// 0. User provided sunset beach background
const img0 = 'https://i.postimg.cc/Y2vmZg5N/image-20261002-102200-replace-with-incredible-sunset-over-a-beach-with-e-remove-the-logo-and-trailer.jpg';

// 1. User provided image 1 (Extreme Performance - First beach scene)
const img1 = 'https://i.postimg.cc/Yq0zndqt/First-beach-scene.jpg';

// 2. User provided image 2
const img2 = 'https://i.postimg.cc/k4mqWtQ2/Gemini-Generated-Image-oav590oav590oav5.jpg';

// 3. User provided image 3 (River Mastery - Lake scene)
const img3 = 'https://i.postimg.cc/FK470sKj/Lake-scene.jpg';

// 4. Curated Spiral Gallery Skylight
const img4 = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <radialGradient id="skylight" cx="50%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#eed8ba" stop-opacity="0.9"/>
      <stop offset="25%" stop-color="#6e5b4b" stop-opacity="0.6"/>
      <stop offset="70%" stop-color="#241d1a" stop-opacity="0.9"/>
      <stop offset="100%" stop-color="#120e0d"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#skylight)"/>
  <!-- Concentric spiral rings -->
  <circle cx="960" cy="380" r="140" fill="none" stroke="#f7e8d5" stroke-width="12" opacity="0.8"/>
  <circle cx="960" cy="380" r="280" fill="none" stroke="#c4ab93" stroke-width="16" opacity="0.6"/>
  <circle cx="960" cy="380" r="440" fill="none" stroke="#756252" stroke-width="22" opacity="0.45"/>
  <circle cx="960" cy="380" r="620" fill="none" stroke="#473a30" stroke-width="30" opacity="0.3"/>
  <!-- Balustrade angles -->
  <polygon points="200,1080 720,680 820,740 380,1080" fill="#382e27"/>
  <polygon points="1720,1080 1200,680 1100,740 1540,1080" fill="#2d241e"/>
</svg>
`);

// 5. Brutalist Geometric Light Corridor
const img5 = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="corridor" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#17191d"/>
      <stop offset="100%" stop-color="#2a2e36"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#corridor)"/>
  <!-- Light beams -->
  <polygon points="960,180 1140,180 1480,1080 1200,1080" fill="#fff5e6" opacity="0.18"/>
  <polygon points="960,180 1020,180 1180,1080 1100,1080" fill="#fff5e6" opacity="0.25"/>
  <!-- Stepped ceiling -->
  <polygon points="0,0 1920,0 1920,240 1480,240 1480,160 960,160 960,80 0,80" fill="#111317"/>
  <!-- Floor grid -->
  <line x1="960" y1="520" x2="200" y2="1080" stroke="#484f5c" stroke-width="2" opacity="0.5"/>
  <line x1="960" y1="520" x2="600" y2="1080" stroke="#484f5c" stroke-width="2" opacity="0.5"/>
  <line x1="960" y1="520" x2="960" y2="1080" stroke="#484f5c" stroke-width="2" opacity="0.5"/>
  <line x1="960" y1="520" x2="1320" y2="1080" stroke="#484f5c" stroke-width="2" opacity="0.5"/>
  <line x1="960" y1="520" x2="1720" y2="1080" stroke="#484f5c" stroke-width="2" opacity="0.5"/>
</svg>
`);

// 6. Sculptural Monolith in Alpine Twilight
const img6 = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="100%" height="100%">
  <defs>
    <linearGradient id="twilight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1b1c2b"/>
      <stop offset="50%" stop-color="#322c3e"/>
      <stop offset="100%" stop-color="#14131a"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="1080" fill="url(#twilight)"/>
  <!-- Mountain ridges -->
  <polygon points="0,780 420,490 890,740 1340,410 1920,680 1920,1080 0,1080" fill="#24212c"/>
  <polygon points="0,880 540,660 1120,840 1680,620 1920,790 1920,1080 0,1080" fill="#181620"/>
  <!-- Standing stone slab -->
  <polygon points="880,1080 920,310 1040,290 1080,1080" fill="#4d445c"/>
  <line x1="1040" y1="290" x2="1080" y2="1080" stroke="#8775a3" stroke-width="2" opacity="0.6"/>
</svg>
`);

export const variationsData: Record<
  string,
  {
    name: string;
    label: string;
    tagline: string;
    subheading: string;
    scrollInstructions: string;
    images: TransitionImage[];
  }
> = {
  'horizontal-blinds': {
    name: 'Marine Range',
    label: '01 — Marine Range',
    tagline: 'Extreme Marine Trailers',
    subheading: 'British Marine Engineering',
    scrollInstructions: '',
    images: [
      {
        id: 1,
        title: 'EXTREME\nTRAILERS',
        subtitle: 'Boat & RIB Trailers, Built in Southampton',
        description:
          'Precision British engineered boat trailers designed for effortless highway towing and swift slipway launch operations.',
        src: img1,
        alt: 'Commercial & Rib Heavy Duty Trailer',
      },
      {
        id: 2,
        title: 'GALVANISED\nTRAILERS',
        subtitle: 'Hot-Dipped Galvanised to ISO 1461',
        description:
          'Every trailer chassis hot-dipped galvanised to British ISO 1461 standards, featuring waterproof submersible LED systems.',
        src: img2,
        alt: 'Bunk & Roller Super Heavyweight Trailer',
      },
      {
        id: 3,
        title: 'SALTWATER\nTRAILERS',
        subtitle: 'Marine-Grade Axles for RIBs & PWC',
        description:
          'Sealed waterproof bearings with stainless steel brake cables, engineered specifically for harsh saltwater launch conditions.',
        src: img3,
        alt: 'Boat & Rib River Marine Launch Trailer',
      },
    ],
  },
  'random-grid': {
    name: 'Random Grid',
    label: '02 — Random Grid',
    tagline: 'On-Scroll SVG Mask Transitions',
    subheading: '(Random Grid)',
    scrollInstructions: 'Scroll down to witness randomized matrix reveals',
    images: [
      {
        id: 4,
        title: 'FIRST\nIMAGE',
        subtitle: 'Section transition',
        description:
          '画像を複数のグリッド状のセルでマスクし、スクロールに連動してセルがランダムに開いていくことで、次の画像へ滑らかに切り替わるトランジションです。',
        src: img4,
        alt: 'Curated Spiral Gallery Skylight',
      },
      {
        id: 5,
        title: 'SECOND\nIMAGE',
        subtitle: 'Section transition',
        description:
          '画像を複数のグリッド状のセルでマスクし、スクロールに連動してセルがランダムに開いていくことで、次の画像へ滑らかに切り替わるトランジションです。',
        src: img5,
        alt: 'Brutalist Geometric Light Corridor',
      },
      {
        id: 6,
        title: 'THIRD\nIMAGE',
        subtitle: 'Section transition',
        description:
          '画像を複数のグリッド状のセルでマスクし、スクロールに連動してセルがランダムに開いていくことで、次の画像へ滑らかに切り替わるトランジションです。',
        src: img6,
        alt: 'Sculptural Monolith in Alpine Twilight',
      },
    ],
  },
  'vertical-blinds': {
    name: 'Vertical Blinds',
    label: '03 — Vertical Blinds',
    tagline: 'On-Scroll SVG Mask Transitions',
    subheading: '(Vertical Blinds)',
    scrollInstructions: 'Scroll down to expand vertical architectural louvers',
    images: [
      {
        id: 7,
        title: 'FIRST\nIMAGE',
        subtitle: 'Section transition',
        description:
          '画像を複数の縦長の矩形でマスクし、スクロールに連動して矩形が順番に開くことで、次の画像へ滑らかに切り替わるトランジションです。',
        src: img3,
        alt: 'Water Pavilion at Dawn',
      },
      {
        id: 8,
        title: 'SECOND\nIMAGE',
        subtitle: 'Section transition',
        description:
          '画像を複数の縦長の矩形でマスクし、スクロールに連動して矩形が順番に開くことで、次の画像へ滑らかに切り替わるトランジションです。',
        src: img1,
        alt: 'Concrete Facade Shadows',
      },
      {
        id: 9,
        title: 'THIRD\nIMAGE',
        subtitle: 'Section transition',
        description:
          '画像を複数の縦長の矩形でマスクし、スクロールに連動して矩形が順番に開くことで、次の画像へ滑らかに切り替わるトランジションです。',
        src: img4,
        alt: 'Spiral Gallery Horizon',
      },
    ],
  },
  'column-grid': {
    name: 'Column Grid',
    label: '04 — Column Grid',
    tagline: 'On-Scroll SVG Mask Transitions',
    subheading: '(Column Grid)',
    scrollInstructions: 'Scroll down for directional column staggered progression',
    images: [
      {
        id: 10,
        title: 'FIRST\nIMAGE',
        subtitle: 'Section transition',
        description:
          '画像をグリッド状のセルでマスクし、スクロールに連動して左から右へ開いていくことで、次の画像へ滑らかに切り替わるトランジションです。',
        src: img2,
        alt: 'Desert Monolith Series',
      },
      {
        id: 11,
        title: 'SECOND\nIMAGE',
        subtitle: 'Section transition',
        description:
          '画像をグリッド状のセルでマスクし、スクロールに連動して左から右へ開いていくことで、次の画像へ滑らかに切り替わるトランジションです。',
        src: img5,
        alt: 'Architectural Shadowplay',
      },
      {
        id: 12,
        title: 'THIRD\nIMAGE',
        subtitle: 'Section transition',
        description:
          '画像をグリッド状のセルでマスクし、スクロールに連動して左から右へ開いていくことで、次の画像へ滑らかに切り替わるトランジションです。',
        src: img6,
        alt: 'Monolithic Twilight Realm',
      },
    ],
  },
};
