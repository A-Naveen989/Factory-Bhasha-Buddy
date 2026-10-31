
import { useEffect, useState } from 'react';

import {
  AlertCircle,
  LoaderCircle,
  Megaphone,
  RefreshCw,
} from 'lucide-react';

import { NoticeCard } from '@/components/NoticeCard';
import { NoticeDetail } from '@/components/NoticeDetail';

import { useWorker } from '@/hooks/useWorker';

import { t } from '@/lib/i18n';
import { supabase } from '@/lib/supabase';

import type { Notice } from '@/lib/types';

// --------------------------------------------------
// CONSTANTS
// --------------------------------------------------

const NOTICE_LIMIT = 100;

// --------------------------------------------------
// LOAD STATE
// --------------------------------------------------

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; notices: Notice[] };

// --------------------------------------------------
// ERROR HANDLER
// --------------------------------------------------

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Unable to load factory notices.';
}

// --------------------------------------------------
// LOAD NOTICES
// --------------------------------------------------

async function loadNotices(
  departmentId: string | null
): Promise<Notice[]> {
  // Fetch global notices and notices matching
  // the worker's assigned department.

  const query = supabase
    .from('notices')
    .select(`
      id,
      title,
      category,
      department_id,
      topic_id,
      full_text,
      created_at,
      notice_translations (
        notice_id,
        language,
        voice_script,
        key_points
      )
    `)
    .order('created_at', { ascending: false });

  // Apply department visibility rules.
  const request = departmentId
    ? query.or(
        `department_id.is.null,department_id.eq.${departmentId}`
      )
    : query.is('department_id', null);

  // Limit the initial result set.
  const { data, error } = await request.limit(NOTICE_LIMIT);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as unknown as Notice[];
}

// --------------------------------------------------
// NOTICES PAGE
// --------------------------------------------------

export function NoticesPage() {
  const { worker } = useWorker();

  const language = worker.language;

  // ------------------------------------------------
  // STATE
  // ------------------------------------------------

  const [load, setLoad] = useState<LoadState>({
    status: 'loading',
  });

  const [selectedId, setSelectedId] = useState<string | null>(
    null
  );

  const [retryCount, setRetryCount] = useState(0);

  // ------------------------------------------------
  // LOAD DATA
  // ------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    async function fetchNotices() {
      setLoad({ status: 'loading' });

      try {
        const notices = await loadNotices(
          worker.department_id
        );

        if (cancelled) {
          return;
        }

        setLoad({
          status: 'ready',
          notices,
        });
      } catch (error) {
        console.error(
          'Failed to load factory notices:',
          error
        );

        if (cancelled) {
          return;
        }

        setLoad({
          status: 'error',
          message: getErrorMessage(error),
        });
      }
    }

    void fetchNotices();

    return () => {
      cancelled = true;
    };
  }, [worker.department_id, retryCount]);

  // ------------------------------------------------
  // RETRY
  // ------------------------------------------------

  function handleRetry() {
    setRetryCount((current) => current + 1);
  }

  // ------------------------------------------------
  // BACK TO NOTICE LIST
  // ------------------------------------------------

  function handleBack() {
    setSelectedId(null);
  }

  // ------------------------------------------------
  // LOADING STATE
  // ------------------------------------------------

  if (load.status === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="
          flex min-h-[50vh]
          flex-col items-center
          justify-center gap-4
        "
      >
        <div className="
          flex h-14 w-14
          items-center justify-center
          rounded-2xl bg-brand-50
        ">
          <LoaderCircle
            className="h-7 w-7 animate-spin text-brand-700"
            aria-hidden="true"
          />
        </div>

        <p className="text-sm font-medium text-slate-600">
          {t(language, 'loading')}
        </p>
      </div>
    );
  }

  // ------------------------------------------------
  // ERROR STATE
  // ------------------------------------------------

  if (load.status === 'error') {
    return (
      <section className="
        flex min-h-[50vh]
        flex-col items-center
        justify-center px-4
      ">
        <div className="
          w-full max-w-sm
          rounded-3xl border
          border-slate-200
          bg-white p-6
          text-center shadow-sm
        ">

          <div className="
            mx-auto mb-4
            flex h-14 w-14
            items-center justify-center
            rounded-full bg-rose-50
          ">
            <AlertCircle
              className="h-7 w-7 text-rose-600"
              aria-hidden="true"
            />
          </div>

          <h2 className="
            text-lg font-bold
            text-slate-900
          ">
            Unable to load notices
          </h2>

          <p className="
            mt-2 text-sm
            leading-6 text-slate-600
          ">
            {t(language, 'connectError')}
          </p>

          <p className="
            mt-3 break-words
            text-xs text-slate-400
          ">
            {load.message}
          </p>

          <button
            type="button"
            onClick={handleRetry}
            className="
              mt-6 inline-flex
              min-h-11 w-full
              items-center justify-center
              gap-2 rounded-xl
              bg-brand-700 px-5 py-3
              text-sm font-bold text-white
              transition-colors
              hover:bg-brand-800
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-brand-600
              focus-visible:ring-offset-2
            "
          >
            <RefreshCw
              className="h-4 w-4"
              aria-hidden="true"
            />

            {t(language, 'retry')}
          </button>

        </div>
      </section>
    );
  }

  // ------------------------------------------------
  // SELECTED NOTICE
  // ------------------------------------------------

  const selected = load.notices.find(
    (notice) => notice.id === selectedId
  );

  if (selected) {
    return (
      <NoticeDetail
        key={`${selected.id}-${language}`}
        notice={selected}
        onBack={handleBack}
      />
    );
  }

  // ------------------------------------------------
  // NOTICE LIST
  // ------------------------------------------------

  return (
    <div className="space-y-6">

      {/* ==========================================
          PAGE HEADER
      =========================================== */}

      <header className="
        animate-fade-up space-y-2
      ">

        <div className="flex items-center gap-2">

          <span className="
            flex h-10 w-10
            items-center justify-center
            rounded-xl bg-brand-100
            text-brand-800
          ">
            <Megaphone
              className="h-5 w-5"
              aria-hidden="true"
            />
          </span>

          <div>
            <h1 className="
              text-2xl font-bold
              tracking-tight text-slate-900
            ">
              {t(language, 'noticesTitle')}
            </h1>

            <p className="text-xs text-slate-500">
              Factory announcements
            </p>
          </div>

        </div>

        <p className="
          text-sm leading-6 text-slate-600
        ">
          {t(language, 'noticesIntro')}
        </p>

        {/* NOTICE COUNT */}

        <p className="
          text-xs font-semibold
          text-slate-400
        ">
          {load.notices.length} notices available
        </p>

      </header>

      {/* ==========================================
          EMPTY STATE
      =========================================== */}

      {load.notices.length === 0 ? (
        <div className="
          flex flex-col items-center
          justify-center rounded-3xl
          border border-dashed
          border-slate-300
          bg-white px-6 py-12
          text-center
        ">

          <div className="
            mb-4 flex h-16 w-16
            items-center justify-center
            rounded-2xl bg-slate-100
            text-slate-400
          ">
            <Megaphone
              className="h-8 w-8"
              aria-hidden="true"
            />
          </div>

          <h2 className="
            text-base font-bold
            text-slate-800
          ">
            {t(language, 'noNotices')}
          </h2>

          <p className="
            mt-2 max-w-xs
            text-sm leading-6
            text-slate-500
          ">
            New factory announcements will appear here when they are published for your department.
          </p>

        </div>
      ) : (

        /* ========================================
           NOTICE CARDS
        ========================================= */

        <section
          aria-label={t(language, 'noticesTitle')}
          className="space-y-3"
        >

          {load.notices.map((notice) => (
            <NoticeCard
              key={notice.id}
              notice={notice}
              language={language}
              onOpen={() => setSelectedId(notice.id)}
            />
          ))}

        </section>
      )}

      {/* ==========================================
          RESULT LIMIT INFORMATION
      =========================================== */}

      {load.notices.length === NOTICE_LIMIT && (
        <p className="
          text-center text-xs
          leading-5 text-slate-400
        ">
          Showing the latest {NOTICE_LIMIT} notices.
        </p>
      )}

    </div>
  );
}
