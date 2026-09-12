import React, { useState } from 'react';
import {
  NotebookPen,
  Search,
  Plus,
  Pin,
  Sparkles,
  CheckSquare,
  Calendar,
  Tag,
  Trash2,
  Archive,
  RotateCcw,
  Copy,
  Check,
  Users,
  FileText,
  Clock,
  ChevronRight,
  Filter,
  FolderOpen,
} from 'lucide-react';
import { WorkSession, Priority, MeetingMinutesData, ActionItem } from '../types';

interface Props {
  sessions: WorkSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: () => void;
  onUpdateSession: (id: string, updates: Partial<WorkSession>) => void;
  onDeleteSession: (id: string) => void;
  onGenerateMeetingMinutes: (session: WorkSession) => Promise<void>;
  isGeneratingMinutes: boolean;
  onOpenMinutesModal: (minutes: MeetingMinutesData) => void;
  onExtractTasksQuickly: (text: string) => Promise<void>;
  isExtractingTasks: boolean;
}

export const WorkSessionsView: React.FC<Props> = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onUpdateSession,
  onDeleteSession,
  onGenerateMeetingMinutes,
  isGeneratingMinutes,
  onOpenMinutesModal,
  onExtractTasksQuickly,
  isExtractingTasks,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived' | 'pinned'>('all');
  const [newTagInput, setNewTagInput] = useState('');
  const [showMobileList, setShowMobileList] = useState(false);

  // Active session object
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0] || null;

  // Extract unique categories & tags
  const allCategories = Array.from(new Set(sessions.map((s) => s.category).filter(Boolean)));
  const allTags = Array.from(new Set(sessions.flatMap((s) => s.tags || [])));

  // Filtered sessions
  const filteredSessions = sessions.filter((s) => {
    // Status filter
    if (statusFilter === 'active' && s.status === 'archived') return false;
    if (statusFilter === 'archived' && s.status !== 'archived') return false;
    if (statusFilter === 'pinned' && !s.pinned) return false;

    // Category filter
    if (categoryFilter !== 'all' && s.category !== categoryFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = s.title.toLowerCase().includes(q);
      const matchContent = s.content.toLowerCase().includes(q);
      const matchTags = s.tags?.some((t) => t.toLowerCase().includes(q));
      const matchMinutes = s.meetingMinutes?.summary?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchTags && !matchMinutes) return false;
    }

    return true;
  });

  // Sort: pinned first, then newest updated
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  const handleAddTag = () => {
    if (!activeSession || !newTagInput.trim()) return;
    const cleanTag = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (!activeSession.tags.includes(cleanTag)) {
      onUpdateSession(activeSession.id, {
        tags: [...activeSession.tags, cleanTag],
        updatedAt: new Date().toISOString(),
      });
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeSession) return;
    onUpdateSession(activeSession.id, {
      tags: activeSession.tags.filter((t) => t !== tagToRemove),
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 items-start">
      {/* LEFT PANEL: Work Session Explorer & Scientific Filter List */}
      <div
        className={`w-full lg:w-80 xl:w-96 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[calc(100vh-140px)] shrink-0 overflow-hidden ${
          showMobileList ? 'block' : 'hidden lg:flex'
        }`}
      >
        {/* Panel Header & Search */}
        <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Kho Phiên Làm Việc ({sortedSessions.length})
              </h3>
            </div>
            <button
              id="sidebar-new-session-btn"
              onClick={() => {
                onNewSession();
                setShowMobileList(false);
              }}
              className="px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1 shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Tạo mới
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="search-sessions-input"
              type="text"
              placeholder="Tìm theo tiêu đề, nội dung, thẻ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          {/* Category & Status Filter */}
          <div className="grid grid-cols-2 gap-2">
            <select
              id="filter-session-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 outline-hidden"
            >
              <option value="all">Tất cả dự án</option>
              {allCategories.map((c, i) => (
                <option key={i} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              id="filter-session-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 outline-hidden"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang thực hiện</option>
              <option value="pinned">Đã ghim</option>
              <option value="archived">Đã lưu trữ</option>
            </select>
          </div>
        </div>

        {/* Sessions Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
          {sortedSessions.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <NotebookPen className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500">Không tìm thấy phiên làm việc phù hợp</p>
            </div>
          ) : (
            sortedSessions.map((session) => {
              const isSelected = activeSession?.id === session.id;
              return (
                <div
                  key={session.id}
                  id={`session-item-${session.id}`}
                  onClick={() => {
                    onSelectSession(session.id);
                    setShowMobileList(false);
                  }}
                  className={`p-3 rounded-xl cursor-pointer transition text-left group ${
                    isSelected
                      ? 'bg-indigo-50/80 border border-indigo-200'
                      : 'hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="text-xs font-bold text-slate-900 line-clamp-1 flex-1">
                      {session.title || 'Phiên chưa đặt tên'}
                    </span>
                    {session.pinned && (
                      <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">
                    {session.content || 'Chưa có nội dung ghi chép...'}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                      {session.category}
                    </span>

                    {session.meetingMinutes && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200 flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        Biên bản ({session.meetingMinutes.actionItems.length} việc)
                      </span>
                    )}

                    <span className="text-slate-400 ml-auto">
                      {new Date(session.updatedAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Workspace Editor & AI Meeting Minutes Workbench */}
      <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col h-[calc(100vh-140px)] overflow-hidden">
        {activeSession ? (
          <>
            {/* Workspace Top Toolbar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
              {/* Mobile Back / Toggle List Button */}
              <button
                id="toggle-mobile-sessions-btn"
                onClick={() => setShowMobileList(!showMobileList)}
                className="lg:hidden px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg flex items-center gap-1.5"
              >
                <FolderOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Danh sách phiên ({sessions.length})</span>
              </button>

              {/* Project / Category input or selector */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-500">Dự án:</span>
                <input
                  id="session-category-input"
                  type="text"
                  value={activeSession.category}
                  onChange={(e) =>
                    onUpdateSession(activeSession.id, {
                      category: e.target.value,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  placeholder="VD: Dự án Nâng Cấp..."
                  className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-hidden w-40 sm:w-52"
                />

                <span className="text-xs font-semibold text-slate-500 ml-2">Ưu tiên:</span>
                <select
                  id="session-priority-select"
                  value={activeSession.priority}
                  onChange={(e) =>
                    onUpdateSession(activeSession.id, {
                      priority: e.target.value as Priority,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  className="text-xs px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 outline-hidden"
                >
                  <option value="high">Cao</option>
                  <option value="medium">Trung bình</option>
                  <option value="low">Thấp</option>
                </select>

                <button
                  id="session-pin-toggle-btn"
                  onClick={() =>
                    onUpdateSession(activeSession.id, {
                      pinned: !activeSession.pinned,
                      updatedAt: new Date().toISOString(),
                    })
                  }
                  title={activeSession.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                  className={`p-1.5 rounded-lg border transition ${
                    activeSession.pinned
                      ? 'bg-amber-50 border-amber-300 text-amber-600'
                      : 'border-slate-200 text-slate-400 hover:text-slate-700'
                  }`}
                >
                  <Pin className={`w-3.5 h-3.5 ${activeSession.pinned ? 'fill-amber-500' : ''}`} />
                </button>
              </div>

              {/* AI & Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  id="generate-meeting-minutes-btn"
                  onClick={() => onGenerateMeetingMinutes(activeSession)}
                  disabled={isGeneratingMinutes || !activeSession.content.trim()}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingMinutes ? 'animate-spin' : 'text-amber-300'}`} />
                  <span>{isGeneratingMinutes ? 'AI đang soạn biên bản...' : 'Tạo Biên Bản Họp & Phân Công (AI)'}</span>
                </button>

                <button
                  id="quick-extract-tasks-btn"
                  onClick={() => onExtractTasksQuickly(activeSession.content)}
                  disabled={isExtractingTasks || !activeSession.content.trim()}
                  title="Tự động trích xuất các đầu việc cần làm từ văn bản ghi chép"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">
                    {isExtractingTasks ? 'Đang trích xuất...' : 'Trích xuất Todo'}
                  </span>
                </button>

                <button
                  id="delete-session-btn"
                  onClick={() => onDeleteSession(activeSession.id)}
                  title="Xóa phiên"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Session Title Bar */}
            <div className="px-6 pt-4 pb-2 border-b border-slate-100">
              <input
                id="session-title-input"
                type="text"
                value={activeSession.title}
                onChange={(e) =>
                  onUpdateSession(activeSession.id, {
                    title: e.target.value,
                    updatedAt: new Date().toISOString(),
                  })
                }
                placeholder="Nhập tiêu đề phiên làm việc hoặc cuộc họp..."
                className="w-full text-lg sm:text-xl font-extrabold text-slate-900 border-none outline-hidden placeholder:text-slate-300"
              />

              {/* Tags bar */}
              <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {activeSession.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium text-[11px]"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-slate-400 hover:text-slate-700 ml-0.5"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1">
                  <input
                    id="add-tag-input"
                    type="text"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    placeholder="+ Thêm thẻ..."
                    className="px-2 py-0.5 text-[11px] bg-slate-50 border border-slate-200 rounded-full outline-hidden w-24"
                  />
                  {newTagInput && (
                    <button
                      id="submit-tag-btn"
                      onClick={handleAddTag}
                      className="text-[11px] font-semibold text-indigo-600"
                    >
                      Thêm
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Attached Meeting Minutes Banner (if already generated) */}
            {activeSession.meetingMinutes && (
              <div className="mx-6 my-2 p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 flex flex-wrap items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <span>{activeSession.meetingMinutes.meetingTitle}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 font-semibold">
                        Đã có bảng giao việc ({activeSession.meetingMinutes.actionItems.length} nhiệm vụ)
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-600 line-clamp-1">
                      {activeSession.meetingMinutes.summary}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="view-minutes-btn"
                    onClick={() => onOpenMinutesModal(activeSession.meetingMinutes!)}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl transition shadow-xs flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Xem & Giao việc
                  </button>
                </div>
              </div>
            )}

            {/* Note Content Editor */}
            <div className="flex-1 p-6 flex flex-col">
              <textarea
                id="session-content-textarea"
                value={activeSession.content}
                onChange={(e) =>
                  onUpdateSession(activeSession.id, {
                    content: e.target.value,
                    updatedAt: new Date().toISOString(),
                  })
                }
                placeholder="Nhập nội dung phiên làm việc, trao đổi thảo luận, phân công hoặc ghi chép cuộc họp tại đây...

Ví dụ:
- Thành phần: Anh An (Chủ tọa), Tiếp (PM), Hà (Tech Lead)
- Trao đổi: Bàn giao hệ thống trước ngày 15/09, cần cấu hình máy chủ và kiểm thử tải.
- Giao việc: Hà phụ trách tài liệu kiến trúc, Tiếp phụ trách cấu hình server, deadline trong 3 ngày tới."
                className="w-full flex-1 p-4 bg-slate-50/40 hover:bg-slate-50/70 focus:bg-white border border-slate-200 rounded-2xl resize-none text-sm text-slate-800 leading-relaxed outline-hidden focus:ring-2 focus:ring-indigo-500 font-sans transition"
              />
            </div>

            {/* Bottom Meta Bar */}
            <div className="px-6 py-2 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Cập nhật lúc:{' '}
                {new Date(activeSession.updatedAt).toLocaleTimeString('vi-VN')},{' '}
                {new Date(activeSession.updatedAt).toLocaleDateString('vi-VN')}
              </span>
              <span>{activeSession.content.length} ký tự</span>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
            <NotebookPen className="w-12 h-12 text-slate-300" />
            <h4 className="text-base font-bold text-slate-700">Chưa chọn phiên làm việc</h4>
            <button
              id="empty-state-new-session-btn"
              onClick={onNewSession}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition"
            >
              + Tạo phiên làm việc mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
