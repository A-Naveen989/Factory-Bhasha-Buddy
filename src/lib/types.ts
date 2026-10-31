export type Language = 'en' | 'hi' | 'ta' | 'te';
export type LocalizedText = Record<Language, string>;

export type Result<T> = { ok: true; data: T } | { ok: false; error: string };

export type Intent = 'SHIFT_INFO' | 'SAFETY_INFO' | 'NOTICE_QUERY' | 'COMPLAINT' | 'OTHER';
export type ComplaintCategory = 'unsafe' | 'unpaid_salary' | 'harassment' | 'other';
export type ComplaintStatus = 'new' | 'reviewing' | 'resolved';
export type NoticeEventType = 'play' | 'replay' | 'not_clear' | 'understood';
export type NoticeCategory = 'general' | 'safety' | 'payroll' | 'policy';
export type ShiftType = 'day' | 'night';

export interface Department {
  id: string;
  name: string;
}

export interface Worker {
  id: string;
  language: Language;
  department_id: string | null;
}

export interface Shift {
  id: string;
  department_id: string;
  shift_type: ShiftType;
  start_time: string;
  end_time: string;
  location: string;
}

export interface SafetyTopic {
  id: string;
  name: string;
  guidance: LocalizedText;
}

export interface NoticeTranslation {
  notice_id: string;
  language: Language;
  voice_script: string;
  key_points: string[];
}

export interface Notice {
  id: string;
  title: string;
  category: NoticeCategory;
  department_id: string | null;
  topic_id: string | null;
  full_text: string;
  created_at: string;
  notice_translations: NoticeTranslation[];
}

export interface NoticeEvent {
  worker_id: string;
  notice_id: string;
  event: NoticeEventType;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  topic_id: string;
  image_a_url: string;
  image_b_url: string;
  correct_option: 0 | 1;
  prompt: LocalizedText;
  explanation: LocalizedText;
  sort_order: number;
}

export interface QuizAttempt {
  worker_id: string;
  question_id: string;
  chosen_option: 0 | 1;
  is_correct: boolean;
  language: Language;
  created_at: string;
}

export interface VoiceQuery {
  worker_id: string;
  language: Language;
  intent: Intent;
  topic_id: string | null;
  raw_text: string;
  created_at: string;
}

export interface Complaint {
  id: string;
  tracking_id: string;
  worker_id: string | null;
  category: ComplaintCategory;
  raw_text: string;
  language: Language;
  structured_summary: string;
  department_id: string | null;
  status: ComplaintStatus;
  created_at: string;
}
