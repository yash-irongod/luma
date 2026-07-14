import { format, formatDistanceToNow, isToday as dfIsToday, isBefore, isAfter, startOfDay, parseISO } from 'date-fns';

export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const formatDate = (timestamp) => format(new Date(timestamp), 'MMM d, yyyy');

export const formatRelativeDate = (timestamp) => {
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 60000) return 'just now';
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
};

export const isToday = (dateStr) => dfIsToday(parseISO(dateStr));

export const isOverdue = (dateStr) => isBefore(parseISO(dateStr), startOfDay(new Date()));

export const isFuture = (dateStr) => isAfter(parseISO(dateStr), startOfDay(new Date()));

export const getTodayISO = () => format(new Date(), 'yyyy-MM-dd');
