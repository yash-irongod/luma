import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Dropdown.css';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Dropdown({ trigger, children, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick);
    };
  }, [open]);

  // Prevent body scroll when bottom sheet is open
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open, isMobile]);

  if (isMobile && open) {
    // Render as bottom sheet via portal
    return (
      <>
        <div onClick={() => setOpen(!open)}>{trigger}</div>
        {createPortal(
          <div className="dropdown-backdrop" onClick={() => setOpen(false)}>
            <div
              className="dropdown-bottom-sheet"
              ref={ref}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="dropdown-sheet-handle" />
              <div className="dropdown-sheet-content" onClick={() => setOpen(false)}>
                {children}
              </div>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  return (
    <div className="dropdown" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div className={`dropdown-menu dropdown-${align}`} onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({ children, onClick, danger }) {
  return (
    <button
      className={`dropdown-item ${danger ? 'dropdown-item-danger' : ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
