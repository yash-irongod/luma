import { Outlet } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import CommandPalette from './components/command/CommandPalette';
import ToastContainer from './components/common/Toast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useUIStore } from './stores/uiStore';

export default function App() {
  useKeyboardShortcuts();
  const sidebarCollapsed = useUIStore(s => s.sidebarCollapsed);

  return (
    <div className="app-layout">
      <Sidebar />
      <main
        className="app-main"
        style={{ marginLeft: sidebarCollapsed ? 56 : 260 }}
      >
        <Outlet />
      </main>
      <CommandPalette />
      <ToastContainer />
    </div>
  );
}
