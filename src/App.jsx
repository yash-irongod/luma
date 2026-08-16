import { useEffect, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import CommandPalette from './components/command/CommandPalette';
import ToastContainer from './components/common/Toast';
import ReloadPrompt from './components/common/ReloadPrompt';
import MergeDialog from './components/common/MergeDialog';
import AlarmOverlay from './components/common/AlarmOverlay';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUIStore } from './stores/uiStore';
import { useTaskStore } from './stores/taskStore';
import { useSync } from './hooks/useSync';
import {
  setAlarmCallback, scheduleAllReminders, requestNotificationPermission,
} from './lib/reminderEngine';

export default function App() {
  useKeyboardShortcuts();
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed);
  const { syncStatus, showMergeDialog, handleMerge } = useSync();
  const tasks = useTaskStore(s => s.tasks);
  const toggleComplete = useTaskStore(s => s.toggleComplete);

  // Alarm state
  const [activeAlarm, setActiveAlarm] = useState(null);

  // Register alarm callback on mount
  useEffect(() => {
    setAlarmCallback((alarm) => setActiveAlarm(alarm));

    // Request notification permission (non-blocking)
    requestNotificationPermission();
  }, []);

  // Schedule reminders whenever tasks change
  useEffect(() => {
    scheduleAllReminders(tasks);
  }, [tasks]);

  // Alarm handlers
  const handleAlarmDismiss = useCallback(() => setActiveAlarm(null), []);
  const handleAlarmComplete = useCallback((taskId) => {
    toggleComplete(taskId);
    setActiveAlarm(null);
  }, [toggleComplete]);

  return (
    <div className="app-layout">
      <Sidebar />
      <MobileNav />
      <main
        className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
      >
        <Outlet />
      </main>
      <CommandPalette />
      <ToastContainer />
      <ReloadPrompt />
      {showMergeDialog && <MergeDialog onMerge={handleMerge} />}
      <AlarmOverlay
        alarm={activeAlarm}
        onDismiss={handleAlarmDismiss}
        onComplete={handleAlarmComplete}
      />
    </div>
  );
}
