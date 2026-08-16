import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import './AlarmOverlay.css';

/**
 * Full-screen alarm overlay — shows when a task reminder fires.
 * Plays repeating alarm sound, vibrates phone, requires user dismiss.
 */
export default function AlarmOverlay({ alarm, onDismiss, onComplete }) {
  const audioRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!alarm) return;

    // Vibrate if supported
    if (navigator.vibrate) {
      navigator.vibrate([500, 200, 500, 200, 500]);
    }

    // Play alarm sound on repeat
    const playAlarm = () => {
      try {
        // Use Web Audio API for a proper alarm tone
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioRef.current = ctx;

        const playTone = (freq, startTime, duration) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = freq;
          osc.type = 'sine';
          gain.gain.setValueAtTime(0.3, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
          osc.start(startTime);
          osc.stop(startTime + duration);
        };

        // Alarm pattern: rising tones
        const now = ctx.currentTime;
        playTone(523, now, 0.15);        // C5
        playTone(659, now + 0.2, 0.15);  // E5
        playTone(784, now + 0.4, 0.15);  // G5
        playTone(1047, now + 0.6, 0.3);  // C6 (longer)
      } catch (e) {
        console.warn('[Alarm] Audio failed:', e);
      }
    };

    playAlarm();
    // Repeat every 3 seconds
    intervalRef.current = setInterval(playAlarm, 3000);

    return () => {
      clearInterval(intervalRef.current);
      if (audioRef.current && audioRef.current.state !== 'closed') {
        audioRef.current.close().catch(() => {});
      }
      if (navigator.vibrate) navigator.vibrate(0); // Stop vibration
    };
  }, [alarm]);

  if (!alarm) return null;

  const handleDismiss = () => {
    clearInterval(intervalRef.current);
    if (audioRef.current && audioRef.current.state !== 'closed') {
      audioRef.current.close().catch(() => {});
    }
    if (navigator.vibrate) navigator.vibrate(0);
    onDismiss();
  };

  const handleComplete = () => {
    clearInterval(intervalRef.current);
    if (audioRef.current && audioRef.current.state !== 'closed') {
      audioRef.current.close().catch(() => {});
    }
    if (navigator.vibrate) navigator.vibrate(0);
    onComplete(alarm.taskId);
  };

  return (
    <div className="alarm-overlay">
      <div className="alarm-card">
        <div className="alarm-icon-pulse">
          <Bell size={40} />
        </div>
        <h2 className="alarm-title">Task Reminder</h2>
        <p className="alarm-task-name">{alarm.title}</p>
        {alarm.dueTime && (
          <p className="alarm-time">{formatTime12h(alarm.dueTime)}</p>
        )}
        <div className="alarm-actions">
          <button className="alarm-btn alarm-btn-dismiss" onClick={handleDismiss}>
            <X size={20} />
            Dismiss
          </button>
          <button className="alarm-btn alarm-btn-complete" onClick={handleComplete}>
            <Check size={20} />
            Mark Done
          </button>
        </div>
      </div>
    </div>
  );
}

function formatTime12h(time) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}
