import React from 'react';
import { TaskItem, TaskPriority } from '../../types/task';
import { Calendar, Eye, MoreVertical, Trash2, Edit3, GripVertical } from 'lucide-react';

interface TaskCardProps {
  task: TaskItem;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onEdit: (task: TaskItem) => void;
  onDelete: (taskId: string) => void;
  onPreviewMask?: (variation: NonNullable<TaskItem['maskVariationPreview']>) => void;
}

const priorityConfig: Record<TaskPriority, { label: string; dotColor: string; textColor: string }> = {
  urgent: { label: 'Urgent', dotColor: 'bg-rose-500', textColor: 'text-rose-600 dark:text-rose-400' },
  high: { label: 'High Priority', dotColor: 'bg-amber-500', textColor: 'text-amber-600 dark:text-amber-400' },
  medium: { label: 'Medium', dotColor: 'bg-blue-500', textColor: 'text-blue-600 dark:text-blue-400' },
  low: { label: 'Low', dotColor: 'bg-slate-400', textColor: 'text-slate-600 dark:text-slate-400' },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onDragStart,
  onEdit,
  onDelete,
  onPreviewMask,
}) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const priority = priorityConfig[task.priority];

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="group relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all cursor-grab active:cursor-grabbing"
    >
      {/* Top row: Category, Priority, and Menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-zinc-400">
          <span className="text-slate-900 dark:text-zinc-200 font-semibold">{task.category}</span>
          <span aria-hidden="true" className="opacity-40">·</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${priority.dotColor}`} />
            <span className={priority.textColor}>{priority.label}</span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            aria-label="Task options"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div
              onMouseLeave={() => setShowMenu(false)}
              className="absolute right-0 top-6 z-30 w-36 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-xl py-1 text-xs text-slate-700 dark:text-zinc-200 font-medium"
            >
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEdit(task);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                Edit Task
              </button>
              {task.maskVariationPreview && onPreviewMask && (
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onPreviewMask(task.maskVariationPreview!);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-left transition-colors text-blue-600 dark:text-blue-400"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview Mask
                </button>
              )}
              <div className="my-1 border-t border-slate-100 dark:border-zinc-800" />
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(task.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-left transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug mb-1.5 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
          {task.description}
        </p>
      )}

      {/* Optional Transition Badge / Shortcut */}
      {task.maskVariationPreview && onPreviewMask && (
        <button
          onClick={() => onPreviewMask(task.maskVariationPreview!)}
          className="w-full mb-3 flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800/60 hover:bg-slate-100 dark:hover:bg-zinc-800 border border-slate-200/60 dark:border-zinc-700/60 text-xs text-slate-700 dark:text-zinc-300 transition-colors text-left"
        >
          <span className="flex items-center gap-1.5 font-medium">
            <Eye className="w-3.5 h-3.5 text-blue-500" />
            <span>Interactive Mask: {task.maskVariationPreview}</span>
          </span>
          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold">Test →</span>
        </button>
      )}

      {/* Progress Bar if not 0% */}
      {task.progress > 0 && (
        <div className="mb-3 space-y-1">
          <div className="flex justify-between text-[11px] font-medium text-slate-500 dark:text-zinc-400 tabular-nums">
            <span>Progress</span>
            <span>{task.progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                task.status === 'done'
                  ? 'bg-emerald-500'
                  : task.progress > 70
                  ? 'bg-blue-500'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${task.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Bottom Footer: Date & Assignee */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 opacity-60" />
          <span className="tabular-nums">{task.dueDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-slate-600 dark:text-zinc-300">
            {task.assignee.name.split(' ')[0]}
          </span>
          <div
            title={`${task.assignee.name} (${task.assignee.role})`}
            className="w-6 h-6 rounded-full bg-slate-900 text-white dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold ring-1 ring-white dark:ring-zinc-900"
          >
            {task.assignee.avatar}
          </div>
        </div>
      </div>
    </div>
  );
};
