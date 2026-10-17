import React, { useState, useMemo } from 'react';
import { columns, teamMembers } from '../../data/initialTasks';
import { TaskItem, TaskPriority, TaskStatus } from '../../types/task';
import { useRealTimeTaskManager } from '../../hooks/useRealTimeTaskManager';
import { TaskColumn } from './TaskColumn';
import { TaskModal } from './TaskModal';
import { MaskPreviewModal } from './MaskPreviewModal';
import { ActivityFeed } from './ActivityFeed';
import { VariationType } from '../SvgMaskTransitions/SvgMaskTransitions';
import {
  Plus,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  AlertCircle,
  Radio,
} from 'lucide-react';

interface TaskManagerProps {
  onOpenSvgShowcase?: (variation?: VariationType) => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({ onOpenSvgShowcase }) => {
  const {
    tasks,
    activities,
    isLiveConnected,
    lastSyncNotice,
    moveTask,
    createTask,
    updateTask,
    deleteTask,
    resetBoard,
    triggerPeerSimulation,
  } = useRealTimeTaskManager();

  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTask, setModalTask] = useState<TaskItem | null>(null);
  const [modalStatus, setModalStatus] = useState<TaskStatus>('backlog');
  const [previewVariation, setPreviewVariation] = useState<VariationType | null>(null);

  // Drag and drop handler
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropTask = (taskId: string, targetStatus: TaskStatus) => {
    moveTask(taskId, targetStatus);
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.assignee.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority =
        priorityFilter === 'all' || task.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  // Metrics
  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'done').length;
    const inFlight = tasks.filter((t) => t.status === 'in-progress' || t.status === 'in-review').length;
    const urgent = tasks.filter((t) => t.priority === 'urgent').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inFlight, urgent, completionRate };
  }, [tasks]);

  return (
    <div className="w-full min-h-screen bg-slate-100/60 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 p-6 md:p-8 font-sans transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Remote Sync Notice Pill */}
        {lastSyncNotice && (
          <div className="fixed top-20 right-8 z-50 flex items-center gap-2 px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-black rounded-lg shadow-xl text-xs font-medium animate-in fade-in slide-in-from-top-2">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{lastSyncNotice}</span>
          </div>
        )}

        {/* Board Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Engineering & Design Sprint
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Real-time drag-and-drop task management synchronized with the SVG Mask transition pipeline.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            {onOpenSvgShowcase && (
              <button
                onClick={() => onOpenSvgShowcase('horizontal-blinds')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>View SVG Mask Showcase</span>
              </button>
            )}

            <button
              onClick={() => {
                setModalTask(null);
                setModalStatus('backlog');
                setIsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Task</span>
            </button>

            <button
              onClick={resetBoard}
              title="Reset task board to initial baseline"
              className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 text-xs transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block mb-0.5">
                Total Tasks
              </span>
              <span className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">
                {metrics.total}
              </span>
            </div>
            <Layers className="w-5 h-5 text-slate-400" />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block mb-0.5">
                Active in Flight
              </span>
              <span className="text-xl font-bold tabular-nums text-blue-600 dark:text-blue-400">
                {metrics.inFlight}
              </span>
            </div>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block mb-0.5">
                Completed
              </span>
              <span className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {metrics.completed} ({metrics.completionRate}%)
              </span>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 block mb-0.5">
                Urgent Priority
              </span>
              <span className="text-xl font-bold tabular-nums text-rose-600 dark:text-rose-400">
                {metrics.urgent}
              </span>
            </div>
            <AlertCircle className="w-5 h-5 text-rose-500" />
          </div>
        </div>

        {/* Toolbar: Search, Filters & Active Collaborator Presence */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-xl p-3 shadow-2xs">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks, categories, assignees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-zinc-400">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 bg-slate-50/50 dark:bg-zinc-950 text-xs focus:outline-none"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {/* Active Collaborator Avatars */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[11px] font-medium text-slate-500 dark:text-zinc-400 mr-1 hidden lg:inline">
              Active Team:
            </span>
            <div className="flex -space-x-1.5">
              {teamMembers.map((m) => (
                <div
                  key={m.id}
                  title={`${m.name} (${m.role})`}
                  className="w-6 h-6 rounded-full bg-slate-800 dark:bg-zinc-700 text-white flex items-center justify-center text-[10px] font-bold ring-2 ring-white dark:ring-zinc-900"
                >
                  {m.avatar}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kanban Board 4 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((column) => {
            const columnTasks = filteredTasks.filter((t) => t.status === column.id);
            return (
              <TaskColumn
                key={column.id}
                column={column}
                tasks={columnTasks}
                onDragStart={handleDragStart}
                onDropTask={handleDropTask}
                onEditTask={(task) => {
                  setModalTask(task);
                  setIsModalOpen(true);
                }}
                onDeleteTask={deleteTask}
                onAddTask={(status) => {
                  setModalTask(null);
                  setModalStatus(status);
                  setIsModalOpen(true);
                }}
                onPreviewMask={(v) => setPreviewVariation(v)}
              />
            );
          })}
        </div>

        {/* Real-Time Activity Feed Drawer */}
        <ActivityFeed
          activities={activities}
          isLiveConnected={isLiveConnected}
          onSimulatePeer={triggerPeerSimulation}
        />
      </div>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setModalTask(null);
        }}
        onSave={(data) => {
          if (modalTask) {
            updateTask(modalTask.id, data);
          } else {
            createTask(data);
          }
        }}
        initialTask={modalTask}
        defaultStatus={modalStatus}
      />

      {/* Mask Preview Modal */}
      <MaskPreviewModal
        variation={previewVariation}
        onClose={() => setPreviewVariation(null)}
        onOpenFullExperience={(v) => {
          setPreviewVariation(null);
          if (onOpenSvgShowcase) onOpenSvgShowcase(v);
        }}
      />
    </div>
  );
};
