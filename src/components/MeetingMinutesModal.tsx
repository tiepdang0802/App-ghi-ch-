import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Users,
  CheckSquare,
  Copy,
  Check,
  Download,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  ListOrdered,
  FileText,
} from 'lucide-react';
import { MeetingMinutesData, ActionItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  minutes: MeetingMinutesData | null;
  onConvertToTasks: (items: ActionItem[]) => void;
  onSyncGoogleTasks?: (items: ActionItem[]) => void;
  hasGoogleAuth: boolean;
}

export const MeetingMinutesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  minutes,
  onConvertToTasks,
  onSyncGoogleTasks,
  hasGoogleAuth,
}) => {
  const [activeTab, setActiveTab] = useState<'actions' | 'full' | 'raw'>('actions');
  const [copied, setCopied] = useState(false);
  const [tasksConverted, setTasksConverted] = useState(false);
  const [syncedGoogle, setSyncedGoogle] = useState(false);

  if (!isOpen || !minutes) return null;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(minutes.markdownReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([minutes.markdownReport], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bien-ban-hop-${minutes.meetingDate || 'ngay'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConvert = () => {
    onConvertToTasks(minutes.actionItems);
    setTasksConverted(true);
    setTimeout(() => setTasksConverted(false), 3000);
  };

  const handleSyncGoogle = () => {
    if (onSyncGoogleTasks) {
      onSyncGoogleTasks(minutes.actionItems);
      setSyncedGoogle(true);
      setTimeout(() => setSyncedGoogle(false), 3000);
    }
  };

  return (
    <div
      id="meeting-minutes-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Biên Bản Họp & Bảng Giao Việc Tự Động
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-100 text-indigo-700 rounded-full">
                  AI Gemini
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Tạo tự động từ ghi chú phiên làm việc với phân công đầu mối & deadline
              </p>
            </div>
          </div>
          <button
            id="close-meeting-minutes-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="px-6 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="flex gap-4">
            <button
              id="tab-action-items-btn"
              onClick={() => setActiveTab('actions')}
              className={`py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'actions'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              Bảng Giao Việc & Deadline ({minutes.actionItems.length})
            </button>
            <button
              id="tab-full-report-btn"
              onClick={() => setActiveTab('full')}
              className={`py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'full'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              Toàn Văn Biên Bản
            </button>
            <button
              id="tab-raw-markdown-btn"
              onClick={() => setActiveTab('raw')}
              className={`py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
                activeTab === 'raw'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Copy className="w-4 h-4" />
              Định Dạng Markdown
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="copy-minutes-btn"
              onClick={handleCopyMarkdown}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Đã sao chép!' : 'Sao chép'}
            </button>
            <button
              id="download-minutes-btn"
              onClick={handleDownload}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Tải file
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Meeting Info Banner */}
          <div className="bg-indigo-50/60 rounded-xl p-4 border border-indigo-100 flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-base">{minutes.meetingTitle}</h3>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  {minutes.meetingDate || 'Hôm nay'}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  {minutes.attendees && minutes.attendees.length > 0
                    ? minutes.attendees.join(', ')
                    : 'Các thành viên tham dự'}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Content: Action Items */}
          {activeTab === 'actions' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Bảng Phân Công Nhiệm Vụ & Hạn Chót
                  </h4>
                  <p className="text-xs text-slate-500">
                    Các đầu việc được AI phân tích với người phụ trách cụ thể và mốc deadline
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    id="convert-to-tasks-btn"
                    onClick={handleConvert}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 shadow-xs transition"
                  >
                    {tasksConverted ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        Đã thêm vào Công việc!
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4" />
                        Thêm vào Danh Sách Công Việc
                      </>
                    )}
                  </button>

                  {hasGoogleAuth && (
                    <button
                      id="sync-to-google-tasks-modal-btn"
                      onClick={handleSyncGoogle}
                      className="px-3 py-2 text-xs font-medium text-slate-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition"
                    >
                      {syncedGoogle ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      Đồng bộ Google Tasks
                    </button>
                  )}
                </div>
              </div>

              {/* Action Items Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-semibold text-xs border-b border-slate-200">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Nhiệm vụ cụ thể</th>
                      <th className="py-3 px-4 w-44">Đầu mối phụ trách</th>
                      <th className="py-3 px-4 w-36">Thời hạn (Deadline)</th>
                      <th className="py-3 px-4 w-28">Ưu tiên</th>
                      <th className="py-3 px-4">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 bg-white">
                    {minutes.actionItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-indigo-50/30 transition">
                        <td className="py-3 px-4 text-center font-semibold text-slate-400 text-xs">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900">
                          {item.task}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                            {item.assignee}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            <Calendar className="w-3 h-3" />
                            {item.deadline}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                              item.priority === 'high'
                                ? 'bg-rose-100 text-rose-700'
                                : item.priority === 'medium'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.priority === 'high'
                              ? 'Cao'
                              : item.priority === 'medium'
                              ? 'Trung bình'
                              : 'Thấp'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">
                          {item.notes || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab Content: Full Report */}
          {activeTab === 'full' && (
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Tóm Tắt & Mục Tiêu Cuộc Họp
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-sm leading-relaxed">
                  {minutes.summary}
                </div>
              </div>

              {/* Discussion Points */}
              {minutes.discussionPoints && minutes.discussionPoints.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ListOrdered className="w-4 h-4 text-indigo-600" />
                    Các Nội Dung Thảo Luận Chính
                  </h4>
                  <ul className="space-y-2">
                    {minutes.discussionPoints.map((pt, i) => (
                      <li
                        key={i}
                        className="p-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-800 flex items-start gap-2.5"
                      >
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Key Decisions */}
              {minutes.decisions && minutes.decisions.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    Kết Luận & Quyết Định Thống Nhất
                  </h4>
                  <div className="space-y-2">
                    {minutes.decisions.map((dec, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-emerald-50/70 border border-emerald-200/70 text-sm text-emerald-950 flex items-start gap-2.5 font-medium"
                      >
                        <Check className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span>{dec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Raw Markdown */}
          {activeTab === 'raw' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Định dạng Markdown tiêu chuẩn có thể dán vào email, Word hoặc Notion
                </span>
              </div>
              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[450px]">
                {minutes.markdownReport}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {minutes.actionItems.length} nhiệm vụ được gán thời hạn hoàn thành
          </span>
          <div className="flex items-center gap-3">
            <button
              id="modal-secondary-close-btn"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-xl transition"
            >
              Đóng
            </button>
            <button
              id="modal-primary-convert-btn"
              onClick={handleConvert}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-2 transition shadow-xs"
            >
              <CheckSquare className="w-4 h-4" />
              Tạo công việc vào hệ thống
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
