import { useEffect, useRef, useCallback, useState } from 'react';

export function useAutoSave(saveFn, delay = 500) {
  const [saveStatus, setSaveStatus] = useState('saved');
  const timeoutRef = useRef(null);
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  const triggerSave = useCallback((data) => {
    setSaveStatus('saving');
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      saveFnRef.current(data);
      setSaveStatus('saved');
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { triggerSave, saveStatus };
}
