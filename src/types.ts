export type Priority = 'low' | 'medium' | 'high';

export interface ActionItem {
  task: string;
  assignee: string;
  deadline: string;
  priority: Priority;
  notes?: string;
}

export interface MeetingMinutesData {
  meetingTitle: string;
  meetingDate: string;
  attendees: string[];
  summary: string;
  discussionPoints: string[];
  decisions: string[];
  actionItems: ActionItem[];
  markdownReport: string;
  generatedAt: string;
}

export interface WorkSession {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  pinned: boolean;
  priority: Priority;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
  meetingMinutes?: MeetingMinutesData;
}

export interface TaskItem {
  id: string;
  title: string;
  assignee: string;
  dueDate: string; // YYYY-MM-DD or YYYY-MM-DDTHH:mm
  priority: Priority;
  completed: boolean;
  completedAt?: string;
  sessionId?: string;
  sessionTitle?: string;
  notes?: string;
  googleTaskId?: string;
  reminderDismissed?: boolean;
  createdAt: string;
}

export interface CloudSyncPayload {
  userId: string;
  sessions: WorkSession[];
  tasks: TaskItem[];
  settings?: Record<string, any>;
  lastSyncedAt: string;
}

export interface GoogleUserInfo {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  accessToken: string | null;
}
