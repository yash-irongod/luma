import { useState, useEffect, useCallback } from 'react';
import { create } from 'zustand';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import './Toast.css';

// Global toast store
export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'success', duration = 3000) => {
    const id = Date.now() + Math.random();
    set(state => ({ toasts: [...state.toasts, { id, message, type, duration }] }));
    return id;
  },
  removeToast: (id) => set(state => ({
    toasts: state.toasts.filter(t => t.id !== id),
  })),
}));

// Helper function - call from anywhere
export const toast = {
  success: (msg) => useToastStore.getState().addToast(msg, 'success'),
  error: (msg) => useToastStore.getState().addToast(msg, 'error'),
  info: (msg) => useToastStore.getState().addToast(msg, 'info'),
};

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

function ToastItem({ toast: t }) {
  const removeToast = useToastStore(s => s.removeToast);

  useEffect(() => {
    const timer = setTimeout(() => removeToast(t.id), t.duration);
    return () => clearTimeout(timer);
  }, [t.id, t.duration, removeToast]);

  const Icon = icons[t.type] || Info;

  return (
    <motion.div
      className={`toast toast-${t.type}`}
      initial={{ opacity: 0, y: 16, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Icon size={16} className="toast-icon" />
      <span className="toast-message">{t.message}</span>
      <button className="toast-close" onClick={() => removeToast(t.id)}>
        <X size={14} />
      </button>
    </motion.div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);

  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
      </AnimatePresence>
    </div>
  );
}
