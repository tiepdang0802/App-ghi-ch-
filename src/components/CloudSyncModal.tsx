import React, { useState } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  Smartphone,
  Laptop,
  Key,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { WorkSession, TaskItem } from '../types';
import {
  exportDataAsJSON,
  syncToCloud,
  pullFromCloud,
  setCustomSyncKey,
} from '../services/storageService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  syncKey: string;
  onSyncKeyChange: (newKey: string) => void;
  sessions: WorkSession[];
  tasks: TaskItem[];
  onDataLoaded: (sessions: WorkSession[], tasks: TaskItem[]) => void;
  lastSyncedTime: string | null;
  userEmail: string | null;
  onGoogleSignIn: () => void;
  isLoggingIn: boolean;
}

export const CloudSyncModal: React.FC<Props> = ({
  isOpen,
  onClose,
  syncKey,
  onSyncKeyChange,
  sessions,
  tasks,
  onDataLoaded,
  lastSyncedTime,
  userEmail,
  onGoogleSignIn,
  isLoggingIn,
}) => {
  const [copiedKey, setCopiedKey] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleCopyKey = () => {
    navigator.clipboard.writeText(syncKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleManualPush = async () => {
    setIsSyncing(true);
    setStatusMessage(null);
    const result = await syncToCloud(syncKey, sessions, tasks);
    setIsSyncing(false);
    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: 'Đã tải và sao lưu toàn bộ ghi chú & công việc lên Cloud thành công!',
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: result.error || 'Lỗi khi đồng bộ lên Cloud',
      });
    }
  };

  const handlePullFromOtherDevice = async () => {
    if (!inputKey.trim()) return;
    setIsSyncing(true);
    setStatusMessage(null);
    const cleanKey = inputKey.trim().toUpperCase();
    const result = await pullFromCloud(cleanKey);
    setIsSyncing(false);

    if (result.success && result.data) {
      setCustomSyncKey(cleanKey);
      onSyncKeyChange(cleanKey);
      onDataLoaded(result.data.sessions || [], result.data.tasks || []);
      setStatusMessage({
        type: 'success',
        text: `Đã kết nối và tải thành công ${result.data.sessions?.length || 0} phiên làm việc & ${
          result.data.tasks?.length || 0
        } công việc từ thiết bị khác!`,
      });
      setInputKey('');
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Không tìm thấy dữ liệu trên Cloud với mã này. Hãy kiểm tra lại mã đã nhập.',
      });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.sessions && Array.isArray(parsed.sessions)) {
          onDataLoaded(parsed.sessions, parsed.tasks || []);
          setStatusMessage({
            type: 'success',
            text: `Khôi phục thành công từ file dự phòng! (${parsed.sessions.length} phiên, ${
              parsed.tasks?.length || 0
            } công việc)`,
          });
        } else {
          throw new Error('Định dạng file không đúng cấu trúc ứng dụng');
        }
      } catch (err: any) {
        setStatusMessage({
          type: 'error',
          text: `Lỗi đọc file: ${err.message}`,
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div
      id="cloud-sync-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Đồng Bộ Đám Mây & Bảo Vệ Dữ Liệu
              </h2>
              <p className="text-xs text-slate-500">
                Xem trên cả điện thoại & laptop, an toàn tuyệt đối khi hỏng máy hay đổi thiết bị
              </p>
            </div>
          </div>
          <button
            id="close-cloud-sync-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Status feedback */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs font-medium flex items-center gap-2.5 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Sync Key Card */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-blue-600" />
                Mã Đồng Bộ Đám Mây Của Bạn
              </span>
              <span className="text-xs text-slate-500">
                {lastSyncedTime
                  ? `Đồng bộ lần cuối: ${new Date(lastSyncedTime).toLocaleTimeString('vi-VN')}`
                  : 'Chưa đồng bộ'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-blue-200 px-3.5 py-2.5 rounded-xl font-mono text-sm font-bold text-slate-800 tracking-wider">
                {syncKey}
              </div>
              <button
                id="copy-sync-key-btn"
                onClick={handleCopyKey}
                className="px-3.5 py-2.5 text-xs font-bold text-blue-700 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-1.5 transition shadow-xs"
              >
                {copiedKey ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                {copiedKey ? 'Đã chép' : 'Sao chép'}
              </button>
              <button
                id="manual-push-sync-btn"
                onClick={handleManualPush}
                disabled={isSyncing}
                className="px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Đang lưu...' : 'Lưu lên Cloud'}
              </button>
            </div>
            <p className="text-xs text-blue-800/80 leading-relaxed">
              Nhập mã này trên bất kỳ máy tính, máy tính bảng hoặc điện thoại nào để xem và đồng bộ dữ liệu ngay lập tức.
            </p>
          </div>

          {/* Connect Another Device Section */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-slate-500" />
              Kết Nối & Tải Dữ Liệu Từ Máy Khác
            </h3>
            <p className="text-xs text-slate-500">
              Nếu bạn đã có ghi chú trên điện thoại hoặc máy tính cũ, dán mã đồng bộ vào đây:
            </p>
            <div className="flex gap-2">
              <input
                id="input-other-sync-key"
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="VD: CLOUDSYNC-842-X7K2"
                className="flex-1 px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-hidden"
              />
              <button
                id="pull-data-btn"
                onClick={handlePullFromOtherDevice}
                disabled={isSyncing || !inputKey.trim()}
                className="px-4 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition disabled:opacity-40"
              >
                Tải Dữ Liệu
              </button>
            </div>
          </div>

          {/* Google Account & Google Tasks Direct Sync */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                  Đồng Bộ Trực Tiếp Với Tài Khoản Google (Google Tasks)
                </h3>
                <p className="text-xs text-slate-500">
                  Tự động đồng bộ các deadline và nhiệm vụ vào ứng dụng Google Tasks trên điện thoại (Android & iOS).
                </p>
              </div>
            </div>

            {userEmail ? (
              <div className="flex items-center justify-between bg-emerald-50/70 border border-emerald-200 px-3.5 py-2.5 rounded-xl">
                <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Đã kết nối với: <strong>{userEmail}</strong></span>
                </div>
                <span className="text-xs text-emerald-700 font-semibold">Google Tasks Sẵn Sàng</span>
              </div>
            ) : (
              <button
                id="modal-google-signin-btn"
                onClick={onGoogleSignIn}
                disabled={isLoggingIn}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-2.5 text-xs font-bold text-slate-700 shadow-xs transition"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
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
                {isLoggingIn ? 'Đang kết nối Google...' : 'Đăng nhập Google để đồng bộ Google Tasks'}
              </button>
            )}
          </div>

          {/* Offline Backup & Restore Section */}
          <div className="rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              Sao Lưu & Khôi Phục Thủ Công (Phòng Khi Mất Máy)
            </h3>
            <div className="flex flex-wrap gap-2.5">
              <button
                id="export-json-backup-btn"
                onClick={() => exportDataAsJSON(sessions, tasks)}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                Tải file sao lưu (.json)
              </button>

              <label className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Khôi phục từ file .json</span>
                <input
                  id="import-backup-file-input"
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Dữ liệu tự động đồng bộ liên tục ngầm
          </span>
          <button
            id="modal-close-cloud-btn"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
