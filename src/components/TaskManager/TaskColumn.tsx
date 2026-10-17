import React, { useState } from 'react';
import { ColumnDef, TaskItem } from '../../types/task';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';

interface TaskColumnProps {
  column: ColumnDef;
  tasks: TaskItem[];
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDropTask: (taskId: string, targetStatus: ColumnDef['id']) => void;
  onEditTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (status: ColumnDef['id']) => void;
  onPreviewMask?: (variation: NonNullable<TaskItem['maskVariationPreview']>) => void;
}

export const TaskColumn: React.FC<TaskColumnProps> = ({
  column,
  tasks,
  onDragStart,
  onDropTask,
  onEditTask,
  onDeleteTask,
  onAddTask,
  onPreviewMask,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only turn off if leaving column
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
    if (taskId) {
      onDropTask(taskId, column.id);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex flex-col rounded-2xl bg-slate-50/70 dark:bg-zinc-950/50 border transition-all duration-200 min-h-[580px] p-3.5 ${
        isDragOver
          ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/20 ring-2 ring-blue-500/20'
          : 'border-slate-200/80 dark:border-zinc-800/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between px-1.5 pb-3 mb-2 border-b border-slate-200/60 dark:border-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: column.accentColor }}
          />
          <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 tracking-tight">
            {column.title}
          </h3>
          <span className="text-xs font-semibold tabular-nums text-slate-500 dark:text-zinc-400 bg-slate-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => onAddTask(column.id)}
          aria-label={`Add task to ${column.title}`}
          className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-slate-200/60 dark:hover:bg-zinc-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Task List */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-0.5">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onDragStart={onDragStart}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            onPreviewMask={onPreviewMask}
          />
        ))}

        {tasks.length === 0 && (
          <div className="h-32 rounded-xl border border-dashed border-slate-200 dark:border-zinc-800 flex flex-col items-center justify-center text-center p-4 text-xs text-slate-400 dark:text-zinc-500">
            <span>No tasks in this lane</span>
            <button
              onClick={() => onAddTask(column.id)}
              className="mt-2 text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              + Create task
            </button>
          </div>
        )}
      </div>

      {/* Bottom quick add button */}
      <button
        onClick={() => onAddTask(column.id)}
        className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 text-xs font-medium text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition-all"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add task</span>
      </button>
    </div>
  );
};
