import { Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import MobileNav from './components/layout/MobileNav';
import CommandPalette from './components/command/CommandPalette';
import ToastContainer from './components/common/Toast';
import ReloadPrompt from './components/common/ReloadPrompt';
import MergeDialog from './components/common/MergeDialog';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUIStore } from './stores/uiStore';
import { useSync } from './hooks/useSync';

export default function App() {
  useKeyboardShortcuts();
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed);
  const { syncStatus, showMergeDialog, handleMerge } = useSync();

  return (
    <div className="app-layout">
      <Sidebar />
      <MobileNav />
      <main
        className="app-main"
        style={{ marginLeft: sidebarCollapsed ? 56 : 260 }}
      >
        <Outlet />
      </main>
      <CommandPalette />
      <ToastContainer />
      <ReloadPrompt />
      {showMergeDialog && <MergeDialog onMerge={handleMerge} />}
    </div>
  );
}
