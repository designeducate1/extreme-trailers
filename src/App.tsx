import React, { useState } from 'react';
import { SvgMaskTransitions, VariationType } from './components/SvgMaskTransitions/SvgMaskTransitions';
import { TaskManager } from './components/TaskManager/TaskManager';
import { MenuBanner } from './components/MenuBanner';
import { TrailerRangePage } from './components/TrailerRangePage';

type AppViewMode = 'svg-transitions' | 'task-manager' | 'split-view' | 'trailer-range';

export default function App() {
  const [viewMode, setViewMode] = useState<AppViewMode>('svg-transitions');
  const [activeVariation, setActiveVariation] = useState<VariationType>('horizontal-blinds');

  const handleOpenSvgShowcase = (variation: VariationType = 'horizontal-blinds') => {
    setActiveVariation(variation);
    setViewMode('svg-transitions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenTaskManager = () => {
    setViewMode(viewMode === 'task-manager' ? 'svg-transitions' : 'task-manager');
  };

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      {/* Menu Banner matching user-provided design */}
      <MenuBanner
        onHomeClick={() => {
          setViewMode('svg-transitions');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onTrailerRangeClick={() => {
          setViewMode('trailer-range');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenTaskManager={handleOpenTaskManager}
      />

      {/* Main View Router - starts with Extreme logo panel */}
      <main className="w-full">
        {viewMode === 'svg-transitions' && (
          <SvgMaskTransitions
            initialVariation={activeVariation}
            onOpenTaskManager={handleOpenTaskManager}
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
    </div>
  );
}
