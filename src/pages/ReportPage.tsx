
import { useEffect, useRef, useState, type FormEvent } from 'react';

import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  LoaderCircle,
  ShieldAlert,
} from 'lucide-react';

import { MicButton } from '@/components/MicButton';
import { useWorker } from '@/hooks/useWorker';

import { t, type UiText } from '@/lib/i18n';
import { buildComplaintSummary } from '@/lib/simplify';
import { supabase } from '@/lib/supabase';

import type { ComplaintCategory } from '@/lib/types';

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const MAX_DESCRIPTION_LENGTH = 3000;

// --------------------------------------------------
// COMPLAINT CATEGORIES
// --------------------------------------------------

const CATEGORIES: {
  value: ComplaintCategory;
  label: UiText;
}[] = [
  { value: 'unsafe', label: 'categoryUnsafe' },
  { value: 'unpaid_salary', label: 'categoryUnpaid' },
  { value: 'harassment', label: 'categoryHarassment' },
  { value: 'other', label: 'categoryOther' },
];

// --------------------------------------------------
// REPORT PHASE
// --------------------------------------------------

type ReportPhase =
  | { kind: 'describe' }
  | {
      kind: 'review';
      summary: string;
      trackingId: string;
    }
  | {
      kind: 'done';
      trackingId: string;
    };

// --------------------------------------------------
// HELPER: GENERATE TRACKING ID
// --------------------------------------------------

function createTrackingId(): string {
  if (
    typeof crypto === 'undefined' ||
    typeof crypto.getRandomValues !== 'function'
  ) {
    throw new Error(
      'Secure tracking ID generation is unavailable.'
    );
  }

  const bytes = new Uint8Array(8);

  crypto.getRandomValues(bytes);

  const suffix = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  return `FBB-${suffix}`;
}

// --------------------------------------------------
// REPORT PAGE
// --------------------------------------------------

export function ReportPage() {
  const { worker } = useWorker();

  const language = worker.language;

  // ------------------------------------------------
  // STATE
  // ------------------------------------------------

  const [category, setCategory] =
    useState<ComplaintCategory | null>(null);

  const [draft, setDraft] = useState('');

  const [phase, setPhase] = useState<ReportPhase>({
    kind: 'describe',
  });

  const [error, setError] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);

  // ------------------------------------------------
  // REFS
  // ------------------------------------------------

  // Prevent duplicate submissions synchronously.
  const submitLockRef = useRef(false);

  // Prevent state updates after unmounting.
  const mountedRef = useRef(true);

  // ------------------------------------------------
  // COMPONENT CLEANUP
  // ------------------------------------------------

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  // ------------------------------------------------
  // HANDLE VOICE INPUT
  // ------------------------------------------------

  function handleVoiceText(text: string): void {
    if (!text.trim()) {
      return;
    }

    setDraft((current) => {
      const combined = [current.trim(), text.trim()]
        .filter(Boolean)
        .join(' ');

      return combined.slice(0, MAX_DESCRIPTION_LENGTH);
    });

    setError(null);
  }

  // ------------------------------------------------
  // CONTINUE TO COMPLAINT REVIEW
  // ------------------------------------------------

  function handleContinue(
    event: FormEvent<HTMLFormElement>
  ): void {
    event.preventDefault();

    if (submitLockRef.current) {
      return;
    }

    const description = draft.trim();

    // Validate category.
    if (!category) {
      setError(t(language, 'reportIntro'));
      return;
    }

    // Validate complaint description.
    if (!description) {
      setError(t(language, 'needDescription'));
      return;
    }

    // Generate a tracking identifier before submission.
    // Keep it unchanged if the worker retries.
    let trackingId: string;

    try {
      trackingId = createTrackingId();
    } catch (error) {
      console.error(
        'Tracking ID generation failed:',
        error
      );

      setError(t(language, 'saveFailed'));
      return;
    }

    // Generate a supplementary summary.
    const summary = buildComplaintSummary(
      category,
      description
    );

    setError(null);

    setPhase({
      kind: 'review',
      summary,
      trackingId,
    });
  }

  // ------------------------------------------------
  // SUBMIT COMPLAINT
  // ------------------------------------------------

  async function handleSubmit(): Promise<void> {
    if (
      !category ||
      phase.kind !== 'review' ||
      submitLockRef.current
    ) {
      return;
    }

    submitLockRef.current = true;

    setSubmitting(true);
    setError(null);

    try {
      const { error: insertError } = await supabase
        .from('complaints')
        .insert({
          tracking_id: phase.trackingId,
          worker_id: worker.id,
          category,
          raw_text: draft.trim(),
          language,
          structured_summary: phase.summary,
          department_id: worker.department_id,
        });

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Display success only after database confirmation.
      if (mountedRef.current) {
        setPhase({
          kind: 'done',
          trackingId: phase.trackingId,
        });
      }

    } catch (submitError) {
      console.error(
        'Complaint submission failed:',
        submitError
      );

      if (mountedRef.current) {
        setError(t(language, 'saveFailed'));
      }

    } finally {
      submitLockRef.current = false;

      if (mountedRef.current) {
        setSubmitting(false);
      }
    }
  }

  // ------------------------------------------------
  // EDIT COMPLAINT
  // ------------------------------------------------

  function handleEdit(): void {
    if (submitting) {
      return;
    }

    setError(null);
    setPhase({ kind: 'describe' });
  }

  // ------------------------------------------------
  // RESET FORM
  // ------------------------------------------------

  function resetForm(): void {
    if (submitLockRef.current) {
      return;
    }

    setCategory(null);
    setDraft('');
    setError(null);

    setPhase({
      kind: 'describe',
    });
  }

  // ------------------------------------------------
  // STATUS MESSAGE
  // ------------------------------------------------

  function ErrorMessage() {
    if (!error) {
      return null;
    }

    return (
      <div
        role="alert"
        aria-live="assertive"
        className="
          flex items-start gap-3
          rounded-2xl border
          border-rose-200
          bg-rose-50 p-4
        "
      >
        <AlertCircle
          className="mt-0.5 h-5 w-5 shrink-0 text-rose-600"
          aria-hidden="true"
        />

        <p className="
          text-sm font-medium
          leading-6 text-rose-800
        ">
          {error}
        </p>
      </div>
    );
  }

  // ------------------------------------------------
  // SUCCESS SCREEN
  // ------------------------------------------------

  if (phase.kind === 'done') {
    return (
      <div className="
        animate-fade-up
        space-y-6 rounded-3xl
        border border-slate-200
        bg-white p-6 shadow-sm
        sm:p-8
      ">

        {/* SUCCESS ICON */}

        <div className="
          mx-auto flex h-20 w-20
          items-center justify-center
          rounded-full bg-success-100
          text-success-700
        ">
          <CheckCircle2
            className="h-10 w-10"
            aria-hidden="true"
          />
        </div>

        {/* SUCCESS MESSAGE */}

        <div className="space-y-2 text-center">

          <h1 className="
            text-xl font-bold
            text-slate-900
          ">
            {t(language, 'reportDone')}
          </h1>

          <p className="
            text-sm leading-6
            text-slate-600
          ">
            Your complaint has been recorded.
            Keep your tracking ID for future reference.
          </p>

        </div>

        {/* TRACKING ID */}

        <div className="
          space-y-3 rounded-2xl
          border border-brand-200
          bg-brand-50 p-5 text-center
        ">

          <div className="
            flex items-center
            justify-center gap-2
            text-sm font-semibold
            text-brand-800
          ">
            <ClipboardCheck
              className="h-4 w-4"
              aria-hidden="true"
            />

            {t(language, 'trackingId')}
          </div>

          <p className="
            break-all font-mono
            text-xl font-bold
            tracking-wider text-brand-900
            sm:text-2xl
          ">
            {phase.trackingId}
          </p>

        </div>

        {/* IMPORTANT REMINDER */}

        <div className="
          flex items-start gap-3
          rounded-xl bg-slate-50 p-4
        ">
          <ShieldAlert
            className="mt-0.5 h-5 w-5 shrink-0 text-slate-600"
            aria-hidden="true"
          />

          <p className="
            text-xs leading-6
            text-slate-600
          ">
            Keep your tracking ID. You may need it
            when following up on your complaint.
          </p>
        </div>

        {/* ANOTHER COMPLAINT */}

        <button
          type="button"
          onClick={resetForm}
          className="
            min-h-12 w-full
            rounded-2xl border-2
            border-brand-700
            px-5 py-3 text-base
            font-bold text-brand-800
            transition-colors
            hover:bg-brand-50
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-brand-600
            focus-visible:ring-offset-2
            active:scale-[0.98]
          "
        >
          {t(language, 'reportAnother')}
        </button>

      </div>
    );
  }

  // ------------------------------------------------
  // COMPLAINT REVIEW SCREEN
  // ------------------------------------------------

  if (phase.kind === 'review') {
    const categoryLabel = CATEGORIES.find(
      (item) => item.value === category
    )?.label;

    return (
      <div className="animate-fade-up space-y-5">

        {/* HEADER */}

        <header className="space-y-2">

          <h1 className="
            text-2xl font-bold
            leading-tight text-slate-900
          ">
            {t(language, 'reportReview')}
          </h1>

          <p className="text-sm leading-6 text-slate-600">
            Check the original description and summary
            before submitting your complaint.
          </p>

        </header>

        {/* CATEGORY */}

        <section className="
          space-y-3 rounded-3xl
          border border-slate-200
          bg-white p-5 shadow-sm
        ">

          <p className="
            text-xs font-bold uppercase
            tracking-wide text-slate-500
          ">
            {t(language, 'reportYouAreReporting')}
          </p>

          <span className="
            inline-flex rounded-full
            bg-brand-100 px-3 py-1.5
            text-sm font-bold text-brand-900
          ">
            {categoryLabel
              ? t(language, categoryLabel)
              : t(language, 'categoryOther')}
          </span>

          <div className="space-y-2 border-t border-slate-100 pt-4">

            <h2 className="text-sm font-bold text-slate-800">
              {t(language, 'reportDescribe')}
            </h2>

            {/* Preserve and display original complaint. */}

            <p className="
              whitespace-pre-wrap
              break-words text-sm
              leading-7 text-slate-700
            ">
              {draft.trim()}
            </p>

          </div>

          <div className="space-y-2 border-t border-slate-100 pt-4">

            <h2 className="text-sm font-bold text-slate-800">
              {t(language, 'reportReview')}
            </h2>

            {/* Supplementary generated summary. */}

            <p className="
              whitespace-pre-wrap
              break-words rounded-xl
              bg-slate-50 p-4
              text-sm leading-7
              text-slate-700
            ">
              {phase.summary}
            </p>

          </div>

        </section>

        {/* ERROR MESSAGE */}

        <ErrorMessage />

        {/* ACTION BUTTONS */}

        <div className="grid grid-cols-2 gap-3">

          {/* EDIT */}

          <button
            type="button"
            onClick={handleEdit}
            disabled={submitting}
            className="
              min-h-12 rounded-2xl
              border-2 border-slate-300
              bg-white px-4 py-3
              text-sm font-bold
              text-slate-700
              transition-colors
              hover:bg-slate-50
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-brand-600
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {t(language, 'editText')}
          </button>

          {/* SUBMIT */}

          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting}
            className="
              flex min-h-12
              items-center justify-center
              gap-2 rounded-2xl
              bg-brand-700 px-4 py-3
              text-sm font-bold text-white
              transition-colors
              hover:bg-brand-800
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-brand-600
              focus-visible:ring-offset-2
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {submitting ? (
              <>
                <LoaderCircle
                  className="h-5 w-5 animate-spin"
                  aria-hidden="true"
                />

                {t(language, 'submitting')}
              </>
            ) : (
              t(language, 'submit')
            )}
          </button>

        </div>

        {/* CANCEL */}

        <button
          type="button"
          onClick={resetForm}
          disabled={submitting}
          className="
            min-h-10 w-full
            text-sm font-semibold
            text-slate-600
            underline-offset-4
            transition hover:text-slate-900
            hover:underline
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {t(language, 'cancel')}
        </button>

      </div>
    );
  }

  // ------------------------------------------------
  // COMPLAINT DESCRIPTION SCREEN
  // ------------------------------------------------

  return (
    <div className="animate-fade-up space-y-6">

      {/* ==========================================
          PAGE HEADER
      =========================================== */}

      <header className="space-y-2">

        <div className="flex items-center gap-2">

          <span className="
            flex h-10 w-10
            items-center justify-center
            rounded-xl bg-error-100
            text-error-800
          ">
            <ShieldAlert
              className="h-5 w-5"
              aria-hidden="true"
            />
          </span>

          <h1 className="
            text-2xl font-bold
            leading-tight text-slate-900
          ">
            {t(language, 'reportTitle')}
          </h1>

        </div>

        <p className="text-sm leading-6 text-slate-600">
          {t(language, 'reportIntro')}
        </p>

      </header>

      {/* ==========================================
          COMPLAINT CATEGORY
      =========================================== */}

      <fieldset className="space-y-3">

        <legend className="text-sm font-semibold text-slate-700">
          {t(language, 'reportIntro')}
        </legend>

        <div className="grid grid-cols-2 gap-3">

          {CATEGORIES.map((item) => {
            const selected = category === item.value;

            return (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setCategory(item.value);
                  setError(null);
                }}
                aria-pressed={selected}
                className={`
                  flex min-h-16
                  items-center gap-2
                  rounded-2xl border-2
                  px-3 py-3 text-left
                  text-sm font-bold
                  transition-all duration-200
                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-brand-600
                  focus-visible:ring-offset-2
                  active:scale-[0.98]
                  ${
                    selected
                      ? 'border-brand-700 bg-brand-50 text-brand-900 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-slate-50'
                  }
                `}
              >
                {selected && (
                  <CheckCircle2
                    className="h-4 w-4 shrink-0 text-brand-700"
                    aria-hidden="true"
                  />
                )}

                <span>{t(language, item.label)}</span>

              </button>
            );
          })}

        </div>

      </fieldset>

      {/* ==========================================
          DESCRIPTION FORM
      =========================================== */}

      <form
        onSubmit={handleContinue}
        className="
          space-y-5 rounded-3xl
          border border-slate-200
          bg-white p-5 shadow-sm
          sm:p-6
        "
      >

        {/* FORM HEADER */}

        <div className="space-y-1">

          <h2 className="text-base font-bold text-slate-900">
            {t(language, 'reportDescribe')}
          </h2>

          <p className="text-sm leading-6 text-slate-500">
            {t(language, 'reportDescribeHint')}
          </p>

        </div>

        {/* VOICE INPUT */}

        <div className="
          rounded-2xl bg-slate-50
          px-3 py-5
        ">
          <MicButton
            language={language}
            onText={handleVoiceText}
          />
        </div>

        {/* DESCRIPTION FIELD */}

        <div className="space-y-2">

          <label
            htmlFor="complaint-description"
            className="block text-sm font-semibold text-slate-700"
          >
            {t(language, 'reportDescribe')}
            <span className="ml-1 text-error-700">*</span>
          </label>

          <textarea
            id="complaint-description"
            value={draft}
            onChange={(event) => {
              setDraft(event.target.value);
              setError(null);
            }}
            rows={5}
            maxLength={MAX_DESCRIPTION_LENGTH}
            placeholder={t(language, 'reportDescribeHint')}
            aria-describedby="complaint-description-help complaint-character-count"
            required
            className="
              min-h-36 w-full
              resize-y rounded-2xl
              border border-slate-300
              bg-white px-4 py-3
              text-base leading-7
              text-slate-900
              placeholder:text-slate-400
              transition-colors
              focus:border-brand-600
              focus:outline-none
              focus:ring-2
              focus:ring-brand-200
            "
          />

          <p
            id="complaint-description-help"
            className="text-xs leading-5 text-slate-500"
          >
            Describe what happened, where it happened,
            and when it happened. Include important details.
          </p>

          <p
            id="complaint-character-count"
            className="text-right text-xs text-slate-400"
          >
            {draft.length}/{MAX_DESCRIPTION_LENGTH}
          </p>

        </div>

        {/* ERROR */}

        <ErrorMessage />

        {/* CONTINUE */}

        <button
          type="submit"
          disabled={!draft.trim() || !category}
          className="
            flex min-h-14 w-full
            items-center justify-center
            rounded-2xl bg-brand-700
            px-5 py-4 text-base
            font-bold text-white
            shadow-sm transition-colors
            hover:bg-brand-800
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-brand-600
            focus-visible:ring-offset-2
            active:scale-[0.98]
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          {t(language, 'reportReview')}
        </button>

      </form>

      {/* ==========================================
          PRIVACY REMINDER
      =========================================== */}

      <div className="
        flex items-start gap-3
        rounded-2xl border
        border-slate-200 bg-white
        p-4
      ">
        <ShieldAlert
          className="mt-0.5 h-5 w-5 shrink-0 text-brand-700"
          aria-hidden="true"
        />

        <p className="
          text-xs leading-6 text-slate-600
        ">
          Your original description is retained with
          your complaint. Keep your tracking ID after
          submission so you can follow up.
        </p>

      </div>

    </div>
  );
}
