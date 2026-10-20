import React, { useState } from 'react';
import { Trailer3DViewer } from './Trailer3DViewer';
import {
  Search,
  RotateCcw,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Sliders,
  Check,
  Compass,
  Download,
  Share2,
  X,
} from 'lucide-react';

import trailer3500 from '../assets/3500srblue-ext.png';
import trailerCustomPowder from '../assets/new-powder-coat-blue.jpg';
import trailer3000 from '../assets/3000-sr.jpg';
import trailer2600 from '../assets/2600sr-blue.jpg';
import trailer1900 from '../assets/1900sr-blue.jpg';
import trailer1500 from '../assets/1500-sr.jpg';

interface PartOption {
  id: string;
  name: string;
  price: number;
  imageThumbnail?: string;
  colorHex?: string;
  gradient?: string;
}

const FINISH_CONTRASTS: PartOption[] = [
  {
    id: 'galv-iso',
    name: 'ISO Hot-Dipped Galvanised',
    price: 0,
    gradient: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
  },
  {
    id: 'stealth-black',
    name: 'Stealth Matte Marine Black',
    price: 650,
    gradient: 'linear-gradient(135deg, #1e293b 0%, #020617 100%)',
  },
];

const FINISH_SHADES: PartOption[] = [
  {
    id: 'graphite-satin',
    name: 'Graphite Satin Shield',
    price: 580,
    gradient: 'linear-gradient(135deg, #475569 0%, #1e293b 100%)',
  },
  {
    id: 'salt-primer',
    name: 'Salt-Shield Marine Primer',
    price: 450,
    gradient: 'linear-gradient(135deg, #64748b 0%, #334155 100%)',
  },
  {
    id: 'hydro-chrome',
    name: 'Titanium Hydro Silver',
    price: 890,
    gradient: 'linear-gradient(135deg, #cbd5e1 0%, #64748b 100%)',
  },
  {
    id: 'marine-pearl',
    name: 'Marine Pearl Lustre',
    price: 1067,
    gradient: 'linear-gradient(135deg, #f8fafc 0%, #94a3b8 100%)',
  },
];

const FINISH_CUSTOMS: PartOption[] = [
  {
    id: 'solent-blue',
    name: 'Solent Navy Gloss',
    price: 1704,
    gradient: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
  },
  {
    id: 'coast-orange',
    name: 'Coastguard High-Vis Orange',
    price: 1704,
    gradient: 'linear-gradient(135deg, #ea580c 0%, #9a3412 100%)',
  },
  {
    id: 'crimson-ruby',
    name: 'Bespoke Crimson Metallic',
    price: 1704,
    gradient: 'linear-gradient(135deg, #991b1b 0%, #450a0a 100%)',
  },
  {
    id: 'lime-rescue',
    name: 'Offshore Rescue Chartreuse',
    price: 1704,
    gradient: 'linear-gradient(135deg, #84cc16 0%, #3f6212 100%)',
  },
];

const AXLE_OPTIONS: PartOption[] = [
  { id: 'axle-alko', name: 'AL-KO Waterproof Torsion Axle', price: 0 },
  { id: 'axle-tandem', name: 'Tandem Braked Saltwater Axle', price: 890 },
  { id: 'axle-tri', name: 'Tri-Axle Extreme 3,500kg Heavy Haul', price: 1750 },
];

const ROLLER_OPTIONS: PartOption[] = [
  { id: 'roller-poly', name: 'Wobble Polyurethane Marine Rollers', price: 0 },
  { id: 'roller-hybrid', name: 'Bunk & Roller Centering Hybrid', price: 720 },
  { id: 'roller-air', name: 'Pneumatic Self-Centering Rib System', price: 1150 },
];

const WINCH_OPTIONS: PartOption[] = [
  { id: 'winch-manual', name: 'Dutton-Lainson 2-Speed Manual Winch', price: 0 },
  { id: 'winch-wireless', name: '12V Wireless Remote Marine Electric Winch', price: 850 },
  { id: 'winch-solar', name: 'Dual Battery & Solar Trickle Pack', price: 490 },
];

const TRAILER_VIEWS = [
  {
    id: 'view-3500',
    title: 'Extreme 3500 Super Roller (Twin Axle)',
    src: trailer3500,
    thumbnail: trailer3500,
  },
  {
    id: 'view-custom-powder',
    title: 'Stealth Powder-Coated Marine Custom',
    src: trailerCustomPowder,
    thumbnail: trailerCustomPowder,
  },
  {
    id: 'view-3000',
    title: 'Extreme 3000 Super Roller Commercial',
    src: trailer3000,
    thumbnail: trailer3000,
  },
  {
    id: 'view-2600',
    title: 'Extreme 2600 Super Roller Tandem',
    src: trailer2600,
    thumbnail: trailer2600,
  },
  {
    id: 'view-1900',
    title: 'Extreme 1900 Super Roller Heavy Duty',
    src: trailer1900,
    thumbnail: trailer1900,
  },
  {
    id: 'view-1500',
    title: 'Extreme 1500 Super Roller Fast-Tow',
    src: trailer1500,
    thumbnail: trailer1500,
  },
];

export const TrailerConfiguratorPanel: React.FC = () => {
  // Selected parts state
  const [selectedFinish, setSelectedFinish] = useState<string>('galv-iso');
  const [selectedAxle, setSelectedAxle] = useState<string>('axle-alko');
  const [selectedRoller, setSelectedRoller] = useState<string>('roller-poly');
  const [selectedWinch, setSelectedWinch] = useState<string>('winch-manual');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  // EXT750 test: open on the interactive 3D model; photo thumbnails switch back to images
  const [show3D, setShow3D] = useState<boolean>(true);

  // Accordion section collapse state
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    finish: true,
    axle: true,
    rollers: true,
    winch: false,
  });

  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [showTechModal, setShowTechModal] = useState<boolean>(false);
  const [savedNotification, setSavedNotification] = useState<boolean>(false);

  // Calculate pricing
  const basePrice = 14850;
  const finishPrice =
    [...FINISH_CONTRASTS, ...FINISH_SHADES, ...FINISH_CUSTOMS].find((p) => p.id === selectedFinish)?.price || 0;
  const axlePrice = AXLE_OPTIONS.find((p) => p.id === selectedAxle)?.price || 0;
  const rollerPrice = ROLLER_OPTIONS.find((p) => p.id === selectedRoller)?.price || 0;
  const winchPrice = WINCH_OPTIONS.find((p) => p.id === selectedWinch)?.price || 0;

  const totalPrice = basePrice + finishPrice + axlePrice + rollerPrice + winchPrice;
  const monthlyFinance = (totalPrice / 48) * 1.05;

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSaveConfig = () => {
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 3000);
  };

  return (
    <div className="w-full bg-white text-zinc-900 font-sf border-t border-zinc-200 pb-16">

      {/* Save Notification Toast */}
      {savedNotification && (
        <div className="fixed top-32 right-6 z-50 bg-emerald-600 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Trailer Configuration Saved to Marine Profile</span>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN VIEWPORT LAYOUT */}
      <div className="max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Selection of bespoke parts for the trailers */}
        <div className="lg:col-span-5 order-2 lg:order-1 flex flex-col space-y-6 lg:max-h-[82vh] lg:overflow-y-auto lg:pr-4 custom-scrollbar">
          {/* Model Title & Header Info */}
          <div className="border-b border-zinc-200 pb-5">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900">
                EXT750 Maxi Roller
              </h1>
              <span className="text-xs font-bold text-zinc-700 bg-zinc-100 px-2.5 py-0.5 rounded-full border border-zinc-200">
                2027
              </span>
            </div>
            <button
              onClick={() => setShowTechModal(true)}
              className="text-xs text-zinc-600 hover:text-black underline underline-offset-4 cursor-pointer font-medium"
            >
              Technical data and standard equipment
            </button>
          </div>

          {/* Search bespoke options bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search equipment options, winches, axles..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-zinc-400 focus:bg-white transition-all"
            />
          </div>

          {/* CATEGORY 1: Finish & Chassis Coatings (Porsche Exterior Colours styling) */}
          <div className="border-b border-zinc-200 pb-6">
            <button
              onClick={() => toggleSection('finish')}
              className="w-full flex items-center justify-between text-left py-2 group cursor-pointer"
            >
              <span className="font-bold text-base text-zinc-900 tracking-wide group-hover:text-black transition-colors">
                Chassis & Exterior Finish
              </span>
              {openSections.finish ? (
                <ChevronUp className="w-5 h-5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              )}
            </button>

            {openSections.finish && (
              <div className="pt-3 space-y-5">
                {/* Contrasts */}
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-600 mb-2.5 font-medium">
                    <span>Industrial Contrasts</span>
                    <span className="text-zinc-500">£0.00 – £650.00</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                    {FINISH_CONTRASTS.map((fin) => {
                      const isSelected = selectedFinish === fin.id;
                      return (
                        <button
                          key={fin.id}
                          onClick={() => setSelectedFinish(fin.id)}
                          title={`${fin.name} (${fin.price === 0 ? 'Included' : `+£${fin.price}`})`}
                          className={`group relative aspect-square rounded-xl p-1 border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-black ring-2 ring-black/40 scale-105'
                              : 'border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          <div
                            className="w-full h-full rounded-lg shadow-xs flex items-center justify-center"
                            style={{ background: fin.gradient }}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Shades */}
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-600 mb-2.5 font-medium">
                    <span>Performance Marine Shades</span>
                    <span className="text-zinc-500">£450.00 – £1,067.00</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                    {FINISH_SHADES.map((fin) => {
                      const isSelected = selectedFinish === fin.id;
                      return (
                        <button
                          key={fin.id}
                          onClick={() => setSelectedFinish(fin.id)}
                          title={`${fin.name} (+£${fin.price})`}
                          className={`group relative aspect-square rounded-xl p-1 border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-black ring-2 ring-black/40 scale-105'
                              : 'border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          <div
                            className="w-full h-full rounded-lg shadow-xs flex items-center justify-center"
                            style={{ background: fin.gradient }}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Customs */}
                <div>
                  <div className="flex items-center justify-between text-xs text-zinc-600 mb-2.5 font-medium">
                    <span>Bespoke Marine Fleet Colours</span>
                    <span className="text-zinc-500">£1,704.00</span>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                    {FINISH_CUSTOMS.map((fin) => {
                      const isSelected = selectedFinish === fin.id;
                      return (
                        <button
                          key={fin.id}
                          onClick={() => setSelectedFinish(fin.id)}
                          title={`${fin.name} (+£${fin.price})`}
                          className={`group relative aspect-square rounded-xl p-1 border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-black ring-2 ring-black/40 scale-105'
                              : 'border-zinc-200 hover:border-zinc-400'
                          }`}
                        >
                          <div
                            className="w-full h-full rounded-lg shadow-xs flex items-center justify-center"
                            style={{ background: fin.gradient }}
                          >
                            {isSelected && <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CATEGORY 2: Axles & Suspension */}
          <div className="border-b border-zinc-200 pb-6">
            <button
              onClick={() => toggleSection('axle')}
              className="w-full flex items-center justify-between text-left py-2 group cursor-pointer"
            >
              <span className="font-bold text-base text-zinc-900 tracking-wide group-hover:text-black transition-colors">
                Axles & Saltwater Suspension
              </span>
              {openSections.axle ? (
                <ChevronUp className="w-5 h-5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              )}
            </button>

            {openSections.axle && (
              <div className="pt-3 space-y-2.5">
                {AXLE_OPTIONS.map((axle) => {
                  const isSelected = selectedAxle === axle.id;
                  return (
                    <div
                      key={axle.id}
                      onClick={() => setSelectedAxle(axle.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-zinc-100 border-black text-black ring-1 ring-black/20 font-medium'
                          : 'bg-zinc-50/70 border-zinc-200 text-zinc-800 hover:bg-zinc-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-black bg-black' : 'border-zinc-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs sm:text-sm">{axle.name}</span>
                      </div>
                      <span className="text-xs font-bold text-zinc-600">
                        {axle.price === 0 ? 'Included' : `+£${axle.price.toLocaleString()}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CATEGORY 3: Rollers & Bunk Systems */}
          <div className="border-b border-zinc-200 pb-6">
            <button
              onClick={() => toggleSection('rollers')}
              className="w-full flex items-center justify-between text-left py-2 group cursor-pointer"
            >
              <span className="font-bold text-base text-zinc-900 tracking-wide group-hover:text-black transition-colors">
                Rollers & Vessel Hull Support
              </span>
              {openSections.rollers ? (
                <ChevronUp className="w-5 h-5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              )}
            </button>

            {openSections.rollers && (
              <div className="pt-3 space-y-2.5">
                {ROLLER_OPTIONS.map((roller) => {
                  const isSelected = selectedRoller === roller.id;
                  return (
                    <div
                      key={roller.id}
                      onClick={() => setSelectedRoller(roller.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-zinc-100 border-black text-black ring-1 ring-black/20 font-medium'
                          : 'bg-zinc-50/70 border-zinc-200 text-zinc-800 hover:bg-zinc-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-black bg-black' : 'border-zinc-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs sm:text-sm">{roller.name}</span>
                      </div>
                      <span className="text-xs font-bold text-zinc-600">
                        {roller.price === 0 ? 'Included' : `+£${roller.price.toLocaleString()}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* CATEGORY 4: Winch & Launch Recovery */}
          <div className="border-b border-zinc-200 pb-6">
            <button
              onClick={() => toggleSection('winch')}
              className="w-full flex items-center justify-between text-left py-2 group cursor-pointer"
            >
              <span className="font-bold text-base text-zinc-900 tracking-wide group-hover:text-black transition-colors">
                Recovery Winch & Marine Electrics
              </span>
              {openSections.winch ? (
                <ChevronUp className="w-5 h-5 text-zinc-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-zinc-400" />
              )}
            </button>

            {openSections.winch && (
              <div className="pt-3 space-y-2.5">
                {WINCH_OPTIONS.map((winch) => {
                  const isSelected = selectedWinch === winch.id;
                  return (
                    <div
                      key={winch.id}
                      onClick={() => setSelectedWinch(winch.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-zinc-100 border-black text-black ring-1 ring-black/20 font-medium'
                          : 'bg-zinc-50/70 border-zinc-200 text-zinc-800 hover:bg-zinc-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-black bg-black' : 'border-zinc-300'
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                        <span className="text-xs sm:text-sm">{winch.name}</span>
                      </div>
                      <span className="text-xs font-bold text-zinc-600">
                        {winch.price === 0 ? 'Included' : `+£${winch.price.toLocaleString()}`}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Right window has an image of the trailer */}
        <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col space-y-4">
          {/* Main Visualizer Window */}
          <div className="relative aspect-[4/3.6] sm:aspect-[16/9.5] w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-b from-white to-zinc-100 border border-zinc-200 shadow-xl group flex items-center justify-center p-4 sm:p-8">
            {/* Trailer: interactive 3D model, or photo */}
            {show3D ? (
              <Trailer3DViewer finishId={selectedFinish} />
            ) : (
              <img
                src={TRAILER_VIEWS[activeImageIndex].src}
                alt={TRAILER_VIEWS[activeImageIndex].title}
                className="w-full h-full object-contain filter drop-shadow-[0_12px_24px_rgba(0,0,0,0.12)] transition-transform duration-700 group-hover:scale-[1.03]"
              />
            )}

            {/* Active Spec Badge */}
            <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-zinc-200 text-xs font-semibold text-zinc-900 flex items-center gap-2 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{show3D ? 'EXT750 Maxi Roller · Interactive 3D' : TRAILER_VIEWS[activeImageIndex].title}</span>
            </div>

            {/* Overlaid View Controls (Porsche screenshot style: Adjust scene, Compare, 360 View, Download) */}
            <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-2">
              <div className="bg-white/90 backdrop-blur-md border border-zinc-200 rounded-xl p-1 flex items-center gap-1 shadow-md">
                <button
                  onClick={() => {
                    setShow3D(false);
                    setActiveImageIndex((prev) => (prev + 1) % TRAILER_VIEWS.length);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-800 hover:text-black hover:bg-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-zinc-700" />
                  <span className="hidden sm:inline">Cycle model</span>
                </button>
                <div className="h-3 w-[1px] bg-zinc-300" />
                <button
                  onClick={() => setShowTechModal(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-800 hover:text-black hover:bg-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-zinc-700" />
                  <span className="hidden sm:inline">Compare</span>
                </button>
                <div className="h-3 w-[1px] bg-zinc-300" />
                <button
                  onClick={() => setShow3D(true)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-800 hover:text-black hover:bg-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-zinc-700" />
                  <span className="hidden sm:inline">360° View</span>
                </button>
              </div>

              <div className="bg-white/90 backdrop-blur-md border border-zinc-200 rounded-xl p-1 flex items-center gap-1 shadow-md">
                <button
                  onClick={() => setShowSummaryModal(true)}
                  className="p-1.5 rounded-lg text-zinc-700 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
                  title="Download Spec Sheet"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowSummaryModal(true)}
                  className="p-1.5 rounded-lg text-zinc-700 hover:text-black hover:bg-zinc-100 transition-colors cursor-pointer"
                  title="Full View"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Thumbnails Strip (Porsche screenshot style: preview tiles) */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-1">
            <button
              onClick={() => setShow3D(true)}
              className={`aspect-[16/10] rounded-xl overflow-hidden border p-1 bg-zinc-900 text-white transition-all cursor-pointer flex flex-col items-center justify-center ${
                show3D ? 'border-black ring-2 ring-black/40 scale-[1.03] shadow-md' : 'border-zinc-200 opacity-75 hover:opacity-100'
              }`}
            >
              <span className="text-sm sm:text-base font-extrabold leading-none">3D</span>
              <span className="text-[9px] sm:text-[10px] opacity-70">EXT750</span>
            </button>
            {TRAILER_VIEWS.map((view, idx) => {
              const isActive = !show3D && activeImageIndex === idx;
              return (
                <button
                  key={view.id}
                  onClick={() => {
                    setShow3D(false);
                    setActiveImageIndex(idx);
                  }}
                  className={`aspect-[16/10] rounded-xl overflow-hidden border p-1 bg-white transition-all cursor-pointer relative flex items-center justify-center ${
                    isActive
                      ? 'border-black ring-2 ring-black/40 scale-[1.03] shadow-md'
                      : 'border-zinc-200 opacity-75 hover:opacity-100 hover:border-zinc-400'
                  }`}
                >
                  <img src={view.thumbnail} alt={view.title} className="w-full h-full object-contain" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* MODAL 1: Specification Summary (Porsche style) */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 text-zinc-900 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-5">
              <div>
                <h3 className="text-xl font-bold text-black">Bespoke Trailer Specification</h3>
                <p className="text-xs text-zinc-500">Extreme EXT750 Maxi Roller · 2027 Model</p>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm mb-6 max-h-[50vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Base Chassis Platform</span>
                <span className="font-semibold text-zinc-900">£{basePrice.toLocaleString()}.00</span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Selected Finish</span>
                <span className="font-semibold text-zinc-900">
                  {[...FINISH_CONTRASTS, ...FINISH_SHADES, ...FINISH_CUSTOMS].find((f) => f.id === selectedFinish)?.name} (+£{finishPrice})
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Axle Configuration</span>
                <span className="font-semibold text-zinc-900">
                  {AXLE_OPTIONS.find((a) => a.id === selectedAxle)?.name} (+£{axlePrice})
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Vessel Roller Setup</span>
                <span className="font-semibold text-zinc-900">
                  {ROLLER_OPTIONS.find((r) => r.id === selectedRoller)?.name} (+£{rollerPrice})
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-zinc-100">
                <span className="text-zinc-500">Recovery Winch System</span>
                <span className="font-semibold text-zinc-900">
                  {WINCH_OPTIONS.find((w) => w.id === selectedWinch)?.name} (+£{winchPrice})
                </span>
              </div>
              <div className="flex justify-between py-3 border-t border-zinc-200 text-base font-bold text-black">
                <span>Total On-The-Road Price (inc. VAT)</span>
                <span>£{totalPrice.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  alert('Spec PDF ready for export!');
                  setShowSummaryModal(false);
                }}
                className="flex-1 py-3 rounded-xl bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
              >
                Download PDF Build Sheet
              </button>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="px-5 py-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-semibold text-zinc-900 cursor-pointer border border-zinc-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Technical Data & Standard Equipment */}
      {showTechModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-md">
          <div className="w-full max-w-xl bg-white border border-zinc-200 rounded-3xl p-6 sm:p-8 text-zinc-900 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 mb-5">
              <div>
                <h3 className="text-lg font-bold text-black">Standard Marine Equipment</h3>
                <p className="text-xs text-zinc-500">British ISO 1461 Certified Engineering</p>
              </div>
              <button
                onClick={() => setShowTechModal(false)}
                className="p-2 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-black cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs mb-6">
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-500 block text-[10px] uppercase font-medium">Gross Weight</span>
                <span className="font-bold text-zinc-900 text-sm">3,500 kg</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-500 block text-[10px] uppercase font-medium">Unladen Weight</span>
                <span className="font-bold text-zinc-900 text-sm">620 kg</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-500 block text-[10px] uppercase font-medium">Max Vessel Length</span>
                <span className="font-bold text-zinc-900 text-sm">8.50 Metres</span>
              </div>
              <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                <span className="text-zinc-500 block text-[10px] uppercase font-medium">Bearings</span>
                <span className="font-bold text-zinc-900 text-sm">Waterproof AL-KO Sealed</span>
              </div>
            </div>

            <button
              onClick={() => setShowTechModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-xs font-bold text-zinc-900 transition-colors cursor-pointer border border-zinc-200"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrailerConfiguratorPanel;
