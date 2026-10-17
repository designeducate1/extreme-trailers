import { useState, useEffect, useCallback, useRef } from 'react';
import { TaskItem, TaskStatus, ActivityEvent } from '../types/task';
import { initialTasks, initialActivities, teamMembers } from '../data/initialTasks';

const STORAGE_TASKS_KEY = 'codrops_tasks_state_v1';
const STORAGE_ACTIVITY_KEY = 'codrops_activity_state_v1';
const CHANNEL_NAME = 'realtime_task_manager_channel';

type SyncMessage =
  | { type: 'TASKS_UPDATE'; payload: { tasks: TaskItem[]; activity: ActivityEvent } }
  | { type: 'TASKS_RESET'; payload: { tasks: TaskItem[] } };

export function useRealTimeTaskManager() {
  const [tasks, setTasks] = useState<TaskItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_TASKS_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return initialTasks;
  });

  const [activities, setActivities] = useState<ActivityEvent[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_ACTIVITY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return initialActivities;
  });

  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(true);
  const [lastSyncNotice, setLastSyncNotice] = useState<string | null>(null);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize BroadcastChannel
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        channel = new BroadcastChannel(CHANNEL_NAME);
        channelRef.current = channel;

        channel.onmessage = (event: MessageEvent<SyncMessage>) => {
          const msg = event.data;
          if (msg.type === 'TASKS_UPDATE') {
            setTasks(msg.payload.tasks);
            setActivities((prev) => [msg.payload.activity, ...prev.slice(0, 19)]);
            setLastSyncNotice(`Remote update: ${msg.payload.activity.action} on "${msg.payload.activity.targetTask}"`);
            setTimeout(() => setLastSyncNotice(null), 3000);
          } else if (msg.type === 'TASKS_RESET') {
            setTasks(msg.payload.tasks);
            setLastSyncNotice('Board reset to baseline');
            setTimeout(() => setLastSyncNotice(null), 2500);
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported in current environment', e);
      setIsLiveConnected(false);
    }

    return () => {
      if (channel) channel.close();
      channelRef.current = null;
    };
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error(e);
    }
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVITY_KEY, JSON.stringify(activities));
    } catch (e) {
      console.error(e);
    }
  }, [activities]);

  const broadcastChange = useCallback((updatedTasks: TaskItem[], activity: ActivityEvent) => {
    if (channelRef.current) {
      try {
        channelRef.current.postMessage({
          type: 'TASKS_UPDATE',
          payload: { tasks: updatedTasks, activity },
        });
      } catch (err) {
        console.warn('Failed to broadcast task update', err);
      }
    }
  }, []);

  // Move task (Drag and Drop action)
  const moveTask = useCallback(
    (taskId: string, targetStatus: TaskStatus, targetIndex?: number) => {
      setTasks((prev) => {
        const taskToMove = prev.find((t) => t.id === taskId);
        if (!taskToMove) return prev;

        const oldStatus = taskToMove.status;
        const updatedTask: TaskItem = {
          ...taskToMove,
          status: targetStatus,
          progress: targetStatus === 'done' ? 100 : taskToMove.progress,
          updatedAt: new Date().toISOString(),
        };

        const remaining = prev.filter((t) => t.id !== taskId);

        let newTasks: TaskItem[];
        if (typeof targetIndex === 'number' && targetIndex >= 0) {
          // Find index within the status subset
          const statusTasks = remaining.filter((t) => t.status === targetStatus);
          const nonStatusTasks = remaining.filter((t) => t.status !== targetStatus);

          const splicedStatus = [...statusTasks];
          splicedStatus.splice(targetIndex, 0, updatedTask);
          newTasks = [...nonStatusTasks, ...splicedStatus];
        } else {
          newTasks = [...remaining, updatedTask];
        }

        const newActivity: ActivityEvent = {
          id: `act-${Date.now()}`,
          userName: 'You',
          userAvatar: 'YOU',
          action:
            oldStatus === targetStatus
              ? 'reordered task'
              : `moved task from ${oldStatus} to ${targetStatus}`,
          targetTask: updatedTask.title,
          timestamp: 'Just now',
        };

        setActivities((actPrev) => [newActivity, ...actPrev.slice(0, 19)]);
        broadcastChange(newTasks, newActivity);
        return newTasks;
      });
    },
    [broadcastChange]
  );

  // Create new task
  const createTask = useCallback(
    (newTaskData: Omit<TaskItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const now = new Date().toISOString();
      const newTask: TaskItem = {
        ...newTaskData,
        id: `task-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };

      setTasks((prev) => {
        const next = [newTask, ...prev];
        const newActivity: ActivityEvent = {
          id: `act-${Date.now()}`,
          userName: 'You',
          userAvatar: 'YOU',
          action: 'created task',
          targetTask: newTask.title,
          timestamp: 'Just now',
        };
        setActivities((actPrev) => [newActivity, ...actPrev.slice(0, 19)]);
        broadcastChange(next, newActivity);
        return next;
      });
    },
    [broadcastChange]
  );

  // Update existing task
  const updateTask = useCallback(
    (taskId: string, partial: Partial<TaskItem>) => {
      setTasks((prev) => {
        const existing = prev.find((t) => t.id === taskId);
        if (!existing) return prev;

        const updated: TaskItem = {
          ...existing,
          ...partial,
          updatedAt: new Date().toISOString(),
        };

        const next = prev.map((t) => (t.id === taskId ? updated : t));
        const newActivity: ActivityEvent = {
          id: `act-${Date.now()}`,
          userName: 'You',
          userAvatar: 'YOU',
          action: 'updated details for',
          targetTask: updated.title,
          timestamp: 'Just now',
        };
        setActivities((actPrev) => [newActivity, ...actPrev.slice(0, 19)]);
        broadcastChange(next, newActivity);
        return next;
      });
    },
    [broadcastChange]
  );

  // Delete task
  const deleteTask = useCallback(
    (taskId: string) => {
      setTasks((prev) => {
        const target = prev.find((t) => t.id === taskId);
        if (!target) return prev;

        const next = prev.filter((t) => t.id !== taskId);
        const newActivity: ActivityEvent = {
          id: `act-${Date.now()}`,
          userName: 'You',
          userAvatar: 'YOU',
          action: 'deleted task',
          targetTask: target.title,
          timestamp: 'Just now',
        };
        setActivities((actPrev) => [newActivity, ...actPrev.slice(0, 19)]);
        broadcastChange(next, newActivity);
        return next;
      });
    },
    [broadcastChange]
  );

  // Reset to initial demo state
  const resetBoard = useCallback(() => {
    setTasks(initialTasks);
    setActivities(initialActivities);
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'TASKS_RESET',
        payload: { tasks: initialTasks },
      });
    }
  }, []);

  // Occasional simulated collaborator event to demonstrate real-time vitality
  const triggerPeerSimulation = useCallback(() => {
    const peers = teamMembers;
    const randomPeer = peers[Math.floor(Math.random() * peers.length)];
    const actions = [
      'reviewed mask transition',
      'verified performance metrics',
      'updated design token specs',
      'checked 60fps frame rate',
    ];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];

    setTasks((currentTasks) => {
      if (currentTasks.length === 0) return currentTasks;
      const randomTask = currentTasks[Math.floor(Math.random() * currentTasks.length)];

      const peerActivity: ActivityEvent = {
        id: `act-${Date.now()}`,
        userName: randomPeer.name,
        userAvatar: randomPeer.avatar,
        action: randomAction,
        targetTask: randomTask.title,
        timestamp: 'Just now',
      };

      setActivities((actPrev) => [peerActivity, ...actPrev.slice(0, 19)]);
      setLastSyncNotice(`${randomPeer.name} ${randomAction} on "${randomTask.title}"`);
      setTimeout(() => setLastSyncNotice(null), 3000);
      return currentTasks;
    });
  }, []);

  return {
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
  };
}
