/**
 * Reminder Engine — In-app alarm + browser notifications for tasks
 * 
 * Uses setTimeout to schedule reminders.
 * When a reminder fires: shows in-app alarm overlay + browser notification.
 */

const activeReminders = new Map(); // taskId -> timeoutId
let alarmCallback = null; // Set by App.jsx to trigger alarm overlay

/**
 * Register the alarm callback — called by App.jsx
 */
export function setAlarmCallback(callback) {
  alarmCallback = callback;
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Schedule a reminder for a task
 */
export function scheduleReminder(taskId, title, dueDate, dueTime) {
  cancelReminder(taskId);
  if (!dueDate || !dueTime) return;

  const dueDateTime = new Date(`${dueDate}T${dueTime}:00`);
  const now = new Date();
  const delay = dueDateTime.getTime() - now.getTime();

  if (delay <= 0) return; // Already past

  console.log(`[Reminder] "${title}" scheduled in ${Math.round(delay / 60000)}min`);

  const timeoutId = setTimeout(() => {
    fireAlarm(taskId, title, dueTime);
    activeReminders.delete(taskId);
  }, delay);

  activeReminders.set(taskId, timeoutId);
}

/**
 * Cancel a reminder
 */
export function cancelReminder(taskId) {
  const tid = activeReminders.get(taskId);
  if (tid) {
    clearTimeout(tid);
    activeReminders.delete(taskId);
  }
}

/**
 * Cancel all reminders
 */
export function cancelAllReminders() {
  activeReminders.forEach(tid => clearTimeout(tid));
  activeReminders.clear();
}

/**
 * Fire the alarm — in-app overlay + browser notification
 */
function fireAlarm(taskId, title, dueTime) {
  console.log(`[Reminder] 🔔 ALARM: "${title}"`);

  // Trigger in-app alarm overlay
  if (alarmCallback) {
    alarmCallback({ taskId, title, dueTime });
  }

  // Vibrate
  if (navigator.vibrate) {
    navigator.vibrate([500, 200, 500, 200, 500, 200, 500]);
  }

  // Browser notification (for background tabs)
  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification('Luma — Task Due', {
        body: `⏰ ${title}${dueTime ? ` (${formatTime12h(dueTime)})` : ''}`,
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        tag: `task-${taskId}`,
        requireInteraction: true,
        vibrate: [500, 200, 500],
      });
      notification.onclick = () => { window.focus(); notification.close(); };
      setTimeout(() => notification.close(), 30000);
    } catch (e) {}
  }
}

/**
 * Scan all tasks and schedule reminders for today
 */
export function scheduleAllReminders(tasks) {
  cancelAllReminders();
  const today = new Date().toISOString().split('T')[0];

  tasks.forEach(task => {
    if (task.completed || task.trashedAt) return;

    // Parent task with time
    if (task.dueDate === today && task.dueTime) {
      scheduleReminder(task.id, task.title, task.dueDate, task.dueTime);
    }

    // Subtasks with time
    task.subtasks?.forEach(st => {
      if (!st.completed && st.dueDate === today && st.dueTime) {
        scheduleReminder(st.id, `${st.title} (in "${task.title}")`, st.dueDate, st.dueTime);
      }
    });
  });
}

function formatTime12h(time) {
  const [h, m] = time.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

export function getNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}
