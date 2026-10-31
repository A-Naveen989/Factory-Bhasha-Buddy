
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Languages,
  Megaphone,
  RefreshCw,
  Target,
  Users,
} from 'lucide-react';

import { AdminLayout } from '@/components/AdminLayout';
import { supabase } from '@/lib/supabase';
import { LANGUAGES } from '@/lib/i18n';

import type {
  ComplaintCategory,
  ComplaintStatus,
  Language,
  NoticeEventType,
} from '@/lib/types';

// --------------------------------------------------
// TYPES
// --------------------------------------------------

interface ComplaintRow {
  id: string;
  tracking_id: string;
  category: ComplaintCategory;
  structured_summary: string;
  status: ComplaintStatus;
  created_at: string;
}

interface NoticeEventRow {
  event: NoticeEventType;
}

interface NoticeRow {
  id: string;
  title: string;
  notice_events: NoticeEventRow[] | null;
}

interface QuizRow {
  is_correct: boolean;
  language: Language;
  quiz_questions: {
    topic_id: string;
  } | null;
}

interface VoiceQueryRow {
  id: string;
  intent: string;
  raw_text: string;
  language: Language;
  created_at: string;
}

interface Topic {
  id: string;
  name: string;
}

interface DashboardData {
  workerCount: number;
  openComplaintCount: number;
  complaintCategoryCounts: Record<ComplaintCategory, number>;
  complaints: ComplaintRow[];
  notices: NoticeRow[];
  quizAttempts: QuizRow[];
  voiceQueries: VoiceQueryRow[];
  topics: Topic[];
  updatedAt: string;
}

type LoadState = {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
};

type AccuracyMetric = {
  total: number;
  correct: number;
};

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const COMPLAINT_CATEGORIES: ComplaintCategory[] = [
  'unsafe',
  'unpaid_salary',
  'harassment',
  'other',
];

const COMPLAINT_LABELS: Record<ComplaintCategory, string> = {
  unsafe: 'Unsafe condition',
  unpaid_salary: 'Unpaid salary',
  harassment: 'Harassment',
  other: 'Other',
};

const EVENT_LABELS: Record<NoticeEventType, string> = {
  play: 'Plays',
  replay: 'Replays',
  understood: 'Understood',
  not_clear: 'Not clear',
};

const INITIAL_CATEGORY_COUNTS: Record<ComplaintCategory, number> = {
  unsafe: 0,
  unpaid_salary: 0,
  harassment: 0,
  other: 0,
};

// --------------------------------------------------
// HELPER: FORMAT NUMBERS
// --------------------------------------------------

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-IN').format(value);
}

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

  return 'Unable to load dashboard information.';
}

// --------------------------------------------------
// LOAD DASHBOARD DATA
// --------------------------------------------------

async function loadDashboard(): Promise<DashboardData> {
  const [
    workers,
    complaints,
    openComplaints,
    notices,
    quizAttempts,
    voiceQueries,
    topics,
    unsafeCount,
    unpaidCount,
    harassmentCount,
    otherCount,
  ] = await Promise.all([
    // Total registered workers.
    supabase
      .from('workers')
      .select('id', { count: 'exact', head: true }),

    // Latest 100 complaints for the recent activity section.
    supabase
      .from('complaints')
      .select(
        'id, tracking_id, category, structured_summary, status, created_at'
      )
      .order('created_at', { ascending: false })
      .limit(100),

    // Exact count of unresolved complaints.
    supabase
      .from('complaints')
      .select('id', { count: 'exact', head: true })
      .neq('status', 'resolved'),

    // Latest 10 notices with engagement events.
    supabase
      .from('notices')
      .select('id, title, notice_events(event)')
      .order('created_at', { ascending: false })
      .limit(10),

    // Quiz attempts used for understanding analytics.
    supabase
      .from('quiz_attempts')
      .select('is_correct, language, quiz_questions(topic_id)'),

    // Latest 10 voice queries.
    supabase
      .from('voice_queries')
      .select('id, intent, raw_text, language, created_at')
      .order('created_at', { ascending: false })
      .limit(10),

    // Available safety topics.
    supabase
      .from('safety_topics')
      .select('id, name'),

    // Exact complaint counts by category.
    ...COMPLAINT_CATEGORIES.map((category) =>
      supabase
        .from('complaints')
        .select('id', { count: 'exact', head: true })
        .eq('category', category)
    ),
  ]);

  // Check every database request.
  const results = [
    workers,
    complaints,
    openComplaints,
    notices,
    quizAttempts,
    voiceQueries,
    topics,
    unsafeCount,
    unpaidCount,
    harassmentCount,
    otherCount,
  ];

  const failed = results.find((result) => result.error);

  if (failed?.error) {
    throw new Error(failed.error.message);
  }

  // Construct exact category totals.
  const complaintCategoryCounts: Record<ComplaintCategory, number> = {
    unsafe: unsafeCount.count ?? 0,
    unpaid_salary: unpaidCount.count ?? 0,
    harassment: harassmentCount.count ?? 0,
    other: otherCount.count ?? 0,
  };

  return {
    workerCount: workers.count ?? 0,

    openComplaintCount: openComplaints.count ?? 0,

    complaintCategoryCounts,

    complaints: (complaints.data ?? []) as ComplaintRow[],

    notices: (notices.data ?? []) as unknown as NoticeRow[],

    quizAttempts: (quizAttempts.data ?? []) as unknown as QuizRow[],

    voiceQueries: (voiceQueries.data ?? []) as unknown as VoiceQueryRow[],

    topics: (topics.data ?? []) as Topic[],

    updatedAt: new Date().toISOString(),
  };
}

// --------------------------------------------------
// ADMIN DASHBOARD PAGE
// --------------------------------------------------

export function AdminDashboardPage() {
  const [load, setLoad] = useState<LoadState>({
    data: null,
    loading: true,
    error: null,
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = useCallback(() => {
    setRefreshKey((current) => current + 1);
  }, []);

  // Fetch dashboard information.
  useEffect(() => {
    let cancelled = false;

    async function fetchDashboard() {
      setLoad((current) => ({
        ...current,
        loading: true,
        error: null,
      }));

      try {
        const data = await loadDashboard();

        if (!cancelled) {
          setLoad({
            data,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setLoad((current) => ({
            ...current,
            loading: false,
            error: getErrorMessage(error),
          }));
        }
      }
    }

    void fetchDashboard();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <AdminLayout>
      {load.loading && !load.data && (
        <LoadingDashboard />
      )}

      {!load.data && load.error && (
        <DashboardError
          message={load.error}
          onRetry={refresh}
        />
      )}

      {load.data && (
        <div className="space-y-6">

          {load.error && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="text-sm text-rose-800">
                Refresh failed: {load.error}
              </p>

              <button
                type="button"
                onClick={refresh}
                className="text-sm font-semibold text-rose-800 underline"
              >
                Retry
              </button>
            </div>
          )}

          <DashboardContent
            data={load.data}
            onRefresh={refresh}
            refreshing={load.loading}
          />

        </div>
      )}
    </AdminLayout>
  );
}

// --------------------------------------------------
// LOADING DASHBOARD
// --------------------------------------------------

function LoadingDashboard() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
    >
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-700" />

      <p className="text-sm font-medium text-slate-500">
        Loading dashboard...
      </p>
    </div>
  );
}

// --------------------------------------------------
// ERROR DASHBOARD
// --------------------------------------------------

function DashboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center text-center">

      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50">
        <AlertTriangle
          className="h-7 w-7 text-rose-600"
          aria-hidden="true"
        />
      </div>

      <h2 className="text-xl font-bold text-slate-900">
        Dashboard unavailable
      </h2>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        The dashboard could not be loaded. Check your connection and try again.
      </p>

      <p className="mt-2 break-words text-xs text-slate-400">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
      >
        Try again
      </button>

    </div>
  );
}

// --------------------------------------------------
// DASHBOARD CONTENT
// --------------------------------------------------

function DashboardContent({
  data,
  onRefresh,
  refreshing,
}: {
  data: DashboardData;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const correct = data.quizAttempts.filter(
    (attempt) => attempt.is_correct
  ).length;

  const accuracy = data.quizAttempts.length
    ? Math.round(
        (correct / data.quizAttempts.length) * 100
      )
    : null;

  const tiles = [
    {
      label: 'Registered workers',
      value: formatNumber(data.workerCount),
      icon: Users,
      iconStyle: 'bg-blue-50 text-blue-700',
    },
    {
      label: 'Open complaints',
      value: formatNumber(data.openComplaintCount),
      icon: AlertTriangle,
      iconStyle: 'bg-rose-50 text-rose-700',
    },
    {
      label: 'Quiz accuracy',
      value: accuracy === null ? 'No data' : `${accuracy}%`,
      icon: Target,
      iconStyle: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Total notices',
      value: formatNumber(data.notices.length),
      icon: Megaphone,
      iconStyle: 'bg-amber-50 text-amber-700',
    },
  ];

  return (
    <div className="space-y-8">

      {/* ==========================================
          DASHBOARD HEADER
      =========================================== */}

      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">
            Supervisor analytics
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard Overview
          </h1>

          <p className="text-sm leading-6 text-slate-600">
            Monitor worker engagement, factory notices, safety understanding, and complaints.
          </p>

          <p className="text-xs text-slate-400">
            Last updated: {formatDate(data.updatedAt)}
          </p>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:self-center"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />

          {refreshing ? 'Refreshing...' : 'Refresh data'}
        </button>

      </header>

      {/* ==========================================
          SUMMARY CARDS
      =========================================== */}

      <section
        aria-label="Dashboard statistics"
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        {tiles.map((tile) => {
          const Icon = tile.icon;

          return (
            <div
              key={tile.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-3">

                <p className="text-sm font-semibold text-slate-500">
                  {tile.label}
                </p>

                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tile.iconStyle}`}>
                  <Icon
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </span>

              </div>

              <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
                {tile.value}
              </p>
            </div>
          );
        })}
      </section>

      {/* ==========================================
          QUIZ ANALYTICS
      =========================================== */}

      <UnderstandingHeatmap
        topics={data.topics}
        attempts={data.quizAttempts}
      />

      {/* ==========================================
          NOTICE ANALYTICS
      =========================================== */}

      <NoticeAnalytics notices={data.notices} />

      {/* ==========================================
          COMPLAINT ANALYTICS
      =========================================== */}

      <ComplaintInsights
        complaints={data.complaints}
        categoryCounts={data.complaintCategoryCounts}
      />

      {/* ==========================================
          RECENT VOICE QUESTIONS
      =========================================== */}

      <RecentQuestions queries={data.voiceQueries} />

    </div>
  );
}

// --------------------------------------------------
// UNDERSTANDING HEATMAP
// --------------------------------------------------

function UnderstandingHeatmap({
  topics,
  attempts,
}: {
  topics: Topic[];
  attempts: QuizRow[];
}) {
  // Aggregate quiz results once instead of filtering the
  // entire attempt collection for every table cell.
  const metrics = useMemo(() => {
    const result = new Map<string, AccuracyMetric>();

    for (const attempt of attempts) {
      const topicId = attempt.quiz_questions?.topic_id;

      if (!topicId) {
        continue;
      }

      const key = `${topicId}:${attempt.language}`;

      const metric = result.get(key) ?? {
        total: 0,
        correct: 0,
      };

      metric.total += 1;

      if (attempt.is_correct) {
        metric.correct += 1;
      }

      result.set(key, metric);
    }

    return result;
  }, [attempts]);

  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div>
        <div className="flex items-center gap-2">
          <Languages className="h-5 w-5 text-brand-700" aria-hidden="true" />

          <h2 className="text-base font-bold text-slate-900">
            Understanding by topic and language
          </h2>
        </div>

        <p className="mt-1 text-xs text-slate-500">
          Percentage of correct quiz attempts.
        </p>
      </div>

      {topics.length === 0 ? (
        <EmptyState message="No safety topics available." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full min-w-[520px] text-left text-sm">

            <thead className="bg-slate-50">
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-4 py-3 font-semibold">
                  Topic
                </th>

                {LANGUAGES.map((language) => (
                  <th
                    scope="col"
                    key={language.code}
                    className="px-4 py-3 font-semibold"
                  >
                    {language.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {topics.map((topic) => (
                <tr
                  key={topic.id}
                  className="border-t border-slate-100 transition hover:bg-slate-50"
                >
                  <th
                    scope="row"
                    className="px-4 py-4 font-semibold text-slate-800"
                  >
                    {topic.name}
                  </th>

                  {LANGUAGES.map((language) => {
                    const metric = metrics.get(
                      `${topic.id}:${language.code}`
                    );

                    const rate = metric
                      ? Math.round(
                          (metric.correct / metric.total) * 100
                        )
                      : null;

                    return (
                      <td
                        key={language.code}
                        className="px-4 py-4"
                      >
                        <span
                          className={`inline-flex min-w-14 justify-center rounded-lg px-2.5 py-1.5 text-xs font-bold ${heatTone(rate)}`}
                          title={
                            metric
                              ? `${metric.correct} correct out of ${metric.total} attempts`
                              : 'No attempts'
                          }
                        >
                          {rate === null ? '-' : `${rate}%`}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span>80–100%: High accuracy</span>
        <span>50–79%: Moderate accuracy</span>
        <span>Below 50%: Needs attention</span>
      </div>

    </section>
  );
}

// --------------------------------------------------
// HEATMAP COLORS
// --------------------------------------------------

function heatTone(rate: number | null): string {
  if (rate === null) {
    return 'bg-slate-100 text-slate-500';
  }

  if (rate >= 80) {
    return 'bg-success-100 text-success-800';
  }

  if (rate >= 50) {
    return 'bg-warning-100 text-warning-800';
  }

  return 'bg-error-100 text-error-800';
}

// --------------------------------------------------
// NOTICE ANALYTICS
// --------------------------------------------------

function NoticeAnalytics({
  notices,
}: {
  notices: NoticeRow[];
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center gap-2">
        <Megaphone className="h-5 w-5 text-brand-700" aria-hidden="true" />

        <div>
          <h2 className="text-base font-bold text-slate-900">
            Notice engagement
          </h2>

          <p className="text-xs text-slate-500">
            Latest 10 notices
          </p>
        </div>
      </div>

      {notices.length === 0 ? (
        <EmptyState message="No notices have been published yet." />
      ) : (
        <ul className="divide-y divide-slate-100">

          {notices.map((notice) => {
            const counts = countEvents(notice.notice_events);

            return (
              <li
                key={notice.id}
                className="space-y-3 py-4 first:pt-0 last:pb-0"
              >

                <p className="break-words font-semibold text-slate-800">
                  {notice.title}
                </p>

                <div className="flex flex-wrap gap-2">

                  {(Object.keys(EVENT_LABELS) as NoticeEventType[]).map(
                    (event) => (
                      <span
                        key={event}
                        className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        <span className="font-bold">
                          {formatNumber(counts[event])}
                        </span>

                        {EVENT_LABELS[event]}
                      </span>
                    )
                  )}

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
// COUNT NOTICE EVENTS
// --------------------------------------------------

function countEvents(
  events: NoticeEventRow[] | null | undefined
): Record<NoticeEventType, number> {
  const counts: Record<NoticeEventType, number> = {
    play: 0,
    replay: 0,
    understood: 0,
    not_clear: 0,
  };

  for (const item of events ?? []) {
    if (item.event in counts) {
      counts[item.event] += 1;
    }
  }

  return counts;
}

// --------------------------------------------------
// COMPLAINT INSIGHTS
// --------------------------------------------------

function ComplaintInsights({
  complaints,
  categoryCounts,
}: {
  complaints: ComplaintRow[];
  categoryCounts: Record<ComplaintCategory, number>;
}) {
  const totalComplaints = Object.values(categoryCounts).reduce(
    (total, count) => total + count,
    0
  );

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" aria-hidden="true" />

            <h2 className="text-base font-bold text-slate-900">
              Complaint insights
            </h2>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {formatNumber(totalComplaints)} total complaints
          </p>
        </div>

        <span className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
          {formatNumber(totalComplaints)}
        </span>
      </div>

      {/* CATEGORY COUNTS */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

        {COMPLAINT_CATEGORIES.map((category) => (
          <div
            key={category}
            className="rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <p className="text-xs font-semibold leading-5 text-slate-500">
              {COMPLAINT_LABELS[category]}
            </p>

            <p className="mt-2 text-xl font-bold text-slate-900">
              {formatNumber(categoryCounts[category])}
            </p>
          </div>
        ))}

      </div>

      {/* RECENT COMPLAINTS */}

      <div className="space-y-3 border-t border-slate-100 pt-5">

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">
            Recent complaints
          </h3>

          <span className="text-xs text-slate-400">
            Latest 100
          </span>
        </div>

        {complaints.length === 0 ? (
          <EmptyState message="No complaints have been submitted yet." />
        ) : (
          <ul className="space-y-3">

            {complaints.map((complaint) => (
              <li
                key={complaint.id}
                className="rounded-xl border border-slate-200 p-4 transition hover:border-brand-200"
              >

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                  <span className="font-mono text-xs font-bold text-brand-800">
                    {complaint.tracking_id}
                  </span>

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="text-xs font-semibold text-slate-600">
                      {COMPLAINT_LABELS[complaint.category]}
                    </span>

                    <StatusBadge status={complaint.status} />

                  </div>

                </div>

                <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                  {complaint.structured_summary}
                </p>

                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  {formatDate(complaint.created_at)}
                </p>

              </li>
            ))}

          </ul>
        )}

      </div>

    </section>
  );
}

// --------------------------------------------------
// COMPLAINT STATUS BADGE
// --------------------------------------------------

function StatusBadge({
  status,
}: {
  status: ComplaintStatus;
}) {
  const styles: Record<ComplaintStatus, string> = {
    new: 'bg-rose-50 text-rose-700',
    reviewing: 'bg-warning-50 text-warning-800',
    resolved: 'bg-success-50 text-success-800',
  };

  const label: Record<ComplaintStatus, string> = {
    new: 'New',
    reviewing: 'Reviewing',
    resolved: 'Resolved',
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-bold ${styles[status]}`}
    >
      {label[status]}
    </span>
  );
}

// --------------------------------------------------
// RECENT VOICE QUESTIONS
// --------------------------------------------------

function RecentQuestions({
  queries,
}: {
  queries: VoiceQueryRow[];
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center gap-2">
        <Activity className="h-5 w-5 text-brand-700" aria-hidden="true" />

        <div>
          <h2 className="text-base font-bold text-slate-900">
            Recent worker questions
          </h2>

          <p className="text-xs text-slate-500">
            Latest 10 voice queries
          </p>
        </div>
      </div>

      {queries.length === 0 ? (
        <EmptyState message="No worker questions have been recorded yet." />
      ) : (
        <ul className="divide-y divide-slate-100">

          {queries.map((query) => (
            <li
              key={query.id}
              className="space-y-2 py-4 first:pt-0 last:pb-0"
            >

              <div className="flex flex-wrap items-center justify-between gap-2">

                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800">
                  {query.intent}
                </span>

                <span className="text-xs text-slate-400">
                  {formatDate(query.created_at)}
                </span>

              </div>

              <p className="break-words text-sm leading-6 text-slate-700">
                {query.raw_text}
              </p>

              <p className="text-xs font-medium text-slate-400">
                Language: {LANGUAGES.find(
                  (language) => language.code === query.language
                )?.label ?? query.language}
              </p>

            </li>
          ))}

        </ul>
      )}

    </section>
  );
}

// --------------------------------------------------
// REUSABLE EMPTY STATE
// --------------------------------------------------

function EmptyState({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">

      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400">
        <CheckCircle2
          className="h-5 w-5"
          aria-hidden="true"
        />
      </div>

      <p className="text-sm text-slate-500">
        {message}
      </p>

    </div>
  );
}
