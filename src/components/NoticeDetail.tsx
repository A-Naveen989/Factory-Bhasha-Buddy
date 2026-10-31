
import { useEffect, useRef, useState } from 'react';

import {
  ArrowLeft,
  CheckCircle2,
  HelpCircle,
  Play,
  RotateCcw,
  LoaderCircle,
} from 'lucide-react';

import { useWorker } from '@/hooks/useWorker';

import {
  CATEGORY_KEYS,
  resolveNoticeTranslation,
} from '@/lib/notices';

import { t } from '@/lib/i18n';
import { speakText, stopSpeaking } from '@/lib/speech';
import { supabase } from '@/lib/supabase';

import type {
  Notice,
  NoticeEventType,
} from '@/lib/types';

// --------------------------------------------------
// COMPONENT PROPS
// --------------------------------------------------

interface NoticeDetailProps {
  notice: Notice;
  onBack: () => void;
}

// --------------------------------------------------
// STATUS INTERFACE
// --------------------------------------------------

interface NoticeStatus {
  tone: 'success' | 'error';
  text: string;
}

// --------------------------------------------------
// NOTICE DETAIL
// --------------------------------------------------

export function NoticeDetail({
  notice,
  onBack,
}: NoticeDetailProps) {
  const { worker } = useWorker();

  const language = worker.language;

  // Resolve notice content for the selected language.
  const resolved = resolveNoticeTranslation(
    notice,
    language
  );

  // --------------------------------------------------
  // COMPONENT STATE
  // --------------------------------------------------

  const [plays, setPlays] = useState(0);

  const [status, setStatus] =
    useState<NoticeStatus | null>(null);

  const [savingEvent, setSavingEvent] =
    useState<NoticeEventType | null>(null);

  // Track playback and database operations synchronously.
  const hasPlayedRef = useRef(false);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);

  // --------------------------------------------------
  // COMPONENT CLEANUP
  // --------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      stopSpeaking();
    };
  }, []);

  // --------------------------------------------------
  // RECORD NOTICE EVENT
  // --------------------------------------------------

  async function record(
    event: NoticeEventType,
    successText?: string
  ): Promise<void> {
    // Prevent duplicate simultaneous database requests.
    if (savingRef.current) {
      return;
    }

    savingRef.current = true;

    setSavingEvent(event);
    setStatus(null);

    try {
      const { error } = await supabase
        .from('notice_events')
        .insert({
          worker_id: worker.id,
          notice_id: notice.id,
          event,
        });

      if (error) {
        throw new Error(error.message);
      }

      if (mountedRef.current && successText) {
        setStatus({
          tone: 'success',
          text: successText,
        });
      }
    } catch (error) {
      console.error(
        'Failed to record notice event:',
        error
      );

      if (mountedRef.current) {
        setStatus({
          tone: 'error',
          text: t(language, 'saveFailed'),
        });
      }
    } finally {
      savingRef.current = false;

      if (mountedRef.current) {
        setSavingEvent(null);
      }
    }
  }

  // --------------------------------------------------
  // PLAY NOTICE
  // --------------------------------------------------

  function handlePlay(): void {
    // Prevent repeated clicks during event submission.
    if (savingRef.current) {
      return;
    }

    // Determine whether this is the first playback.
    const event: NoticeEventType =
      hasPlayedRef.current ? 'replay' : 'play';

    // Update the ref synchronously.
    hasPlayedRef.current = true;

    setPlays((count) => count + 1);

    // Start speech playback.
    speakText(resolved.voiceScript, language);

    // Record the playback event.
    void record(event);
  }

  // --------------------------------------------------
  // RECORD UNDERSTOOD FEEDBACK
  // --------------------------------------------------

  function handleUnderstood(): void {
    void record(
      'understood',
      t(language, 'understoodDone')
    );
  }

  // --------------------------------------------------
  // RECORD NOT CLEAR FEEDBACK
  // --------------------------------------------------

  function handleNotClear(): void {
    void record(
      'not_clear',
      t(language, 'notClearDone')
    );
  }

  // --------------------------------------------------
  // BACK NAVIGATION
  // --------------------------------------------------

  function handleBack(): void {
    stopSpeaking();
    onBack();
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  const isSaving = savingEvent !== null;

  const statusClasses =
    status?.tone === 'success'
      ? 'border-success-200 bg-success-50 text-success-800'
      : 'border-error-200 bg-error-50 text-error-700';

  return (
    <article
      className="animate-fade-up space-y-6"
      aria-busy={isSaving}
    >

      {/* ==========================================
          BACK NAVIGATION
      =========================================== */}

      <button
        type="button"
        onClick={handleBack}
        className="
          inline-flex items-center gap-2
          rounded-full px-3 py-2
          text-sm font-semibold text-brand-800
          transition-colors hover:bg-brand-50
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-brand-600
          focus-visible:ring-offset-2
        "
      >
        <ArrowLeft
          className="h-4 w-4"
          aria-hidden="true"
        />

        {t(language, 'back')}
      </button>

      {/* ==========================================
          NOTICE HEADER
      =========================================== */}

      <header className="space-y-3">

        {/* CATEGORY */}

        <span
          className="
            inline-flex items-center
            rounded-full bg-accent-100
            px-3 py-1
            text-xs font-bold uppercase
            tracking-wide text-accent-800
          "
        >
          {t(
            language,
            CATEGORY_KEYS[notice.category]
          )}
        </span>

        {/* NOTICE TITLE */}

        <h1 className="
          break-words text-2xl font-bold
          leading-tight text-slate-900
          sm:text-3xl
        ">
          {notice.title}
        </h1>

        {/* TRANSLATION FALLBACK WARNING */}

        {resolved.isFallback && (
          <div
            role="status"
            className="
              rounded-2xl border border-amber-200
              bg-amber-50 px-4 py-3
              text-sm leading-6 text-amber-900
            "
          >
            {t(language, 'noticeNotTranslated')}
          </div>
        )}

      </header>

      {/* ==========================================
          NOTICE CONTENT CARD
      =========================================== */}

      <section className="
        space-y-6 rounded-3xl
        border border-slate-200
        bg-white p-4 shadow-sm
        sm:p-6
      ">

        {/* ========================================
            PLAY NOTICE BUTTON
        ========================================= */}

        <div className="space-y-3">

          <button
            type="button"
            onClick={handlePlay}
            disabled={isSaving}
            aria-label={
              plays === 0
                ? t(language, 'play')
                : t(language, 'replay')
            }
            className={`
              flex min-h-16 w-full
              items-center justify-center gap-3
              rounded-2xl px-5 py-4
              text-lg font-bold text-white
              shadow-md transition-all duration-200
              focus-visible:outline-none
              focus-visible:ring-4
              focus-visible:ring-brand-300
              focus-visible:ring-offset-2
              active:scale-[0.98]
              disabled:cursor-not-allowed
              disabled:opacity-60
              ${
                plays === 0
                  ? 'bg-brand-700 hover:bg-brand-800'
                  : 'bg-brand-800 hover:bg-brand-900'
              }
            `}
          >
            {plays === 0 ? (
              <Play
                className="h-6 w-6"
                aria-hidden="true"
              />
            ) : (
              <RotateCcw
                className="h-6 w-6"
                aria-hidden="true"
              />
            )}

            {plays === 0
              ? t(language, 'play')
              : t(language, 'replay')}
          </button>

          {plays > 0 && (
            <p className="text-center text-xs text-slate-500">
              {plays} {plays === 1 ? 'play' : 'plays'}
            </p>
          )}

        </div>

        {/* ========================================
            KEY POINTS
        ========================================= */}

        {resolved.keyPoints.length > 0 && (
          <div>

            <h2 className="
              mb-3 text-sm font-bold
              uppercase tracking-wide
              text-slate-500
            ">
              {t(language, 'keyPoints')}
            </h2>

            <ol className="space-y-3">

              {resolved.keyPoints.map((point, index) => (
                <li
                  key={`${index}-${point}`}
                  className="
                    flex items-start gap-3
                    rounded-2xl bg-slate-50
                    p-3 text-slate-800
                    transition-colors hover:bg-slate-100
                  "
                >
                  <span className="
                    flex h-8 w-8 shrink-0
                    items-center justify-center
                    rounded-full bg-brand-700
                    text-sm font-bold text-white
                  ">
                    {index + 1}
                  </span>

                  <span className="
                    min-w-0 flex-1
                    text-sm leading-7
                    sm:text-base
                  ">
                    {point}
                  </span>
                </li>
              ))}

            </ol>
          </div>
        )}

        {/* ========================================
            WORKER FEEDBACK
        ========================================= */}

        <div className="space-y-3 border-t border-slate-100 pt-5">

          <h2 className="text-sm font-bold text-slate-700">
            {t(language, 'understood')}
          </h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            {/* UNDERSTOOD BUTTON */}

            <button
              type="button"
              onClick={handleUnderstood}
              disabled={isSaving}
              className="
                flex min-h-14 items-center
                justify-center gap-2
                rounded-2xl border-2
                border-success-500 bg-success-50
                px-3 py-3 text-sm font-bold
                text-success-800
                transition-colors
                hover:bg-success-100
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-success-500
                focus-visible:ring-offset-2
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {savingEvent === 'understood' ? (
                <LoaderCircle
                  className="h-5 w-5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <CheckCircle2
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              )}

              {t(language, 'understood')}
            </button>

            {/* NOT CLEAR BUTTON */}

            <button
              type="button"
              onClick={handleNotClear}
              disabled={isSaving}
              className="
                flex min-h-14 items-center
                justify-center gap-2
                rounded-2xl border-2
                border-warning-500 bg-warning-50
                px-3 py-3 text-sm font-bold
                text-warning-800
                transition-colors
                hover:bg-warning-100
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-warning-500
                focus-visible:ring-offset-2
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              {savingEvent === 'not_clear' ? (
                <LoaderCircle
                  className="h-5 w-5 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <HelpCircle
                  className="h-5 w-5"
                  aria-hidden="true"
                />
              )}

              {t(language, 'notClear')}
            </button>

          </div>
        </div>

        {/* ========================================
            STATUS MESSAGE
        ========================================= */}

        {status && (
          <div
            role={status.tone === 'error' ? 'alert' : 'status'}
            aria-live="polite"
            className={`
              rounded-xl border px-4 py-3
              text-sm font-medium leading-6
              ${statusClasses}
            `}
          >
            {status.text}
          </div>
        )}

      </section>

      {/* ==========================================
          FULL NOTICE TEXT
      =========================================== */}

      <details className="
        group rounded-3xl
        border border-slate-200
        bg-white p-5 shadow-sm
        transition-shadow hover:shadow-md
      ">

        <summary className="
          flex cursor-pointer
          list-none items-center
          justify-between gap-3
          text-sm font-bold text-slate-700
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-brand-600
          focus-visible:ring-offset-2
        ">
          <span>
            {t(language, 'noticeFullText')}
          </span>

          <span
            aria-hidden="true"
            className="
              text-xl font-normal text-brand-700
              transition-transform duration-200
              group-open:rotate-45
            "
          >
            +
          </span>
        </summary>

        <div className="
          mt-4 border-t border-slate-100
          pt-4
        ">
          <p className="
            whitespace-pre-line
            break-words text-sm
            leading-7 text-slate-700
          ">
            {notice.full_text}
          </p>
        </div>

      </details>

    </article>
  );
}
