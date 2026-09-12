import React from 'react';
import {
  NotebookPen,
  Clock,
  Cloud,
  CheckCircle2,
  Bell,
  AlertTriangle,
  Smartphone,
  Plus,
  FileCheck2,
  LogOut,
  RefreshCw,
  Search,
} from 'lucide-react';
import { TaskItem, GoogleUserInfo } from '../types';
import { getDeadlineState } from '../utils/notifications';

interface Props {
  currentTab: 'sessions' | 'tasks';
  onTabChange: (tab: 'sessions' | 'tasks') => void;
  tasks: TaskItem[];
  onOpenSyncModal: () => void;
  lastSyncedTime: string | null;
  googleUser: GoogleUserInfo | null;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
  isLoggingIn: boolean;
  onNewSession: () => void;
  onNewTask: () => void;
  isSyncing: boolean;
}

export const Header: React.FC<Props> = ({
  currentTab,
  onTabChange,
  tasks,
  onOpenSyncModal,
  lastSyncedTime,
  googleUser,
  onGoogleSignIn,
  onGoogleSignOut,
  isLoggingIn,
  onNewSession,
  onNewTask,
  isSyncing,
}) => {
  // Calculate overdue & due today tasks
  const overdueCount = tasks.filter((t) => !t.completed && getDeadlineState(t.dueDate).state === 'overdue').length;
  const dueTodayCount = tasks.filter((t) => !t.completed && getDeadlineState(t.dueDate).state === 'due-today').length;
  const urgentCount = overdueCount + dueTodayCount;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* App Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-xs">
              <NotebookPen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-slate-900 tracking-tight">
                  WorkNotes
                </h1>
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Cá Nhân & AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Ghi chú • Nhắc việc đến hạn • Biên bản họp AI • Đồng bộ Cloud
              </p>
            </div>
          </div>

          {/* Navigation View Switcher */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              id="nav-sessions-tab"
              onClick={() => onTabChange('sessions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                currentTab === 'sessions'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <NotebookPen className="w-3.5 h-3.5" />
              <span>Phiên Làm Việc</span>
            </button>

            <button
              id="nav-tasks-tab"
              onClick={() => onTabChange('tasks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition relative ${
                currentTab === 'tasks'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Việc Đến Hạn</span>
              {urgentCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {urgentCount}
                </span>
              )}
            </button>
          </div>

          {/* Action Bar Right */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cloud Sync Status / Modal Trigger */}
            <button
              id="header-cloud-sync-btn"
              onClick={onOpenSyncModal}
              title="Xem thông tin đồng bộ đám mây và mở trên điện thoại"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 transition"
            >
              <Cloud
                className={`w-3.5 h-3.5 ${isSyncing ? 'text-blue-500 animate-spin' : 'text-blue-600'}`}
              />
              <span className="hidden md:inline font-medium">
                {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ Cloud'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </button>

            {/* Google Sign In / Tasks Sync Button */}
            {googleUser ? (
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2.5 py-1 bg-white">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-700 max-w-[100px] truncate hidden lg:inline">
                  {googleUser.displayName || googleUser.email}
                </span>
                <button
                  id="header-google-signout-btn"
                  onClick={onGoogleSignOut}
                  title="Đăng xuất Google"
                  className="text-slate-400 hover:text-rose-600 p-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="header-google-signin-btn"
                onClick={onGoogleSignIn}
                disabled={isLoggingIn}
                className="gsi-material-button hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google Tasks</span>
              </button>
            )}

            {/* Quick New Button */}
            {currentTab === 'sessions' ? (
              <button
                id="header-create-session-btn"
                onClick={onNewSession}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Phiên Mới</span>
              </button>
            ) : (
              <button
                id="header-create-task-btn"
                onClick={onNewTask}
                className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Việc Mới</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
