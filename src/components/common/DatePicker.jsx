import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isSameMonth, addWeeks } from 'date-fns';
import { Calendar, X } from 'lucide-react';
import './DatePicker.css';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function DatePicker({ value, onChange, trigger }) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, isMobile]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    if (open && isMobile) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open, isMobile]);

  const selectDate = (date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setOpen(false);
  };

  const clearDate = () => {
    onChange(null);
    setOpen(false);
  };

  const quickOptions = [
    { label: 'Today', date: today },
    { label: 'Tomorrow', date: addDays(today, 1) },
    { label: 'Next week', date: addWeeks(today, 1) },
    { label: 'Next month', date: addMonths(today, 1) },
  ];

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(new Date(day));
    day = addDays(day, 1);
  }

  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  const calendarContent = (
    <>
      <div className="date-picker-quick">
        {quickOptions.map(opt => (
          <button
            key={opt.label}
            type="button"
            className="date-picker-quick-btn"
            onClick={() => selectDate(opt.date)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="date-picker-nav">
        <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>&lt;</button>
        <span>{format(currentMonth, 'MMMM yyyy')}</span>
        <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>&gt;</button>
      </div>

      <div className="date-picker-weekdays">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="date-picker-grid">
        {days.map((d, i) => {
          const isCurrentMonth = isSameMonth(d, currentMonth);
          const isSelected = selectedDate && isSameDay(d, selectedDate);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={i}
              type="button"
              className={[
                'date-picker-day',
                !isCurrentMonth && 'outside',
                isSelected && 'selected',
                isToday && 'today',
              ].filter(Boolean).join(' ')}
              onClick={() => selectDate(d)}
            >
              {format(d, 'd')}
            </button>
          );
        })}
      </div>

      {value && (
        <button type="button" className="date-picker-clear" onClick={clearDate}>
          <X size={12} /> Clear date
        </button>
      )}
    </>
  );

  // Mobile: render as bottom sheet via portal
  if (isMobile && open) {
    return (
      <>
        <div onClick={() => setOpen(!open)}>
          {trigger || (
            <button type="button" className="date-picker-trigger">
              <Calendar size={14} />
              <span>{value ? format(new Date(value + 'T00:00:00'), 'MMM d') : 'Set date'}</span>
            </button>
          )}
        </div>
        {createPortal(
          <div className="date-picker-backdrop" onClick={() => setOpen(false)}>
            <div
              className="date-picker-bottom-sheet"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="date-picker-sheet-handle" />
              {calendarContent}
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }

  // Desktop: standard absolute dropdown
  return (
    <div className="date-picker-wrapper" ref={ref}>
      <div onClick={() => setOpen(!open)}>
        {trigger || (
          <button type="button" className="date-picker-trigger">
            <Calendar size={14} />
            <span>{value ? format(new Date(value + 'T00:00:00'), 'MMM d') : 'Set date'}</span>
          </button>
        )}
      </div>

      {open && (
        <div className="date-picker-dropdown">
          {calendarContent}
        </div>
      )}
    </div>
  );
}
