import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { WorkSessionsView } from './components/WorkSessionsView';
import { TasksDeadlineView } from './components/TasksDeadlineView';
import { MeetingMinutesModal } from './components/MeetingMinutesModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { WorkSession, TaskItem, MeetingMinutesData, ActionItem, GoogleUserInfo } from './types';
import {
  loadLocalSessions,
  saveLocalSessions,
  loadLocalTasks,
  saveLocalTasks,
  getOrCreateSyncKey,
  syncToCloud,
  pullFromCloud,
  getLastSyncedTime,
} from './services/storageService';
import {
  initAuth,
  googleSignIn,
  googleSignOut,
  getCachedAccessToken,
  createGoogleTask,
} from './services/googleAuth';
import {
  getDeadlineState,
  sendBrowserNotification,
  playReminderSound,
} from './utils/notifications';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'sessions' | 'tasks'>('sessions');
  const [sessions, setSessions] = useState<WorkSession[]>(() => loadLocalSessions());
  const [tasks, setTasks] = useState<TaskItem[]>(() => loadLocalTasks());
  const [activeSessionId, setActiveSessionId] = useState<string | null>(() => {
    const s = loadLocalSessions();
    return s.length > 0 ? s[0].id : null;
  });

  const [syncKey, setSyncKey] = useState<string>(() => getOrCreateSyncKey());
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(() => getLastSyncedTime());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Minutes modal
  const [minutesModalData, setMinutesModalData] = useState<MeetingMinutesData | null>(null);
  const [isMinutesModalOpen, setIsMinutesModalOpen] = useState(false);
  const [isGeneratingMinutes, setIsGeneratingMinutes] = useState(false);
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);

  // Google Auth
  const [googleUser, setGoogleUser] = useState<GoogleUserInfo | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);

  // Notification feedback banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Initialize Google Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          accessToken: token,
        });
      },
      () => {
        setGoogleUser(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // 2. Initial background cloud pull to ensure newest sync across laptop & phone
  useEffect(() => {
    const fetchCloud = async () => {
      if (syncKey) {
        setIsSyncing(true);
        const result = await pullFromCloud(syncKey);
        setIsSyncing(false);
        if (result.success && result.data) {
          if (result.data.sessions && result.data.sessions.length > 0) {
            setSessions(result.data.sessions);
            saveLocalSessions(result.data.sessions);
          }
          if (result.data.tasks && result.data.tasks.length > 0) {
            setTasks(result.data.tasks);
            saveLocalTasks(result.data.tasks);
          }
        }
      }
    };
    fetchCloud();
  }, [syncKey]);

  // 3. Debounced Auto-sync to Cloud whenever sessions or tasks change
  const syncTimeoutRef = useRef<any>(null);
  useEffect(() => {
    saveLocalSessions(sessions);
    saveLocalTasks(tasks);

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      if (syncKey) {
        setIsSyncing(true);
        const res = await syncToCloud(syncKey, sessions, tasks);
        setIsSyncing(false);
        if (res.success && res.serverTime) {
          setLastSyncedTime(res.serverTime);
        }
      }
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [sessions, tasks, syncKey]);

  // 4. Background deadline monitoring loop: check every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach((t) => {
        if (!t.completed && t.dueDate) {
          const dl = getDeadlineState(t.dueDate);
          if (dl.state === 'overdue' && !t.reminderDismissed) {
            sendBrowserNotification('⚠️ Việc Quá Hạn Cần Xử Lý', `Công việc: "${t.title}" (Người làm: ${t.assignee}) đã quá hạn.`);
          } else if (dl.state === 'due-today' && dl.hoursRemaining !== null && dl.hoursRemaining <= 1) {
            sendBrowserNotification('⏰ Sắp Đến Hạn', `Công việc: "${t.title}" sẽ đến hạn trong 1 giờ tới!`);
          }
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [tasks]);

  // Google sign in handler
  const handleGoogleSignIn = async () => {
    setIsLoggingIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser({
          uid: res.user.uid,
          email: res.user.email,
          displayName: res.user.displayName,
          photoURL: res.user.photoURL,
          accessToken: res.accessToken,
        });
        showToast(`Đã kết nối tài khoản Google: ${res.user.email}`);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      showToast('Đăng nhập Google thất bại hoặc đã hủy.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleSignOut = async () => {
    await googleSignOut();
    setGoogleUser(null);
    showToast('Đã đăng xuất Google.');
  };

  // Sync tasks to Google Tasks
  const handleSyncAllGoogleTasks = async () => {
    const token = getCachedAccessToken();
    if (!token) {
      showToast('Vui lòng đăng nhập Google trước để đồng bộ Google Tasks!');
      handleGoogleSignIn();
      return;
    }

    setIsSyncingGoogle(true);
    try {
      let count = 0;
      for (const t of tasks.filter((x) => !x.completed)) {
        await createGoogleTask(token, {
          title: `[WorkNotes] ${t.title} (${t.assignee})`,
          notes: `Ưu tiên: ${t.priority}\nHạn chót: ${t.dueDate || 'Không có'}\nGhi chú: ${t.notes || ''}`,
          due: t.dueDate ? new Date(t.dueDate).toISOString() : undefined,
        });
        count++;
      }
      showToast(`Đã đồng bộ thành công ${count} công việc lên Google Tasks trên điện thoại!`);
    } catch (err: any) {
      console.error('Google Tasks sync error:', err);
      showToast(`Lỗi khi đồng bộ Google Tasks: ${err.message}`);
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  // Work Session Handlers
  const handleNewSession = () => {
    const newSession: WorkSession = {
      id: 'session-' + Date.now(),
      title: 'Phiên làm việc mới ' + new Date().toLocaleDateString('vi-VN'),
      category: 'Dự án nội bộ',
      content: '',
      tags: ['mới'],
      pinned: false,
      priority: 'medium',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setCurrentTab('sessions');
  };

  const handleUpdateSession = (id: string, updates: Partial<WorkSession>) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s))
    );
  };

  const handleDeleteSession = (id: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa phiên làm việc này không?')) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (activeSessionId === id) {
        const remaining = sessions.filter((s) => s.id !== id);
        setActiveSessionId(remaining.length > 0 ? remaining[0].id : null);
      }
      showToast('Đã xóa phiên làm việc.');
    }
  };

  // AI Meeting Minutes Generation
  const handleGenerateMeetingMinutes = async (session: WorkSession) => {
    setIsGeneratingMinutes(true);
    try {
      const res = await fetch('/api/ai/meeting-minutes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteContent: session.content,
          sessionTitle: session.title,
          extraNotes: `Danh mục: ${session.category}. Thẻ: ${session.tags.join(', ')}`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.details || 'Lỗi từ dịch vụ AI');
      }

      const minutesData: MeetingMinutesData = {
        ...data.result,
        generatedAt: new Date().toISOString(),
      };

      // Attach to session
      handleUpdateSession(session.id, {
        meetingMinutes: minutesData,
      });

      setMinutesModalData(minutesData);
      setIsMinutesModalOpen(true);
      playReminderSound();
      showToast('Đã tạo Biên bản họp & Bảng phân công nhiệm vụ AI thành công!');
    } catch (err: any) {
      console.error('Generate minutes error:', err);
      showToast(`Không thể tạo biên bản họp: ${err.message}`);
    } finally {
      setIsGeneratingMinutes(false);
    }
  };

  // Quick Extract Tasks from Note
  const handleExtractTasksQuickly = async (text: string) => {
    setIsExtractingTasks(true);
    try {
      const res = await fetch('/api/ai/extract-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi trích xuất');
      }

      const extracted = data.result?.tasks || [];
      if (extracted.length === 0) {
        showToast('Không tìm thấy đầu việc rõ ràng trong ghi chú.');
        return;
      }

      const curSession = sessions.find((s) => s.id === activeSessionId);
      const newTasks: TaskItem[] = extracted.map((item: any, i: number) => ({
        id: 'task-ai-' + Date.now() + '-' + i,
        title: item.title,
        assignee: item.assignee || 'Tôi',
        dueDate: item.dueDate || new Date(Date.now() + 3600000 * 48).toISOString().slice(0, 16),
        priority: item.priority || 'medium',
        completed: false,
        sessionId: curSession?.id,
        sessionTitle: curSession?.title,
        notes: item.notes,
        createdAt: new Date().toISOString(),
      }));

      setTasks((prev) => [...newTasks, ...prev]);
      showToast(`Đã tự động trích xuất ${newTasks.length} công việc và thêm vào danh sách!`);
      setCurrentTab('tasks');
    } catch (err: any) {
      console.error('Extract tasks error:', err);
      showToast(`Lỗi trích xuất: ${err.message}`);
    } finally {
      setIsExtractingTasks(false);
    }
  };

  // Convert Meeting Minutes Action Items into Tasks
  const handleConvertActionItemsToTasks = (items: ActionItem[]) => {
    const curSession = sessions.find((s) => s.id === activeSessionId);
    const newTasks: TaskItem[] = items.map((item, i) => {
      // Normalize deadline into datetime or date
      let formattedDue = item.deadline;
      if (formattedDue && !formattedDue.includes(':') && !formattedDue.includes('T')) {
        formattedDue = `${formattedDue}T17:00`;
      }

      return {
        id: 'task-minutes-' + Date.now() + '-' + i,
        title: item.task,
        assignee: item.assignee,
        dueDate: formattedDue,
        priority: item.priority || 'medium',
        completed: false,
        sessionId: curSession?.id,
        sessionTitle: curSession?.title,
        notes: item.notes,
        createdAt: new Date().toISOString(),
      };
    });

    setTasks((prev) => [...newTasks, ...prev]);
    showToast(`Đã tạo ${newTasks.length} công việc có deadline vào danh sách theo dõi!`);
  };

  // Sync individual action items to Google Tasks
  const handleSyncActionItemsToGoogle = async (items: ActionItem[]) => {
    const token = getCachedAccessToken();
    if (!token) {
      showToast('Vui lòng đăng nhập Google trước để đồng bộ Google Tasks!');
      handleGoogleSignIn();
      return;
    }

    try {
      for (const item of items) {
        await createGoogleTask(token, {
          title: `[Họp] ${item.task} - Phụ trách: ${item.assignee}`,
          notes: `Đầu mối: ${item.assignee}\nƯu tiên: ${item.priority}\nGhi chú: ${item.notes || ''}`,
          due: item.deadline ? new Date(item.deadline).toISOString() : undefined,
        });
      }
      showToast(`Đã đồng bộ ${items.length} nhiệm vụ lên Google Tasks!`);
    } catch (err: any) {
      console.error('Google Tasks error:', err);
      showToast(`Lỗi khi tạo Google Task: ${err.message}`);
    }
  };

  // Task item operations
  const handleToggleTask = (taskId: string) => {
    playReminderSound();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? new Date().toISOString() : undefined,
            }
          : t
      )
    );
  };

  const handleAddTask = (newTaskData: Omit<TaskItem, 'id' | 'createdAt'>) => {
    const task: TaskItem = {
      ...newTaskData,
      id: 'task-' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [task, ...prev]);
    showToast(`Đã thêm công việc: ${task.title}`);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<TaskItem>) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t)));
    showToast('Đã cập nhật công việc.');
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    showToast('Đã xóa công việc.');
  };

  const handleDataLoadedFromCloudOrFile = (newSessions: WorkSession[], newTasks: TaskItem[]) => {
    setSessions(newSessions);
    setTasks(newTasks);
    if (newSessions.length > 0) {
      setActiveSessionId(newSessions[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/60 text-slate-900 font-sans antialiased flex flex-col">
      {/* Toast message */}
      {toastMessage && (
        <div
          id="app-toast-message"
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-3 max-w-sm flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        tasks={tasks}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        lastSyncedTime={lastSyncedTime}
        googleUser={googleUser}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
        isLoggingIn={isLoggingIn}
        onNewSession={handleNewSession}
        onNewTask={() => {
          setCurrentTab('tasks');
        }}
        isSyncing={isSyncing}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentTab === 'sessions' ? (
          <WorkSessionsView
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelectSession={setActiveSessionId}
            onNewSession={handleNewSession}
            onUpdateSession={handleUpdateSession}
            onDeleteSession={handleDeleteSession}
            onGenerateMeetingMinutes={handleGenerateMeetingMinutes}
            isGeneratingMinutes={isGeneratingMinutes}
            onOpenMinutesModal={(m) => {
              setMinutesModalData(m);
              setIsMinutesModalOpen(true);
            }}
            onExtractTasksQuickly={handleExtractTasksQuickly}
            isExtractingTasks={isExtractingTasks}
          />
        ) : (
          <TasksDeadlineView
            tasks={tasks}
            sessions={sessions}
            onToggleTask={handleToggleTask}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onSyncAllGoogleTasks={handleSyncAllGoogleTasks}
            hasGoogleAuth={!!googleUser}
            isSyncingGoogle={isSyncingGoogle}
            onSelectSession={(sid) => {
              setActiveSessionId(sid);
              setCurrentTab('sessions');
            }}
          />
        )}
      </main>

      {/* Meeting Minutes & Action Assignment Modal */}
      <MeetingMinutesModal
        isOpen={isMinutesModalOpen}
        onClose={() => setIsMinutesModalOpen(false)}
        minutes={minutesModalData}
        onConvertToTasks={handleConvertActionItemsToTasks}
        onSyncGoogleTasks={handleSyncActionItemsToGoogle}
        hasGoogleAuth={!!googleUser}
      />

      {/* Cloud Sync & Cross-device Recovery Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        syncKey={syncKey}
        onSyncKeyChange={setSyncKey}
        sessions={sessions}
        tasks={tasks}
        onDataLoaded={handleDataLoadedFromCloudOrFile}
        lastSyncedTime={lastSyncedTime}
        userEmail={googleUser?.email || null}
        onGoogleSignIn={handleGoogleSignIn}
        isLoggingIn={isLoggingIn}
      />
    </div>
  );
}
