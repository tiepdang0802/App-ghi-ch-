// Web Audio API chime sound generator for reminders
export function playReminderSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(440, now);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.2); // D6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
  } catch (err) {
    console.warn('Audio chime notice error:', err);
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

export function sendBrowserNotification(title: string, body: string) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
      playReminderSound();
    } catch (e) {
      console.warn('Could not trigger notification', e);
    }
  }
}

export type DeadlineState = 'overdue' | 'due-today' | 'due-soon' | 'upcoming' | 'no-deadline';

export function getDeadlineState(dueDateStr?: string): {
  state: DeadlineState;
  label: string;
  badgeClass: string;
  hoursRemaining: number | null;
} {
  if (!dueDateStr) {
    return {
      state: 'no-deadline',
      label: 'Không có hạn',
      badgeClass: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
      hoursRemaining: null,
    };
  }

  const now = new Date();
  const due = new Date(dueDateStr);
  if (isNaN(due.getTime())) {
    return {
      state: 'no-deadline',
      label: 'Ngày không hợp lệ',
      badgeClass: 'bg-slate-100 text-slate-600',
      hoursRemaining: null,
    };
  }

  const diffMs = due.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffMs < 0) {
    const overdueHours = Math.abs(diffHours);
    const overdueDays = Math.floor(overdueHours / 24);
    const label =
      overdueDays > 0
        ? `Quá hạn ${overdueDays} ngày`
        : `Quá hạn ${overdueHours} giờ`;
    return {
      state: 'overdue',
      label,
      badgeClass: 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold',
      hoursRemaining: diffHours,
    };
  }

  const isToday =
    now.getDate() === due.getDate() &&
    now.getMonth() === due.getMonth() &&
    now.getFullYear() === due.getFullYear();

  if (isToday) {
    const label =
      diffHours <= 1 ? 'Đến hạn trong 1 giờ tới!' : `Hôm nay (còn ${diffHours}h)`;
    return {
      state: 'due-today',
      label,
      badgeClass: 'bg-amber-50 text-amber-700 border border-amber-300 font-medium animate-pulse',
      hoursRemaining: diffHours,
    };
  }

  if (diffHours <= 48) {
    return {
      state: 'due-soon',
      label: `Sắp đến hạn (${Math.round(diffHours / 24)} ngày)`,
      badgeClass: 'bg-orange-50 text-orange-700 border border-orange-200',
      hoursRemaining: diffHours,
    };
  }

  const days = Math.ceil(diffHours / 24);
  return {
    state: 'upcoming',
    label: `Còn ${days} ngày`,
    badgeClass: 'bg-blue-50 text-blue-700 border border-blue-200',
    hoursRemaining: diffHours,
  };
}

export function formatVietnameseDateTime(isoDateStr?: string): string {
  if (!isoDateStr) return '';
  const d = new Date(isoDateStr);
  if (isNaN(d.getTime())) return isoDateStr;

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  if (isoDateStr.includes('T')) {
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  }
  return `${day}/${month}/${year}`;
}
