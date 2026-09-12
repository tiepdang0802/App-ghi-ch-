import { WorkSession, TaskItem, CloudSyncPayload } from '../types';

const STORAGE_KEY_SESSIONS = 'worknotes_sessions_v1';
const STORAGE_KEY_TASKS = 'worknotes_tasks_v1';
const STORAGE_KEY_SYNC_ID = 'worknotes_sync_user_id';
const STORAGE_KEY_LAST_SYNCED = 'worknotes_last_synced';

export function getOrCreateSyncKey(): string {
  let key = localStorage.getItem(STORAGE_KEY_SYNC_ID);
  if (!key) {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const num = Math.floor(100 + Math.random() * 900);
    key = `CLOUDSYNC-${num}-${randomHex}`;
    localStorage.setItem(STORAGE_KEY_SYNC_ID, key);
  }
  return key;
}

export function setCustomSyncKey(key: string) {
  localStorage.setItem(STORAGE_KEY_SYNC_ID, key.trim().toUpperCase());
}

// Initial realistic default data for first-time use
const DEFAULT_SESSIONS: WorkSession[] = [
  {
    id: 'session-demo-1',
    title: 'Họp Kick-off Dự án Nâng cấp Hệ thống & Phân công Quý 3',
    category: 'Dự án Công nghệ',
    content: `Cuộc họp khởi động dự án nâng cấp kiến trúc và chuyển đổi số quý 3.
Thành phần: Nguyễn Văn An (Trưởng ban), Đặng Viết Tiếp (PM), Trần Thu Hà (Tech Lead), Lê Quang Hải (QA Lead).

Nội dung trao đổi:
- Khảo sát hạ tầng hiện tại: Server tải cao vào khung giờ 9h-11h sáng, cần bổ sung bộ đệm Redis và cân bằng tải.
- Tích hợp tính năng đồng bộ tự động với Google Workspace và phân quyền đầu mối.
- Thời gian chạy thử nghiệm (UAT) dự kiến vào đầu tháng sau.

Các thống nhất quan trọng:
1. Đồng ý phương án chuyển đổi dữ liệu phân kỳ, tránh gián đoạn dịch vụ.
2. Thiết lập quy trình báo cáo tiến độ 2 ngày/lần trên bảng điều khiển.
3. Kiểm thử bảo mật độc lập trước khi nghiệm thu bàn giao.`,
    tags: ['dự-án', 'quý-3', 'hạ-tầng', 'họp-toàn-thể'],
    pinned: true,
    priority: 'high',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    meetingMinutes: {
      meetingTitle: 'Biên Bản Họp Khởi Động Dự Án Nâng Cấp Hệ Thống Q3',
      meetingDate: '2026-09-10',
      attendees: ['Nguyễn Văn An (Trưởng ban)', 'Đặng Viết Tiếp (PM)', 'Trần Thu Hà (Tech Lead)', 'Lê Quang Hải (QA)'],
      summary: 'Thống nhất kế hoạch triển khai nâng cấp hạ tầng, bổ sung bộ đệm và tích hợp đồng bộ dữ liệu chuẩn bị cho UAT.',
      discussionPoints: [
        'Đánh giá tải hệ thống hiện tại và đề xuất hạ tầng phân tán',
        'Lộ trình tích hợp API Google Workspace và cơ chế đồng bộ đa thiết bị',
        'Kế hoạch kiểm thử an toàn thông tin và dự phòng rủi ro',
      ],
      decisions: [
        'Phê duyệt kinh phí bổ sung máy chủ thử nghiệm',
        'Chốt mốc bàn giao bản thử nghiệm UAT',
        'Áp dụng cơ chế phân công nhiệm vụ có deadline cụ thể cho từng đầu mối',
      ],
      actionItems: [
        {
          task: 'Hoàn thiện tài liệu kiến trúc kỹ thuật & sơ đồ cơ sở dữ liệu',
          assignee: 'Trần Thu Hà (Tech Lead)',
          deadline: new Date(Date.now() + 3600000 * 24 * 2).toISOString().split('T')[0],
          priority: 'high',
          notes: 'Gửi bản dự thảo cho Trưởng ban duyệt',
        },
        {
          task: 'Cấu hình cụm máy chủ thử nghiệm và tích hợp cơ chế đồng bộ Cloud',
          assignee: 'Đặng Viết Tiếp (PM)',
          deadline: new Date(Date.now() + 3600000 * 24 * 3).toISOString().split('T')[0],
          priority: 'high',
          notes: 'Đảm bảo test trên cả điện thoại di động và laptop',
        },
        {
          task: 'Xây dựng kịch bản kiểm thử tải UAT và tiêu chí nghiệm thu',
          assignee: 'Lê Quang Hải (QA)',
          deadline: new Date(Date.now() + 3600000 * 24 * 5).toISOString().split('T')[0],
          priority: 'medium',
          notes: 'Tập trung vào 5 luồng nghiệp vụ cốt lõi',
        },
      ],
      markdownReport: `# CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
Độc lập - Tự do - Hạnh phúc
---
## BIÊN BẢN HỌP KHỞI ĐỘNG DỰ ÁN NÂNG CẤP HỆ THỐNG
*Thời gian: 09:00, ngày 10/09/2026*
*Địa điểm: Phòng họp tầng 5 & Trực tuyến qua Google Meet*

### I. THÀNH PHẦN THAM DỰ
1. Ông Nguyễn Văn An - Chủ tọa, Trưởng ban
2. Ông Đặng Viết Tiếp - Quản lý dự án (PM)
3. Bà Trần Thu Hà - Trưởng nhóm Kỹ thuật (Tech Lead)
4. Ông Lê Quang Hải - Trưởng nhóm Kiểm thử (QA Lead)

### II. NỘI DUNG THẢO LUẬN & KẾT LUẬN
- Thống nhất giải pháp mở rộng hạ tầng đám mây và tối ưu hoá bộ nhớ đệm.
- Thiết lập quy chế đồng bộ công việc và cảnh báo hạn chót tự động.

### III. BẢNG PHÂN CÔNG NHIỆM VỤ (ACTION ITEMS)
| STT | Nhiệm vụ cụ thể | Đầu mối phụ trách | Thời hạn (Deadline) | Mức độ ưu tiên |
|---|---|---|---|---|
| 1 | Hoàn thiện tài liệu kiến trúc kỹ thuật | Trần Thu Hà | 2 ngày tới | Cao |
| 2 | Cấu hình máy chủ thử nghiệm & Cloud sync | Đặng Viết Tiếp | 3 ngày tới | Cao |
| 3 | Xây dựng kịch bản kiểm thử UAT | Lê Quang Hải | 5 ngày tới | Trung bình |`,
      generatedAt: new Date().toISOString(),
    },
  },
  {
    id: 'session-demo-2',
    title: 'Ghi chép Thảo luận Khách hàng VIP & Yêu cầu Hợp đồng Mới',
    category: 'Quan hệ Đối tác',
    content: `Gặp gỡ đại diện đối tác chiến lược để thống nhất điều khoản bổ sung.
Ghi chú chính:
- Đối tác yêu cầu hỗ trợ xem và thao tác trên cả điện thoại di động không bị trễ.
- Yêu cầu lưu trữ dữ liệu an toàn, khi đổi máy tính không bị gián đoạn.
- Cần hoàn thành bản báo giá trước 17h00 ngày mai.`,
    tags: ['khách-hàng', 'hợp-đồng', 'gấp'],
    pinned: false,
    priority: 'high',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'session-demo-3',
    title: 'Kế hoạch phát triển cá nhân & Nghiên cứu Công nghệ Tuần này',
    category: 'Học tập & Cá nhân',
    content: `Mục tiêu tuần:
- Nghiên cứu mô hình Gemini AI mới nhất để tự động hóa biên bản cuộc họp.
- Tối ưu hóa UI/UX cho phiên bản di động để trải nghiệm mượt mà như native app.
- Hoàn thành báo cáo tổng kết tháng gửi Giám đốc điều hành.`,
    tags: ['cá-nhân', 'nghiên-cứu', 'ai'],
    pinned: false,
    priority: 'medium',
    status: 'active',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 30).toISOString(),
  },
];

const DEFAULT_TASKS: TaskItem[] = [
  {
    id: 'task-1',
    title: 'Nộp báo cáo tài chính & tiến độ dự án tuần cho Ban Giám đốc',
    assignee: 'Đặng Viết Tiếp (Tôi)',
    dueDate: new Date(Date.now() + 3600000 * 4).toISOString().slice(0, 16), // Due in 4 hours today!
    priority: 'high',
    completed: false,
    sessionId: 'session-demo-1',
    sessionTitle: 'Họp Kick-off Dự án Nâng cấp Hệ thống',
    notes: 'Kèm bảng phụ lục chi phí và số liệu server',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Gửi biên bản họp & bảng phân công deadline cho các phòng ban',
    assignee: 'Thư ký / Tôi',
    dueDate: new Date(Date.now() + 3600000 * 20).toISOString().slice(0, 16), // Due tomorrow
    priority: 'high',
    completed: false,
    sessionId: 'session-demo-1',
    sessionTitle: 'Họp Kick-off Dự án Nâng cấp Hệ thống',
    notes: 'Đính kèm bản xuất PDF/Markdown',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Gặp đối tác phản hồi phương án điều khoản bảo mật',
    assignee: 'Đặng Viết Tiếp',
    dueDate: new Date(Date.now() + 3600000 * 48).toISOString().slice(0, 16),
    priority: 'medium',
    completed: false,
    sessionId: 'session-demo-2',
    sessionTitle: 'Ghi chép Thảo luận Khách hàng VIP',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'Thử nghiệm đồng bộ dữ liệu đám mây trên thiết bị di động',
    assignee: 'Đặng Viết Tiếp',
    dueDate: new Date(Date.now() - 3600000 * 5).toISOString().slice(0, 16), // Overdue by 5 hours!
    priority: 'high',
    completed: false,
    notes: 'Đã quá hạn cần xử lý gấp để nghiệm thu',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'task-5',
    title: 'Đăng ký tài khoản thử nghiệm Google Cloud Developer',
    assignee: 'Đặng Viết Tiếp',
    dueDate: new Date(Date.now() - 3600000 * 48).toISOString().slice(0, 16),
    priority: 'low',
    completed: true,
    completedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 3600000 * 60).toISOString(),
  },
];

export function loadLocalSessions(): WorkSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading sessions from localStorage:', err);
  }
  saveLocalSessions(DEFAULT_SESSIONS);
  return DEFAULT_SESSIONS;
}

export function saveLocalSessions(sessions: WorkSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch (err) {
    console.error('Error saving sessions to localStorage:', err);
  }
}

export function loadLocalTasks(): TaskItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TASKS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading tasks from localStorage:', err);
  }
  saveLocalTasks(DEFAULT_TASKS);
  return DEFAULT_TASKS;
}

export function saveLocalTasks(tasks: TaskItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
  } catch (err) {
    console.error('Error saving tasks to localStorage:', err);
  }
}

export function getLastSyncedTime(): string | null {
  return localStorage.getItem(STORAGE_KEY_LAST_SYNCED);
}

export function setLastSyncedTime(time: string) {
  localStorage.setItem(STORAGE_KEY_LAST_SYNCED, time);
}

// Push local data up to the Server Cloud Store
export async function syncToCloud(
  userId: string,
  sessions: WorkSession[],
  tasks: TaskItem[],
): Promise<{ success: boolean; serverTime?: string; error?: string }> {
  try {
    const res = await fetch('/api/cloud/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        sessions,
        tasks,
        lastSyncedAt: new Date().toISOString(),
      }),
    });
    const result = await res.json();
    if (result.success) {
      setLastSyncedTime(result.serverTime || new Date().toISOString());
      return { success: true, serverTime: result.serverTime };
    } else {
      return { success: false, error: result.error || 'Đồng bộ thất bại' };
    }
  } catch (err: any) {
    console.error('syncToCloud error:', err);
    return { success: false, error: err.message };
  }
}

// Pull data from Cloud Store into local
export async function pullFromCloud(
  userId: string,
): Promise<{ success: boolean; data?: CloudSyncPayload | null; error?: string }> {
  try {
    const res = await fetch(`/api/cloud/data/${encodeURIComponent(userId)}`);
    const result = await res.json();
    if (result.success) {
      return { success: true, data: result.data };
    }
    return { success: false, error: result.message || 'Không thể tải dữ liệu từ Cloud' };
  } catch (err: any) {
    console.error('pullFromCloud error:', err);
    return { success: false, error: err.message };
  }
}

// Export complete data for offline backup
export function exportDataAsJSON(sessions: WorkSession[], tasks: TaskItem[]) {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    appName: 'Ghi Chú Công Việc Cá Nhân',
    version: '1.0.0',
    sessions,
    tasks,
  };
  const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ghi-chu-sao-luu-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
