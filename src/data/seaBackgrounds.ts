/**
 * High-fidelity marine ocean & sea scenes for the parallax header
 * Completely self-contained vector artworks with 0% network failure risk
 */

function createSvgDataUri(svgString: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgString.trim())}`;
}

// Layer 1: Distant Ocean Horizon, Atmospheric Maritime Sky & Sea Reflection
export const seaSkyLayer = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1200" width="100%" height="100%">
  <defs>
    <!-- Sky Gradient -->
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#050e1c"/>
      <stop offset="30%" stop-color="#0a1f3d"/>
      <stop offset="55%" stop-color="#143b6e"/>
      <stop offset="70%" stop-color="#245a99"/>
      <stop offset="85%" stop-color="#467bb5"/>
      <stop offset="100%" stop-color="#7da6d1"/>
    </linearGradient>

    <!-- Deep Ocean Water Gradient -->
    <linearGradient id="seaDeep" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#19477d"/>
      <stop offset="20%" stop-color="#123561"/>
      <stop offset="50%" stop-color="#0b2447"/>
      <stop offset="80%" stop-color="#071830"/>
      <stop offset="100%" stop-color="#030b17"/>
    </linearGradient>

    <!-- Horizon Sun / Glow Shimmer -->
    <radialGradient id="sunGlow" cx="50%" cy="58%" r="40%">
      <stop offset="0%" stop-color="#d4e8fc" stop-opacity="0.8"/>
      <stop offset="25%" stop-color="#73a9e0" stop-opacity="0.45"/>
      <stop offset="60%" stop-color="#1e528e" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#0a1f3d" stop-opacity="0"/>
    </radialGradient>

    <!-- Water specular sheen -->
    <linearGradient id="shimmerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#eaf4ff" stop-opacity="0.6"/>
      <stop offset="15%" stop-color="#93c5fd" stop-opacity="0.3"/>
      <stop offset="60%" stop-color="#38bdf8" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#0284c7" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Sky Background -->
  <rect width="1920" height="700" fill="url(#skyGrad)"/>
  
  <!-- Coastal Atmospheric Clouds -->
  <g opacity="0.35">
    <ellipse cx="380" cy="380" rx="460" ry="80" fill="#2d578b" filter="blur(30px)"/>
    <ellipse cx="960" cy="420" rx="600" ry="70" fill="#4a79b0" filter="blur(25px)"/>
    <ellipse cx="1540" cy="360" rx="420" ry="75" fill="#2d578b" filter="blur(30px)"/>
    <ellipse cx="960" cy="460" rx="350" ry="40" fill="#8cb9e6" filter="blur(15px)"/>
  </g>

  <!-- Horizon Ambient Flare -->
  <rect y="200" width="1920" height="600" fill="url(#sunGlow)"/>

  <!-- Distant Headland / Coastal Islands (Low on Horizon) -->
  <path d="M0,660 Q240,640 480,658 Q720,650 960,660 L960,670 L0,670 Z" fill="#0c1f38" opacity="0.6"/>
  <path d="M1200,662 Q1440,646 1680,656 Q1820,652 1920,660 L1920,670 L1200,670 Z" fill="#0c1f38" opacity="0.6"/>

  <!-- Crisp Sea Horizon Line -->
  <line x1="0" y1="660" x2="1920" y2="660" stroke="#a5cbf5" stroke-width="2" opacity="0.8"/>

  <!-- Sea Plane (Deep Water Body) -->
  <rect y="660" width="1920" height="540" fill="url(#seaDeep)"/>

  <!-- Distant Ocean Waves & Horizon Swells -->
  <g opacity="0.65">
    <path d="M0,672 Q240,666 480,672 T960,672 T1440,672 T1920,672" stroke="#60a5fa" stroke-width="2" fill="none"/>
    <path d="M0,688 Q180,682 360,688 T720,688 T1080,688 T1440,688 T1800,688 T1920,688" stroke="#3b82f6" stroke-width="2.5" fill="none"/>
    <path d="M0,708 Q240,700 480,708 T960,708 T1440,708 T1920,708" stroke="#60a5fa" stroke-width="2.5" fill="none"/>
    <path d="M0,732 Q200,724 400,732 T800,732 T1200,732 T1600,732 T1920,732" stroke="#2563eb" stroke-width="3" fill="none"/>
    <path d="M0,760 Q260,750 520,760 T1040,760 T1560,760 T1920,760" stroke="#1d4ed8" stroke-width="3.5" fill="none"/>
    <path d="M0,792 Q220,780 440,792 T880,792 T1320,792 T1760,792 T1920,792" stroke="#3b82f6" stroke-width="4" fill="none" opacity="0.7"/>
    <path d="M0,830 Q280,816 560,830 T1120,830 T1680,830 T1920,830" stroke="#1e40af" stroke-width="4" fill="none"/>
    <path d="M0,875 Q240,860 480,875 T960,875 T1440,875 T1920,875" stroke="#2563eb" stroke-width="5" fill="none" opacity="0.8"/>
  </g>

  <!-- Horizon Light Shimmer Column on Water -->
  <polygon points="960,660 760,1200 1160,1200" fill="url(#shimmerGrad)"/>
  
  <!-- Subtle Sea Texture Highlights -->
  <g stroke="#ffffff" stroke-width="1.5" opacity="0.4" stroke-linecap="round">
    <line x1="880" y1="675" x2="1040" y2="675"/>
    <line x1="820" y1="695" x2="1100" y2="695"/>
    <line x1="780" y1="720" x2="1140" y2="720"/>
    <line x1="720" y1="750" x2="1200" y2="750"/>
    <line x1="680" y1="785" x2="1240" y2="785"/>
    <line x1="620" y1="830" x2="1300" y2="830"/>
  </g>
</svg>
`);

// Layer 2: Midground Rolling Ocean Waves, Foaming Crests & Rolling Marine Swell
export const seaWavesLayer = createSvgDataUri(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1200" width="100%" height="100%">
  <defs>
    <!-- Swell Wave Gradient 1 -->
    <linearGradient id="waveBody1" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#1e40af"/>
      <stop offset="30%" stop-color="#172554"/>
      <stop offset="100%" stop-color="#0a1122"/>
    </linearGradient>

    <!-- Swell Wave Gradient 2 -->
    <linearGradient id="waveBody2" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#2563eb"/>
      <stop offset="25%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#090e1c"/>
    </linearGradient>

    <!-- Foam Highlight Gradient -->
    <linearGradient id="foamWhite" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="#e0f2fe" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#bae6fd" stop-opacity="0.8"/>
    </linearGradient>
  </defs>

  <!-- Midground Rolling Ocean Swell Tier 1 (Background swell) -->
  <path d="M0,640 Q220,580 440,630 T880,620 T1320,635 T1760,615 T1920,630 L1920,1200 L0,1200 Z" fill="url(#waveBody1)" opacity="0.85"/>
  <path d="M0,640 Q220,580 440,630 T880,620 T1320,635 T1760,615 T1920,630" stroke="url(#foamWhite)" stroke-width="4" fill="none" opacity="0.8"/>

  <!-- Midground Wave Swell Tier 2 (Main rolling wave body) -->
  <path d="M0,710 Q180,650 380,700 Q580,740 780,680 Q980,630 1180,690 Q1380,730 1580,670 Q1780,630 1920,680 L1920,1200 L0,1200 Z" fill="url(#waveBody2)"/>
  
  <!-- Wave Crest Foam Lines & Whitecaps -->
  <path d="M0,710 Q180,650 380,700 Q580,740 780,680 Q980,630 1180,690 Q1380,730 1580,670 Q1780,630 1920,680" stroke="#ffffff" stroke-width="5" fill="none"/>
  
  <!-- Secondary Froth & Wave Curl Textures -->
  <g stroke="#bae6fd" stroke-width="2.5" opacity="0.65" stroke-linecap="round">
    <!-- Wave 1 Foam Ribs -->
    <path d="M120,680 Q160,700 200,690" fill="none"/>
    <path d="M260,690 Q300,715 350,705" fill="none"/>
    <path d="M720,670 Q760,695 820,685" fill="none"/>
    <path d="M920,650 Q960,675 1020,665" fill="none"/>
    <path d="M1120,675 Q1160,700 1220,690" fill="none"/>
    <path d="M1520,660 Q1560,685 1620,675" fill="none"/>
  </g>

  <!-- Powerful Foreground Sea Roller (Tier 3) -->
  <path d="M0,790 Q260,720 520,780 Q780,820 1040,750 Q1300,700 1560,770 Q1800,810 1920,760 L1920,1200 L0,1200 Z" fill="#0f1f3d" opacity="0.95"/>
  <path d="M0,790 Q260,720 520,780 Q780,820 1040,750 Q1300,700 1560,770 Q1800,810 1920,760" stroke="#ffffff" stroke-width="7" fill="none"/>
  
  <!-- Heavy Spray & Spindrift Froth -->
  <g fill="#ffffff" opacity="0.75">
    <ellipse cx="480" cy="765" rx="60" ry="8"/>
    <ellipse cx="530" cy="775" rx="45" ry="6"/>
    <ellipse cx="1020" cy="740" rx="80" ry="10"/>
    <ellipse cx="1080" cy="750" rx="60" ry="7"/>
    <ellipse cx="1520" cy="755" rx="75" ry="9"/>
    <ellipse cx="1580" cy="765" rx="50" ry="6"/>
  </g>

  <!-- Deep Ocean Surf Swell (Tier 4) -->
  <path d="M0,910 Q240,840 480,890 Q720,930 960,860 Q1200,810 1440,880 Q1680,920 1920,870 L1920,1200 L0,1200 Z" fill="#070d1a"/>
  <path d="M0,910 Q240,840 480,890 Q720,930 960,860 Q1200,810 1440,880 Q1680,920 1920,870" stroke="#93c5fd" stroke-width="6" fill="none" opacity="0.9"/>

  <!-- Foreground Deep Water Bed (Blends into black stage) -->
  <rect y="980" width="1920" height="220" fill="#000000" opacity="0.9"/>
</svg>
`);
