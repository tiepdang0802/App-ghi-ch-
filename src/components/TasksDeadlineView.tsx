import React, { useState } from 'react';
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  Search,
  Filter,
  Check,
  Bell,
  Sparkles,
  ArrowUpDown,
  Tag,
} from 'lucide-react';
import { TaskItem, WorkSession, Priority } from '../types';
import {
  getDeadlineState,
  formatVietnameseDateTime,
  playReminderSound,
  requestNotificationPermission,
  sendBrowserNotification,
} from '../utils/notifications';

interface Props {
  tasks: TaskItem[];
  sessions: WorkSession[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (task: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<TaskItem>) => void;
  onDeleteTask: (taskId: string) => void;
  onSyncAllGoogleTasks: () => void;
  hasGoogleAuth: boolean;
  isSyncingGoogle: boolean;
  onSelectSession: (sessionId: string) => void;
}

export const TasksDeadlineView: React.FC<Props> = ({
  tasks,
  sessions,
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSyncAllGoogleTasks,
  hasGoogleAuth,
  isSyncingGoogle,
  onSelectSession,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'overdue' | 'today' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Form states
  const [taskTitle, setTaskTitle] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPriority, setTaskPriority] = useState<Priority>('medium');
  const [taskSessionId, setTaskSessionId] = useState('');
  const [taskNotes, setTaskNotes] = useState('');

  // Extract unique assignees for filtering
  const allAssignees = Array.from(new Set(tasks.map((t) => t.assignee).filter(Boolean)));

  // Categorize
  const overdueTasks = tasks.filter((t) => !t.completed && getDeadlineState(t.dueDate).state === 'overdue');
  const dueTodayTasks = tasks.filter((t) => !t.completed && getDeadlineState(t.dueDate).state === 'due-today');
  const upcomingTasks = tasks.filter((t) => !t.completed && ['due-soon', 'upcoming'].includes(getDeadlineState(t.dueDate).state));
  const completedTasks = tasks.filter((t) => t.completed);

  // Filter list
  const filteredTasks = tasks.filter((t) => {
    // Tab filter
    if (filterTab === 'overdue') {
      if (t.completed || getDeadlineState(t.dueDate).state !== 'overdue') return false;
    } else if (filterTab === 'today') {
      if (t.completed || getDeadlineState(t.dueDate).state !== 'due-today') return false;
    } else if (filterTab === 'upcoming') {
      if (t.completed || !['due-soon', 'upcoming'].includes(getDeadlineState(t.dueDate).state)) return false;
    } else if (filterTab === 'completed') {
      if (!t.completed) return false;
    }

    // Assignee filter
    if (assigneeFilter !== 'all' && t.assignee !== assigneeFilter) return false;

    // Priority filter
    if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchAssignee = t.assignee?.toLowerCase().includes(q);
      const matchNotes = t.notes?.toLowerCase().includes(q);
      const matchSession = t.sessionTitle?.toLowerCase().includes(q);
      if (!matchTitle && !matchAssignee && !matchNotes && !matchSession) return false;
    }

    return true;
  });

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const matchedSession = sessions.find((s) => s.id === taskSessionId);

    if (editingTask) {
      onUpdateTask(editingTask.id, {
        title: taskTitle.trim(),
        assignee: taskAssignee.trim() || 'Tôi',
        dueDate: taskDueDate,
        priority: taskPriority,
        sessionId: taskSessionId || undefined,
        sessionTitle: matchedSession ? matchedSession.title : undefined,
        notes: taskNotes.trim() || undefined,
      });
      setEditingTask(null);
    } else {
      onAddTask({
        title: taskTitle.trim(),
        assignee: taskAssignee.trim() || 'Tôi',
        dueDate: taskDueDate,
        priority: taskPriority,
        completed: false,
        sessionId: taskSessionId || undefined,
        sessionTitle: matchedSession ? matchedSession.title : undefined,
        notes: taskNotes.trim() || undefined,
      });
      setIsAddingTask(false);
    }

    // Reset
    setTaskTitle('');
    setTaskAssignee('');
    setTaskDueDate('');
    setTaskPriority('medium');
    setTaskSessionId('');
    setTaskNotes('');
  };

  const startEdit = (task: TaskItem) => {
    setEditingTask(task);
    setTaskTitle(task.title);
    setTaskAssignee(task.assignee || '');
    setTaskDueDate(task.dueDate || '');
    setTaskPriority(task.priority);
    setTaskSessionId(task.sessionId || '');
    setTaskNotes(task.notes || '');
    setIsAddingTask(true);
  };

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    playReminderSound();
    if (granted) {
      sendBrowserNotification('Chuông Báo Việc WorkNotes', 'Hệ thống nhắc nhở công việc đến hạn đang hoạt động tốt!');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Overdue / Urgent Alert Banner */}
      {(overdueTasks.length > 0 || dueTodayTasks.length > 0) && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-xl shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950">
                Cảnh báo hạn chót: Có {overdueTasks.length} việc quá hạn & {dueTodayTasks.length} việc đến hạn hôm nay!
              </h3>
              <p className="text-xs text-rose-700">
                Hãy ưu tiên xử lý các đầu mục này để tránh ảnh hưởng tiến độ chung của nhóm.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="test-notification-btn"
              onClick={handleTestNotification}
              className="px-3 py-1.5 text-xs font-semibold text-rose-800 bg-rose-100 hover:bg-rose-200 rounded-lg flex items-center gap-1.5 transition"
            >
              <Bell className="w-3.5 h-3.5" />
              Bật âm báo & nhắc nhở
            </button>
            <button
              id="view-overdue-btn"
              onClick={() => setFilterTab('overdue')}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
            >
              Xem việc quá hạn ({overdueTasks.length})
            </button>
          </div>
        </div>
      )}

      {/* Main Top Controls Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="tab-tasks-all"
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                filterTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả ({tasks.length})
            </button>
            <button
              id="tab-tasks-overdue"
              onClick={() => setFilterTab('overdue')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                filterTab === 'overdue'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
            >
              Quá hạn ({overdueTasks.length})
            </button>
            <button
              id="tab-tasks-today"
              onClick={() => setFilterTab('today')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 ${
                filterTab === 'today'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Hôm nay ({dueTodayTasks.length})
            </button>
            <button
              id="tab-tasks-upcoming"
              onClick={() => setFilterTab('upcoming')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                filterTab === 'upcoming'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Sắp tới ({upcomingTasks.length})
            </button>
            <button
              id="tab-tasks-completed"
              onClick={() => setFilterTab('completed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                filterTab === 'completed'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Đã xong ({completedTasks.length})
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {hasGoogleAuth && (
              <button
                id="sync-all-google-tasks-btn"
                onClick={onSyncAllGoogleTasks}
                disabled={isSyncingGoogle}
                className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                {isSyncingGoogle ? 'Đang đồng bộ...' : 'Đồng bộ Google Tasks'}
              </button>
            )}

            <button
              id="open-add-task-form-btn"
              onClick={() => {
                setEditingTask(null);
                setTaskTitle('');
                setTaskAssignee('Tôi');
                setTaskDueDate(new Date(Date.now() + 3600000 * 24).toISOString().slice(0, 16));
                setTaskPriority('medium');
                setTaskNotes('');
                setIsAddingTask(true);
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Giao việc mới
            </button>
          </div>
        </div>

        {/* Filters row: Search & Assignee filter */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="search-tasks-input"
              type="text"
              placeholder="Tìm kiếm công việc, người phụ trách, ghi chú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-hidden"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Đầu mối:</span>
            <select
              id="filter-assignee-select"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white outline-hidden"
            >
              <option value="all">Tất cả người phụ trách</option>
              {allAssignees.map((a, i) => (
                <option key={i} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Ưu tiên:</span>
            <select
              id="filter-priority-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white outline-hidden"
            >
              <option value="all">Tất cả mức độ</option>
              <option value="high">Ưu tiên Cao</option>
              <option value="medium">Ưu tiên Trung bình</option>
              <option value="low">Ưu tiên Thấp</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inline Create / Edit Task Modal Form */}
      {isAddingTask && (
        <div className="bg-white rounded-2xl p-5 border-2 border-indigo-200 shadow-md animate-in slide-in-from-top-4">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            {editingTask ? 'Chỉnh Sửa Công Việc & Deadline' : 'Tạo Nhiệm Vụ Mới & Giao Việc'}
          </h3>
          <form onSubmit={handleSaveTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Task Title */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Tên công việc cần làm *</label>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  placeholder="VD: Nộp báo cáo tuần, Gửi hợp đồng cho đối tác..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden font-medium"
                />
              </div>

              {/* Assignee */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Đầu mối chịu trách nhiệm (Assignee)</label>
                <input
                  id="task-assignee-input"
                  type="text"
                  placeholder="VD: Đặng Viết Tiếp (Tôi), Trần Thu Hà..."
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>

              {/* Due Date */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Hạn chót hoàn thành (Deadline) *</label>
                <input
                  id="task-duedate-input"
                  type="datetime-local"
                  required
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden font-mono"
                />
              </div>

              {/* Priority */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Mức độ ưu tiên</label>
                <select
                  id="task-priority-input"
                  value={taskPriority}
                  onChange={(e) => setTaskPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="high">Cao (Cần xử lý gấp)</option>
                  <option value="medium">Trung bình (Bình thường)</option>
                  <option value="low">Thấp (Có thể hoãn)</option>
                </select>
              </div>

              {/* Associated Work Session */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Thuộc phiên họp / dự án</label>
                <select
                  id="task-session-input"
                  value={taskSessionId}
                  onChange={(e) => setTaskSessionId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                >
                  <option value="">-- Không gắn phiên cụ thể --</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Ghi chú thêm & tiêu chí hoàn thành</label>
                <textarea
                  id="task-notes-input"
                  rows={2}
                  placeholder="Ghi chú chi tiết kết quả cần đạt, đường link tài liệu hoặc yêu cầu..."
                  value={taskNotes}
                  onChange={(e) => setTaskNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                id="cancel-add-task-btn"
                onClick={() => {
                  setIsAddingTask(false);
                  setEditingTask(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                id="submit-save-task-btn"
                className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition shadow-xs"
              >
                {editingTask ? 'Cập nhật' : 'Lưu công việc'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-3">
            <Clock className="w-12 h-12 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-700">Không có công việc nào trong danh mục này</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Bạn có thể tự tạo công việc mới hoặc sử dụng tính năng <strong>Biên bản họp AI</strong> trong Phiên làm việc để trích xuất tự động.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const dl = getDeadlineState(task.dueDate);
            return (
              <div
                key={task.id}
                id={`task-item-${task.id}`}
                className={`group rounded-2xl p-4 transition border bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  task.completed
                    ? 'opacity-60 bg-slate-50/80 border-slate-200'
                    : dl.state === 'overdue'
                    ? 'border-rose-300 hover:border-rose-400 bg-rose-50/20'
                    : dl.state === 'due-today'
                    ? 'border-amber-300 hover:border-amber-400 bg-amber-50/20'
                    : 'border-slate-200 hover:border-indigo-200 hover:shadow-sm'
                }`}
              >
                {/* Left: Checkbox & Info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    id={`toggle-task-${task.id}`}
                    onClick={() => onToggleTask(task.id)}
                    className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                      task.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 hover:border-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-sm font-bold text-slate-900 break-words ${
                          task.completed ? 'line-through text-slate-500 font-normal' : ''
                        }`}
                      >
                        {task.title}
                      </span>

                      {/* Deadline Badge */}
                      <span className={`px-2 py-0.5 rounded-md text-[11px] ${dl.badgeClass}`}>
                        {dl.label}
                      </span>

                      {/* Priority Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                          task.priority === 'high'
                            ? 'bg-rose-100 text-rose-700'
                            : task.priority === 'medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {task.priority === 'high'
                          ? 'Cao'
                          : task.priority === 'medium'
                          ? 'Trung bình'
                          : 'Thấp'}
                      </span>
                    </div>

                    {/* Meta info row: Assignee, Due Date, Session */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <User className="w-3 h-3 text-slate-400" />
                        {task.assignee}
                      </span>

                      {task.dueDate && (
                        <span className="flex items-center gap-1 text-slate-600 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Hạn: {formatVietnameseDateTime(task.dueDate)}
                        </span>
                      )}

                      {task.sessionTitle && task.sessionId && (
                        <button
                          id={`link-session-${task.id}`}
                          onClick={() => onSelectSession(task.sessionId!)}
                          className="flex items-center gap-1 text-indigo-600 hover:underline"
                        >
                          <Tag className="w-3 h-3 text-indigo-400" />
                          <span>Từ: {task.sessionTitle}</span>
                        </button>
                      )}
                    </div>

                    {/* Notes if any */}
                    {task.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-2xl">
                        {task.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    id={`edit-task-btn-${task.id}`}
                    onClick={() => startEdit(task)}
                    title="Chỉnh sửa"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    id={`delete-task-btn-${task.id}`}
                    onClick={() => onDeleteTask(task.id)}
                    title="Xóa công việc"
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
