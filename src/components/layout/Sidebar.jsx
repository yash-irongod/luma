import { useMemo } from 'react';
import { NavLink, Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { useNoteStore } from '../../stores/noteStore';
import { useTaskStore } from '../../stores/taskStore';
import { useListStore } from '../../stores/listStore';
import {
  Home, FileText, CheckSquare, FolderOpen, Search,
  Trash2, Settings, ChevronsLeft, ChevronsRight, Plus, Tag, Sun, List
} from 'lucide-react';
import './Sidebar.css';

const isMac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.userAgent);

/* Standard sidebar link — uses NavLink for path-only routes */
function SidebarItem({ to, icon: Icon, label, count, accent, end }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
      end={end}
    >
      <Icon size={18} className="sidebar-item-icon" style={accent ? { color: accent } : undefined} />
      <span className="sidebar-item-label">{label}</span>
      {count > 0 && <span className="sidebar-item-count">{count}</span>}
    </NavLink>
  );
}

/* Query-aware sidebar link — checks both pathname AND search params */
function SidebarQueryItem({ pathname, queryKey, queryValue, icon: Icon, label, count, accent, children }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isActive = location.pathname === pathname && searchParams.get(queryKey) === queryValue;
  const to = `${pathname}?${queryKey}=${queryValue}`;

  return (
    <Link
      to={to}
      className={`sidebar-item ${isActive ? 'active' : ''}`}
    >
      {Icon && <Icon size={18} className="sidebar-item-icon" style={accent ? { color: accent } : undefined} />}
      {children}
      <span className="sidebar-item-label">{label}</span>
      {count > 0 && <span className="sidebar-item-count">{count}</span>}
    </Link>
  );
}

export default function Sidebar() {
  const collapsed = useUIStore(s => s.sidebarCollapsed);
  const toggleSidebar = useUIStore(s => s.toggleSidebar);
  const toggleCommandPalette = useUIStore(s => s.toggleCommandPalette);
  const allProjects = useProjectStore(s => s.projects);
  const allNotes = useNoteStore(s => s.notes);
  const allTasks = useTaskStore(s => s.tasks);
  const allLists = useListStore(s => s.lists);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const projects = useMemo(() => allProjects.filter(p => !p.trashedAt), [allProjects]);
  const noteCount = useMemo(() => allNotes.filter(n => !n.trashedAt).length, [allNotes]);
  const activeTaskCount = useMemo(() => allTasks.filter(t => !t.trashedAt && !t.completed).length, [allTasks]);
  const myDayCount = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return allTasks.filter(t => !t.trashedAt && !t.completed && (t.focusToday || t.dueDate === today)).length;
  }, [allTasks]);

  const listCounts = useMemo(() => {
    const counts = {};
    allLists.forEach(l => {
      counts[l.id] = allTasks.filter(t => !t.trashedAt && !t.completed && t.listId === l.id).length;
    });
    return counts;
  }, [allTasks, allLists]);

  // "Tasks" link should only be active when on /tasks with NO list query param
  const isTasksActive = location.pathname === '/tasks' && !searchParams.get('list');

  return (
    <nav className="sidebar" data-collapsed={collapsed}>
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <img src="/luma-logo.png" alt="Luma" className="sidebar-logo-img" />
          <span className="sidebar-logo-text">Luma</span>
        </div>
        <button className="sidebar-collapse-btn" onClick={toggleSidebar} aria-label="Toggle sidebar">
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </button>
      </div>

      <div className="sidebar-nav">
        <SidebarItem to="/" icon={Home} label="Home" end />

        <SidebarQueryItem
          pathname="/tasks"
          queryKey="list"
          queryValue="my-day"
          icon={Sun}
          label="My Day"
          count={myDayCount}
          accent="var(--luma-warning)"
        />

        <SidebarItem to="/search" icon={Search} label="Search" />

        <div className="sidebar-section">
          <span className="sidebar-section-label">Workspace</span>
        </div>

        <SidebarItem to="/notes" icon={FileText} label="Notes" count={noteCount} />

        {/* Tasks — active only when no list filter */}
        <Link
          to="/tasks"
          className={`sidebar-item ${isTasksActive ? 'active' : ''}`}
        >
          <CheckSquare size={18} className="sidebar-item-icon" />
          <span className="sidebar-item-label">Tasks</span>
          {activeTaskCount > 0 && <span className="sidebar-item-count">{activeTaskCount}</span>}
        </Link>

        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span className="sidebar-section-label">Projects</span>
            <button
              className="sidebar-add-btn"
              onClick={() => navigate('/projects')}
              aria-label="View projects"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="sidebar-projects">
          {projects.map(project => (
            <NavLink
              key={project.id}
              to={`/projects/${project.id}`}
              className={({ isActive }) => `sidebar-item sidebar-project-item ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-project-emoji">{project.emoji}</span>
              <span className="sidebar-item-label">{project.name}</span>
            </NavLink>
          ))}
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <span className="sidebar-section-label">Lists</span>
            <button
              className="sidebar-add-btn"
              onClick={() => {
                const name = prompt('New list name:');
                if (name?.trim()) {
                  useListStore.getState().addList({ name: name.trim() });
                }
              }}
              aria-label="Add list"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="sidebar-lists">
          {allLists.map(list => (
            <SidebarQueryItem
              key={list.id}
              pathname="/tasks"
              queryKey="list"
              queryValue={list.id}
              label={list.name}
              count={listCounts[list.id]}
            >
              <span className="sidebar-list-dot" style={{ background: list.color }} />
            </SidebarQueryItem>
          ))}
        </div>

        <SidebarItem to="/tags" icon={Tag} label="Tags" />
      </div>

      <div className="sidebar-footer">
        <SidebarItem to="/trash" icon={Trash2} label="Trash" />
        <SidebarItem to="/settings" icon={Settings} label="Settings" />
        <button className="sidebar-shortcut-hint" onClick={toggleCommandPalette}>
          <Search size={14} />
          <span className="sidebar-item-label">Quick Open</span>
          <kbd className="sidebar-kbd">{isMac ? '⌘K' : 'Ctrl+K'}</kbd>
        </button>
      </div>
    </nav>
  );
}
