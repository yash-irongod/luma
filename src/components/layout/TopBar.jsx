import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './TopBar.css';

export default function TopBar({ title, backTo, backLabel, children }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        {backTo && (
          <Link to={backTo} className="topbar-back">
            <ArrowLeft size={16} />
            <span>{backLabel || 'Back'}</span>
          </Link>
        )}
        {title && <h1 className="topbar-title">{title}</h1>}
      </div>
      <div className="topbar-actions">{children}</div>
    </header>
  );
}
