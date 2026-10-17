import React from 'react';
import { ActivityEvent } from '../../types/task';
import { Radio } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityEvent[];
  isLiveConnected: boolean;
  onSimulatePeer: () => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  isLiveConnected,
  onSimulatePeer,
}) => {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-xs">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
            Real-Time Collaboration Feed
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-zinc-400">·</span>
          <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            <Radio className="w-3 h-3 animate-pulse" />
            {isLiveConnected ? 'Multi-Tab Synced' : 'Local Channel'}
          </span>
        </div>

        <button
          onClick={onSimulatePeer}
          title="Simulate a remote teammate event"
          className="text-xs px-2.5 py-1 rounded-md bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 transition-colors font-medium"
        >
          Simulate Teammate Action
        </button>
      </div>

      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {activities.map((act) => (
          <div
            key={act.id}
            className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-zinc-300"
          >
            <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
              {act.userAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="leading-snug">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {act.userName}
                </span>{' '}
                <span className="text-slate-500 dark:text-zinc-400">{act.action}</span>{' '}
                <span className="font-medium text-slate-800 dark:text-zinc-200 truncate">
                  "{act.targetTask}"
                </span>
              </p>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 tabular-nums">
                {act.timestamp}
              </span>
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-zinc-500 text-center py-4">
            No live activity yet. Drag a card or edit a task!
          </p>
        )}
      </div>
    </div>
  );
};
