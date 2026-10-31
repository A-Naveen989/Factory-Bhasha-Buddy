
import { useEffect, useRef, useState, type FormEvent } from 'react';

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Megaphone,
  RefreshCw,
  Send,
} from 'lucide-react';

import { AdminLayout } from '@/components/AdminLayout';

import {
  buildKeyPoints,
  buildVoiceScript,
} from '@/lib/simplify';

import { supabase } from '@/lib/supabase';

import type {
  Department,
  Notice,
  NoticeCategory,
} from '@/lib/types';

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const NOTICE_TEXT_LIMIT = 5000;
const NOTICE_TITLE_LIMIT = 120;
const NOTICE_LIST_LIMIT = 20;

// --------------------------------------------------
// TYPES
// --------------------------------------------------

interface TopicOption {
  id: string;
  name: string;
}

interface Lookups {
  departments: Department[];
  topics: TopicOption[];
  notices: Pick<
    Notice,
    'id' | 'title' | 'category' | 'created_at'
  >[];
}

type StatusTone = 'success' | 'error' | 'warning';

interface FormStatus {
  tone: StatusTone;
  text: string;
}

interface AdminNoticesPageState {
  loading: boolean;
  error: string | null;
}

const CATEGORY_OPTIONS: {
  value: NoticeCategory;
  label: string;
}[] = [
  { value: 'general', label: 'General' },
  { value: 'safety', label: 'Safety' },
  { value: 'payroll', label: 'Salary' },
  { value: 'policy', label: 'Policy' },
];

// --------------------------------------------------
// HELPER: FORMAT DATE
// --------------------------------------------------

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Date unavailable';
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

// --------------------------------------------------
// HELPER: ERROR MESSAGE
// --------------------------------------------------

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

// --------------------------------------------------
// LOAD ADMIN LOOKUP DATA
// --------------------------------------------------

async function loadLookups(): Promise<Lookups> {
  const [
    departments,
    topics,
    notices,
  ] = await Promise.all([
    supabase
      .from('departments')
      .select('id, name')
      .order('name', { ascending: true }),

    supabase
      .from('safety_topics')
      .select('id, name')
      .order('name', { ascending: true }),

    supabase
      .from('notices')
      .select('id, title, category, created_at')
      .order('created_at', { ascending: false })
      .limit(NOTICE_LIST_LIMIT),
  ]);

  // Check all database responses.
  const results = [
    departments,
    topics,
    notices,
  ];

  const failed = results.find((result) => result.error);

  if (failed?.error) {
    throw new Error(failed.error.message);
  }

  return {
    departments: (departments.data ?? []) as Department[],

    topics: (topics.data ?? []) as TopicOption[],

    notices: (notices.data ?? []) as Lookups['notices'],
  };
}

// --------------------------------------------------
// ADMIN NOTICES PAGE
// --------------------------------------------------

export function AdminNoticesPage() {
  const [lookups, setLookups] = useState<Lookups | null>(null);

  const [loadState, setLoadState] =
    useState<AdminNoticesPageState>({
      loading: true,
      error: null,
    });

  const [refreshKey, setRefreshKey] = useState(0);

  // --------------------------------------------------
  // LOAD DATA
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function fetchLookups() {
      setLoadState({
        loading: true,
        error: null,
      });

      try {
        const data = await loadLookups();

        if (!cancelled) {
          setLookups(data);

          setLoadState({
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Failed to load notices:', error);

        if (!cancelled) {
          setLoadState({
            loading: false,
            error: getErrorMessage(error),
          });
        }
      }
    }

    void fetchLookups();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  // --------------------------------------------------
  // REFRESH DATA
  // --------------------------------------------------

  function refreshData() {
    setRefreshKey((value) => value + 1);
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <AdminLayout>
      <div className="space-y-8">

        {/* ==========================================
            PAGE HEADER
        =========================================== */}

        <header className="animate-fade-up flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="space-y-1">

            <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
              Supervisor management
            </p>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Factory Notices
            </h1>

            <p className="max-w-xl text-sm leading-6 text-slate-600">
              Publish important factory announcements, safety instructions,
              and workplace updates for workers.
            </p>

          </div>

          <button
            type="button"
            onClick={refreshData}
            disabled={loadState.loading}
            className="
              inline-flex min-h-11
              items-center justify-center gap-2
              self-start rounded-xl
              border border-slate-200 bg-white
              px-4 py-2.5 text-sm font-semibold
              text-slate-700 shadow-sm
              transition hover:border-brand-300
              hover:bg-brand-50
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-brand-600
              focus-visible:ring-offset-2
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loadState.loading ? 'animate-spin' : ''
              }`}
              aria-hidden="true"
            />

            Refresh
          </button>

        </header>

        {/* ==========================================
            ERROR MESSAGE
        =========================================== */}

        {loadState.error && (
          <div
            role="alert"
            className="
              flex flex-col gap-3
              rounded-2xl border border-rose-200
              bg-rose-50 p-4
              sm:flex-row sm:items-center
              sm:justify-between
            "
          >
            <div className="flex items-start gap-3">

              <AlertCircle
                className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
                aria-hidden="true"
              />

              <div>
                <p className="text-sm font-bold text-rose-800">
                  Unable to load notices
                </p>

                <p className="mt-1 break-words text-sm text-rose-700">
                  {loadState.error}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={refreshData}
              className="
                shrink-0 text-sm
                font-bold text-rose-800
                underline underline-offset-4
              "
            >
              Try again
            </button>

          </div>
        )}

        {/* ==========================================
            LOADING STATE
        =========================================== */}

        {loadState.loading && !lookups && (
          <div
            role="status"
            aria-live="polite"
            className="
              flex min-h-64
              flex-col items-center
              justify-center gap-4
            "
          >
            <LoaderCircle className="h-9 w-9 animate-spin text-brand-700" />

            <p className="text-sm font-medium text-slate-500">
              Loading notice management...
            </p>
          </div>
        )}

        {/* ==========================================
            NOTICE MANAGEMENT
        =========================================== */}

        {lookups && (
          <div className="
            grid items-start gap-6
            lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]
          ">

            {/* NOTICE FORM */}

            <NoticeForm
              departments={lookups.departments}
              topics={lookups.topics}
              onSaved={refreshData}
            />

            {/* PUBLISHED NOTICES */}

            <PublishedNotices
              notices={lookups.notices}
              refreshing={loadState.loading}
            />

          </div>
        )}

      </div>
    </AdminLayout>
  );
}

// --------------------------------------------------
// PUBLISHED NOTICES
// --------------------------------------------------

function PublishedNotices({
  notices,
  refreshing,
}: {
  notices: Lookups['notices'];
  refreshing: boolean;
}) {
  return (
    <section className="
      space-y-4 rounded-2xl
      border border-slate-200
      bg-white p-5 shadow-sm
    ">

      <div className="flex items-center justify-between gap-3">

        <div className="flex items-center gap-2">
          <Megaphone
            className="h-5 w-5 text-brand-700"
            aria-hidden="true"
          />

          <h2 className="text-base font-bold text-slate-900">
            Published notices
          </h2>
        </div>

        <span className="
          rounded-full bg-brand-50
          px-3 py-1 text-xs
          font-bold text-brand-800
        ">
          {notices.length}
        </span>

      </div>

      <p className="text-xs leading-5 text-slate-500">
        Showing the latest {NOTICE_LIST_LIMIT} notices.
      </p>

      {refreshing && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
          Updating notice list...
        </div>
      )}

      {notices.length === 0 ? (
        <div className="
          flex flex-col items-center
          justify-center rounded-xl
          border border-dashed border-slate-200
          bg-slate-50 px-4 py-10 text-center
        ">
          <FileText
            className="mb-3 h-9 w-9 text-slate-300"
            aria-hidden="true"
          />

          <p className="text-sm font-semibold text-slate-700">
            No notices published yet
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Your published notices will appear here.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100">

          {notices.map((notice) => {
            const category = CATEGORY_OPTIONS.find(
              (item) => item.value === notice.category
            );

            return (
              <li
                key={notice.id}
                className="space-y-2 py-4 first:pt-1 last:pb-1"
              >

                <div className="flex items-start justify-between gap-3">

                  <p className="min-w-0 break-words text-sm font-bold leading-6 text-slate-800">
                    {notice.title}
                  </p>

                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-success-600"
                    aria-label="Published"
                  />

                </div>

                <div className="flex flex-wrap items-center gap-2">

                  <span className="
                    rounded-full bg-accent-100
                    px-2.5 py-1 text-xs
                    font-semibold text-accent-800
                  ">
                    {category?.label ?? notice.category}
                  </span>

                  <span className="text-xs text-slate-400">
                    {formatDate(notice.created_at)}
                  </span>

                </div>

              </li>
            );
          })}

        </ul>
      )}

    </section>
  );
}

// --------------------------------------------------
// NOTICE FORM PROPS
// --------------------------------------------------

interface NoticeFormProps {
  departments: Department[];
  topics: TopicOption[];
  onSaved: () => void;
}

// --------------------------------------------------
// NOTICE FORM
// --------------------------------------------------

function NoticeForm({
  departments,
  topics,
  onSaved,
}: NoticeFormProps) {
  // -----------------------------------------------
  // FORM STATE
  // -----------------------------------------------

  const [title, setTitle] = useState('');

  const [category, setCategory] =
    useState<NoticeCategory>('general');

  const [departmentId, setDepartmentId] =
    useState('');

  const [topicId, setTopicId] =
    useState('');

  const [fullText, setFullText] = useState('');

  const [status, setStatus] =
    useState<FormStatus | null>(null);

  const [saving, setSaving] = useState(false);

  // Prevent duplicate submissions.
  const submitLockRef = useRef(false);

  // -----------------------------------------------
  // RESET FORM
  // -----------------------------------------------

  function resetForm() {
    setTitle('');
    setFullText('');
    setDepartmentId('');
    setTopicId('');
    setCategory('general');
  }

  // -----------------------------------------------
  // HANDLE FORM SUBMISSION
  // -----------------------------------------------

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (submitLockRef.current) {
      return;
    }

    const cleanTitle = title.trim();
    const cleanText = fullText.trim();

    // ---------------------------------------------
    // VALIDATION
    // ---------------------------------------------

    if (!cleanTitle || !cleanText) {
      setStatus({
        tone: 'error',
        text: 'Please provide both a notice title and notice text.',
      });

      return;
    }

    if (cleanTitle.length > NOTICE_TITLE_LIMIT) {
      setStatus({
        tone: 'error',
        text: `The title cannot exceed ${NOTICE_TITLE_LIMIT} characters.`,
      });

      return;
    }

    if (cleanText.length > NOTICE_TEXT_LIMIT) {
      setStatus({
        tone: 'error',
        text: `The notice cannot exceed ${NOTICE_TEXT_LIMIT} characters.`,
      });

      return;
    }

    // ---------------------------------------------
    // START PUBLICATION
    // ---------------------------------------------

    submitLockRef.current = true;
    setSaving(true);
    setStatus(null);

    let noticeCreated = false;

    try {
      // -------------------------------------------
      // STEP 1: SAVE NOTICE
      // -------------------------------------------

      const {
        data: inserted,
        error: noticeError,
      } = await supabase
        .from('notices')
        .insert({
          title: cleanTitle,
          category,
          department_id: departmentId || null,
          topic_id: topicId || null,
          full_text: cleanText,
        })
        .select('id')
        .single();

      if (noticeError) {
        throw new Error(noticeError.message);
      }

      if (!inserted?.id) {
        throw new Error(
          'The notice was not created successfully.'
        );
      }

      noticeCreated = true;

      // -------------------------------------------
      // STEP 2: PREPARE ENGLISH VOICE CONTENT
      // -------------------------------------------

      const voiceScript = buildVoiceScript(cleanText);
      const keyPoints = buildKeyPoints(cleanText);

      // -------------------------------------------
      // STEP 3: SAVE ENGLISH TRANSLATION
      // -------------------------------------------

      let translationError: string | null = null;

      try {
        const result = await supabase
          .from('notice_translations')
          .insert({
            notice_id: inserted.id,
            language: 'en',
            voice_script: voiceScript,
            key_points: keyPoints,
          });

        translationError = result.error?.message ?? null;
      } catch (error) {
        translationError = getErrorMessage(error);
      }

      // -------------------------------------------
      // STEP 4: HANDLE PUBLICATION RESULT
      // -------------------------------------------

      resetForm();

      // Refresh the published notice list.
      onSaved();

      if (translationError) {
        console.error(
          'Notice translation creation failed:',
          translationError
        );

        setStatus({
          tone: 'warning',
          text:
            'The notice was published, but its English voice summary could not be created. The original notice text remains available to workers. Please check the translation record.',
        });

      } else {
        setStatus({
          tone: 'success',
          text: 'Notice published successfully.',
        });
      }

    } catch (error) {
      console.error('Notice publication failed:', error);

      if (noticeCreated) {
        onSaved();

        setStatus({
          tone: 'warning',
          text:
            'The notice was created, but another publication step failed. Check its translation before publishing again.',
        });
      } else {
        setStatus({
          tone: 'error',
          text:
            'The notice could not be published. Please check your connection and permissions, then try again.',
        });
      }

    } finally {
      submitLockRef.current = false;
      setSaving(false);
    }
  }

  // -----------------------------------------------
  // INPUT STYLES
  // -----------------------------------------------

  const inputClass = `
    w-full min-h-11
    rounded-xl border border-slate-300
    bg-white px-3 py-2.5
    text-sm text-slate-900
    placeholder:text-slate-400
    transition-colors
    focus:border-brand-600
    focus:outline-none
    focus:ring-2
    focus:ring-brand-200
    disabled:cursor-not-allowed
    disabled:bg-slate-100
  `;

  const statusStyles: Record<StatusTone, string> = {
    success: 'border-success-200 bg-success-50 text-success-800',
    error: 'border-error-200 bg-error-50 text-error-700',
    warning: 'border-warning-200 bg-warning-50 text-warning-800',
  };

  // -----------------------------------------------
  // FORM RENDER
  // -----------------------------------------------

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={saving}
      className="
        animate-fade-up space-y-5
        rounded-2xl border border-slate-200
        bg-white p-5 shadow-sm
        sm:p-6
      "
    >

      {/* ==========================================
          FORM HEADER
      =========================================== */}

      <div className="flex items-start gap-3 border-b border-slate-100 pb-4">

        <span className="
          flex h-11 w-11 shrink-0
          items-center justify-center
          rounded-xl bg-brand-50
          text-brand-700
        ">
          <Megaphone
            className="h-5 w-5"
            aria-hidden="true"
          />
        </span>

        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Create a notice
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Add the announcement that factory workers need to hear.
          </p>
        </div>

      </div>

      {/* ==========================================
          NOTICE TITLE
      =========================================== */}

      <label
        htmlFor="notice-title"
        className="block space-y-1.5"
      >
        <span className="text-sm font-semibold text-slate-700">
          Notice title
          <span className="ml-1 text-rose-600">*</span>
        </span>

        <input
          id="notice-title"
          type="text"
          className={inputClass}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Enter a clear notice title"
          maxLength={NOTICE_TITLE_LIMIT}
          required
          disabled={saving}
          autoComplete="off"
        />

        <span className="block text-right text-xs text-slate-400">
          {title.length}/{NOTICE_TITLE_LIMIT}
        </span>
      </label>

      {/* ==========================================
          NOTICE CONFIGURATION
      =========================================== */}

      <div className="grid gap-4 sm:grid-cols-2">

        {/* CATEGORY */}

        <label
          htmlFor="notice-category"
          className="block space-y-1.5"
        >
          <span className="text-sm font-semibold text-slate-700">
            Notice type
          </span>

          <select
            id="notice-category"
            className={inputClass}
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as NoticeCategory)
            }
            disabled={saving}
          >
            {CATEGORY_OPTIONS.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </label>

        {/* DEPARTMENT */}

        <label
          htmlFor="notice-department"
          className="block space-y-1.5"
        >
          <span className="text-sm font-semibold text-slate-700">
            Target department
          </span>

          <select
            id="notice-department"
            className={inputClass}
            value={departmentId}
            onChange={(event) =>
              setDepartmentId(event.target.value)
            }
            disabled={saving}
          >
            <option value="">
              All departments
            </option>

            {departments.map((department) => (
              <option
                key={department.id}
                value={department.id}
              >
                {department.name}
              </option>
            ))}
          </select>
        </label>

        {/* SAFETY TOPIC */}

        <label
          htmlFor="notice-topic"
          className="block space-y-1.5 sm:col-span-2"
        >
          <span className="text-sm font-semibold text-slate-700">
            Related safety topic
          </span>

          <select
            id="notice-topic"
            className={inputClass}
            value={topicId}
            onChange={(event) =>
              setTopicId(event.target.value)
            }
            disabled={saving}
          >
            <option value="">
              No related safety topic
            </option>

            {topics.map((topic) => (
              <option
                key={topic.id}
                value={topic.id}
              >
                {topic.name}
              </option>
            ))}
          </select>
        </label>

      </div>

      {/* ==========================================
          NOTICE DESCRIPTION
      =========================================== */}

      <label
        htmlFor="notice-text"
        className="block space-y-2"
      >
        <span className="text-sm font-semibold text-slate-700">
          Notice content
          <span className="ml-1 text-rose-600">*</span>
        </span>

        <textarea
          id="notice-text"
          className={`${inputClass} min-h-44 resize-y leading-6`}
          rows={8}
          value={fullText}
          onChange={(event) =>
            setFullText(event.target.value)
          }
          placeholder="Write the notice using short, clear sentences. Workers will be able to hear the original notice text."
          maxLength={NOTICE_TEXT_LIMIT}
          required
          disabled={saving}
          aria-describedby="notice-text-help notice-character-count"
        />

        <span
          id="notice-text-help"
          className="block text-xs leading-5 text-slate-500"
        >
          Use simple sentences. The first three sentences
          are used to generate the English voice summary.
        </span>

        <span
          id="notice-character-count"
          className="block text-right text-xs text-slate-400"
        >
          {fullText.length}/{NOTICE_TEXT_LIMIT} characters
        </span>
      </label>

      {/* ==========================================
          TRANSLATION INFORMATION
      =========================================== */}

      <div className="
        rounded-xl border border-amber-200
        bg-amber-50 p-4
      ">
        <p className="text-sm font-semibold text-amber-900">
          Language support
        </p>

        <p className="mt-1 text-xs leading-5 text-amber-800">
          This form generates English voice content.
          Hindi, Tamil and Telugu translations must be
          added separately. Until then, the worker app
          uses the original notice text as its fallback.
        </p>
      </div>

      {/* ==========================================
          FORM STATUS
      =========================================== */}

      {status && (
        <div
          role={status.tone === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={`
            flex items-start gap-3
            rounded-xl border p-4
            text-sm font-medium leading-6
            ${statusStyles[status.tone]}
          `}
        >
          {status.tone === 'success' ? (
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle
              className="mt-0.5 h-5 w-5 shrink-0"
              aria-hidden="true"
            />
          )}

          <p>{status.text}</p>
        </div>
      )}

      {/* ==========================================
          PUBLISH BUTTON
      =========================================== */}

      <button
        type="submit"
        disabled={saving}
        className="
          flex min-h-12 w-full
          items-center justify-center gap-2
          rounded-xl bg-brand-700
          px-5 py-3 text-sm font-bold
          text-white shadow-sm
          transition-colors duration-200
          hover:bg-brand-800
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-brand-600
          focus-visible:ring-offset-2
          active:scale-[0.98]
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {saving ? (
          <>
            <LoaderCircle
              className="h-5 w-5 animate-spin"
              aria-hidden="true"
            />

            Publishing...
          </>
        ) : (
          <>
            <Send
              className="h-4 w-4"
              aria-hidden="true"
            />

            Publish notice
          </>
        )}
      </button>

    </form>
  );
}
