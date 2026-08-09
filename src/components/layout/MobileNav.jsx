import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Home, CheckSquare, FileText, Search, Menu, FolderOpen, Tag, Trash2, Settings, X, LogIn } from 'lucide-react';
import './MobileNav.css';

export default function MobileNav() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, signInWithGoogle } = useAuth();

  const toggleDrawer = () => setDrawerOpen(prev => !prev);
  const closeDrawer = () => setDrawerOpen(false);

  // Close drawer on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <nav className="mobile-nav">
        <NavLink to="/" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} end onClick={closeDrawer}>
          <Home size={20} />
          <span>Home</span>
        </NavLink>
        <NavLink to="/tasks" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
          <CheckSquare size={20} />
          <span>Tasks</span>
        </NavLink>
        <NavLink to="/notes" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
          <FileText size={20} />
          <span>Notes</span>
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`} onClick={closeDrawer}>
          <Search size={20} />
          <span>Search</span>
        </NavLink>
        <button className={`mobile-nav-item ${drawerOpen ? 'active' : ''}`} onClick={toggleDrawer}>
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>

      {drawerOpen && (
        <div className="mobile-nav-drawer-overlay" onClick={closeDrawer}>
          <div className="mobile-nav-drawer" onClick={e => e.stopPropagation()}>
            <div className="mobile-nav-drawer-header">
              <h3>More</h3>
              <button className="icon-btn" onClick={closeDrawer}><X size={20} /></button>
            </div>
            <div className="mobile-nav-drawer-content">
              {user ? (
                <NavLink to="/settings" className="mobile-nav-drawer-item mobile-nav-user" onClick={closeDrawer}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="mobile-nav-avatar" />
                  ) : (
                    <span className="mobile-nav-avatar-placeholder">{(user.displayName || 'U')[0]}</span>
                  )}
                  <span>{user.displayName || user.email}</span>
                </NavLink>
              ) : (
                <button className="mobile-nav-drawer-item mobile-nav-signin" onClick={() => { signInWithGoogle(); closeDrawer(); }}>
                  <LogIn size={18} />
                  <span>Sign in to sync</span>
                </button>
              )}
              <div className="mobile-nav-drawer-divider" />
              <NavLink to="/projects" className="mobile-nav-drawer-item" onClick={closeDrawer}>
                <FolderOpen size={18} />
                <span>Projects</span>
              </NavLink>
              <NavLink to="/tags" className="mobile-nav-drawer-item" onClick={closeDrawer}>
                <Tag size={18} />
                <span>Tags</span>
              </NavLink>
              <NavLink to="/trash" className="mobile-nav-drawer-item" onClick={closeDrawer}>
                <Trash2 size={18} />
                <span>Trash</span>
              </NavLink>
              <NavLink to="/settings" className="mobile-nav-drawer-item" onClick={closeDrawer}>
                <Settings size={18} />
                <span>Settings</span>
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
