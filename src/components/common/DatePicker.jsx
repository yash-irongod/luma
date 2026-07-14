import { useState, useRef, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameDay, isSameMonth, addWeeks } from 'date-fns';
import { Calendar, X } from 'lucide-react';
import './DatePicker.css';

export default function DatePicker({ value, onChange, trigger }) {
  const [open, setOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value ? new Date(value) : new Date());
  const ref = useRef(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

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

  // Generate calendar days
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
        </div>
      )}
    </div>
  );
}
