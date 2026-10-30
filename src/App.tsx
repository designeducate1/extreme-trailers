import React, { useEffect, useState } from 'react';
import { SvgMaskTransitions, VariationType } from './components/SvgMaskTransitions/SvgMaskTransitions';
import { TaskManager } from './components/TaskManager/TaskManager';
import { MenuBanner } from './components/MenuBanner';
import { TrailerRangePage } from './components/TrailerRangePage';
import { TrailerBuilderPage } from './components/TrailerBuilderPage';
import { ExtremeFooter } from './components/ExtremeFooter';
import RossChat from './components/RossChat';

type AppViewMode = 'svg-transitions' | 'task-manager' | 'split-view' | 'trailer-range' | 'trailer-builder';

export default function App() {
  // ?builder opens the Trailer Builder directly (the AR QR code links a
  // phone to the same build this way); ?range opens the Trailer Range.
  const viewFromUrl = (): AppViewMode => {
    const q = new URLSearchParams(window.location.search);
    return q.has('builder') ? 'trailer-builder' : q.has('range') ? 'trailer-range' : 'svg-transitions';
  };
  const [viewMode, setViewMode] = useState<AppViewMode>(viewFromUrl);
  // Remounts the builder when Ross links to a different model or product.
  const [builderKey, setBuilderKey] = useState(0);

  useEffect(() => {
    const onPop = () => { setViewMode(viewFromUrl()); setBuilderKey((k) => k + 1); };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  // Ross's in-site links (/?builder&product=...&model=..., /?range).
  const handleRossNavigate = (href: string) => {
    window.history.pushState(null, '', href);
    setViewMode(viewFromUrl());
    setBuilderKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const [activeVariation, setActiveVariation] = useState<VariationType>('horizontal-blinds');

  const handleOpenSvgShowcase = (variation: VariationType = 'horizontal-blinds') => {
    setActiveVariation(variation);
    setViewMode('svg-transitions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTaskManager = () => {
    setViewMode(viewMode === 'task-manager' ? 'svg-transitions' : 'task-manager');
  };

  // Shared by MenuBanner's own nav item and the homepage lozenge (see
  // SvgMaskTransitions) -- same destination, same handler, so both stay
  // in sync automatically rather than each having their own copy.
  const handleGoToTrailerRange = () => {
    setViewMode('trailer-range');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFooterNav = (action: string) => {
    if (action === 'HOME') {
      setViewMode('svg-transitions');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (action === 'TRAILER RANGE') {
      setViewMode('trailer-range');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {/* Menu Banner matching user-provided design */}
      <MenuBanner
        onHomeClick={() => {
          setViewMode('svg-transitions');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onTrailerRangeClick={handleGoToTrailerRange}
        onTrailerBuilderClick={() => {
          setViewMode('trailer-builder');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenTaskManager={handleOpenTaskManager}
        currentPage={viewMode === 'svg-transitions' ? 'home' : viewMode === 'trailer-range' || viewMode === 'trailer-builder' ? viewMode : undefined}
      />

      {/* Main View Router - starts with Extreme logo panel */}
      <main className="w-full">
        {viewMode === 'svg-transitions' && (
          <SvgMaskTransitions
            initialVariation={activeVariation}
            onOpenTaskManager={handleOpenTaskManager}
            onTrailerRangeClick={handleGoToTrailerRange}
          />
        )}

        {viewMode === 'task-manager' && (
          <TaskManager onOpenSvgShowcase={handleOpenSvgShowcase} />
        )}

        {viewMode === 'trailer-range' && (
          <TrailerRangePage
            onBackHome={() => {
              setViewMode('svg-transitions');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {viewMode === 'trailer-builder' && <TrailerBuilderPage key={builderKey} />}

        {viewMode === 'split-view' && (
          <div className="grid grid-cols-1 xl:grid-cols-2 divide-y xl:divide-y-0 xl:divide-x divide-white/10 min-h-screen">
            <div className="p-4 bg-zinc-950 overflow-y-auto max-h-screen">
              <div className="mb-4 pb-2 border-b border-white/10 flex items-center justify-between">
                <span className="text-xs uppercase font-mono tracking-wider text-white/50">
                  Left Pane: Interactive Drag-and-Drop Tasks
                </span>
                <span className="text-xs text-emerald-400 font-mono">Live Sync: Active</span>
              </div>
              <TaskManager onOpenSvgShowcase={handleOpenSvgShowcase} />
            </div>

            <div className="bg-black relative overflow-y-auto max-h-screen">
              <SvgMaskTransitions
                key={activeVariation}
                initialVariation={activeVariation}
                onOpenTaskManager={handleOpenTaskManager}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer: shown on Home and Trailer Range views only */}
      {(viewMode === 'svg-transitions' || viewMode === 'trailer-range') && (
        <ExtremeFooter onNavClick={handleFooterNav} />
      )}

      {/* AI Ross chat, on every page */}
      <RossChat raised={viewMode === 'trailer-builder'} onNavigate={handleRossNavigate} />
    </div>
  );
}
